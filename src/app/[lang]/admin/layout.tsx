import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { setting } from "@/lib/engine/settings";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * The shell every admin page sits in.
 *
 * The middleware already turned away anyone who is not an administrator. This
 * checks again, because a layout that trusts the middleware is one routing
 * change away from being the only thing between a stranger and the instrument
 * catalogue — and because the session is needed here anyway, to say who is
 * signed in.
 *
 * A rail rather than a row of tabs. Eight sections do not fit across the top
 * without wrapping, a wrapped tab bar moves when the window changes width, and
 * a destination that moves is one people stop trusting. The rail also leaves
 * the full width for tables, which is what most of these pages are.
 */
export default async function AdminLayout(props: LayoutProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/admin`);
  if (!session.user.isAdmin) redirect(`/${lang}/traderoom`);

  const [brand, copy] = [await setting("brand"), adminCopy(lang)];

  return (
    /*
     * The accent is a variable rather than a Tailwind colour: it comes from a
     * row an administrator edits, and Tailwind's palette is decided when the
     * app is built.
     */
    <div
      className="flex min-h-screen bg-[#0f1013] text-[#e8e8ea]"
      style={{ "--accent": brand.primary } as React.CSSProperties}
    >
      <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r border-white/10 bg-[#15161a]">
        <div className="flex items-center gap-2.5 px-5 py-5">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt="" className="h-6 max-w-[120px] object-contain" />
          ) : (
            <span className="flex size-6 items-center justify-center rounded" style={{ background: brand.primary }}>
              <span className="text-[13px] font-bold text-white">{brand.name.slice(0, 1)}</span>
            </span>
          )}
          <span className="truncate text-[14px] font-semibold tracking-tight">{brand.name}</span>
        </div>

        <AdminNav locale={lang} copy={copy.shell} />

        <div className="mt-auto border-t border-white/10 px-5 py-4 text-[12px] text-[#73747a]">
          <p className="truncate" title={session.user.email ?? ""}>
            {copy.shell.signedInAs}
            <br />
            <span className="text-[#a0a1a6]">{session.user.email}</span>
          </p>
          <Link
            href={`/${lang}/traderoom`}
            className="mt-3 inline-block text-[13px] transition-colors hover:underline"
            style={{ color: brand.primary }}
          >
            {copy.shell.traderoom} →
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1180px] px-8 py-8">{props.children}</div>
      </main>
    </div>
  );
}
