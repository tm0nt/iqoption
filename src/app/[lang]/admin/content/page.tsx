import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ContentEditor, type AdminContent } from "@/components/admin/ContentEditor";

export const metadata: Metadata = { title: "Content · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const items = await prisma.contentItem.findMany({
    orderBy: [{ kind: "asc" }, { priority: "desc" }, { startsAt: "desc" }, { id: "desc" }],
    take: 500,
  });

  /*
   * Dates as strings, because this crosses into a client component and a Date
   * does not survive that boundary intact.
   */
  const rows: AdminContent[] = items.map((item) => ({
    ...item,
    startsAt: item.startsAt?.toISOString() ?? null,
    endsAt: item.endsAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[20px] font-semibold">Content</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          What the traderoom&apos;s left-hand panels show: webinars, tutorials, market news, help
          and promos. An item with no language is shown in all three.
        </p>
      </section>

      <ContentEditor items={rows} />
    </div>
  );
}
