/**
 * Where identity documents are kept, and the checks on what is let in.
 *
 * Outside `public`, under `var/uploads/kyc/<userId>/`, and named at random:
 * nothing about a file's name says whose it is or what it shows, and nothing
 * serves the directory. The one way out is the route that checks the person
 * asking is the owner or an administrator.
 *
 * What is checked, and why:
 *
 *   - the size, so a 200 MB "photo" is refused rather than written;
 *   - the file's own first bytes — JPEG, PNG or WebP — because the type a
 *     browser declares is whatever the client says it is;
 *   - the extension written to disk comes from those bytes, never from the
 *     uploaded name, so `passport.jpg.html` cannot land as HTML.
 */
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

export const KYC_DIR = path.join(process.cwd(), "var", "uploads", "kyc");
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

const NAME = /^\d+\/[0-9a-f]{32}\.(jpg|png|webp)$/;

export type ImageKind = "jpg" | "png" | "webp";

export function sniff(bytes: Uint8Array): ImageKind | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (
    bytes.length > 12 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === "RIFF" &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export const CONTENT_TYPE: Record<ImageKind, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Writes one checked image for a user, returning the name to store. */
export async function storeImage(userId: number, bytes: Uint8Array, kind: ImageKind) {
  const name = `${userId}/${randomBytes(16).toString("hex")}.${kind}`;
  await mkdir(path.join(KYC_DIR, String(userId)), { recursive: true, mode: 0o700 });
  await writeFile(path.join(KYC_DIR, name), bytes, { mode: 0o600 });
  return name;
}

/** Reads a stored image back. The name comes from the database, and is checked anyway. */
export async function readImage(name: string) {
  if (!NAME.test(name)) return null;
  try {
    const bytes = await readFile(path.join(KYC_DIR, name));
    return { bytes, type: CONTENT_TYPE[name.split(".").pop() as ImageKind] };
  } catch {
    return null;
  }
}

export async function removeImages(names: (string | null | undefined)[]) {
  await Promise.all(
    names.filter((name): name is string => Boolean(name && NAME.test(name))).map((name) => unlink(path.join(KYC_DIR, name)).catch(() => {})),
  );
}
