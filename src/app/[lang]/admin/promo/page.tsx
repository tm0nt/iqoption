import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PromoTable, type AdminPromo } from "@/components/admin/PromoTable";
import { adminCopy } from "@/i18n/admin";

export async function generateMetadata(props: PageProps<"/[lang]/admin/promo">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.promo.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

export default async function AdminPromoPage(props: PageProps<"/[lang]/admin/promo">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
  const rows = await prisma.promoCode.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { uses: true } } },
    take: 500,
  });

  const codes: AdminPromo[] = rows.map((row) => ({
    ...row,
    endsAt: row.endsAt?.toISOString() ?? null,
    uses: row._count.uses,
  }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[20px] font-semibold">{t.promo.heading}</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">{t.promo.lead}</p>
      </section>

      <PromoTable codes={codes} locale={lang} />
    </div>
  );
}
