import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EngineHost } from "@/components/traderoom/EngineHost";
import { mintTradingSession } from "@/lib/auth/trading-session";
import { engineConfig, setting } from "@/lib/engine/settings";
import { isLocale } from "@/i18n/avalon";

// The traderoom's tab says the platform's name and nothing else, which is what
// the live site does — and the name is a row, so it says whatever it is now.
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await setting("brand")).name };
}

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

  /*
   * The middleware already turned anonymous visitors away. This is the second
   * check, and it is not redundant: it is what makes the session's user id
   * available here, and a page that reached this far without one would boot a
   * 103 MB engine against an account that does not exist.
   */
  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/traderoom`);

  const [config, ssid] = await Promise.all([
    engineConfig(),
    mintTradingSession(session.user.platformId),
  ]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <EngineHost
        wsUrl={config.feed.wsUrl}
        ssid={ssid}
        resourceHost={config.resource.host}
        resourceVersion={config.resource.version}
        stubBase="/api/engine/stubs"
        locale={lang}
      />
    </main>
  );
}
