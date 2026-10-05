/**
 * The cashier's limits, fees and rails, for an administrator.
 *
 * Its own route rather than a PUT to the generic settings one: that one takes
 * any JSON for any key, and this setting decides how much money can move. The
 * whole document is validated here before it is written — see
 * src/lib/admin/finance-input.ts.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { financeInput } from "@/lib/admin/finance-input";
import { CASHIER_KEY, cashierSettings } from "@/lib/cabinet/cashier";

export const dynamic = "force-dynamic";

const DESCRIPTION =
  "The cashier: rails, deposit and withdrawal limits, free withdrawals and fees. Edited under Limits & fees.";

export async function GET() {
  return NextResponse.json({ settings: await cashierSettings() });
}

export async function PUT(request: Request) {
  const parsed = financeInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await prisma.platformSetting.upsert({
    where: { key: CASHIER_KEY },
    create: { key: CASHIER_KEY, value: parsed.data, description: DESCRIPTION },
    update: { value: parsed.data },
  });

  return NextResponse.json({ settings: parsed.data });
}
