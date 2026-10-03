import Link from "next/link";

interface AuthLinkRowProps {
  lead: string;
  linkText: string;
  linkHref: string;
  /** Optional trailing word, e.g. "now" after "Log In" on the register page. */
  tail?: string;
  className?: string;
}

/** "Don't have an account? Sign Up" / "Already have an account? Log In now" */
export function AuthLinkRow({
  lead,
  linkText,
  linkHref,
  tail,
  className,
}: AuthLinkRowProps) {
  return (
    <div
      data-test-id="auth-link"
      className={
        className ??
        "mt-[7px] block h-5 w-full text-center font-avalon text-[12px] font-medium leading-5 text-avalon-text"
      }
    >
      <span>
        {lead}{" "}
        <Link
          href={linkHref}
          className="text-center font-avalon text-[12px] font-medium leading-5 text-avalon-primary hover:underline"
        >
          {linkText}
        </Link>
        {tail ? ` ${tail}` : null}
      </span>
    </div>
  );
}
