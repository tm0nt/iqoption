/**
 * Platform settings, for an administrator.
 *
 * GET lists every row; PUT writes one. A setting is a whole JSON document
 * rather than a scalar, because each one configures a different thing and the
 * shapes have nothing in common — see `src/lib/engine/settings.ts` for the ones
 * the traderoom reads and what they default to.
 *
 * **No authentication yet.** `engine.feed` points the traderoom at a WebSocket;
 * anyone who can write it can point every session somewhere else.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { key?: unknown; value?: unknown; description?: unknown }
    | null;

  if (!body || typeof body.key !== "string" || !body.key.trim()) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }
  if (body.value === undefined) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    return NextResponse.json({ error: "description must be a string" }, { status: 400 });
  }

  const value = body.value as Parameters<typeof prisma.platformSetting.create>[0]["data"]["value"];
  const setting = await prisma.platformSetting.upsert({
    where: { key: body.key },
    create: { key: body.key, value, description: body.description ?? null },
    update: { value, ...(body.description === undefined ? {} : { description: body.description }) },
  });

  return NextResponse.json({ setting });
}
