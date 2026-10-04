/**
 * The switches the notification page offers, and what they default to.
 *
 * One list, used to render the page, to validate what comes back, and to fill
 * in an account that has never saved anything. A switch that exists in the
 * form and not here would be silently dropped on save.
 */
export const EMAIL_TOPICS = [
  { key: "promotions", label: "Promotions", on: false },
  { key: "systemNews", label: "System news", on: true },
  { key: "analytics", label: "Analytical reports", on: true },
  { key: "product", label: "Product updates", on: true },
  { key: "education", label: "Education & trading insights", on: true },
  { key: "offers", label: "Special offers & bonuses", on: true },
  { key: "tournaments", label: "Tournaments", on: true },
  { key: "marketNews", label: "Market News", on: true },
] as const;

/** The three switches that stand on their own, outside the e-mail list. */
export const CHANNELS = [
  { key: "email", on: true },
  { key: "push", on: false },
  { key: "calls", on: true },
  { key: "marketing", on: true },
] as const;

export type NotificationSettings = Record<string, boolean>;

/** Every key the page may send, so an unknown one can be refused. */
export const KEYS = new Set<string>([
  ...EMAIL_TOPICS.map((topic) => topic.key),
  ...CHANNELS.map((channel) => channel.key),
]);

/** What is stored, merged over the defaults. */
export function readSettings(stored: unknown): NotificationSettings {
  const out: NotificationSettings = {};
  for (const topic of EMAIL_TOPICS) out[topic.key] = topic.on;
  for (const channel of CHANNELS) out[channel.key] = channel.on;

  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
      if (KEYS.has(key) && typeof value === "boolean") out[key] = value;
    }
  }
  return out;
}
