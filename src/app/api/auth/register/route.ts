/**
 * Creating an account.
 *
 * Ours, not Auth.js's: Auth.js signs people in, it has no opinion about who is
 * allowed to exist. The validation is `src/lib/auth/validation.ts`, which
 * reports every rule a submission breaks rather than the first, so the form can
 * show its whole checklist.
 *
 * A new account gets a practice wallet and nothing else. Real money is a
 * separate decision and is not made here.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/auth/validation";
import { setting } from "@/lib/engine/settings";

export const dynamic = "force-dynamic";

/** Cost 12: a few hundred milliseconds per attempt, which is the point. */
const BCRYPT_ROUNDS = 12;

/**
 * `IQBalanceType`, the two wallets every account gets.
 *
 * The real one starts empty on purpose: money reaches it through a deposit
 * somebody reconciles, never through registering. The practice one is funded
 * from `trading.demoBalance` and can be topped back up from the traderoom.
 */
const REAL = 1;
const PRACTICE = 4;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    /*
     * Every failure, grouped by field. A form that is told one problem at a
     * time takes one round trip per rule.
     */
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".") || "form";
      (errors[field] ??= []).push(issue.message);
    }
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  const { email, password, name, phone, phoneCountry } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const demo = await setting("trading.demoBalance");

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        phone,
        phoneCountry,
        balances: {
          create: [
            { type: REAL, amount: new Prisma.Decimal(0), currency: demo.currency },
            { type: PRACTICE, amount: new Prisma.Decimal(demo.amount), currency: demo.currency },
          ],
        },
      },
      select: { id: true, email: true, name: true },
    });

    // No session here. Registering and signing in are separate steps, so a
    // failure to sign in is visible rather than hidden behind a redirect.
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    /*
     * The unique constraints are the check. Looking first and inserting second
     * leaves a window where two requests both find nothing and both insert;
     * the database is the only place that can decide this.
     */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? String(target[0]) : String(target ?? "");
      const onPhone = field.includes("phone");
      return NextResponse.json(
        {
          error: "already registered",
          errors: onPhone
            ? { phone: ["That number is already registered."] }
            : { email: ["That email is already registered."] },
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
