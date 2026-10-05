/**
 * The round mark beside a payment method.
 *
 * One component for both cashier panels, because the deposit and the
 * withdrawal lists are the same list and a method that is drawn one way in one
 * and another way in the other reads as two different methods.
 *
 * It falls back to the lettered badge rather than to a placeholder image. Not
 * every method has artwork — the platform's own set covers the coins it
 * trades and the card schemes, and nothing else — and initials are honest
 * where a borrowed logo would not be.
 */
import { methodIcon, methodInitials, type CashierMethod } from "@/lib/cabinet/cashier-types";

export function MethodMark({ method, size = 28 }: { method: CashierMethod; size?: number }) {
  const icon = methodIcon(method);

  /*
   * Sized in a style rather than a Tailwind class: the two panels ask for 28
   * and 60, and a class name built by interpolation is one Tailwind cannot see
   * to generate.
   */
  const box = { width: size, height: size } as const;

  if (!icon) {
    return (
      <span
        style={box}
        className="flex shrink-0 items-center justify-center rounded-full bg-avalon-surface-hover font-semibold text-avalon-text"
      >
        <span style={{ fontSize: Math.max(9, Math.round(size * 0.32)) }}>{methodInitials(method)}</span>
      </span>
    );
  }

  return (
    <span style={box} className="flex shrink-0 items-center justify-center overflow-hidden rounded-full">
      {/*
        * A plain <img>: these are mirrored third-party files served straight
        * from `public`, so there is nothing for the image optimiser to do but
        * add a round trip.
        */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" width={size} height={size} className="size-full object-contain" />
    </span>
  );
}
