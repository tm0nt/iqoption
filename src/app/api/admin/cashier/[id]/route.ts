/**
 * Settling one cashier request, by an administrator.
 *
 * The money moves in src/lib/cabinet/settle.ts, which also explains the four
 * cases; this checks the request and turns a refusal into a status code.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { settleTransaction } from "@/lib/cabinet/settle";
import { prisma } from "@/lib/db";
import { pixProvider } from "@/lib/payments/pix/provider";

/**
 * What kind of PIX key a destination is, read from its shape.
 *
 * The provider needs to be told, and asking the person again for something
 * derivable from what they already typed is a form nobody fills correctly.
 * `evp` is the fallback because a random key is the one shape with no
 * pattern to recognise.
 */
function pixKeyType(key: string): "cpf" | "cnpj" | "email" | "mobile" | "evp" {
  const digits = key.replace(/\D/g, "");
  if (key.includes("@")) return "email";
  if (digits.length === 11 && !key.startsWith("+")) return "cpf";
  if (digits.length === 14) return "cnpj";
  if (digits.length >= 12 || key.startsWith("+")) return "mobile";
  return "evp";
}

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

  /*
   * Approving a PIX withdrawal sends the money.
   *
   * Settled first, then paid: the status change is the lock that stops two
   * administrators approving the same row, so sending before it could pay
   * twice. The order costs a failure mode — a payout refused after the row
   * is marked approved — and that one is visible and fixable, while a double
   * payment is neither.
   *
   * A payout answers `AWAITING`; the outcome arrives as a `PIX_PAY_OUT`
   * webhook. So the note says what was accepted, not what was paid.
   */
  const result = await settleTransaction(id, action, { by: session?.user?.platformId ?? null, note });

  if (result.ok && action === "approve") {
    const row = await prisma.transaction.findUnique({
      where: { id },
      select: { kind: true, amount: true, destination: true, method: true, providerRef: true, userId: true },
    });
    const pix = pixProvider();

    if (pix && row?.kind === "WITHDRAWAL" && row.destination && !row.providerRef && /\bpix\b/i.test(row.method)) {
      /*
       * The holder, from the account and from an approved identity document.
       * Their documentation asks for the document and warns the order may be
       * refused without it — the destination's ownership cannot be checked —
       * so an unverified account sends the name alone and may be refused,
       * which is the correct outcome rather than a silent transfer.
       */
      const holder = await prisma.user.findUnique({
        where: { id: row.userId },
        select: {
          firstName: true,
          lastName: true,
          kycSubmissions: {
            where: { status: "APPROVED" },
            orderBy: { id: "desc" },
            take: 1,
            select: { documentNumber: true },
          },
        },
      });
      const payout = await pix.payout({
        externalId: `wd-${id}`,
        key: row.destination,
        keyType: pixKeyType(row.destination),
        amount: Number(row.amount),
        holderName: [holder?.firstName, holder?.lastName].filter(Boolean).join(" ") || undefined,
        holderDocument: holder?.kycSubmissions?.[0]?.documentNumber ?? undefined,
      });

      await prisma.transaction.update({
        where: { id },
        data: payout
          ? { providerRef: payout.externalId, note: `${note ?? ""} PIX enviado via ${pix.id}: ${payout.status}.`.trim() }
          : { note: `${note ?? ""} PIX NÃO enviado: o provedor recusou ou não respondeu.`.trim() },
      });
    }
  }
  if (!result.ok) return NextResponse.json({ error: REFUSALS[result.reason] }, { status: 409 });
  return NextResponse.json({ transaction: result.row });
}
