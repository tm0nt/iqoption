"use client";

import { useState } from "react";
import { cabinetCopy } from "@/i18n/cabinet";
import Link from "next/link";
import { AccountDrawer, type DrawerAccount } from "./AccountDrawer";
import { UserIcon } from "./icons";
import {
  AvalonIconSprite,
  FlagEnIcon,
  FlagEsIcon,
  FlagPtIcon,
} from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/icons";
import { LOCALE_LABELS, LOCALES } from "@/i18n/avalon";
import { rememberLocale } from "@/i18n/remember";
import type { AvalonLocale } from "@/types/avalon-login";

const LOGO = "/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/images/avalon-logo.svg";

/** The flag the language trigger shows, from the sprite the auth pages already load. */
function Flag({ locale }: { locale: AvalonLocale }) {
  const Icon = locale === "es" ? FlagEsIcon : locale === "pt" ? FlagPtIcon : FlagEnIcon;
  return <Icon width={18} height={18} />;
}

/**
 * The frame every cabinet page sits in: the bar across the top, the account
 * drawer behind the avatar, and the footer.
 *
 * Measured from the live site rather than guessed — a 60px bar, a 1032px
 * content column centred in the page, and a 400px drawer. Pages supply only
 * their own column; everything around it is here so the eight of them cannot
 * drift apart.
 */
export function CabinetShell({
  account,
  locale,
  wide = false,
  bleed = false,
  children,
}: {
  account: DrawerAccount;
  locale: AvalonLocale;
  /**
   * The cabinet has two column widths and the live site uses both: 1032px for
   * the profile pages, 1440px for verification, which needs room for a rail
   * beside a form.
   */
  wide?: boolean;
  /**
   * Hands the full width to the page. The portfolio runs a banner and a tinted
   * band edge to edge and centres its own column inside each, which a wrapper
   * with a max width cannot express.
   */
  bleed?: boolean;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-avalon text-avalon-text">
      <AvalonIconSprite />
      <header className="sticky top-0 z-30 h-[60px] shrink-0 bg-white">
        <div className="flex h-full items-center px-6">
          <Link href={`/${locale}/traderoom`} aria-label="Avalon">
            {/* The same file the login header uses, at the size the live cabinet draws it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Avalon" width={120} height={30} className="h-[30px] w-[120px]" />
          </Link>

          <div className="ml-auto flex items-center gap-5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[14px] text-avalon-text-strong"
              >
                <Flag locale={locale} />
                {locale.charAt(0).toUpperCase() + locale.slice(1)}
              </button>
              {langOpen && (
                <ul className="absolute right-0 top-full z-40 mt-2 min-w-[140px] rounded-[2px] bg-white py-1 shadow-avalon">
                  {LOCALES.map((code) => (
                    <li key={code}>
                      <Link
                        href={`/${code}/profile/personal`}
                        onClick={() => {
                          rememberLocale(code);
                          setLangOpen(false);
                        }}
                        className="block px-4 py-2 text-[14px] text-avalon-text transition-colors hover:bg-avalon-surface hover:text-avalon-text-strong"
                      >
                        {LOCALE_LABELS[code]}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={cabinetCopy(locale).nav.accountMenu}
              className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-avalon-surface-hover text-avalon-border-muted"
            >
              <UserIcon width={18} height={18} />
            </button>

            <Link
              href={`/${locale}/traderoom`}
              className="flex h-10 items-center rounded-[2px] border border-avalon-primary bg-avalon-primary px-4 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
            >
              {cabinetCopy(locale).nav.tradeNow}
            </Link>
          </div>
        </div>
      </header>

      <main
        className={
          bleed ? "w-full grow" : `mx-auto w-full grow px-6 pb-16 ${wide ? "max-w-[1440px]" : "max-w-[1032px]"}`
        }
      >
        {children}
      </main>

      <footer className="mt-auto border-t border-avalon-surface-hover py-6 text-center text-[13px] text-avalon-text">
        Avalon
      </footer>

      <AccountDrawer account={account} locale={locale} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
