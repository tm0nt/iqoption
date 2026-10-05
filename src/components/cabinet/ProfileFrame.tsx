/**
 * The column every profile page shares: the registration line, the
 * sub-navigation, and the page's own content beside it.
 *
 * Six pages wrote this arrangement out themselves, and all six put a 240px
 * menu beside the content at every width — which on a phone left the content
 * about a hundred pixels. Here the menu sits above the content until there is
 * room for it beside.
 */
import { ProfileHeader } from "./ProfileHeader";
import { ProfileNav } from "./ProfileNav";

export function ProfileFrame({
  locale,
  createdAt,
  id,
  title,
  children,
}: {
  locale: string;
  createdAt: Date;
  id: number;
  /** The page's heading. Personal Data has none, as on the live site. */
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ProfileHeader locale={locale} createdAt={createdAt} id={id} />

      <div className="mt-4 flex flex-col gap-6 md:mt-6 md:flex-row md:gap-12">
        <ProfileNav locale={locale} />
        <div className="min-w-0 grow">
          {title && <h1 className="pb-2 text-[24px] font-semibold text-avalon-text-strong md:text-[28px]">{title}</h1>}
          {children}
        </div>
      </div>
    </>
  );
}
