import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { engineConfig } from "@/lib/engine/settings";
import { ReloadFeedButton } from "@/components/admin/ReloadFeedButton";
import { FeedStatus } from "@/components/admin/FeedStatus";

export const metadata: Metadata = { title: "Admin · Avalon" };
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
        <h1 className="text-[20px] font-semibold">Overview</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          What the platform is currently serving.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Instruments enabled"
          value={instruments}
          hint={`${live} with a live feed, ${instruments - live} on the synthetic curve`}
        />
        <Stat label="Accounts" value={users} />
        <Stat
          label="Deals"
          value={`${openDeals} / ${settledDeals}`}
          hint="running / settled"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Market feed</h2>
        <div className="rounded-lg border border-white/10 bg-[#15161a] p-5">
          <FeedStatus />
          <p className="mt-4 text-[13px] leading-relaxed text-[#a0a1a6]">
            The feed reads the instrument catalogue when it starts. It shares this
            database but not this process, so an instrument changed here is invisible
            there until it is asked to look again.
          </p>
          <div className="mt-4">
            <ReloadFeedButton />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Engine</h2>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 text-[13px] sm:grid-cols-2">
          {[
            ["Feed", config.feed.wsUrl],
            ["Engine build", `${config.resource.host} @ ${config.resource.version}`],
            ["Brand", config.brand.name],
            ["Country reported", `${config.brand.countryFlag} (${config.brand.countryId})`],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#15161a] px-5 py-3">
              <dt className="text-[#a0a1a6]">{label}</dt>
              <dd className="mt-0.5 font-mono text-[12px] break-all">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[13px] text-[#a0a1a6]">
          These live in{" "}
          <Link href={`/${lang}/admin/settings`} className="text-avalon-primary hover:underline">
            settings
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
