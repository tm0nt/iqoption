/**
 * Joining the affiliate programme.
 *
 * Active at once when the programme approves automatically; otherwise the row
 * waits under Affiliates in the admin. Joining twice returns the row already
 * there rather than an error, so a double click is harmless.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { affiliateProgram } from "@/lib/affiliate/program";
import { joinProgram } from "@/lib/affiliate/membership";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const program = await affiliateProgram();
  if (!program.enabled) return NextResponse.json({ error: "the programme is closed" }, { status: 403 });

  const affiliate = await joinProgram(session.user.platformId, program.autoApprove);
  return NextResponse.json({ affiliate: { code: affiliate.code, status: affiliate.status } }, { status: 201 });
}
