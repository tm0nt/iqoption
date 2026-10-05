/**
 * The affiliate programme's terms, for an administrator.
 *
 * Validated whole before it is written — see src/lib/admin/affiliate-input.ts.
 * Changing a figure changes what accrues from the next pass of the ledger on;
 * lines already written keep the figures they were written with.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { programInput } from "@/lib/admin/affiliate-input";
import { PROGRAM_KEY, affiliateProgram } from "@/lib/affiliate/program";

export const dynamic = "force-dynamic";

const DESCRIPTION = "The affiliate programme: plan, CPA, revenue share, hold, minimum payout, cookie. Edited under Affiliates → Programme.";

export async function GET() {
  return NextResponse.json({ program: await affiliateProgram() });
}

export async function PUT(request: Request) {
  const parsed = programInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await prisma.platformSetting.upsert({
    where: { key: PROGRAM_KEY },
    create: { key: PROGRAM_KEY, value: parsed.data, description: DESCRIPTION },
    update: { value: parsed.data },
  });
  return NextResponse.json({ program: parsed.data });
}
