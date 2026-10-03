import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { CookieNotice } from "./CookieNotice";
import { AvalonIconSprite } from "./icons";
import type { AvalonDictionary, AvalonLocale } from "@/types/avalon-login";

interface AuthShellProps {
  locale: AvalonLocale;
  /** Path segment of the current page, used by the language switcher. */
  page: string;
  dict: AvalonDictionary;
  headerAction: "signUp" | "logIn";
  children: React.ReactNode;
}

/**
 * Page frame shared by every Avalon auth page: fixed 60px navbar above a flex
 * column whose content area is offset by an equal padding-top, footer pinned by
 * `flex: 0 0 auto`, plus the portal-style cookie notice.
 */
export function AuthShell({
  locale,
  page,
  dict,
  headerAction,
  children,
}: AuthShellProps) {
  return (
    <div className="avalon-root flex-1">
      <AvalonIconSprite />
      <SiteHeader
        locale={locale}
        page={page}
        copy={dict.common}
        action={headerAction}
      />
      <div
        data-test-id="inner-layout-content"
        className="relative flex flex-1 flex-col pt-[60px]"
      >
        {children}
      </div>
      <SiteFooter label={dict.common.footer} />
      <CookieNotice
        message={dict.common.cookieMessage}
        actionLabel={dict.common.cookieAction}
      />
    </div>
  );
}
