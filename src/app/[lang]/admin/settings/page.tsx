import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SettingsEditor, type AdminSetting } from "@/components/admin/SettingsEditor";
import { adminCopy } from "@/i18n/admin";
import { PageHeader } from "@/components/admin/ui";

export async function generateMetadata(props: PageProps<"/[lang]/admin/settings">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.settings.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

export default async function AdminSettings(props: PageProps<"/[lang]/admin/settings">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title={t.settings.heading} lead={t.settings.lead} />

      <SettingsEditor
        settings={settings.map((setting) => ({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updatedAt.toISOString(),
        })) as AdminSetting[]}
        locale={lang}
      />
    </div>
  );
}
