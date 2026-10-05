/**
 * Two-step sign-in, from the account's own security page.
 *
 *   setup      — a new secret and the QR code that carries it. Not yet in force.
 *   enable     — the app's first code proves it has the secret; the feature
 *                turns on and the recovery codes are shown, once.
 *   disable    — the password and a code (or a recovery code). Both, because
 *                an unattended signed-in tab has neither.
 *   recovery   — a code, and a fresh set of recovery codes replaces the old.
 *
 * Every code goes through `verifySecondFactor`, which locks the account's row,
 * refuses a code already used and locks the step after five failures.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { setting } from "@/lib/engine/settings";
import { TWO_FACTOR_OFF, beginSetup, confirmSetup, replaceRecoveryCodes, verifySecondFactor } from "@/lib/auth/two-factor";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const t = cabinetExtra(typeof body?.locale === "string" ? body.locale : "en").twoFactor;
  const action = typeof body?.action === "string" ? body.action : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const userId = session.user.platformId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true, twoFactorEnabledAt: true },
  });
  if (!user) return NextResponse.json({ error: "no such account" }, { status: 404 });

  const refuse = (result: string) =>
    NextResponse.json(
      { error: result === "locked" ? t.locked : t.invalidCode },
      { status: result === "locked" ? 429 : 400 },
    );

  if (action === "setup") {
    if (user.twoFactorEnabledAt) return NextResponse.json({ error: t.alreadyOn }, { status: 409 });
    const brand = await setting("brand");
    const { secret, uri } = await beginSetup(userId, brand.name, user.email);
    const svg = await QRCode.toString(uri, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
    return NextResponse.json({
      // Grouped in fours, which is how the apps' "enter a key" screens show it.
      secret: secret.replace(/(.{4})/g, "$1 ").trim(),
      qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    });
  }

  if (action === "enable") {
    if (user.twoFactorEnabledAt) return NextResponse.json({ error: t.alreadyOn }, { status: 409 });
    const confirmed = await confirmSetup(userId, code);
    if (confirmed.result !== "ok") return refuse(confirmed.result);
    return NextResponse.json({ recoveryCodes: confirmed.codes });
  }

  if (!user.twoFactorEnabledAt) return NextResponse.json({ error: t.notOn }, { status: 409 });

  if (action === "disable") {
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: t.wrongPassword, errors: { password: t.wrongPassword } }, { status: 403 });
    }
    const result = await verifySecondFactor(userId, code);
    if (result !== "ok") return refuse(result);
    await prisma.user.update({ where: { id: userId }, data: TWO_FACTOR_OFF });
    return NextResponse.json({ enabled: false });
  }

  if (action === "recovery") {
    const result = await verifySecondFactor(userId, code);
    if (result !== "ok") return refuse(result);
    return NextResponse.json({ recoveryCodes: await replaceRecoveryCodes(userId) });
  }

  return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
}
