/**
 * The editorial items the traderoom shows: list and create.
 *
 * The middleware refuses anyone who is not an administrator before this runs
 * (see `/api/admin` in src/middleware.ts), so there is no second check here.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contentInput } from "@/lib/admin/content-input";
import { ContentKind } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  const known = (Object.values(ContentKind) as string[]).includes(kind ?? "");

  const items = await prisma.contentItem.findMany({
    where: known ? { kind: kind as ContentKind } : {},
    orderBy: [{ kind: "asc" }, { priority: "desc" }, { startsAt: "desc" }, { id: "desc" }],
    take: 500,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const parsed = contentInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const item = await prisma.contentItem.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}
