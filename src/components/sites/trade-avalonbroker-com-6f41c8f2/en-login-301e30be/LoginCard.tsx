import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { SocialLogin } from "../shared/SocialLogin";
import { RiskWarning } from "../shared/RiskWarning";
import { AuthLinkRow } from "../shared/AuthLinkRow";
import type { AvalonDictionary, AvalonLocale } from "@/types/avalon-login";

interface LoginCardProps {
  locale: AvalonLocale;
  dict: AvalonDictionary;
}

export function LoginCard({ locale, dict }: LoginCardProps) {
  const copy = dict.login;

  return (
    <div className="relative m-auto box-border block w-full min-w-[320px] max-w-[420px] px-4 pb-[60px] pt-8 min-[840px]:pt-12">
      <div className="block w-full max-w-[420px] px-4">
        <div className="mb-5 block w-full">
          <h1 className="block w-full text-center font-avalon text-[24px] font-semibold leading-8 tracking-[-1px] text-avalon-text min-[480px]:text-[30px] min-[480px]:leading-10">
            <span>{copy.heading}</span>
          </h1>
        </div>

        <LoginForm copy={copy} locale={locale} />
        <SocialLogin
          dividerLabel={dict.common.divider}
          buttonLabel={copy.google}
          testId="right-bar_google"
        />

        <div className="block w-full text-center">
          <Link
            href={`/${locale}/change-password`}
            className="relative inline-block cursor-pointer rounded-[2px] text-center font-avalon text-[12px] font-medium leading-5 text-avalon-primary transition-[border-color,background-color,color] duration-200 hover:underline"
          >
            {copy.forgotPassword}
          </Link>
          <AuthLinkRow
            lead={copy.noAccountLead}
            linkText={copy.noAccountLink}
            linkHref={`/${locale}/register`}
            tail={copy.noAccountTail || undefined}
          />
        </div>

        <RiskWarning
          legend={dict.common.riskLegend}
          body={dict.common.riskBody}
        />
      </div>
    </div>
  );
}
