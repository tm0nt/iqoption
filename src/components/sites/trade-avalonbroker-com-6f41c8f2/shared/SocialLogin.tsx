import { GoogleIcon } from "./icons";

interface SocialLoginProps {
  /** "or use a social account" */
  dividerLabel: string;
  /** "Log in with Google" / "Sign Up with Google" */
  buttonLabel: string;
  testId?: string;
}

export function SocialLogin({ dividerLabel, buttonLabel, testId }: SocialLoginProps) {
  return (
    <div data-test-id="social-login-links" className="relative">
      <div className="avalon-divider relative mb-3 h-[23.1875px] text-center min-[480px]:mb-4">
        <div className="relative inline-block bg-white px-[6px] text-center font-avalon text-[12px] font-medium leading-5 text-avalon-text">
          <span>{dividerLabel}</span>
        </div>
      </div>

      <div className="mb-6 flex w-full flex-col">
        <button
          type="button"
          data-test-id={testId}
          className="relative box-border flex h-[53px] w-full cursor-pointer items-center justify-center rounded-[2px] border border-avalon-border-muted bg-avalon-surface px-4 py-3 text-center font-avalon text-[16px] font-semibold leading-4 text-avalon-text-strong transition-[border-color,background-color,color] duration-200 hover:bg-avalon-surface-hover"
        >
          <div className="box-border flex h-[27px] w-[26px] shrink-0 items-center justify-center">
            <GoogleIcon className="h-[27px] w-[26px]" />
          </div>
          {/* flex:1 next to the 26px icon — the label centres on the remaining width,
              which is why it sits slightly right of the button's centre. */}
          <div className="block h-4 flex-1 text-center text-[14px] font-semibold leading-4 text-avalon-text-strong">
            {buttonLabel}
          </div>
        </button>
      </div>
    </div>
  );
}
