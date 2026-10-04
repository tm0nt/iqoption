/**
 * Everything that moved the balance, in one list.
 *
 * Two tables feed it and neither is the whole story: `transactions` holds money
 * arriving and leaving, `positions` holds what trading did to it. A balance
 * history that showed only the first would not add up to the balance, which is
 * the one thing it has to do.
 *
 * A settled deal produces two entries, not one — the stake leaving when it
 * opened and the payout arriving when it closed. Netting them into a single
 * "profit" line would hide the moment the money left, and that moment is
 * usually what someone is looking for.
 */
import { prisma } from "@/lib/db";

export type HistoryKind = "deposit" | "withdrawal" | "trade-open" | "trade-payout";

export type HistoryEntry = {
  id: string;
  at: Date;
  kind: HistoryKind;
  label: string;
  /** Signed: positive is money arriving. */
  amount: number;
  currency: string;
  status: string;
  reference: string;
};

export type HistoryFilter = {
  type?: "all" | "deposit" | "withdrawal" | "trade";
  status?: string;
  from?: Date;
  to?: Date;
};

const TRADE_LABEL: Record<string, string> = {
  win: "Trade won",
  loose: "Trade lost",
  equal: "Trade refunded",
};

export async function balanceHistory(userId: number, filter: HistoryFilter = {}): Promise<HistoryEntry[]> {
  const wantsTrades = !filter.type || filter.type === "all" || filter.type === "trade";
  const wantsMoney = !filter.type || filter.type === "all" || filter.type === "deposit" || filter.type === "withdrawal";

  const [transactions, positions] = await Promise.all([
    wantsMoney
      ? prisma.transaction.findMany({
          where: {
            userId,
            ...(filter.type === "deposit" ? { kind: "DEPOSIT" as const } : {}),
            ...(filter.type === "withdrawal" ? { kind: "WITHDRAWAL" as const } : {}),
            ...(filter.from || filter.to
              ? { createdAt: { ...(filter.from ? { gte: filter.from } : {}), ...(filter.to ? { lte: filter.to } : {}) } }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 300,
        })
      : [],
    wantsTrades
      ? prisma.position.findMany({
          where: {
            userId,
            ...(filter.from || filter.to
              ? {
                  openTime: {
                    ...(filter.from ? { gte: Math.floor(filter.from.getTime() / 1000) } : {}),
                    ...(filter.to ? { lte: Math.floor(filter.to.getTime() / 1000) } : {}),
                  },
                }
              : {}),
          },
          orderBy: { openTime: "desc" },
          take: 300,
        })
      : [],
  ]);

  const entries: HistoryEntry[] = [];

  for (const row of transactions) {
    entries.push({
      id: `t${row.id}`,
      at: row.createdAt,
      kind: row.kind === "DEPOSIT" ? "deposit" : "withdrawal",
      label: row.kind === "DEPOSIT" ? "Deposit" : "Withdrawal",
      amount: row.kind === "DEPOSIT" ? Number(row.amount) : -Number(row.amount),
      currency: row.currency,
      status: row.status.toLowerCase(),
      reference: row.method,
    });
  }

  for (const row of positions) {
    entries.push({
      id: `p${row.id}-open`,
      at: new Date(row.openTime * 1000),
      kind: "trade-open",
      label: "Trade opened",
      amount: -Number(row.invest),
      currency: row.currency,
      status: row.closedAt ? "settled" : "open",
      reference: `#${row.id}`,
    });

    // A loss pays nothing, so it has no second entry: the stake already left.
    if (row.closedAt && Number(row.profitAmount ?? 0) > 0) {
      entries.push({
        id: `p${row.id}-payout`,
        at: new Date(row.closedAt * 1000),
        kind: "trade-payout",
        label: TRADE_LABEL[row.closeReason] ?? "Trade settled",
        amount: Number(row.profitAmount),
        currency: row.currency,
        status: "settled",
        reference: `#${row.id}`,
      });
    }
  }

  const filtered = filter.status && filter.status !== "all"
    ? entries.filter((entry) => entry.status === filter.status)
    : entries;

  return filtered.sort((a, b) => b.at.getTime() - a.at.getTime());
}
