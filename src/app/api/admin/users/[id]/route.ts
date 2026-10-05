/**
 * What an administrator can change about an account: whether it can sign in,
 * and where its identity verification stands.
 *
 * Not its role. Granting administrator rights stays a command-line act —
 * `npm run admin:grant` — for the reason given in scripts/grant-admin.ts: any
 * path from a web form to "can change what the platform trades" is a path an
 * attacker can take.
 *
 * Disabling an account also ends its trading sessions, so the engine stops
 * trading on it at once rather than when its ssid expires. An administrator
 * cannot disable their own account from here; that is how a platform ends up
 * with nobody able to sign in to its admin.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const KYC = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const session = await auth();

  const data: { isActive?: boolean; closedAt?: Date | null; kycStatus?: (typeof KYC)[number] } = {};
  if (typeof body?.isActive === "boolean") {
    if (!body.isActive && session?.user?.platformId === id) {
      return NextResponse.json({ error: "you cannot disable your own account" }, { status: 409 });
    }
    data.isActive = body.isActive;
    data.closedAt = body.isActive ? null : new Date();
  }
  if (body && "kycStatus" in body) {
    if (!KYC.includes(body.kycStatus as (typeof KYC)[number])) {
      return NextResponse.json({ error: `kycStatus must be one of ${KYC.join(", ")}` }, { status: 400 });
    }
    data.kycStatus = body.kycStatus as (typeof KYC)[number];
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing to change" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "no such account" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data }),
    ...(data.isActive === false ? [prisma.tradingSession.deleteMany({ where: { userId: id } })] : []),
  ]);
  return NextResponse.json({ ok: true });
}
