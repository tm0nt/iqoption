import Link from "next/link";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { AuthLinkRow } from "../shared/AuthLinkRow";
import { PasswordRecoveryIcon } from "../shared/icons";
import type { AvalonDictionary, AvalonLocale } from "@/types/avalon-login";

interface ChangePasswordCardProps {
  locale: AvalonLocale;
  dict: AvalonDictionary;
}

export function ChangePasswordCard({ locale, dict }: ChangePasswordCardProps) {
  const copy = dict.changePassword;

  return (
    <div className="relative m-auto box-border block w-full min-w-[320px] max-w-[420px] px-4 pb-[60px] pt-8 min-[840px]:pt-12">
      <div className="block w-full max-w-[420px] px-4">
        <div className="mb-5 block w-full">
          <h1 className="block w-full text-center font-avalon text-[24px] font-semibold leading-8 tracking-[-1px] text-avalon-text min-[480px]:text-[30px] min-[480px]:leading-10">
            <span>{copy.heading}</span>
          </h1>
        </div>

        <PasswordRecoveryIcon className="mx-auto my-6 block size-[88px] overflow-hidden" />

        <div className="my-6 block w-full text-center font-avalon text-[14px] font-medium leading-[22px] text-avalon-text">
          <span>{copy.instruction}</span>
        </div>

        <ChangePasswordForm copy={copy} />

        <div className="block w-full text-center">
          <Link
            href={`/${locale}/login`}
            data-test-id="back-to-login-button"
            className="relative inline-block cursor-pointer rounded-[2px] text-center font-avalon text-[12px] font-medium leading-5 text-avalon-primary transition-[border-color,background-color,color] duration-200 hover:underline"
          >
            {copy.backToLogin}
          </Link>
          <AuthLinkRow
            lead={copy.noAccountLead}
            linkText={copy.noAccountLink}
            linkHref={`/${locale}/register`}
            tail={copy.noAccountTail || undefined}
          />
        </div>
      </div>
    </div>
  );
}
