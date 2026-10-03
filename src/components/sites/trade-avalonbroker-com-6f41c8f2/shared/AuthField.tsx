import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** data-test-id on the outer wrapper, mirroring the live DOM. */
  testId?: string;
  /** Wrapper background. White on login/register, #FBF9FA on change-password. */
  surface?: "white" | "muted";
  wrapperClassName?: string;
}

/**
 * The Avalon text field: a 50px wrapper holding a 1px-bordered 48px frame.
 * The frame darkens on focus and stays dark while the field has a value —
 * see `.avalon-field` in globals.css.
 */
export function AuthField({
  testId,
  surface = "white",
  wrapperClassName,
  className,
  ...input
}: AuthFieldProps) {
  return (
    <div
      data-test-id={testId}
      className={cn(
        "mb-[18px] block h-[50px] w-full",
        surface === "white" ? "bg-white" : "bg-avalon-surface",
        wrapperClassName,
      )}
    >
      <div className="avalon-field relative h-[50px] w-full">
        <input
          {...input}
          className={cn(
            "box-border h-12 w-full border-0 bg-transparent px-[10px] font-avalon text-[14px] font-normal leading-[16.1px] text-avalon-text outline-none",
            className,
          )}
        />
      </div>
    </div>
  );
}
