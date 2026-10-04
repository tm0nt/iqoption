/**
 * A drain for page captures, during development only.
 *
 * Cloning a page means reading its real markup, its computed styles and its
 * icon sprites. Carrying all of that back through a conversation is slow and
 * lossy — the interesting parts get truncated. This lets the page being studied
 * POST what it knows straight to disk, where it can be read properly.
 *
 * It refuses to exist in production: the route answers 404 there, because an
 * endpoint that writes attacker-chosen bytes into the repository is not
 * something to leave switched on. It is also why the filename is sanitised to a
 * single flat name rather than trusted as a path.
 *
 *   fetch("http://localhost:3000/api/dev/capture?name=sprite.svg", {
 *     method: "POST", body: document.querySelector("svg").outerHTML,
 *   })
 *
 * Chrome allows a secure page to reach http://localhost, so this works from a
 * tab open on the live site.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CAPTURE_DIR = path.join(process.cwd(), "docs", "research", "captures");

/** Flattens anything path-like to one safe filename. */
function safeName(raw: string | null) {
  const base = (raw ?? "capture.txt").split(/[/\\]/).pop() ?? "capture.txt";
  const clean = base.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^\.+/, "").slice(0, 120);
  return clean || "capture.txt";
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("not found", { status: 404 });
  }

  const url = new URL(request.url);
  const name = safeName(url.searchParams.get("name"));
  const body = await request.text();

  await mkdir(CAPTURE_DIR, { recursive: true });
  await writeFile(path.join(CAPTURE_DIR, name), body, "utf8");

  return NextResponse.json(
    { saved: name, bytes: body.length },
    // The page doing the POST is on another origin, so it needs to be allowed
    // to read this answer — otherwise the fetch reports an opaque failure and
    // there is no way to tell a refused write from a successful one.
    { headers: CORS },
  );
}

/*
 * `allow-private-network` is the one that matters. Chrome treats a request from
 * a public site to a loopback address as a private-network request and blocks
 * it unless the target opts in, through a preflight carrying
 * `Access-Control-Request-Private-Network`. Without this header the fetch does
 * not fail — it hangs, which reads as a frozen renderer rather than a refused
 * request.
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-allow-private-network": "true",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
