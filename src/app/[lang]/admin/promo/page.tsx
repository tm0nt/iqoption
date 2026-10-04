import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PromoTable, type AdminPromo } from "@/components/admin/PromoTable";

export const metadata: Metadata = { title: "Promo codes · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
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
        <h1 className="text-[20px] font-semibold">Promo codes</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          What the traderoom&apos;s Promo panel offers. Applying a code records that it was
          used; paying a bonus out needs the cashier, which is not connected.
        </p>
      </section>

      <PromoTable codes={codes} />
    </div>
  );
}
