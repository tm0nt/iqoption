"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
function effectOf(kind: string, action: "approve" | "reject") {
  if (kind === "DEPOSIT") {
    return action === "approve" ? "credits the wallet" : "moves no money";
  }
  return action === "approve" ? "money already left" : "refunds the wallet";
}

export function CashierQueue({ transactions }: { transactions: AdminTransaction[] }) {
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
      setError(said?.error ?? "could not settle that one");
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
        <h2 className="mb-3 text-[15px] font-semibold">Waiting ({pending.length})</h2>

        {pending.length === 0 ? (
          <p className="text-[13px] text-[#73747a]">Nothing to settle.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((row) => (
              <li key={row.id} className="rounded border border-white/10 bg-[#15161a] p-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className={`text-[13px] font-medium ${row.kind === "DEPOSIT" ? "text-avalon-primary" : "text-amber-400"}`}>
                    {row.kind === "DEPOSIT" ? "Deposit" : "Withdrawal"}
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
                    To: <span className="font-mono">{row.destination}</span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={notes[row.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                    placeholder="A note, for whoever reads this later"
                    className="min-w-[240px] flex-1 rounded border border-white/10 bg-[#0f1013] px-2 py-1.5 text-[13px] text-white outline-none focus:border-avalon-primary"
                  />

                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void settle(row.id, "approve")}
                    className="rounded bg-avalon-primary px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                    title={effectOf(row.kind, "approve")}
                  >
                    Approve — {effectOf(row.kind, "approve")}
                  </button>

                  <button
                    type="button"
                    disabled={busy === row.id}
                    onClick={() => void settle(row.id, "reject")}
                    className="rounded border border-avalon-danger/50 px-3 py-1.5 text-[13px] text-avalon-danger disabled:opacity-50"
                    title={effectOf(row.kind, "reject")}
                  >
                    Reject — {effectOf(row.kind, "reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Settled</h2>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-[#73747a]">
              <th className="py-2 pr-3">Kind</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Outcome</th>
              <th className="py-2 pr-3">When</th>
              <th className="py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {settled.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.kind === "DEPOSIT" ? "Deposit" : "Withdrawal"}</td>
                <td className="py-2 pr-3">{money(row.amount, row.currency)}</td>
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.email}</td>
                <td className="py-2 pr-3 text-[#a0a1a6]">{row.method}</td>
                <td className={`py-2 pr-3 ${row.status === "APPROVED" ? "text-avalon-primary" : "text-avalon-danger"}`}>
                  {row.status.toLowerCase()}
                </td>
                <td className="py-2 pr-3 text-[#a0a1a6]">
                  {row.settledAt ? new Date(row.settledAt).toLocaleString() : "—"}
                </td>
                <td className="py-2 text-[#73747a]">{row.note ?? ""}</td>
              </tr>
            ))}

            {settled.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-[#73747a]">Nothing settled yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
