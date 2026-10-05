"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminCopy, type AdminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { Badge, Card, EmptyState, TableShell, buttonClass, inputClass, statusTone, td, th } from "./ui";

/** One request, already written out by the server in the admin's language. */
export type AdminTransaction = {
  id: number;
  kind: "DEPOSIT" | "WITHDRAWAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  amount: string;
  fee: string | null;
  bonus: string | null;
  /** What the person is paid, for a withdrawal with a fee. */
  payable: string | null;
  promo: string | null;
  method: string;
  destination: string | null;
  note: string | null;
  createdAt: string;
  settledAt: string | null;
  settledBy: string | null;
  email: string;
  userId: number;
  kyc: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  affiliate: { id: number; code: string } | null;
  /** For a card deposit: which card, whose name is on it, and the processor's id for the charge. */
  card: { label: string; holder: string; holderMismatch: boolean } | null;
  providerRef: string | null;
};

/**
 * What each decision does to the money, said on the screen.
 *
 * The two kinds are not symmetrical — a withdrawal has already left the
 * balance and a deposit has not arrived — and an administrator should not have
 * to remember which. The button says what it will do.
 */
function effectOf(row: AdminTransaction, action: "approve" | "reject", t: AdminCopy["cashier"], bonus: (b: string) => string) {
  if (row.kind === "DEPOSIT") {
    if (action === "approve") return row.bonus ? bonus(row.bonus) : t.credits;
    return t.movesNothing;
  }
  return action === "approve" ? t.alreadyLeft : t.refunds;
}

export function CashierQueue({ transactions, queue, locale }: { transactions: AdminTransaction[]; queue: boolean; locale: string }) {
  const t = adminCopy(locale).cashier;
  const m = adminMoneyCopy(locale);
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  async function settle(id: number, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    const response = await fetch(`/api/admin/cashier/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, note: notes[id] ?? "" }),
    }).catch(() => null);

    setBusy(null);
    if (!response?.ok) {
      const said = await response?.json().catch(() => null);
      setError(said?.error ?? t.settleFailed);
      return;
    }
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState>{queue ? t.nothingToSettle : m.cashier.noneMatch}</EmptyState>
      </Card>
    );
  }

  const who = (row: AdminTransaction) => (
    <span className="flex flex-wrap items-center gap-1.5">
      <Link href={`/${locale}/admin/users?q=${row.userId}`} className="text-white hover:text-[var(--accent)]">
        {row.email}
      </Link>
      <span className="text-[11px] text-[#6f7076]">#{row.userId}</span>
      <Badge tone={row.kyc === "APPROVED" ? "success" : row.kyc === "REJECTED" ? "danger" : row.kyc === "PENDING" ? "warning" : "neutral"}>
        {m.cashier.kyc}: {m.cashier.kycStates[row.kyc]}
      </Badge>
      {row.affiliate && (
        <Link href={`/${locale}/admin/affiliates/${row.affiliate.id}`}>
          <Badge tone="info">
            {m.cashier.via} {row.affiliate.code}
          </Badge>
        </Link>
      )}
    </span>
  );

  if (queue) {
    return (
      <div className="space-y-3">
        {error && <p className="rounded border border-[#f6465d]/40 bg-[#f6465d]/10 px-3 py-2 text-[13px] text-[#ff8a99]">{error}</p>}
        <ul className="space-y-3">
          {transactions.map((row) => (
            <li key={row.id} className="rounded-lg border border-white/[0.08] bg-[#15161a] p-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                <Badge tone={row.kind === "DEPOSIT" ? "accent" : "warning"}>{row.kind === "DEPOSIT" ? t.deposit : t.withdrawal}</Badge>
                <span className="text-[18px] font-semibold text-white">{row.amount}</span>
                {row.bonus && (
                  <span className="text-[13px] text-emerald-300">
                    + {m.cashier.bonus} {row.bonus}
                    {row.promo && ` (${row.promo})`}
                  </span>
                )}
                {row.fee && (
                  <span className="text-[13px] text-[#a0a1a6]">
                    {m.cashier.fee} {row.fee} · {m.cashier.payable} <span className="text-white">{row.payable}</span>
                  </span>
                )}
                <span className="text-[13px] text-[#a0a1a6]">{row.method}</span>
                <span className="ml-auto text-[12px] text-[#6f7076]">
                  #{row.id} · {row.createdAt}
                </span>
              </div>

              <div className="mt-2 text-[13px]">{who(row)}</div>

              {row.card ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#a0a1a6]">
                  {m.cashier.card}: <span className="font-mono text-white">{row.card.label}</span>
                  <span>· {row.card.holder}</span>
                  {row.card.holderMismatch && <Badge tone="danger">{m.cashier.holderMismatch}</Badge>}
                  {row.providerRef && (
                    <span className="text-[12px] text-[#6f7076]">
                      · {m.cashier.processorRef} <span className="font-mono">{row.providerRef}</span>
                    </span>
                  )}
                </p>
              ) : (
                row.destination && (
                  <p className="mt-2 break-all text-[13px] text-[#a0a1a6]">
                    {t.to}: <span className="font-mono text-white">{row.destination}</span>
                  </p>
                )
              )}
              {row.card && row.note && <p className="mt-1 text-[12px] text-[#6f7076]">{row.note}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={notes[row.id] ?? ""}
                  onChange={(event) => setNotes({ ...notes, [row.id]: event.target.value })}
                  placeholder={t.notePlaceholder}
                  className={`${inputClass} min-w-[220px] flex-1`}
                />
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => void settle(row.id, "approve")}
                  className={buttonClass("primary")}
                  title={effectOf(row, "approve", t, m.cashier.creditsWithBonus)}
                >
                  {t.approve} — {effectOf(row, "approve", t, m.cashier.creditsWithBonus)}
                </button>
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => void settle(row.id, "reject")}
                  className={buttonClass("danger")}
                  title={effectOf(row, "reject", t, m.cashier.creditsWithBonus)}
                >
                  {t.reject} — {effectOf(row, "reject", t, m.cashier.creditsWithBonus)}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <TableShell>
      <thead>
        <tr>
          {[t.kind, t.amount, m.cashier.user, t.method, t.outcome, t.when, t.note].map((head) => (
            <th key={head} className={th}>
              {head}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {transactions.map((row) => (
          <tr key={row.id}>
            <td className={`${td} text-[#a0a1a6]`}>
              {row.kind === "DEPOSIT" ? t.deposit : t.withdrawal}
              <span className="block text-[11px] text-[#6f7076]">#{row.id}</span>
            </td>
            <td className={`${td} whitespace-nowrap`}>
              {row.amount}
              {row.bonus && <span className="block text-[11px] text-emerald-300">+ {row.bonus}</span>}
              {row.fee && (
                <span className="block text-[11px] text-[#6f7076]">
                  {m.cashier.fee} {row.fee}
                </span>
              )}
            </td>
            <td className={`${td} text-[13px]`}>{who(row)}</td>
            <td className={`${td} text-[#a0a1a6]`}>{row.method}</td>
            <td className={td}>
              <Badge tone={statusTone(row.status)}>{m.common.status[row.status]}</Badge>
              {row.settledBy && <span className="mt-0.5 block text-[11px] text-[#6f7076]">{row.settledBy}</span>}
            </td>
            <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>
              {row.settledAt ?? row.createdAt}
              {row.settledAt && <span className="block text-[11px] text-[#6f7076]">{row.createdAt}</span>}
            </td>
            <td className={`${td} max-w-[260px] text-[12px] text-[#6f7076]`}>{row.note ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
