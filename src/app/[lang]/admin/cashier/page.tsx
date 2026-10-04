import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CashierQueue, type AdminTransaction } from "@/components/admin/CashierQueue";

export const metadata: Metadata = { title: "Cashier · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCashierPage() {
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
        <h1 className="text-[20px] font-semibold">Cashier</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          Deposits and withdrawals waiting on a decision. No payment provider is connected,
          so approving a deposit is the statement that the money arrived — nothing here
          checks that it did.
        </p>
      </section>

      <CashierQueue transactions={transactions} />
    </div>
  );
}
