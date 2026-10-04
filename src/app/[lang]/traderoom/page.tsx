import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EngineHost } from "@/components/traderoom/EngineHost";
import { engineConfig } from "@/lib/engine/settings";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Avalon" };

/*
 * Read on every request. The configuration lives in `platform_settings`, so an
 * administrator repointing the feed or bumping the engine build takes effect on
 * the next load — caching this page would hold the old values until a deploy.
 */
export const dynamic = "force-dynamic";

/**
 * The traderoom.
 *
 * The engine owns the whole viewport and draws into a canvas it creates itself,
 * so this page renders no interface of its own: everything visible is the
 * engine. See src/lib/engine/host.ts for what has to happen before it starts.
 */
export default async function Page(props: PageProps<"/[lang]/traderoom">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const config = await engineConfig();

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <EngineHost
        wsUrl={config.feed.wsUrl}
        ssid={`session-${config.session.userId}`}
        resourceHost={config.resource.host}
        resourceVersion={config.resource.version}
        stubBase="/api/engine/stubs"
      />
    </main>
  );
}
