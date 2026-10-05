import Link from "next/link";
import { adminCopy, type AdminCopy } from "@/i18n/admin";

export type AdminPosition = {
  id: number;
  userId: number;
  userEmail: string | null;
  activeId: number;
  ticker: string;
  direction: string;
  invest: number;
  profitAmount: number | null;
  profitPercent: number;
  openQuote: number;
  closeQuote: number | null;
  openTime: number;
  expirationTime: number;
  expirationSize: number;
  closedAt: number;
  status: string;
  closeReason: string;
  currency: string;
};

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(value: number, currency: string) {
  return `${MONEY.format(value)} ${currency}`;
}

function instant(seconds: number) {
  return new Date(seconds * 1000).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** How long a deal was bought for, in the units the panel offers it. */
function duration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0 && seconds < 3600) return `${seconds / 60}m`;
  return `${Math.round(seconds / 60)}m`;
}

function Outcome({ position, t }: { position: AdminPosition; t: AdminCopy["deals"] }) {
  if (!position.closedAt) {
    return <span className="rounded bg-white/10 px-2 py-0.5 text-[12px] text-[#c9cace]">{t.inProgress}</span>;
  }

  const net = (position.profitAmount ?? 0) - position.invest;
  const tone =
    position.closeReason === "win"
      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
      : position.closeReason === "equal"
        ? "bg-white/10 text-[#c9cace]"
        : "bg-avalon-danger/15 text-avalon-danger";

  // `win` / `loose` / `equal` is what the wire calls them; the panel says it in words.
  const word = position.closeReason === "equal" ? t.refunded : position.closeReason === "win" ? t.win : t.loss;

  return (
    <span className={`rounded px-2 py-0.5 text-[12px] ${tone}`}>
      {word}
      {position.closeReason !== "equal" && (
        <span className="ml-1.5 font-mono">
          {net >= 0 ? "+" : ""}
          {MONEY.format(net)}
        </span>
      )}
    </span>
  );
}

/**
 * The deal book.
 *
 * Read-only on purpose. A screen that can change the outcome of a settled deal
 * is a screen that can be used to change the outcome of a settled deal, and
 * nothing here needs that: an operator wants to see what happened, and the one
 * thing worth doing about a wrong deal — refunding it — is an accounting entry
 * rather than a rewrite of history.
 */
export function PositionTable({ positions, lang }: { positions: AdminPosition[]; lang: string }) {
  const t = adminCopy(lang).deals;
  if (positions.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-[#15161a] px-5 py-8 text-center text-[13px] text-[#a0a1a6]">
        {t.none}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[980px] text-left text-[13px]">
        <thead className="bg-[#1b1c21] text-[12px] uppercase tracking-wide text-[#a0a1a6]">
          <tr>
            {[t.deal, t.account, t.instrument, t.side, t.stake, t.opened, t.expiry, t.quotes, t.outcome].map((head) => (
              <th key={head} className="px-4 py-3 font-medium">
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {positions.map((position) => (
            <tr key={position.id} className="bg-[#15161a]">
              <td className="px-4 py-2.5 font-mono text-[12px]">{position.id}</td>

              <td className="px-4 py-2.5">
                <Link
                  href={`/${lang}/admin/positions?account=${position.userId}`}
                  className="hover:text-[var(--accent)] hover:underline"
                >
                  {position.userEmail ?? position.userId}
                </Link>
              </td>

              <td className="px-4 py-2.5">
                <span className="font-medium">{position.ticker}</span>
                <span className="ml-1.5 text-[12px] text-[#6f7076]">{duration(position.expirationSize)}</span>
              </td>

              <td className="px-4 py-2.5 whitespace-nowrap">
                <span className={position.direction === "call" ? "text-[var(--accent)]" : "text-avalon-danger"}>
                  {position.direction === "call" ? `▲ ${t.call}` : `▼ ${t.put}`}
                </span>
              </td>

              <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[12px]">
                {money(position.invest, position.currency)}
              </td>

              <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#a0a1a6]">
                {instant(position.openTime)}
              </td>

              <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#a0a1a6]">
                {instant(position.expirationTime)}
              </td>

              <td className="px-4 py-2.5 font-mono text-[12px] text-[#a0a1a6]">
                {position.openQuote}
                {position.closedAt ? ` → ${position.closeQuote}` : ""}
              </td>

              <td className="px-4 py-2.5 whitespace-nowrap">
                <Outcome position={position} t={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
