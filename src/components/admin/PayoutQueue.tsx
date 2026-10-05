"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { Badge, EmptyState, buttonClass, inputClass, statusTone } from "./ui";

export type PayoutRow = {
  id: number;
  affiliateId: number;
  email: string;
  code: string;
  amount: string;
  method: string;
  destination: string;
  requested: string;
  /** What the affiliate has left once this one is paid. */
  availableAfter: string | null;
};

/**
 * Affiliate payouts waiting on a decision.
 *
 * The destination is shown in full here, unlike anywhere the affiliate sees
 * it: this is the screen whoever sends the money copies it from.
 */
export function PayoutQueue({ rows, locale }: { rows: PayoutRow[]; locale: string }) {
  const t = adminMoneyCopy(locale).payouts;
  const c = adminMoneyCopy(locale).common;
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  async function settle(id: number, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    const response = await fetch(`/api/admin/affiliates/payouts/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, note: notes[id] ?? "" }),
    }).catch(() => null);
    setBusy(null);
    if (!response?.ok) {
      const said = await response?.json().catch(() => null);
      setError(said?.error ?? c.actionFailed);
      return;
    }
    router.refresh();
  }

  if (rows.length === 0) return <EmptyState>{t.nothing}</EmptyState>;

  return (
    <div>
      {error && <p className="mx-5 mt-4 rounded border border-[#f6465d]/40 bg-[#f6465d]/10 px-3 py-2 text-[13px] text-[#ff8a99]">{error}</p>}
      <ul className="divide-y divide-white/[0.05]">
        {rows.map((row) => (
          <li key={row.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Badge tone={statusTone("PENDING")}>{c.status.PENDING}</Badge>
              <span className="text-[18px] font-semibold text-white">{row.amount}</span>
              <span className="text-[13px] text-[#a0a1a6]">{row.method}</span>
              <Link href={`/${locale}/admin/affiliates/${row.affiliateId}`} className="text-[13px] text-[var(--accent)] hover:underline">
                {row.email} · {row.code}
              </Link>
              <span className="ml-auto text-[12px] text-[#6f7076]">{row.requested}</span>
            </div>
            <p className="mt-2 break-all text-[13px] text-[#a0a1a6]">
              {t.destination}: <span className="font-mono text-white">{row.destination}</span>
            </p>
            {row.availableAfter && (
              <p className="mt-1 text-[12px] text-[#6f7076]">
                {t.availableNow}: {row.availableAfter}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={notes[row.id] ?? ""}
                onChange={(event) => setNotes({ ...notes, [row.id]: event.target.value })}
                placeholder={c.notePlaceholder}
                className={`${inputClass} min-w-[220px] flex-1`}
              />
              <button type="button" disabled={busy === row.id} onClick={() => void settle(row.id, "approve")} className={buttonClass("primary")}>
                {c.approve} — {t.approveEffect}
              </button>
              <button type="button" disabled={busy === row.id} onClick={() => void settle(row.id, "reject")} className={buttonClass("danger")}>
                {c.reject} — {t.rejectEffect}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
