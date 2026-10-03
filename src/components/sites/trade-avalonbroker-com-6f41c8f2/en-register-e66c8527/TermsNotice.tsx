import { Fragment } from "react";
import type { AvalonRegisterCopy } from "@/types/avalon-login";

/**
 * "By creating an account, you accept our <Terms>, <Privacy> and <Order Execution>
 * and confirm that you are 18 years of age or older." — rendered from the
 * locale's plain-text segments interleaved with its three external links.
 */
export function TermsNotice({ copy }: { copy: AvalonRegisterCopy }) {
  return (
    <div
      data-test-id="register-terms-warning"
      className="flex w-full justify-center text-center font-avalon text-[13px] font-medium leading-[18.85px] text-avalon-text"
    >
      <span className="block w-full">
        {copy.termsSegments.map((segment, index) => {
          const link = copy.termsLinks[index];
          return (
            <Fragment key={index}>
              {segment}
              {link ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer text-avalon-primary hover:underline"
                >
                  {link.text}
                </a>
              ) : null}
            </Fragment>
          );
        })}
      </span>
    </div>
  );
}
