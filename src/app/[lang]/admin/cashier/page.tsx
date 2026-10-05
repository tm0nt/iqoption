import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CashierQueue, type AdminTransaction } from "@/components/admin/CashierQueue";
import { adminCopy } from "@/i18n/admin";

export async function generateMetadata(props: PageProps<"/[lang]/admin/cashier">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.cashier.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

export default async function AdminCashierPage(props: PageProps<"/[lang]/admin/cashier">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
  const rows = await prisma.transaction.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { email: true } } },
    take: 300,
  });

  const transactions: AdminTransaction[] = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    status: row.status,
    amount: row.amount.toString(),
    currency: row.currency,
    method: row.method,
    destination: row.destination,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    settledAt: row.settledAt?.toISOString() ?? null,
    email: row.user.email,
    userId: row.userId,
  }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[20px] font-semibold">{t.cashier.heading}</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">{t.cashier.lead}</p>
      </section>

      <CashierQueue transactions={transactions} locale={lang} />
    </div>
  );
}
