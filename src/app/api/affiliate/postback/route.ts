/**
 * An affiliate setting the address their tracker listens on.
 *
 * Checked here for what can be checked without the network — a URL, http or
 * https, not this machine — so a mistake is said while they are looking at the
 * form. The address is checked again, properly, each time it is called; see
 * src/lib/affiliate/postback.ts.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { postbackUrlProblem } from "@/lib/affiliate/postback";
import { affiliateCopy } from "@/i18n/affiliate";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const t = affiliateCopy(typeof body?.locale === "string" ? body.locale : "en");
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (url) {
    const problem = url.length > 1024 ? "too long" : postbackUrlProblem(url);
    if (problem) return NextResponse.json({ error: t.invalidUrl(problem) }, { status: 400 });
  }

  const updated = await prisma.affiliate.updateMany({
    where: { userId: session.user.platformId },
    data: { postbackUrl: url || null },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not an affiliate" }, { status: 404 });

  return NextResponse.json({ postbackUrl: url || null });
}
