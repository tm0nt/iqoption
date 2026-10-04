/**
 * The switches on the profile pages, saved one at a time.
 *
 * Each page saves as the control moves rather than behind a Save button, so
 * this takes `{key, value}` and writes exactly that. The whitelist is the
 * point: without it, a `key` of anything would write anything.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { KEYS, readSettings } from "@/lib/cabinet/notifications";

export const dynamic = "force-dynamic";

/** Switches that live in a column of their own rather than in the JSON. */
const COLUMNS = new Set(["publicProfile"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const key = typeof body?.key === "string" ? body.key : "";
  const value = body?.value;

  if (typeof value !== "boolean") return NextResponse.json({ error: "value must be true or false" }, { status: 400 });

  if (COLUMNS.has(key)) {
    await prisma.user.update({ where: { id: session.user.platformId }, data: { [key]: value } });
    return NextResponse.json({ ok: true });
  }

  if (!KEYS.has(key)) return NextResponse.json({ error: `unknown setting ${key}` }, { status: 400 });

  /*
   * Read, merge, write. The column is one JSON document, so saving a single
   * switch means rewriting the whole of it — and reading the stored value
   * through `readSettings` first means a document written before a switch
   * existed still comes back with that switch at its default.
   */
  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: { notifications: true },
  });

  const next = { ...readSettings(user?.notifications), [key]: value };
  await prisma.user.update({ where: { id: session.user.platformId }, data: { notifications: next } });

  return NextResponse.json({ ok: true });
}
