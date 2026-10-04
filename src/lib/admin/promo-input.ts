/**
 * What an administrator may submit for a promo code.
 *
 * `params`, `instructions` and `information` are free-shaped on purpose — the
 * traderoom renders whatever is in them and validates nothing beyond its own
 * panel — so they are accepted as objects and only checked for being objects.
 */
export type PromoInput = {
  code: string;
  title: string;
  description: string | null;
  descriptionShort: string | null;
  type: string;
  params: object | null;
  instructions: object | null;
  information: object | null;
  endsAt: Date | null;
  enabled: boolean;
};

const TYPES = ["deposit_bonus", "higher_payouts"];

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Accepts an object, or a JSON string typed into a textarea. */
function block(value: unknown): object | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function promoInput(body: unknown): { data: PromoInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "expected a JSON object" };
  const input = body as Record<string, unknown>;

  // Upper case, because the panel shows it that way and a person types it in
  // whatever case they like.
  const code = text(input.code, 48)?.toUpperCase() ?? null;
  if (!code) return { error: "a code is required" };
  if (!/^[A-Z0-9_-]+$/.test(code)) return { error: "a code is letters, digits, dashes and underscores" };

  const title = text(input.title, 160);
  if (!title) return { error: "a title is required" };

  const type = text(input.type, 32) ?? "deposit_bonus";
  if (!TYPES.includes(type)) return { error: `type must be one of ${TYPES.join(", ")}` };

  const endsAtRaw = typeof input.endsAt === "string" && input.endsAt.trim() ? new Date(input.endsAt) : null;
  if (endsAtRaw && Number.isNaN(endsAtRaw.getTime())) return { error: "that end date is not a date" };

  return {
    data: {
      code,
      title,
      description: text(input.description, 8000),
      descriptionShort: text(input.descriptionShort, 255),
      type,
      params: block(input.params),
      instructions: block(input.instructions),
      information: block(input.information),
      endsAt: endsAtRaw,
      enabled: input.enabled !== false,
    },
  };
}
