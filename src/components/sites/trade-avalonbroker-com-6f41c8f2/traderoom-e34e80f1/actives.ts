import type { CandleSize } from "@/lib/avalon/types";

/**
 * Maps the clone's asset tabs onto feed instruments.
 *
 * The ids below are placeholders until `get-initialization-data` is read from a
 * live session — run `node scripts/avalon-probe.mjs` and take the real `id`,
 * `name` and `precision` from the `actives` block of the response.
 */
export interface ActiveBinding {
  activeId: number;
  precision: number;
}

export const ACTIVE_BINDINGS: Record<string, ActiveBinding> = {
  btc: { activeId: 816, precision: 2 },
  us100: { activeId: 959, precision: 2 },
  ssnlf: { activeId: 183, precision: 2 },
};

/** Falls back to the first binding so an unmapped tab still renders. */
export function bindingFor(assetId: string): ActiveBinding {
  return ACTIVE_BINDINGS[assetId] ?? { activeId: 1, precision: 5 };
}

export const DEFAULT_CANDLE_SIZE: CandleSize = 60;
