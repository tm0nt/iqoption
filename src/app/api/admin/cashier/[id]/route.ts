/**
 * Settling one cashier request, by an administrator.
 *
 * The money moves in src/lib/cabinet/settle.ts, which also explains the four
 * cases; this checks the request and turns a refusal into a status code.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { settleTransaction } from "@/lib/cabinet/settle";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const REFUSALS = {
  NOT_PENDING: "that request is not pending",
  NOT_REAL: "that request points at a practice wallet, and money does not move through one",
  NO_WALLET: "that wallet no longer exists",
} as const;

export async function POST(request: Request, context: Context) {
  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const session = await auth();
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;

  const result = await settleTransaction(id, action, { by: session?.user?.platformId ?? null, note });
  if (!result.ok) return NextResponse.json({ error: REFUSALS[result.reason] }, { status: 409 });
  return NextResponse.json({ transaction: result.row });
}
