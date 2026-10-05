import { BRAND_NAMES, type CardBrand } from "@/lib/payments/cards/card-types";

/*
 * The brand as a small card-shaped chip with its name, not its logo: the
 * schemes' marks are their trademarks, and a lettered chip in the scheme's
 * colour is enough to tell one saved card from another.
 */
const COLOURS: Record<CardBrand, string> = {
  visa: "bg-[#1a1f71]",
  mastercard: "bg-[#252525]",
  amex: "bg-[#2e77bc]",
  elo: "bg-[#111111]",
  hipercard: "bg-[#b3131b]",
  diners: "bg-[#0079be]",
  discover: "bg-[#e55c20]",
  other: "bg-[#6b7280]",
};

const SHORT: Record<CardBrand, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  elo: "ELO",
  hipercard: "HIPER",
  diners: "DINERS",
  discover: "DISC",
  other: "CARD",
};

export function CardChip({ brand }: { brand: CardBrand }) {
  return (
    <span
      title={BRAND_NAMES[brand]}
      className={`inline-flex h-[26px] w-[42px] shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold tracking-wide text-white ${COLOURS[brand]}`}
    >
      {SHORT[brand]}
    </span>
  );
}
