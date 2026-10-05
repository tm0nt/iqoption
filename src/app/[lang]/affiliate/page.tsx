import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { RequestHistory, type RequestRow } from "@/components/cabinet/RequestHistory";
import { CopyField, JoinButton, LinkBuilder, PayoutForm, PostbackForm } from "@/components/affiliate/widgets";
import { loadCabinet } from "@/lib/cabinet/profile";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { formatDateTime, formatLongDate, formatMoney, localeTag, maskDestination } from "@/lib/cabinet/format";
import { prisma } from "@/lib/db";
import { affiliateProgram, paysCpa, paysRevshare, termsFor } from "@/lib/affiliate/program";
import { accrueQuietly } from "@/lib/affiliate/accrual";
import { affiliateBalance } from "@/lib/affiliate/ledger";
import { conversion, dailySeries, periodStart, readPeriod, referralsOf, statsOf, subIdReport, PERIODS } from "@/lib/affiliate/stats";
import { POSTBACK_MACROS } from "@/lib/affiliate/postback";
import { isLocale } from "@/i18n/avalon";
import { affiliateCopy, type AffiliateCopy } from "@/i18n/affiliate";

export async function generateMetadata(props: PageProps<"/[lang]/affiliate">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: affiliateCopy(lang).title };
}
export const dynamic = "force-dynamic";

const TABS = ["overview", "links", "referrals", "commissions", "payouts", "postback"] as const;
type Tab = (typeof TABS)[number];

/** `jo***@mail.com`: enough for the affiliate to tell people apart, not enough to contact them. */
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 2)}***@${domain}`;
}

/** Where links should point: the platform's own address if it has one, else the host this page was asked on. */
async function siteOrigin(configured: string) {
  if (configured) return configured.replace(/\/+$/, "");
  const head = await headers();
  const host = head.get("x-forwarded-host") ?? head.get("host") ?? "localhost:3000";
  const proto = head.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[4px] bg-white p-5 shadow-avalon sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-[16px] font-semibold text-avalon-text-strong">{title}</h2>}
      {children}
    </section>
  );
}

function Figure({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-[4px] bg-white px-4 py-3.5 shadow-avalon">
      <p className="text-[12px] text-avalon-text">{label}</p>
      <p className={`mt-1 truncate text-[20px] font-semibold ${strong ? "text-avalon-primary" : "text-avalon-text-strong"}`}>{value}</p>
    </div>
  );
}

/** The programme's figures in words, for the join page and the "your terms" box. */
function TermsList({
  t,
  plan,
  cpa,
  minimum,
  percent,
  hold,
  minPayout,
}: {
  t: AffiliateCopy;
  plan: "CPA" | "REVSHARE" | "HYBRID";
  cpa: string;
  minimum: string;
  percent: string;
  hold: number;
  minPayout: string;
}) {
  return (
    <ul className="space-y-2 text-[14px] leading-[22px] text-avalon-text">
      {paysCpa(plan) && <li>• {t.cpaTerm(cpa, minimum)}</li>}
      {paysRevshare(plan) && <li>• {t.revshareTerm(percent)}</li>}
      <li>• {t.holdTerm(hold)}</li>
      <li>• {t.minPayoutTerm(minPayout)}</li>
    </ul>
  );
}

export default async function AffiliatePage(props: PageProps<"/[lang]/affiliate">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  const t = affiliateCopy(lang);

  const query = await props.searchParams;
  const tab: Tab = TABS.includes(query.tab as Tab) ? (query.tab as Tab) : "overview";
  const period = readPeriod(query.period);

  const { user, account, brand } = await loadCabinet(lang, `/${lang}/affiliate`);
  const [program, found] = await Promise.all([
    affiliateProgram(),
    prisma.affiliate.findUnique({ where: { userId: user.id } }),
  ]);

  const money = (n: number) => formatMoney(n, program.currency, lang);
  const percent = new Intl.NumberFormat(localeTag(lang), { style: "percent", maximumFractionDigits: 2 });

  const header = (
    <div className="pt-8 sm:pt-10">
      <h1 className="text-[26px] font-semibold text-avalon-text-strong sm:text-[30px]">{t.title}</h1>
      <p className="mt-2 text-[14px] text-avalon-text">{t.lead}</p>
    </div>
  );

  /* ---------------------------------------------------- not an affiliate yet */
  if (!found) {
    const terms = termsFor(program, { plan: null, cpaAmount: null, revsharePercent: null });
    return (
      <CabinetShell locale={lang} account={account} brand={brand} wide>
        {header}
        <div className="mt-8 grid gap-6 pb-16 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <h2 className="text-[22px] font-semibold text-avalon-text-strong">{t.joinTitle}</h2>
            <p className="mt-3 max-w-[560px] text-[15px] leading-[24px] text-avalon-text">{t.joinBody}</p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {t.steps.map((step, index) => (
                <li key={step} className="rounded-[4px] bg-avalon-surface px-4 py-4">
                  <span className="flex size-7 items-center justify-center rounded-full bg-avalon-primary text-[13px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-[14px] leading-[20px] text-avalon-text-strong">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-7">{program.enabled ? <JoinButton locale={lang} /> : <p className="text-[14px] text-avalon-danger">{t.closed}</p>}</div>
          </Card>
          <Card title={t.programTerms}>
            <TermsList
              t={t}
              plan={terms.plan}
              cpa={money(terms.cpaAmount)}
              minimum={money(program.cpaMinDeposit)}
              percent={percent.format(terms.revsharePercent / 100)}
              hold={program.holdDays}
              minPayout={money(program.minPayout)}
            />
            {program.terms && (
              <div className="mt-5 space-y-3 border-t border-avalon-surface-hover pt-5 text-[13px] leading-[21px] text-avalon-text">
                {program.terms.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </Card>
        </div>
      </CabinetShell>
    );
  }

  const affiliate = found;

  /* ------------------------------------------------------- waiting approval */
  if (affiliate.status === "PENDING") {
    return (
      <CabinetShell locale={lang} account={account} brand={brand} wide>
        {header}
        <div className="pb-16 pt-8">
          <Card>
            <h2 className="text-[20px] font-semibold text-avalon-text-strong">{t.pendingTitle}</h2>
            <p className="mt-3 max-w-[620px] text-[14px] leading-[22px] text-avalon-text">{t.pendingBody}</p>
          </Card>
        </div>
      </CabinetShell>
    );
  }

  /* -------------------------------------------------------------- dashboard */
  await accrueQuietly(affiliate.id);
  const terms = termsFor(program, affiliate);
  const balance = await affiliateBalance(affiliate.id);
  const origin = await siteOrigin(brand.siteUrl);

  const tabHref = (next: Tab, nextPeriod = period) =>
    `/${lang}/affiliate?tab=${next}${nextPeriod !== "30d" ? `&period=${nextPeriod}` : ""}`;

  let body: React.ReactNode = null;

  if (tab === "overview") {
    const from = periodStart(period);
    const [stats, series, subs] = await Promise.all([statsOf(affiliate.id, from), dailySeries(affiliate.id, 30), subIdReport(affiliate.id, from)]);
    const rate = conversion(stats);
    const peak = Math.max(1, ...series.map((day) => day.clicks), ...series.map((day) => day.signups));

    body = (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((value) => (
            <Link
              key={value}
              href={tabHref("overview", value)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                value === period ? "bg-avalon-primary text-white" : "bg-white text-avalon-text shadow-avalon hover:text-avalon-text-strong"
              }`}
            >
              {t.periods[value]}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Figure label={t.clicks} value={String(stats.clicks)} />
          <Figure label={t.uniqueClicks} value={String(stats.uniqueClicks)} />
          <Figure label={t.signups} value={String(stats.signups)} />
          <Figure label={t.conversion} value={rate === null ? "—" : percent.format(rate / 100)} />
          <Figure label={t.ftds} value={String(stats.ftds)} />
          <Figure label={t.ftdAmount} value={money(stats.ftdAmount)} />
          <Figure label={t.deposits} value={money(stats.deposits)} />
          <Figure label={t.earned} value={money(stats.earned)} strong />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card title={t.last30}>
            <div className="flex h-[160px] items-end gap-[3px]" role="img" aria-label={t.last30}>
              {series.map((day) => (
                <div
                  key={day.day}
                  title={`${day.day} · ${t.legendClicks}: ${day.clicks} · ${t.legendSignups}: ${day.signups} · ${t.legendEarned}: ${money(day.earned)}`}
                  className="relative flex h-full min-w-0 flex-1 items-end"
                >
                  <span className="w-full rounded-t-[2px] bg-avalon-primary/25" style={{ height: `${(day.clicks / peak) * 100}%` }} />
                  <span className="absolute bottom-0 left-0 w-full rounded-t-[2px] bg-avalon-primary" style={{ height: `${(day.signups / peak) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-avalon-text">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-avalon-primary/25" /> {t.legendClicks}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-avalon-primary" /> {t.legendSignups}
              </span>
            </div>
          </Card>

          <Card title={t.earned}>
            <dl className="space-y-2.5 text-[14px]">
              {[
                [t.cpa, stats.cpa],
                [t.revshare, stats.revshare],
                [t.adjustments, stats.adjustments],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-3">
                  <dt className="text-avalon-text">{label}</dt>
                  <dd className={`font-medium ${(value as number) < 0 ? "text-avalon-danger" : "text-avalon-text-strong"}`}>{money(value as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-avalon-surface-hover pt-2.5">
                <dt className="font-medium text-avalon-text-strong">{t.earned}</dt>
                <dd className="font-semibold text-avalon-primary">{money(stats.earned)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card title={t.bySub}>
          {subs.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-avalon-text">{t.noReferrals}</p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
                  <tr>
                    {[t.sub, t.clicks, t.signups, t.ftds, t.earned].map((head) => (
                      <th key={head} className="pb-3 pr-3 font-medium last:text-right">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-avalon-surface-hover">
                  {subs.map((row) => (
                    <tr key={row.sub}>
                      <td className="py-2.5 pr-3 font-mono text-[12px] text-avalon-text-strong">{row.sub || t.noSub}</td>
                      <td className="py-2.5 pr-3">{row.clicks}</td>
                      <td className="py-2.5 pr-3">{row.signups}</td>
                      <td className="py-2.5 pr-3">{row.ftds}</td>
                      <td className="py-2.5 text-right font-medium text-avalon-text-strong">{money(row.earned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (tab === "links") {
    body = (
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card title={t.yourCode}>
          <CopyField value={affiliate.code} locale={lang} mono />
          <p className="mt-5 text-[12px] font-medium uppercase tracking-wide text-avalon-text">{t.yourLink}</p>
          <div className="mt-2">
            <CopyField value={`${origin}/${lang}/register?ref=${affiliate.code}`} locale={lang} mono />
          </div>
        </Card>
        <Card title={t.builder}>
          <p className="mb-4 text-[13px] leading-[20px] text-avalon-text">{t.builderBody}</p>
          <LinkBuilder origin={origin} code={affiliate.code} locale={lang} />
        </Card>
      </div>
    );
  }

  if (tab === "referrals") {
    const rows = await referralsOf(affiliate.id, 100, 0);
    body = (
      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-avalon-text">{t.noReferrals}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
                <tr>
                  {[t.account, t.registered, t.sub, t.firstDeposit, t.deposits, t.earned].map((head) => (
                    <th key={head} className="pb-3 pr-3 font-medium last:text-right">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-avalon-surface-hover">
                {rows.map((row) => (
                  <tr key={row.userId}>
                    <td className="py-2.5 pr-3 text-avalon-text-strong">{maskEmail(row.email)}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 text-avalon-text">{formatLongDate(row.createdAt, lang)}</td>
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-avalon-text">{row.subId ?? "—"}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3">
                      {row.ftdAt ? money(row.ftdAmount ?? 0) : <span className="text-avalon-text">{t.noDeposit}</span>}
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3">{money(row.deposits)}</td>
                    <td className={`whitespace-nowrap py-2.5 text-right font-medium ${row.earned < 0 ? "text-avalon-danger" : "text-avalon-text-strong"}`}>
                      {money(row.earned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pt-3 text-[12px] text-avalon-text">{t.showing(rows.length)}</p>
          </div>
        )}
      </Card>
    );
  }

  if (tab === "commissions") {
    const lines = await prisma.affiliateCommission.findMany({
      where: { affiliateId: affiliate.id, NOT: { amount: 0 } },
      orderBy: { earnedAt: "desc" },
      take: 200,
    });
    const now = new Date();
    body = (
      <Card>
        {lines.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-avalon-text">{t.noCommissions}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
                <tr>
                  {[t.date, t.type, t.base, t.availableFrom, t.state, t.amount].map((head) => (
                    <th key={head} className="pb-3 pr-3 font-medium last:text-right">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-avalon-surface-hover">
                {lines.map((line) => {
                  const state = line.reversedAt ? "reversed" : line.availableAt > now ? "held" : "available";
                  return (
                    <tr key={line.id} className={line.reversedAt ? "opacity-50" : ""}>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-avalon-text">{formatDateTime(line.earnedAt, lang)}</td>
                      <td className="py-2.5 pr-3 text-avalon-text-strong">
                        {t.kinds[line.kind]}
                        {line.rate && line.kind === "REVSHARE" ? ` · ${Number(line.rate)}%` : ""}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-avalon-text">{line.base !== null ? money(Number(line.base)) : line.note ?? "—"}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-avalon-text">{formatLongDate(line.availableAt, lang)}</td>
                      <td className="py-2.5 pr-3 text-avalon-text">{t.states[state]}</td>
                      <td className={`whitespace-nowrap py-2.5 text-right font-medium ${Number(line.amount) < 0 ? "text-avalon-danger" : "text-avalon-text-strong"}`}>
                        {money(Number(line.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="pt-3 text-[12px] text-avalon-text">{t.showing(lines.length)}</p>
          </div>
        )}
      </Card>
    );
  }

  if (tab === "payouts") {
    const [settings, payouts] = await Promise.all([
      cashierSettings(),
      prisma.affiliatePayout.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    const rows: RequestRow[] = payouts.map((payout) => ({
      id: payout.id,
      when: formatDateTime(payout.createdAt, lang),
      method: payout.method,
      destination: maskDestination(payout.destination),
      amount: formatMoney(Number(payout.amount), payout.currency, lang),
      status: payout.status,
    }));
    body = (
      <div className="space-y-6">
        <Card title={t.requestTitle}>
          {affiliate.status === "ACTIVE" ? (
            <PayoutForm
              methods={settings.methods.filter((method) => method.withdrawal)}
              available={balance.available}
              minimum={program.minPayout}
              currency={program.currency}
              locale={lang}
            />
          ) : (
            <p className="text-[14px] text-avalon-text">{t.inactive}</p>
          )}
        </Card>
        <RequestHistory title={t.payoutsHistory} rows={rows} locale={lang} showDestination cancelBase="/api/affiliate/payout" />
      </div>
    );
  }

  if (tab === "postback") {
    const log = await prisma.affiliatePostback.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: "desc" }, take: 30 });
    body = (
      <div className="space-y-6">
        <Card title={t.postbackTitle}>
          <p className="mb-4 text-[13px] leading-[21px] text-avalon-text">
            {t.postbackBody}{" "}
            {POSTBACK_MACROS.map((macro) => (
              <code key={macro} className="mr-1.5 rounded bg-avalon-surface px-1.5 py-0.5 font-mono text-[12px] text-avalon-text-strong">
                {`{${macro}}`}
              </code>
            ))}
          </p>
          <PostbackForm current={affiliate.postbackUrl ?? ""} locale={lang} />
        </Card>
        <Card title={t.postbackLog}>
          {log.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-avalon-text">{t.noPostbacks}</p>
          ) : (
            <ul className="divide-y divide-avalon-surface-hover text-[13px]">
              {log.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                  <span className="whitespace-nowrap text-avalon-text">{formatDateTime(entry.createdAt, lang)}</span>
                  <span className="font-medium text-avalon-text-strong">{entry.event}</span>
                  <span className={entry.status && entry.status < 400 ? "text-avalon-primary" : "text-avalon-danger"}>
                    {entry.status ?? entry.error ?? "—"}
                  </span>
                  <span className="min-w-0 basis-full truncate font-mono text-[11px] text-avalon-text">{entry.url}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  return (
    <CabinetShell locale={lang} account={account} brand={brand} wide>
      {header}

      {affiliate.status === "SUSPENDED" && (
        <p className="mt-6 rounded-[4px] bg-[#fdeff1] px-5 py-4 text-[14px] leading-[22px] text-avalon-danger">
          <span className="font-semibold">{t.suspendedTitle}.</span> {t.suspendedBody(brand.supportEmail)}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Figure label={t.available} value={money(balance.available)} strong />
        <Figure label={t.held} value={money(balance.held)} />
        <Figure label={t.pending} value={money(balance.pending)} />
        <Figure label={t.paid} value={money(balance.paid)} />
      </div>

      <div className="mt-4 rounded-[4px] bg-avalon-surface px-5 py-4">
        <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-avalon-text">{t.yourTerms}</p>
        <TermsList
          t={t}
          plan={terms.plan}
          cpa={money(terms.cpaAmount)}
          minimum={money(program.cpaMinDeposit)}
          percent={percent.format(terms.revsharePercent / 100)}
          hold={program.holdDays}
          minPayout={money(program.minPayout)}
        />
      </div>

      <nav className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-6 border-b border-avalon-surface-hover">
          {TABS.map((value) => (
            <li key={value} className="shrink-0">
              <Link
                href={tabHref(value)}
                aria-current={value === tab ? "page" : undefined}
                className={`-mb-px block border-b-2 pb-3 text-[14px] font-medium transition-colors ${
                  value === tab ? "border-avalon-primary text-avalon-primary" : "border-transparent text-avalon-text hover:text-avalon-text-strong"
                }`}
              >
                {t.tabs[value]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pb-16 pt-6">{body}</div>
    </CabinetShell>
  );
}
