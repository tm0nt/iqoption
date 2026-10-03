import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** The filled teal primary button used by every auth form. */
export function AuthSubmitButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        "relative block box-border h-[50px] w-full cursor-pointer rounded-[2px] border border-transparent bg-avalon-primary px-5 py-3 text-center font-avalon text-[16px] font-medium leading-6 text-white transition-[border-color,background-color,color] duration-200 hover:bg-avalon-primary-hover",
        className,
      )}
    >
      <span>{children}</span>
    </button>
  );
}
