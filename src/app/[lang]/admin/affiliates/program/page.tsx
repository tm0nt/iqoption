import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { affiliateProgram } from "@/lib/affiliate/program";
import { ProgramEditor } from "@/components/admin/ProgramEditor";
import { Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/affiliates/program">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).program.heading} · ${adminCopy(lang).shell.title}` };
}

export default async function AdminProgramPage(props: PageProps<"/[lang]/admin/affiliates/program">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  const t = adminMoneyCopy(lang).program;
  const program = await affiliateProgram();

  return (
    <div className="space-y-6">
      <PageHeader title={t.heading} lead={t.lead} />

      <Card title={t.tracking}>
        <p className="text-[13px] leading-[21px] text-[#a0a1a6]">{t.trackingBody}</p>
        <p className="mt-3 font-mono text-[12px] text-white">/{lang}/register?ref=CODE&amp;sub=campaign-1&amp;utm_source=instagram</p>
        <p className="mt-3 text-[12px] text-[#6f7076]">{t.macros}</p>
      </Card>

      <ProgramEditor program={program} locale={lang} />
    </div>
  );
}
