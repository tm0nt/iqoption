import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AssetTable, type AdminAsset } from "@/components/admin/AssetTable";
import { adminCopy } from "@/i18n/admin";

export async function generateMetadata(props: PageProps<"/[lang]/admin/assets">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.assets.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

export default async function AdminAssets(props: PageProps<"/[lang]/admin/assets">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
  const [assets, groups] = await Promise.all([
    prisma.asset.findMany({
      include: { group: { select: { name: true } } },
      orderBy: [{ groupId: "asc" }, { priority: "asc" }, { id: "asc" }],
    }),
    prisma.assetGroup.findMany({ select: { id: true, name: true }, orderBy: { priority: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[20px] font-semibold">{t.assets.heading}</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">{t.assets.lead}</p>
      </section>

      <AssetTable assets={assets as unknown as AdminAsset[]} groups={groups} locale={lang} />
    </div>
  );
}
