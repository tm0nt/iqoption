/**
 * One block of a profile page: a heading, some words, and a control.
 *
 * The live pages are built almost entirely from this shape — a title, a line
 * or two of explanation, and either a switch on the right or a link beneath —
 * separated by a hairline. Naming it keeps the five pages from each inventing
 * their own spacing.
 */
export function ProfileSection({
  title,
  children,
  aside,
  last = false,
}: {
  title: string;
  children?: React.ReactNode;
  /** The switch or button that sits against the right edge. */
  aside?: React.ReactNode;
  /** The final section carries no rule, so the page does not end in a line. */
  last?: boolean;
}) {
  return (
    <section className={last ? "py-7" : "border-b border-avalon-surface-hover py-7"}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 max-w-[700px]">
          <h2 className="text-[16px] font-semibold text-avalon-text-strong">{title}</h2>
          <div className="mt-3 space-y-2 text-[14px] leading-[22px] text-avalon-text">{children}</div>
        </div>
        {aside && <div className="shrink-0 pt-1">{aside}</div>}
      </div>
    </section>
  );
}

/** The teal link the live pages use for an action under a paragraph. */
export function ProfileAction({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="text-[14px] text-avalon-primary transition-colors hover:text-avalon-primary-hover disabled:opacity-50"
    >
      {children}
    </button>
  );
}
