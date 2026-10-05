"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCopy, type AdminCopy } from "@/i18n/admin";

export type AdminTransaction = {
  id: number;
  kind: string;
  status: string;
  amount: string;
  currency: string;
  method: string;
  destination: string | null;
  note: string | null;
  createdAt: string;
  settledAt: string | null;
  email: string;
  userId: number;
};

const money = (amount: string, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));

/**
 * What each decision does to the money, said on the screen.
 *
 * The two kinds are not symmetrical — a withdrawal has already left the
 * balance and a deposit has not arrived — and an administrator should not have
 * to remember which. The button says what it will do.
 */
function effectOf(kind: string, action: "approve" | "reject", t: AdminCopy["cashier"]) {
  if (kind === "DEPOSIT") {
    return action === "approve" ? t.credits : t.movesNothing;
  }
  return action === "approve" ? t.alreadyLeft : t.refunds;
}

export function CashierQueue({ transactions, locale }: { transactions: AdminTransaction[]; locale: string }) {
  const t = adminCopy(locale).cashier;
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

  const pending = transactions.filter((row) => row.status === "PENDING");
  const settled = transactions.filter((row) => row.status !== "PENDING");

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded border border-avalon-danger/40 bg-avalon-danger/10 px-3 py-2 text-[13px] text-avalon-danger">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">{t.waiting(pending.length)}</h2>

        {pending.length === 0 ? (
          <p className="text-[13px] text-[#73747a]">{t.nothingToSettle}</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((row) => (
              <li key={row.id} className="rounded border border-white/10 bg-[#15161a] p-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className={`text-[13px] font-medium ${row.kind === "DEPOSIT" ? "text-[var(--accent)]" : "text-amber-400"}`}>
                    {row.kind === "DEPOSIT" ? t.deposit : t.withdrawal}
                  </span>
                  <span className="text-[18px] font-semibold">{money(row.amount, row.currency)}</span>
                  <span className="text-[13px] text-[#a0a1a6]">{row.method}</span>
                  <span className="text-[13px] text-[#a0a1a6]">{row.email}</span>
                  <span className="ml-auto text-[12px] text-[#73747a]">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>

                {row.destination && (
                  <p className="mt-2 text-[13px] text-[#a0a1a6]">
                    {t.to}: <span className="font-mono">{row.destination}</span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                    placeholder={t.notePlaceholder}
                    className="min-w-[240px] flex-1 rounded border border-white/10 bg-[#0f1013] px-2 py-1.5 text-[13px] text-white outline-none focus:border-[var(--accent)]"
                  />

                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void settle(row.id, "approve")}
                    className="rounded bg-[var(--accent)] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                    title={effectOf(row.kind, "approve", t)}
                  >
                    {t.approve} — {effectOf(row.kind, "approve", t)}
                  </button>

                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void settle(row.id, "reject")}
                    className="rounded border border-avalon-danger/50 px-3 py-1.5 text-[13px] text-avalon-danger disabled:opacity-50"
                    title={effectOf(row.kind, "reject", t)}
                  >
                    {t.reject} — {effectOf(row.kind, "reject", t)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">{t.settled}</h2>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#73747a]">
              <th className="py-2 pr-3">{t.kind}</th>
              <th className="py-2 pr-3">{t.amount}</th>
              <th className="py-2 pr-3">{t.account}</th>
              <th className="py-2 pr-3">{t.method}</th>
              <th className="py-2 pr-3">{t.outcome}</th>
              <th className="py-2 pr-3">{t.when}</th>
              <th className="py-2">{t.note}</th>
            </tr>
          </thead>
          <tbody>
            {settled.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.kind === "DEPOSIT" ? t.deposit : t.withdrawal}</td>
                <td className="py-2 pr-3">{money(row.amount, row.currency)}</td>
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.email}</td>
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.method}</td>
                <td className={`py-2 pr-3 ${row.status === "APPROVED" ? "text-[var(--accent)]" : "text-avalon-danger"}`}>
                  {row.status === "APPROVED" ? t.approved : t.rejected}
                </td>
                <td className="py-2 pr-3 text-[#a0a1a6]">
                  {row.settledAt ? new Date(row.settledAt).toLocaleString() : "—"}
                </td>
                <td className="py-2 text-[#73747a]">{row.note ?? ""}</td>
              </tr>
            ))}

            {settled.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-[#73747a]">{t.nothingSettled}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
