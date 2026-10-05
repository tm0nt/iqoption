/**
 * A line written on an affiliate's ledger by hand.
 *
 * For what the rules did not cover: a bonus agreed by email, a chargeback the
 * hold did not catch, a correction. Positive or negative, available at once,
 * and always with a reason — a ledger line nobody can explain later is the
 * one that starts the argument.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { affiliateProgram } from "@/lib/affiliate/program";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const raw = typeof body?.amount === "string" ? body.amount.replace(",", ".").trim() : body?.amount;
  const amount = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 255) : "";

  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000) {
    return NextResponse.json({ error: "enter a non-zero amount" }, { status: 400 });
  }
  if (!note) return NextResponse.json({ error: "say why" }, { status: 400 });

  const exists = await prisma.affiliate.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "no such affiliate" }, { status: 404 });

  const program = await affiliateProgram();
  const now = new Date();
  const line = await prisma.affiliateCommission.create({
    data: {
      affiliateId: id,
      kind: "ADJUSTMENT",
      amount: new Prisma.Decimal(Math.round(amount * 100) / 100),
      currency: program.currency,
      note,
      earnedAt: now,
      availableAt: now,
    },
  });
  return NextResponse.json({ commission: { id: line.id } }, { status: 201 });
}
