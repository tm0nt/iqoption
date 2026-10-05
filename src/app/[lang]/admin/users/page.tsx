import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { PRACTICE, REAL } from "@/lib/cabinet/wallet";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, Card, EmptyState, LinkTabs, PageHeader, Pager, TableShell, buttonClass, inputClass, td, th } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/users">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).users.heading} · ${adminCopy(lang).shell.title}` };
}

const PAGE = 50;
const FILTERS = ["kycPending", "referred", "closed"] as const;
type Filter = (typeof FILTERS)[number];

const KYC_TONE = { NONE: "neutral", PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

export default async function AdminUsersPage(props: PageProps<"/[lang]/admin/users">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const t = adminMoneyCopy(lang).users;
  const c = adminMoneyCopy(lang).common;
  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : "");

  const filter = FILTERS.find((value) => value === read("filter"));
  const q = read("q").trim();
  const page = Math.max(1, Number(read("page")) || 1);

  const search: Prisma.UserWhereInput = q
    ? {
        OR: [
          ...(/^\d+$/.test(q) ? [{ id: Number(q) }] : []),
          { email: { contains: q.toLowerCase() } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { phone: { contains: q.replace(/[^\d+]/g, "") || q } },
        ],
      }
    : {};
  const filtered: Record<Filter, Prisma.UserWhereInput> = {
    kycPending: { kycStatus: "PENDING" },
    referred: { referral: { isNot: null } },
    closed: { isActive: false },
  };
  const where: Prisma.UserWhereInput = { ...search, ...(filter ? filtered[filter] : {}) };

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { id: "desc" },
      take: PAGE + 1,
      skip: (page - 1) * PAGE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        kycStatus: true,
        isActive: true,
        role: true,
        twoFactorEnabledAt: true,
        _count: { select: { kycSubmissions: true } },
        balances: { where: { type: { in: [REAL, PRACTICE] } }, select: { type: true, amount: true, currency: true } },
        referral: { select: { affiliate: { select: { id: true, code: true } } } },
        affiliate: { select: { id: true, code: true } },
      },
    }),
    Promise.all([
      prisma.user.count({ where: search }),
      ...FILTERS.map((value) => prisma.user.count({ where: { ...search, ...filtered[value] } })),
    ]),
  ]);

  const hasNext = users.length > PAGE;
  const base = `/${lang}/admin/users`;
  const link = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ filter: filter ?? "", q, ...patch })) if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.heading} lead={t.lead} />

      <div className="space-y-3">
        <LinkTabs
          items={[
            { href: link({ filter: "", page: "" }), label: t.filters.all, current: !filter, count: counts[0] },
            ...FILTERS.map((value, index) => ({
              href: link({ filter: value, page: "" }),
              label: t.filters[value],
              current: filter === value,
              count: counts[index + 1],
            })),
          ]}
        />
        <form method="get" className="flex flex-wrap gap-2">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className={`${inputClass} max-w-[320px]`} />
          <button type="submit" className={buttonClass("secondary")}>
            {c.search}
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <Card>
          <EmptyState>{t.none}</EmptyState>
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              {[t.account, t.registered, t.verification, t.real, t.practice, t.referredBy, t.status, ""].map((head, index) => (
                <th key={index} className={th}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.slice(0, PAGE).map((user) => {
              const real = user.balances.find((balance) => balance.type === REAL);
              const practice = user.balances.find((balance) => balance.type === PRACTICE);
              const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
              return (
                <tr key={user.id} className={user.isActive ? "" : "opacity-60"}>
                  <td className={td}>
                    <span className="block font-medium text-white">{user.email}</span>
                    <span className="block text-[11px] text-[#6f7076]">
                      #{user.id}
                      {name && ` · ${name}`} · {user.phone}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(user.createdAt, lang)}</td>
                  <td className={td}>
                    <Badge tone={KYC_TONE[user.kycStatus]}>{t.kyc[user.kycStatus]}</Badge>
                    {user._count.kycSubmissions > 0 && (
                      <Link
                        href={`/${lang}/admin/kyc?status=all&q=${user.id}`}
                        className={`${buttonClass(user.kycStatus === "PENDING" ? "primary" : "ghost", "sm")} mt-1.5`}
                      >
                        {t.reviewKyc}
                      </Link>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap font-medium`}>{real ? formatMoney(Number(real.amount), real.currency, lang) : "—"}</td>
                  <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>
                    {practice ? formatMoney(Number(practice.amount), practice.currency, lang) : "—"}
                  </td>
                  <td className={td}>
                    {user.referral ? (
                      <Link href={`/${lang}/admin/affiliates/${user.referral.affiliate.id}`}>
                        <Badge tone="info">{user.referral.affiliate.code}</Badge>
                      </Link>
                    ) : (
                      <span className="text-[#6f7076]">—</span>
                    )}
                    {user.affiliate && (
                      <Link href={`/${lang}/admin/affiliates/${user.affiliate.id}`} className="ml-1.5">
                        <Badge tone="accent">{adminMoneyCopy(lang).affiliates.affiliate}</Badge>
                      </Link>
                    )}
                  </td>
                  <td className={td}>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge tone={user.isActive ? "success" : "danger"}>{user.isActive ? t.active : t.closed}</Badge>
                      {user.role === "ADMIN" && <Badge tone="accent">{t.admin}</Badge>}
                      {user.twoFactorEnabledAt && <Badge tone="info">{t.twoFactor}</Badge>}
                    </span>
                  </td>
                  <td className={`${td} space-y-1.5`}>
                    {user.twoFactorEnabledAt && (
                      <ActionButton
                        url={`/api/admin/users/${user.id}`}
                        method="PATCH"
                        body={{ resetTwoFactor: true }}
                        label={t.resetTwoFactor}
                        variant="ghost"
                        confirm={t.confirmResetTwoFactor}
                        failed={c.actionFailed}
                      />
                    )}
                    {user.isActive ? (
                      <ActionButton
                        url={`/api/admin/users/${user.id}`}
                        method="PATCH"
                        body={{ isActive: false }}
                        label={t.disable}
                        variant="danger"
                        confirm={t.confirmDisable}
                        failed={c.actionFailed}
                      />
                    ) : (
                      <ActionButton url={`/api/admin/users/${user.id}`} method="PATCH" body={{ isActive: true }} label={t.enable} failed={c.actionFailed} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Pager
        basePath={base}
        query={Object.fromEntries(Object.entries({ filter: filter ?? "", q }).filter(([, v]) => v))}
        page={page}
        hasNext={hasNext}
        labels={{ previous: c.previous, next: c.next, page: c.page }}
      />
    </div>
  );
}
