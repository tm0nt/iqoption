import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { setting } from "@/lib/engine/settings";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * The shell every admin page sits in.
 *
 * The middleware already turned away anyone who is not an administrator. This
 * checks again, because a layout that trusts the middleware is one routing
 * change away from being the only thing between a stranger and the instrument
 * catalogue — and because the session is needed here anyway, to say who is
 * signed in.
 *
 * It also counts the four queues — deposits and withdrawals, affiliate
 * payouts, affiliates asking to join, identity checks — so the rail can put a
 * number on the link with work behind it. Four counts on indexed columns,
 * cheap enough for every page.
 */
export default async function AdminLayout(props: LayoutProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/admin`);
  if (!session.user.isAdmin) redirect(`/${lang}/traderoom`);

  const [brand, cashier, payouts, affiliates, kyc] = await Promise.all([
    setting("brand"),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.affiliatePayout.count({ where: { status: "PENDING" } }),
    prisma.affiliate.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
  ]);

  return (
    <AdminShell
      locale={lang}
      brand={{ name: brand.name, logoUrl: brand.logoUrl, primary: brand.primary }}
      email={session.user.email ?? ""}
      copy={adminCopy(lang).shell}
      money={adminMoneyCopy(lang).nav}
      badges={{ cashier, payouts, affiliates, kyc }}
    >
      {props.children}
    </AdminShell>
  );
}
