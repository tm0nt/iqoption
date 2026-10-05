import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { setting } from "@/lib/engine/settings";
import { BrandEditor } from "@/components/admin/BrandEditor";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/brand">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.brand.heading} · ${copy.shell.title}` };
}

export default async function AdminBrandPage(props: PageProps<"/[lang]/admin/brand">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const [brand, copy] = [await setting("brand"), adminCopy(lang).brand];

  return (
    <div className="space-y-7">
      <PageHeader title={copy.heading} lead={copy.lead} />

      <BrandEditor brand={brand} locale={lang} />
    </div>
  );
}
