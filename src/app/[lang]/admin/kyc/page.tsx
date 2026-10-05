import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { formatDateTime, localeTag } from "@/lib/cabinet/format";
import { kycRules } from "@/lib/kyc/rules";
import { KycDecision } from "@/components/admin/KycDecision";
import { KycRulesEditor } from "@/components/admin/KycRulesEditor";
import { Badge, Card, EmptyState, LinkTabs, PageHeader, Pager, buttonClass, inputClass, statusTone } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/kyc">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).kyc.heading} · ${adminCopy(lang).shell.title}` };
}

const PAGE = 20;
const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type Status = (typeof STATUSES)[number];

/** Whole years between a date of birth and now, by the calendar rather than by 365-day blocks. */
function ageOf(birth: Date, now = new Date()) {
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const before =
    now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (before) years -= 1;
  return years;
}

/**
 * The identity review queue, and the accepted-documents list beside it.
 *
 * Each submission is laid out the way it is checked: what the person declared
 * on one side, what the document says on the other, the three photos below,
 * and the decision under them. Things worth a second look — a document from a
 * country other than the declared citizenship, someone under eighteen, a third
 * attempt — are flagged rather than left to be noticed.
 */
export default async function AdminKycPage(props: PageProps<"/[lang]/admin/kyc">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const t = adminMoneyCopy(lang).kyc;
  const c = adminMoneyCopy(lang).common;
  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : "");

  const view = read("view") === "rules" ? "rules" : "queue";
  const statusParam = read("status");
  const status: Status | null = statusParam === "all" ? null : (STATUSES.find((value) => value === statusParam) ?? "PENDING");
  const q = read("q").trim();
  const page = Math.max(1, Number(read("page")) || 1);
  const base = `/${lang}/admin/kyc`;
  const regions = new Intl.DisplayNames([localeTag(lang)], { type: "region" });
  const countryName = (code: string | null) => {
    if (!code) return "—";
    try {
      return regions.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const tabs = (pending: number) => (
    <LinkTabs
      items={[
        { href: base, label: t.queueTab, current: view === "queue", count: pending },
        { href: `${base}?view=rules`, label: t.rulesTab, current: view === "rules" },
      ]}
    />
  );

  if (view === "rules") {
    const [rules, pending] = await Promise.all([kycRules(), prisma.kycSubmission.count({ where: { status: "PENDING" } })]);
    return (
      <div className="space-y-6">
        <PageHeader title={t.heading} lead={t.lead} />
        {tabs(pending)}
        <Card title={t.rulesTitle} description={t.rulesLead}>
          <KycRulesEditor
            initial={rules.countries}
            names={Object.fromEntries(rules.countries.map((rule) => [rule.code, countryName(rule.code)]))}
            locale={lang}
          />
        </Card>
      </div>
    );
  }

  const search: Prisma.KycSubmissionWhereInput = q
    ? {
        OR: [
          ...(/^\d+$/.test(q) ? [{ userId: Number(q) }] : []),
          { user: { email: { contains: q.toLowerCase() } } },
          { documentNumber: { contains: q.toUpperCase() } },
        ],
      }
    : {};
  const where: Prisma.KycSubmissionWhereInput = { ...(status ? { status } : {}), ...search };

  const [rows, counts] = await Promise.all([
    prisma.kycSubmission.findMany({
      where,
      // The queue oldest first, so whoever has waited longest is seen first; history newest first.
      orderBy: status === "PENDING" ? { createdAt: "asc" } : { createdAt: "desc" },
      take: PAGE + 1,
      skip: (page - 1) * PAGE,
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, dateOfBirth: true, citizenship: true, isUsPerson: true, kycStatus: true },
        },
      },
    }),
    prisma.kycSubmission.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
  ]);

  const shown = rows.slice(0, PAGE);
  const userIds = [...new Set(shown.map((row) => row.userId))];
  const reviewerIds = [...new Set(shown.map((row) => row.reviewedById).filter((id): id is number => id !== null))];
  const numbers = [...new Set(shown.map((row) => row.documentNumber))];
  const [attempts, reviewers, twins] = await Promise.all([
    userIds.length
      ? prisma.kycSubmission.groupBy({ by: ["userId"], where: { userId: { in: userIds } }, _count: { _all: true } })
      : [],
    reviewerIds.length ? prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, email: true } }) : [],
    /*
     * Every account that has ever sent one of these document numbers. One
     * document on two accounts is either a mistake or someone opening a
     * second account, and either way the reviewer should know before deciding.
     */
    numbers.length
      ? prisma.kycSubmission.findMany({
          where: { documentNumber: { in: numbers } },
          select: { userId: true, country: true, documentNumber: true },
          distinct: ["userId", "country", "documentNumber"],
        })
      : [],
  ]);
  const attemptsOf = new Map(attempts.map((row) => [row.userId, row._count._all]));
  const reviewer = new Map(reviewers.map((user) => [user.id, user.email]));
  const sharedWith = (submission: (typeof shown)[number]) =>
    twins
      .filter((twin) => twin.country === submission.country && twin.documentNumber === submission.documentNumber && twin.userId !== submission.userId)
      .map((twin) => twin.userId);

  const count = (value: Status | null) =>
    value ? (counts.find((row) => row.status === value)?._count._all ?? 0) : counts.reduce((sum, row) => sum + row._count._all, 0);
  const link = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ status: statusParam, q, ...patch })) if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const birthDay = (date: Date) =>
    date.toLocaleDateString(localeTag(lang), { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" });

  const row = (label: string, value: ReactNode) => (
    <div className="flex gap-3 py-1 text-[13px]">
      <dt className="w-[130px] shrink-0 text-[#6f7076]">{label}</dt>
      <dd className="min-w-0 text-white">{value}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t.heading} lead={t.lead} />
      {tabs(count("PENDING"))}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[...STATUSES, null].map((value) => (
            <Link
              key={value ?? "all"}
              href={link({ status: value === "PENDING" ? "" : (value ?? "all"), page: "" })}
              className={buttonClass(status === value ? "primary" : "secondary", "sm")}
            >
              {value ? c.status[value] : c.all}
              <span className="opacity-70">{count(value)}</span>
            </Link>
          ))}
          <form method="get" className="ml-auto flex gap-2">
            {statusParam && <input type="hidden" name="status" value={statusParam} />}
            <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className={`${inputClass} w-[260px]`} />
            <button type="submit" className={buttonClass("secondary")}>
              {c.search}
            </button>
          </form>
        </div>
      </div>

      {shown.length === 0 ? (
        <Card>
          <EmptyState>{status === "PENDING" && !q ? t.nothingWaiting : t.noneMatch}</EmptyState>
        </Card>
      ) : (
        <ul className="space-y-4">
          {shown.map((submission) => {
            const user = submission.user;
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
            const age = user.dateOfBirth ? ageOf(user.dateOfBirth) : null;
            const earlier = (attemptsOf.get(submission.userId) ?? 1) - 1;
            const mismatch = user.citizenship !== null && user.citizenship !== submission.country;
            const shared = sharedWith(submission);
            const parts = [
              { key: "front", label: t.front, file: submission.frontFile },
              { key: "back", label: t.back, file: submission.backFile },
              { key: "selfie", label: t.selfie, file: submission.selfieFile },
            ].filter((part) => part.file || submission.documentType !== "PASSPORT");

            return (
              <li key={submission.id} className="rounded-lg border border-white/[0.08] bg-[#15161a]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/[0.06] px-5 py-3">
                  <Link href={`/${lang}/admin/users?q=${submission.userId}`} className="font-medium text-white hover:text-[var(--accent)]">
                    {user.email}
                  </Link>
                  <span className="text-[11px] text-[#6f7076]">#{submission.userId}</span>
                  <Badge tone={statusTone(submission.status)}>{c.status[submission.status]}</Badge>
                  {earlier > 0 && <Badge tone="warning">{t.attempts(earlier)}</Badge>}
                  {shared.length > 0 && (
                    <Link href={`${base}?status=all&q=${encodeURIComponent(submission.documentNumber)}`}>
                      <Badge tone="danger">{t.sameDocument(shared.map((id) => `#${id}`).join(", "))}</Badge>
                    </Link>
                  )}
                  <span className="ml-auto text-[12px] text-[#6f7076]">
                    {t.submitted} {formatDateTime(submission.createdAt, lang)}
                  </span>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#6f7076]">{t.declared}</p>
                    <dl>
                      {row(t.name, name)}
                      {row(
                        t.birth,
                        user.dateOfBirth ? (
                          <span className="flex flex-wrap items-center gap-2">
                            {birthDay(user.dateOfBirth)}
                            <span className="text-[#a0a1a6]">· {t.age(age ?? 0)}</span>
                            {age !== null && age < 18 && <Badge tone="danger">{t.minor}</Badge>}
                          </span>
                        ) : (
                          "—"
                        ),
                      )}
                      {row(t.citizenship, countryName(user.citizenship))}
                      {row(t.usPerson, user.isUsPerson ? <Badge tone="warning">{c.yes}</Badge> : c.no)}
                    </dl>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#6f7076]">{t.document}</p>
                    <dl>
                      {row(
                        t.country,
                        <span className="flex flex-wrap items-center gap-2">
                          {countryName(submission.country)}
                          {mismatch && <Badge tone="warning">{t.countryMismatch}</Badge>}
                        </span>,
                      )}
                      {row(t.type, t.docTypes[submission.documentType])}
                      {row(t.number, <span className="font-mono">{submission.documentNumber}</span>)}
                    </dl>
                  </div>
                </div>

                <div className={`grid gap-3 px-5 pb-5 sm:grid-cols-2 ${parts.length === 3 ? "lg:grid-cols-3" : ""}`}>
                  {parts.map((part) => {
                    const url = `/api/kyc/files/${submission.id}/${part.key}`;
                    return (
                      <figure key={part.key} className="overflow-hidden rounded-md border border-white/[0.08] bg-[#0d0e11]">
                        {part.file ? (
                          <a href={url} target="_blank" rel="noreferrer" title={t.openFull} className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${part.label} — ${user.email}`} loading="lazy" className="aspect-[4/3] w-full object-contain" />
                          </a>
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center text-[12px] text-[#6f7076]">{t.missing}</div>
                        )}
                        <figcaption className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2 text-[12px] text-[#a0a1a6]">
                          {part.label}
                          {part.file && (
                            <a href={url} target="_blank" rel="noreferrer" className="text-[#6f7076] hover:text-white">
                              {t.openFull} ↗
                            </a>
                          )}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>

                <div className="border-t border-white/[0.06] px-5 py-4">
                  {submission.status === "PENDING" ? (
                    <KycDecision id={submission.id} locale={lang} />
                  ) : (
                    <div className="space-y-1 text-[13px]">
                      {submission.reviewedAt && (
                        <p className="text-[#a0a1a6]">
                          {t.reviewed(
                            submission.reviewedById ? (reviewer.get(submission.reviewedById) ?? `#${submission.reviewedById}`) : "—",
                            formatDateTime(submission.reviewedAt, lang),
                          )}
                        </p>
                      )}
                      {submission.reason && (
                        <p>
                          <span className="text-[#6f7076]">{t.reason}: </span>
                          <span className="text-white">{submission.reason}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pager
        basePath={base}
        query={Object.fromEntries(Object.entries({ status: statusParam, q }).filter(([, v]) => v))}
        page={page}
        hasNext={rows.length > PAGE}
        labels={{ previous: c.previous, next: c.next, page: c.page }}
      />
    </div>
  );
}
