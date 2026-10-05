/**
 * Changing the address an account signs in with.
 *
 * Behind the current password, because the address is the account — whoever
 * controls it controls every reset that follows. The new address starts
 * unconfirmed, whatever the old one was.
 *
 * The unique index is the check that the address is free; looking first and
 * writing second leaves a window two requests can both pass through.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { emailSchema } from "@/lib/auth/validation";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const t = cabinetExtra(typeof body?.locale === "string" ? body.locale : "en").profile;

  const email = emailSchema.safeParse(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email.success) return NextResponse.json({ error: "invalid email", errors: { email: t.emailInvalid } }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: { email: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "no such account" }, { status: 404 });

  if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "wrong password", errors: { password: t.wrongPassword } }, { status: 403 });
  }
  if (email.data === user.email) {
    return NextResponse.json({ error: "unchanged", errors: { email: t.emailSame } }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.platformId },
      data: { email: email.data, emailVerified: null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "taken", errors: { email: t.emailTaken } }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ email: email.data });
}
