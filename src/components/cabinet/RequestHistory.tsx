"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { cabinetCopy } from "@/i18n/cabinet";

/** One request, already written out by the server in the page's language. */
export type RequestRow = {
  id: number;
  when: string;
  method: string;
  destination?: string | null;
  amount: string;
  /** A fee kept, or a bonus added. Shown under the amount. */
  extra?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
};

const TONE: Record<RequestRow["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-avalon-primary/10 text-avalon-primary",
  REJECTED: "bg-avalon-danger/10 text-avalon-danger",
  CANCELLED: "bg-avalon-surface-hover text-avalon-text",
};

/**
 * Someone's own deposit or withdrawal requests, with a way to take back one
 * nobody has looked at yet.
 *
 * The deposit page had no list at all — a deposit was recorded and then
 * vanished until it showed up in Balance History — and neither page could
 * cancel anything, so a mistyped amount waited in the queue for an
 * administrator to reject it.
 */
export function RequestHistory({
  title,
  rows,
  locale,
  showDestination = false,
  cancelBase = "/api/cashier",
}: {
  title: string;
  rows: RequestRow[];
  locale: string;
  showDestination?: boolean;
  /** Where `<id>/cancel` lives: the cashier's requests, or an affiliate's payouts. */
  cancelBase?: string;
}) {
  const t = cabinetExtra(locale).cashier;
  const d = cabinetCopy(locale).personal;
  const h = cabinetCopy(locale).history;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function cancel(id: number) {
    if (!window.confirm(t.cancelConfirm)) return;
    setError(null);
    start(async () => {
      const response = await fetch(`${cancelBase}/${id}/cancel`, { method: "POST" }).catch(() => null);
      if (!response?.ok) {
        setError(t.cancelFailed);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-[4px] bg-white px-4 py-6 shadow-avalon sm:px-8 sm:py-8">
      <h2 className="text-center text-[18px] font-semibold text-avalon-text-strong">{title}</h2>
      {error && <p className="mt-3 text-center text-[13px] text-avalon-danger">{error}</p>}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="#acabac" strokeWidth="1.6" aria-hidden>
            <circle cx="16" cy="16" r="11" />
            <path d="M24 24l9 9M12 12l8 8M20 12l-8 8" />
          </svg>
          <p className="mt-4 text-[14px] text-avalon-text">{t.noRequests}</p>
        </div>
      ) : (
        <>
          {/* On a phone, one card per request: five columns do not fit in 390px. */}
          <ul className="mt-5 divide-y divide-avalon-surface-hover sm:hidden">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
                <div className="min-w-0">
                  <p className="font-medium text-avalon-text-strong">{row.amount}</p>
                  {row.extra && <p className="text-[11px] text-avalon-text">{row.extra}</p>}
                  <p className="mt-0.5 truncate text-avalon-text">{row.method}</p>
                  {showDestination && row.destination && <p className="font-mono text-[11px] text-avalon-text">{row.destination}</p>}
                  <p className="text-[12px] text-avalon-text">{row.when}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[12px] ${TONE[row.status]}`}>{h.statusOf(row.status)}</span>
                  {row.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => cancel(row.id)}
                      className="text-[13px] text-avalon-text underline underline-offset-2 transition-colors hover:text-avalon-danger disabled:opacity-50"
                    >
                      {t.cancel}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
                <tr>
                  {[t.date, d.method, ...(showDestination ? [d.destination] : []), d.amount, t.status, ""].map((head, index) => (
                    <th key={`${head}-${index}`} className="pb-3 pr-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-avalon-surface-hover">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap py-3 pr-3 text-avalon-text">{row.when}</td>
                    <td className="py-3 pr-3 text-avalon-text-strong">{row.method}</td>
                    {showDestination && <td className="py-3 pr-3 font-mono text-[12px] text-avalon-text">{row.destination ?? "—"}</td>}
                    <td className="whitespace-nowrap py-3 pr-3 text-avalon-text-strong">
                      {row.amount}
                      {row.extra && <span className="block text-[11px] text-avalon-text">{row.extra}</span>}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`whitespace-nowrap rounded px-2 py-0.5 text-[12px] ${TONE[row.status]}`}>{h.statusOf(row.status)}</span>
                    </td>
                    <td className="py-3 text-right">
                      {row.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => cancel(row.id)}
                          className="text-[13px] text-avalon-text underline-offset-2 transition-colors hover:text-avalon-danger hover:underline disabled:opacity-50"
                        >
                          {t.cancel}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
