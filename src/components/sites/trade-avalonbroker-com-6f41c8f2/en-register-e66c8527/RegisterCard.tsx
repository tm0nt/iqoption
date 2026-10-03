import { RegisterForm } from "./RegisterForm";
import { SocialLogin } from "../shared/SocialLogin";
import { RiskWarning } from "../shared/RiskWarning";
import { AuthLinkRow } from "../shared/AuthLinkRow";
import type { AvalonDictionary, AvalonLocale } from "@/types/avalon-login";

interface RegisterCardProps {
  locale: AvalonLocale;
  dict: AvalonDictionary;
}

/**
 * The register page uses a wider shell than login: a full-width band with
 * `padding: 48px 0 60px` holding a 420px (max) centred column, rather than an
 * auto-margined card.
 */
export function RegisterCard({ locale, dict }: RegisterCardProps) {
  const copy = dict.register;

  return (
    <div className="block w-full min-w-[320px] px-0 pb-[60px] pt-8 min-[840px]:pt-12">
      {/* The live container is content-box 420px + 2x16px padding = a 452px border box. */}
      <div className="RegisterFormContainer mx-auto block w-full max-w-[452px] px-4">
        <div className="mb-5 block w-full">
          <h1 className="block w-full text-center font-avalon text-[24px] font-semibold leading-8 tracking-[-1px] text-avalon-text min-[480px]:text-[30px] min-[480px]:leading-10">
            <span>{copy.heading}</span>
          </h1>
        </div>

        <RegisterForm copy={copy} locale={locale} />

        <SocialLogin
          dividerLabel={dict.common.divider}
          buttonLabel={copy.google}
          testId="right-bar_google"
        />

        <AuthLinkRow
          lead={copy.hasAccountLead}
          linkText={copy.hasAccountLink}
          linkHref={`/${locale}/login`}
          tail={copy.hasAccountTail || undefined}
          className="block h-5 w-full text-center font-avalon text-[12px] font-medium leading-5 text-avalon-text"
        />

        <RiskWarning
          legend={dict.common.riskLegend}
          body={dict.common.riskBody}
        />
      </div>
    </div>
  );
}
