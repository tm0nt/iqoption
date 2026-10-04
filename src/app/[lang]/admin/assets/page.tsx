import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AssetTable, type AdminAsset } from "@/components/admin/AssetTable";

export const metadata: Metadata = { title: "Instruments · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAssets() {
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
        <h1 className="text-[20px] font-semibold">Instruments</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          What the platform offers, and where each one&apos;s prices come from.
        </p>
      </section>

      <AssetTable assets={assets as unknown as AdminAsset[]} groups={groups} />
    </div>
  );
}
