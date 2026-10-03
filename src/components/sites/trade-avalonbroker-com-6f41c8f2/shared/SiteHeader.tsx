import Image from "next/image";
import Link from "next/link";
import { LanguageMenu } from "./LanguageMenu";
import { LoginArrowIcon } from "./icons";
import type { AvalonCommonCopy, AvalonLocale } from "@/types/avalon-login";

const LOGO_SRC =
  "/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/images/avalon-logo.svg";

interface SiteHeaderProps {
  locale: AvalonLocale;
  page: string;
  copy: AvalonCommonCopy;
  /**
   * `signUp` = filled teal pill (login / change-password pages).
   * `logIn`  = outlined teal pill (register page).
   */
  action: "signUp" | "logIn";
}

export function SiteHeader({ locale, page, copy, action }: SiteHeaderProps) {
  const isSignUp = action === "signUp";
  const label = isSignUp ? copy.signUp : copy.logIn;
  const href = isSignUp ? `/${locale}/register` : `/${locale}/login`;

  return (
    <header data-test-id="header-block" className="relative z-[190] w-full">
      <div className="fixed inset-x-0 top-0 h-[60px] bg-avalon-surface shadow-avalon transition-colors duration-300">
        <div className="box-border flex h-[60px] items-center justify-between px-4 py-[10px] min-[480px]:px-6">
          <div
            data-test-id="header-leftSide-block"
            className="flex h-[30px] items-center pr-0 min-[600px]:pr-4"
          >
            {/* Inert on the live site: data-test-id=header-logo-link-disabled */}
            <div
              data-test-id="header-logo-link-disabled"
              className="ml-4 block h-[30px] w-[120px] min-[480px]:ml-6 min-[1280px]:ml-0"
            >
              <Image
                src={LOGO_SRC}
                alt=""
                width={160}
                height={40}
                priority
                className="h-[30px] w-[120px]"
              />
            </div>
          </div>

          <LanguageMenu locale={locale} page={page} />

          <div
            data-test-id="header-rightSide-block"
            className="ml-2 flex h-10 items-center"
          >
            <Link
              href={href}
              data-test-id={
                isSignUp ? "header-register-button" : "header-login-button"
              }
              className={[
                "relative box-border cursor-pointer text-center font-avalon text-[14px] font-medium leading-[22px]",
                "transition-[border-color,background-color,color] duration-200",
                // <=839px both variants collapse to a 40x40 outlined circle with the arrow glyph
                "flex size-10 items-center justify-center rounded-[40px] border border-avalon-primary bg-transparent text-avalon-primary",
                "min-[840px]:block min-[840px]:size-auto min-[840px]:h-10 min-[840px]:rounded-[2px] min-[840px]:px-4 min-[840px]:py-2",
                isSignUp
                  ? "min-[840px]:bg-avalon-primary min-[840px]:text-white min-[840px]:hover:bg-avalon-signup-hover"
                  : "min-[840px]:mr-2 min-[840px]:bg-transparent min-[840px]:text-avalon-primary min-[840px]:hover:bg-avalon-primary/5",
              ].join(" ")}
            >
              <span className="hidden min-[840px]:inline">{label}</span>
              <LoginArrowIcon className="-ml-px block h-5 w-[21px] min-[840px]:hidden" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
