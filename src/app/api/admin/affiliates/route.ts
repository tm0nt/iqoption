/**
 * Making an existing account an affiliate, from the admin.
 *
 * Active at once and on the programme's terms: an administrator choosing to
 * do this is the approval. The middleware has already turned away anyone who
 * is not an administrator; see `/api/admin` in src/middleware.ts.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { emailSchema } from "@/lib/auth/validation";
import { joinProgram } from "@/lib/affiliate/membership";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = emailSchema.safeParse(body?.email);
  if (!email.success) return NextResponse.json({ error: "enter the account's email address" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.data }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "no account has that email address" }, { status: 404 });

  const affiliate = await joinProgram(user.id, true);
  // Joining returns the row that already exists; an admin adding someone
  // who was waiting is approving them.
  if (affiliate.status === "PENDING") {
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { status: "ACTIVE", approvedAt: new Date() } });
  }
  return NextResponse.json({ affiliate: { id: affiliate.id, code: affiliate.code } }, { status: 201 });
}
