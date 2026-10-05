/**
 * The two lines above every profile page: when the account was made, and its
 * number.
 *
 * Seven pages wrote this out themselves, which is seven places for the wording
 * to drift and seven that would each have needed translating.
 */
import { cabinetCopy } from "@/i18n/cabinet";

/** "October 2, 2026" in English, and the equivalent in each other locale. */
function longDate(date: Date, locale: string) {
  const tag = { en: "en-US", pt: "pt-BR", es: "es-ES" }[locale] ?? "en-US";
  return date.toLocaleDateString(tag, { month: "long", day: "numeric", year: "numeric" });
}

export function ProfileHeader({
  locale,
  createdAt,
  id,
}: {
  locale: string;
  createdAt: Date;
  id: number;
}) {
  const copy = cabinetCopy(locale).profile;

  return (
    <p className="pt-7 text-right text-[12px] leading-5 text-avalon-text">
      {copy.dateRegistered}: {longDate(createdAt, locale)}
      <br />
      {copy.profileId}: {id}
    </p>
  );
}
