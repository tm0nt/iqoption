import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { cardLabel } from "@/lib/payments/cards/card-types";
import { CashierQueue, type AdminTransaction } from "@/components/admin/CashierQueue";
import { LinkTabs, PageHeader, Pager, buttonClass, inputClass } from "@/components/admin/ui";

export async function generateMetadata(props: PageProps<"/[lang]/admin/cashier">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.cashier.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

const PAGE = 50;

/** Upper-case letters only, accents gone: "José da Silva" and "JOSE DA SILVA" are the same name. */
const words = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);

/**
 * Whether the name on a card is someone other than the account holder: their
 * first and last names should both be on it. Cards abbreviate middle names,
 * so only those two are asked for. Unknown when the account has no name yet.
 */
function holderDiffers(holder: string, [first, last]: (string | null)[]) {
  if (!first || !last) return false;
  const onCard = new Set(words(holder));
  return ![...words(first).slice(0, 1), ...words(last).slice(-1)].every((word) => onCard.has(word));
}
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

export default async function AdminCashierPage(props: PageProps<"/[lang]/admin/cashier">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const t = adminCopy(lang);
  const m = adminMoneyCopy(lang);
  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : "");

  /*
   * Pending by default: the queue is why anyone opens this page. "all" is
   * spelled out rather than left empty so that the default can be PENDING.
   */
  const statusParam = read("status");
  const status: Status | null = statusParam === "all" ? null : (STATUSES.find((value) => value === statusParam) ?? "PENDING");
  const kind = read("kind") === "DEPOSIT" || read("kind") === "WITHDRAWAL" ? (read("kind") as "DEPOSIT" | "WITHDRAWAL") : null;
  const q = read("q").trim();
  const page = Math.max(1, Number(read("page")) || 1);

  const search: Prisma.TransactionWhereInput = q
    ? /^\d+$/.test(q)
      ? { OR: [{ userId: Number(q) }, { id: Number(q) }] }
      : { user: { email: { contains: q.toLowerCase() } } }
    : {};
  const where: Prisma.TransactionWhereInput = { ...(status ? { status } : {}), ...(kind ? { kind } : {}), ...search };

  const [rows, counts] = await Promise.all([
    prisma.transaction.findMany({
      where,
      // The queue oldest first, so whoever waited longest is settled first; history newest first.
      orderBy: status === "PENDING" ? { createdAt: "asc" } : { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            kycStatus: true,
            firstName: true,
            lastName: true,
            referral: { select: { affiliate: { select: { id: true, code: true } } } },
          },
        },
      },
      take: PAGE + 1,
      skip: (page - 1) * PAGE,
    }),
    prisma.transaction.groupBy({ by: ["status"], where: { ...(kind ? { kind } : {}), ...search }, _count: { _all: true } }),
  ]);

  const hasNext = rows.length > PAGE;
  const promoIds = [...new Set(rows.map((row) => row.promoCodeId).filter((id): id is number => id !== null))];
  const settlerIds = [...new Set(rows.map((row) => row.settledById).filter((id): id is number => id !== null))];
  const cardIds = [...new Set(rows.map((row) => row.cardId).filter((id): id is number => id !== null))];
  const [promos, settlers, cards] = await Promise.all([
    promoIds.length ? prisma.promoCode.findMany({ where: { id: { in: promoIds } }, select: { id: true, code: true } }) : [],
    settlerIds.length ? prisma.user.findMany({ where: { id: { in: settlerIds } }, select: { id: true, email: true } }) : [],
    cardIds.length
      ? prisma.paymentCard.findMany({ where: { id: { in: cardIds } }, select: { id: true, brand: true, last4: true, holder: true } })
      : [],
  ]);
  const cardOf = new Map(cards.map((card) => [card.id, card]));
  const promoCode = new Map(promos.map((promo) => [promo.id, promo.code]));
  const settler = new Map(settlers.map((user) => [user.id, user.email]));

  const transactions: AdminTransaction[] = rows.slice(0, PAGE).map((row) => {
    const amount = Number(row.amount);
    const fee = Number(row.fee);
    const bonus = Number(row.bonus);
    return {
      id: row.id,
      kind: row.kind,
      status: row.status,
      amount: formatMoney(amount, row.currency, lang),
      fee: fee > 0 ? formatMoney(fee, row.currency, lang) : null,
      bonus: bonus > 0 ? formatMoney(bonus, row.currency, lang) : null,
      payable: row.kind === "WITHDRAWAL" && fee > 0 ? formatMoney(amount - fee, row.currency, lang) : null,
      promo: row.promoCodeId ? (promoCode.get(row.promoCodeId) ?? `#${row.promoCodeId}`) : null,
      method: row.method,
      destination: row.destination,
      note: row.note,
      createdAt: formatDateTime(row.createdAt, lang),
      settledAt: row.settledAt ? formatDateTime(row.settledAt, lang) : null,
      settledBy: row.settledById ? (settler.get(row.settledById) ?? `#${row.settledById}`) : null,
      email: row.user.email,
      userId: row.userId,
      kyc: row.user.kycStatus,
      affiliate: row.user.referral?.affiliate ?? null,
      card: (() => {
        const card = row.cardId ? cardOf.get(row.cardId) : undefined;
        if (!card) return null;
        return {
          label: cardLabel(card),
          holder: card.holder,
          holderMismatch: holderDiffers(card.holder, [row.user.firstName, row.user.lastName]),
        };
      })(),
      providerRef: row.providerRef,
    };
  });

  const base = `/${lang}/admin/cashier`;
  const keep = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const next = { status: statusParam, kind: kind ?? "", q, ...patch };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const count = (value: Status | null) =>
    value ? (counts.find((row) => row.status === value)?._count._all ?? 0) : counts.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t.cashier.heading} lead={t.cashier.lead} />

      <div className="space-y-3">
        <LinkTabs
          items={[
            ...STATUSES.map((value) => ({
              href: keep({ status: value === "PENDING" ? "" : value, page: "" }),
              label: m.common.status[value],
              current: status === value,
              count: count(value),
            })),
            { href: keep({ status: "all", page: "" }), label: m.common.all, current: status === null, count: count(null) },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          {([null, "DEPOSIT", "WITHDRAWAL"] as const).map((value) => (
            <a key={value ?? "all"} href={keep({ kind: value ?? "", page: "" })} className={buttonClass(kind === value ? "primary" : "secondary", "sm")}>
              {value === "DEPOSIT" ? m.cashier.kinds.deposits : value === "WITHDRAWAL" ? m.cashier.kinds.withdrawals : m.cashier.kinds.all}
            </a>
          ))}
          <form method="get" className="ml-auto flex gap-2">
            {statusParam && <input type="hidden" name="status" value={statusParam} />}
            {kind && <input type="hidden" name="kind" value={kind} />}
            <input name="q" defaultValue={q} placeholder={m.cashier.searchPlaceholder} className={`${inputClass} w-[220px]`} />
            <button type="submit" className={buttonClass("secondary")}>
              {m.common.search}
            </button>
          </form>
        </div>
      </div>

      <CashierQueue transactions={transactions} queue={status === "PENDING"} locale={lang} />

      <Pager
        basePath={base}
        query={Object.fromEntries(Object.entries({ status: statusParam, kind: kind ?? "", q }).filter(([, v]) => v))}
        page={page}
        hasNext={hasNext}
        labels={{ previous: m.common.previous, next: m.common.next, page: m.common.page }}
      />
    </div>
  );
}
