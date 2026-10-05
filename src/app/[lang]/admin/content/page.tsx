import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ContentEditor, type AdminContent } from "@/components/admin/ContentEditor";
import { adminCopy } from "@/i18n/admin";
import { PageHeader } from "@/components/admin/ui";

export async function generateMetadata(props: PageProps<"/[lang]/admin/content">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.content.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

export default async function AdminContentPage(props: PageProps<"/[lang]/admin/content">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
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
      <PageHeader title={t.content.heading} lead={t.content.lead} />

      <ContentEditor items={rows} locale={lang} />
    </div>
  );
}
