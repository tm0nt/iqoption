import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLocale } from "@/i18n/avalon";

/**
 * The shell every admin page sits in.
 *
 * The middleware already turned away anyone who is not an administrator. This
 * checks again, because a layout that trusts the middleware is one routing
 * change away from being the only thing between a stranger and the instrument
 * catalogue — and because the session is needed here anyway, to say who is
 * signed in.
 */
export default async function AdminLayout(props: LayoutProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/admin`);
  if (!session.user.isAdmin) redirect(`/${lang}/traderoom`);

  const tabs = [
    { href: `/${lang}/admin`, label: "Overview" },
    { href: `/${lang}/admin/assets`, label: "Instruments" },
    { href: `/${lang}/admin/settings`, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0f1013] text-[#e8e8ea]">
      <header className="border-b border-white/10 bg-[#15161a]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <span className="text-[15px] font-semibold tracking-tight">Avalon admin</span>

          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="rounded px-3 py-1.5 text-[13px] text-[#a0a1a6] transition-colors hover:bg-white/5 hover:text-white"
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-[13px] text-[#a0a1a6]">
            <span>{session.user.email}</span>
            <Link href={`/${lang}/traderoom`} className="text-avalon-primary hover:underline">
              Traderoom
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{props.children}</main>
    </div>
  );
}
