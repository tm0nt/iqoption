/**
 * The platform's identity: read and change.
 *
 * One row in `platform_settings`, because the alternative is the brand being
 * spread across a dozen files and a deploy. The middleware refuses anyone who
 * is not an administrator before this runs.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setting, type Brand } from "@/lib/engine/settings";

export const dynamic = "force-dynamic";

const THEMES = ["black", "white", "blue", "grey"];

export async function GET() {
  return NextResponse.json({ brand: await setting("brand") });
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const current = await setting("brand");
  const next: Brand = { ...current };

  const name = text(body.name, 64);
  if (name !== null) {
    if (!name) return NextResponse.json({ error: "the platform needs a name" }, { status: 400 });
    next.name = name;
  }

  const email = text(body.supportEmail, 160);
  if (email !== null) {
    // Loose on purpose: this is displayed, not authenticated against.
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "that support address is not an address" }, { status: 400 });
    }
    next.supportEmail = email;
  }

  const theme = text(body.theme, 8);
  if (theme !== null) {
    if (!THEMES.includes(theme)) {
      return NextResponse.json({ error: `theme must be one of ${THEMES.join(", ")}` }, { status: 400 });
    }
    next.theme = theme as Brand["theme"];
  }

  const primary = text(body.primary, 32);
  if (primary !== null) {
    /*
     * A CSS colour, checked rather than trusted: it is written into a style
     * attribute, and an unchecked value there is a way into the page.
     */
    if (!/^#[0-9a-fA-F]{3,8}$/.test(primary)) {
      return NextResponse.json({ error: "the accent must be a hex colour, like #00b17a" }, { status: 400 });
    }
    next.primary = primary;
  }

  // An empty string clears a logo, which is how you go back to the build's own.
  for (const slot of ["logoUrl", "logoBigUrl"] as const) {
    const value = text(body[slot], 512);
    if (value === null) continue;
    if (value && !value.startsWith("/api/admin/brand/logo/")) {
      return NextResponse.json({ error: "a logo has to be one this platform stored" }, { status: 400 });
    }
    next[slot] = value;
  }

  await prisma.platformSetting.upsert({
    where: { key: "brand" },
    update: { value: next },
    create: { key: "brand", value: next },
  });

  return NextResponse.json({ brand: next });
}
