import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { engineConfig } from "@/lib/engine/settings";
import { ReloadFeedButton } from "@/components/admin/ReloadFeedButton";
import { FeedStatus } from "@/components/admin/FeedStatus";
import { adminCopy } from "@/i18n/admin";

export async function generateMetadata(props: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.overview.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

/** A number with a word under it. */
function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#15161a] px-5 py-4">
      <div className="text-[26px] font-semibold leading-tight">{value}</div>
      <div className="mt-1 text-[13px] text-[#a0a1a6]">{label}</div>
      {hint && <div className="mt-2 text-[12px] text-[#6f7076]">{hint}</div>}
    </div>
  );
}

export default async function AdminOverview(props: PageProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  const t = adminCopy(lang).overview;

  const [instruments, live, users, openDeals, settledDeals, config] = await Promise.all([
    prisma.asset.count({ where: { enabled: true } }),
    prisma.asset.count({ where: { enabled: true, source: "BINANCE" } }),
    prisma.user.count(),
    prisma.position.count({ where: { closedAt: 0 } }),
    prisma.position.count({ where: { closedAt: { gt: 0 } } }),
    engineConfig(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-[20px] font-semibold">{t.heading}</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">{t.lead}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label={t.instrumentsEnabled}
          value={instruments}
          hint={t.instrumentsNote(live, instruments - live)}
        />
        <Stat label={t.accounts} value={users} />
        <Stat label={t.deals} value={`${openDeals} / ${settledDeals}`} hint={t.dealsNote} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">{t.marketFeed}</h2>
        <div className="rounded-lg border border-white/10 bg-[#15161a] p-5">
          <FeedStatus locale={lang} />
          <p className="mt-4 text-[13px] leading-relaxed text-[#a0a1a6]">{t.feedNote}</p>
          <div className="mt-4">
            <ReloadFeedButton locale={lang} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">{t.engine}</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 text-[13px] sm:grid-cols-2">
          {[
            [t.feed, config.feed.wsUrl],
            [t.engineBuild, `${config.resource.host} @ ${config.resource.version}`],
            [t.brand, config.brand.name],
            [t.countryReported, `${config.brand.countryFlag} (${config.brand.countryId})`],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#15161a] px-5 py-3">
              <dt className="text-[#a0a1a6]">{label}</dt>
              <dd className="mt-0.5 font-mono text-[12px] break-all">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[13px] text-[#a0a1a6]">
          {t.theseLiveIn}{" "}
          <Link href={`/${lang}/admin/settings`} className="text-[var(--accent)] hover:underline">
            {t.settingsLink}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
