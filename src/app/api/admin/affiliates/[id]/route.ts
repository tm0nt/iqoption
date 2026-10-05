/**
 * Changing one affiliate: status, code, commercial terms, postback, note.
 *
 * Only the fields sent are changed. A term sent empty goes back to following
 * the programme's default — see `termsFor` in src/lib/affiliate/program-types.ts.
 * The first move to ACTIVE stamps the approval.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { affiliateUpdateInput } from "@/lib/admin/affiliate-input";
import { postbackUrlProblem } from "@/lib/affiliate/postback";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const parsed = affiliateUpdateInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data } = parsed;

  if (data.postbackUrl) {
    const problem = postbackUrlProblem(data.postbackUrl);
    if (problem) return NextResponse.json({ error: `postback URL: ${problem}` }, { status: 400 });
  }

  const current = await prisma.affiliate.findUnique({ where: { id }, select: { approvedAt: true } });
  if (!current) return NextResponse.json({ error: "no such affiliate" }, { status: 404 });

  try {
    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        ...data,
        ...(data.cpaAmount !== undefined ? { cpaAmount: data.cpaAmount === null ? null : new Prisma.Decimal(data.cpaAmount) } : {}),
        ...(data.revsharePercent !== undefined
          ? { revsharePercent: data.revsharePercent === null ? null : new Prisma.Decimal(data.revsharePercent) }
          : {}),
        ...(data.status === "ACTIVE" && !current.approvedAt ? { approvedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ affiliate: { id: affiliate.id, status: affiliate.status, code: affiliate.code } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "another affiliate already has that code" }, { status: 409 });
    }
    throw error;
  }
}
