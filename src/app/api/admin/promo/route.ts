/**
 * Promo codes: list and create.
 *
 * The middleware turns away anyone who is not an administrator before this
 * runs; see `/api/admin` in src/middleware.ts.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { promoInput } from "@/lib/admin/promo-input";

export const dynamic = "force-dynamic";

export async function GET() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { uses: true } } },
    take: 500,
  });
  return NextResponse.json({ codes });
}

export async function POST(request: Request) {
  const parsed = promoInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const code = await prisma.promoCode.create({
      data: parsed.data as Prisma.PromoCodeCreateInput,
    });
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    // The unique key on `code` is the check; looking first would leave a
    // window where two requests both find nothing.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "that code already exists" }, { status: 409 });
    }
    throw error;
  }
}
