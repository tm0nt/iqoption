/**
 * The admin's building blocks.
 *
 * Every admin page used to spell out its own heading, card and table classes,
 * which is how eight pages ended up with five shades of grey and three heading
 * sizes. These are the shared shapes: a page header, a card, a stat, a badge,
 * table cells and form controls. No state and no client code, so server pages
 * and client editors use the same ones.
 *
 * Colours are the admin's own dark palette rather than the cabinet's tokens —
 * the operator's screen and the trader's are different products — with the
 * brand accent arriving as `--accent` from the layout.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export const ink = {
  muted: "text-[#a0a1a6]",
  dim: "text-[#6f7076]",
};

/** Text inputs, selects and textareas. */
export const inputClass =
  "h-9 w-full rounded-md border border-white/10 bg-[#0d0e11] px-3 text-[13px] text-white outline-none transition-colors placeholder:text-[#5c5d63] focus:border-[var(--accent)] disabled:opacity-50";
export const textareaClass =
  "w-full rounded-md border border-white/10 bg-[#0d0e11] px-3 py-2 text-[13px] leading-relaxed text-white outline-none transition-colors placeholder:text-[#5c5d63] focus:border-[var(--accent)]";
export const labelClass = "mb-1.5 block text-[12px] font-medium text-[#a0a1a6]";
export const hintClass = "mt-1.5 text-[12px] leading-[18px] text-[#6f7076]";

const BUTTONS = {
  primary: "bg-[var(--accent)] text-white hover:brightness-110",
  secondary: "border border-white/10 bg-white/[0.04] text-[#e8e8ea] hover:bg-white/[0.08]",
  danger: "border border-[#f6465d]/40 text-[#ff8a99] hover:bg-[#f6465d]/10",
  ghost: "text-[#a0a1a6] hover:bg-white/[0.05] hover:text-white",
} as const;

export function buttonClass(variant: keyof typeof BUTTONS = "primary", size: "sm" | "md" = "md") {
  const box = size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]";
  return `inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${box} ${BUTTONS[variant]}`;
}

/** Table header and body cells. Tables go inside `TableShell`, which scrolls sideways on a phone. */
export const th = "whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#6f7076]";
export const td = "px-4 py-2.5 align-middle text-[13px]";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#15161a]">
      <table className="w-full min-w-[640px] border-collapse [&_tbody_tr]:border-t [&_tbody_tr]:border-white/[0.05] [&_tbody_tr:hover]:bg-white/[0.02]">
        {children}
      </table>
    </div>
  );
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
        {lead && <p className="mt-1.5 max-w-[760px] text-[13px] leading-[21px] text-[#a0a1a6]">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  padded = true,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/[0.08] bg-[#15161a] ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] leading-[18px] text-[#8b8c92]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children !== undefined && <div className={padded ? "p-5" : ""}>{children}</div>}
    </section>
  );
}

const TONES = {
  neutral: "bg-white/[0.06] text-[#c4c5ca]",
  success: "bg-emerald-500/12 text-emerald-300",
  warning: "bg-amber-500/12 text-amber-300",
  danger: "bg-[#f6465d]/12 text-[#ff8a99]",
  accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
  info: "bg-sky-500/12 text-sky-300",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** The usual tone for a request's status. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "APPROVED":
    case "ACTIVE":
      return "success";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    default:
      return "neutral";
  }
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "up" | "down";
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#a0a1a6]">{label}</span>
        {icon && <span className="text-[#6f7076]">{icon}</span>}
      </div>
      <div
        className={`mt-2 truncate text-[24px] font-semibold leading-tight tracking-tight ${
          tone === "up" ? "text-emerald-300" : tone === "down" ? "text-[#ff8a99]" : "text-white"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-[12px] leading-[17px] text-[#6f7076]">{hint}</div>}
    </>
  );
  const box = "block rounded-lg border border-white/[0.08] bg-[#15161a] px-4 py-3.5";
  return href ? (
    <Link href={href} className={`${box} transition-colors hover:border-white/20`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-[13px] text-[#6f7076]">{children}</p>;
}

/** Tabs as links: the current one is in the URL, so a filtered view can be shared and reloaded. */
export function LinkTabs({ items }: { items: { href: string; label: string; current: boolean; count?: number }[] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-white/[0.08]">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.current ? "page" : undefined}
          className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition-colors ${
            item.current
              ? "border-[var(--accent)] text-white"
              : "border-transparent text-[#a0a1a6] hover:text-white"
          }`}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && (
            <span className="rounded bg-white/[0.08] px-1.5 text-[11px] text-[#c4c5ca]">{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** A labelled form row. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className={`block ${hintClass}`}>{hint}</span>}
    </label>
  );
}

/** Prev/next by page number, carrying the rest of the query along. */
export function Pager({
  basePath,
  query,
  page,
  hasNext,
  labels,
}: {
  basePath: string;
  query: Record<string, string>;
  page: number;
  hasNext: boolean;
  labels: { previous: string; next: string; page: (n: number) => string };
}) {
  const href = (n: number) => {
    const params = new URLSearchParams(query);
    if (n > 1) params.set("page", String(n));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  if (page <= 1 && !hasNext) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      {page > 1 ? (
        <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}>
          ← {labels.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[#6f7076]">{labels.page(page)}</span>
      {hasNext ? (
        <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}>
          {labels.next} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
