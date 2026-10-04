import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/avalon";

/**
 * `/profile` is the account menu's own link; the sub-navigation uses
 * `/profile/personal`. They are the same page on the live site, so this sends
 * one to the other rather than duplicating it.
 */
export default async function ProfileIndex(props: PageProps<"/[lang]/profile">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  redirect(`/${lang}/profile/personal`);
}
