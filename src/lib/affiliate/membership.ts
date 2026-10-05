/**
 * Joining the programme.
 *
 * One function, used by the person asking to join and by an administrator
 * making someone an affiliate, so both end with the same row: a code nobody
 * else has, and a status that says whether links track yet.
 */
import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/** No 0/O or 1/I: a code is read aloud and typed from a screenshot. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/**
 * Makes someone an affiliate, or returns the row they already have.
 *
 * The code is drawn at random and the unique index decides whether it is free:
 * thirty-two letters to the eighth power leaves a collision so unlikely that a
 * retry loop of five is a formality, but a formality that costs nothing.
 */
export async function joinProgram(userId: number, active: boolean) {
  const existing = await prisma.affiliate.findUnique({ where: { userId } });
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.affiliate.create({
        data: {
          userId,
          code: generateCode(),
          status: active ? "ACTIVE" : "PENDING",
          approvedAt: active ? new Date() : null,
        },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      // Either the code was taken, or the same person joined twice at once.
      const raced = await prisma.affiliate.findUnique({ where: { userId } });
      if (raced) return raced;
    }
  }
  throw new Error("could not find a free affiliate code");
}
