"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { BRAND_NAMES, expiryLabel, type CardProviderInfo, type SavedCard } from "@/lib/payments/cards/card-types";
import { CardChip } from "./CardChip";
import { CardForm } from "./CardForm";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";

/** The saved cards on the payment-methods page: each one, a way to remove it, and a way to add one. */
export function SavedCardsPanel({
  cards,
  provider,
  holder,
  locale,
}: {
  cards: SavedCard[];
  provider: CardProviderInfo;
  holder: string;
  locale: string;
}) {
  const t = cabinetExtra(locale).cards;
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: number) {
    if (!window.confirm(t.confirmRemove)) return;
    setBusy(id);
    setError(null);
    const response = await fetch(`/api/profile/cards/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(null);
    if (!response?.ok) {
      setError(t.failed);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 pt-4">
      {cards.length > 0 ? (
        <ul className="border border-avalon-surface-hover">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-avalon-surface-hover px-4 py-3.5 last:border-b-0 sm:px-5"
            >
              <CardChip brand={card.brand} />
              <span className="min-w-0 grow">
                <span className="block text-[14px] text-avalon-text-strong">
                  {BRAND_NAMES[card.brand]} <span className="font-mono">•••• {card.last4}</span>
                </span>
                <span className="block text-[12px] text-avalon-text">
                  {card.holder} · {t.expires(expiryLabel(card))}
                </span>
              </span>
              {card.expired && <span className="rounded bg-avalon-danger/10 px-2 py-0.5 text-[12px] text-avalon-danger">{t.expired}</span>}
              <button
                type="button"
                onClick={() => void remove(card.id)}
                disabled={busy === card.id}
                className="text-[13px] text-avalon-text transition-colors hover:text-avalon-danger disabled:opacity-50"
              >
                {t.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && <p className="text-[13px] text-avalon-text">{t.noCardsYet}</p>
      )}
      <FormError>{error}</FormError>

      {adding ? (
        <div className="max-w-[520px]">
          <CardForm
            provider={provider}
            locale={locale}
            holder={holder}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-[42px] items-center gap-2 rounded-[2px] border border-dashed border-avalon-border-muted px-5 text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
        >
          <span className="text-[18px] leading-none">+</span> {t.add}
        </button>
      )}
    </div>
  );
}
