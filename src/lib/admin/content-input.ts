/**
 * What an editor is allowed to submit for a content item.
 *
 * Shared by the create and the edit routes so the two cannot drift: a field
 * accepted on one and rejected on the other is a bug that only shows up after
 * someone has written a long article.
 */
import { ContentKind } from "@/generated/prisma/enums";

const KINDS = Object.values(ContentKind) as string[];
const LOCALES = ["en", "pt", "es"];

export type ContentInput = {
  kind: ContentKind;
  locale: string | null;
  category: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  author: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  durationMins: number | null;
  priority: number;
  enabled: boolean;
};

/** Trims, and turns the empty string into null — a blank field is not a value. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function when(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function contentInput(body: unknown): { data: ContentInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "expected a JSON object" };
  const input = body as Record<string, unknown>;

  const kind = typeof input.kind === "string" ? input.kind : "";
  if (!KINDS.includes(kind)) return { error: `kind must be one of ${KINDS.join(", ")}` };

  const title = text(input.title, 255);
  if (!title) return { error: "a title is required" };

  const locale = text(input.locale, 2);
  // Null is meaningful here — it means every language — so an unknown code is
  // refused rather than quietly turned into one.
  if (locale !== null && !LOCALES.includes(locale)) {
    return { error: `locale must be empty or one of ${LOCALES.join(", ")}` };
  }

  const startsAt = when(input.startsAt);
  const endsAt = when(input.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) return { error: "it cannot end before it starts" };

  const duration = Number(input.durationMins);
  const priority = Number(input.priority);

  return {
    data: {
      kind: kind as ContentKind,
      locale,
      category: text(input.category, 96),
      title,
      summary: text(input.summary, 512),
      body: text(input.body, 20_000),
      imageUrl: text(input.imageUrl, 512),
      linkUrl: text(input.linkUrl, 512),
      author: text(input.author, 128),
      startsAt,
      endsAt,
      durationMins: Number.isFinite(duration) && duration > 0 ? Math.min(Math.round(duration), 1440) : null,
      priority: Number.isFinite(priority) ? Math.max(-1000, Math.min(Math.round(priority), 1000)) : 0,
      enabled: input.enabled !== false,
    },
  };
}
