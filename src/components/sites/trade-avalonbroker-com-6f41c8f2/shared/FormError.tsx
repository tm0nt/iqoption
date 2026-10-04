import { cn } from "@/lib/utils";

/**
 * A failure, shown where the person is looking.
 *
 * It renders nothing when there is nothing to say, rather than an empty box
 * that shifts the form down the moment a field goes wrong — the layout has to
 * hold still while someone is typing in it.
 */
export function FormError({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn(
        "mb-[18px] font-avalon text-[13px] leading-[18px] text-avalon-danger",
        className,
      )}
    >
      {children}
    </p>
  );
}
