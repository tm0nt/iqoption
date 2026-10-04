import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SettingsEditor, type AdminSetting } from "@/components/admin/SettingsEditor";

export const metadata: Metadata = { title: "Settings · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[20px] font-semibold">Settings</h1>
        <p className="mt-1 text-[13px] text-[#a0a1a6]">
          Configuration the platform reads at runtime. The traderoom picks these up
          on its next load; the market feed needs a reload for the ones it reads.
        </p>
      </section>

      <SettingsEditor
        settings={settings.map((setting) => ({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt.toISOString(),
        })) as AdminSetting[]}
      />
    </div>
  );
}
