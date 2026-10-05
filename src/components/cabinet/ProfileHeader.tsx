/**
 * The two lines above every profile page: when the account was made, and its
 * number.
 *
 * Seven pages wrote this out themselves, which is seven places for the wording
 * to drift and seven that would each have needed translating.
 */
import { cabinetCopy } from "@/i18n/cabinet";
import { formatLongDate } from "@/lib/cabinet/format";

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
    <p className="pt-5 text-right text-[12px] leading-5 text-avalon-text md:pt-7">
      {copy.dateRegistered}: {formatLongDate(createdAt, locale)}
      <br />
      {copy.profileId}: {id}
    </p>
  );
}
