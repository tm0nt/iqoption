/**
 * Authentication.
 *
 * Auth.js v5, with credentials and a JWT session. No database adapter: the
 * adapter exists to store sessions, and a credentials provider cannot use
 * database sessions — Auth.js only issues a session row for providers it has
 * verified itself. The token carries what the app needs and the database stays
 * the record of who exists, not of who is signed in.
 *
 * The id in the token is the platform's own numeric user id, the one the
 * trading protocol carries. Everything downstream — the traderoom's ssid, the
 * `check-session` answer, the wallet — keys off it.
 */
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
// Imported for its side effect on the type graph: a module augmentation can
// only attach to a module TypeScript has actually resolved.
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { emailSchema } from "@/lib/auth/validation";
import { verifySecondFactor } from "@/lib/auth/two-factor";

/*
 * The second step's three answers, as error codes the login form can read.
 *
 * Auth.js turns a thrown `CredentialsSignin` into `?code=` on its answer, and
 * `signIn(..., { redirect: false })` hands that code back. They are only ever
 * reached after the password matched, so saying "a code is needed" tells
 * nobody anything they could not learn by knowing the password — and the
 * password is the thing the second factor exists to back up.
 */
class TwoFactorRequired extends CredentialsSignin {
  code = "2fa_required";
}
class TwoFactorInvalid extends CredentialsSignin {
  code = "2fa_invalid";
}
class TwoFactorLocked extends CredentialsSignin {
  code = "2fa_locked";
}

/*
 * Our own fields, under our own names.
 *
 * `id` and `emailVerified` already exist on Auth.js's `User`, typed as a string
 * and a `Date | null`. Ours are a number and a boolean, so they get names of
 * their own rather than redeclaring the library's with incompatible types —
 * which does not narrow a type, it makes the module fail to augment at all.
 */
declare module "next-auth" {
  interface Session {
    user: {
      /** The `user_id` the trading protocol carries. */
      platformId: number;
      emailConfirmed: boolean;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    platformId: number;
    emailConfirmed: boolean;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    platformId: number;
    emailConfirmed: boolean;
    isAdmin: boolean;
  }
}

/**
 * Compared against when no account matches, so answering takes the same time
 * either way. Without it, a fast "no" and a slow "wrong password" tell an
 * attacker which addresses are registered.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.uQZkmU2Z3lXOBzQ5ZsQ6OQZ0bKj5Dlu";

void (undefined as unknown as JWT);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/en/login" },
  // The app is reached by whatever hostname it is deployed under, and the
  // engine requires a hostname rather than an address (see
  // docs/engine-host-pendencias.md), so the host header is what there is.
  trustHost: true,

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        /** The authenticator app's code, or a recovery code. Only asked for when the account has it on. */
        code: { label: "Code", type: "text" },
      },

      async authorize(credentials) {
        const email = emailSchema.safeParse(credentials?.email);
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email.success || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.data },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            emailVerified: true,
            isActive: true,
            role: true,
            twoFactorEnabledAt: true,
          },
        });

        // Always hashes, even with no account, so the answer takes the same
        // time whether or not the address is registered.
        const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !matches || !user.isActive) return null;

        if (user.twoFactorEnabledAt) {
          const code = typeof credentials?.code === "string" ? credentials.code.trim() : "";
          if (!code) throw new TwoFactorRequired();
          const result = await verifySecondFactor(user.id, code);
          if (result === "locked") throw new TwoFactorLocked();
          if (result !== "ok") throw new TwoFactorInvalid();
        }

        return {
          id: String(user.id),
          platformId: user.id,
          email: user.email,
          name: user.name,
          emailConfirmed: user.emailVerified !== null,
          isAdmin: user.role === "ADMIN",
        };
      },
    }),
  ],

  events: {
    /**
     * Signing out ends the trading session too.
     *
     * The traderoom does not use the web session: it is handed an opaque ssid
     * that the market server resolves in `trading_sessions`, and that row
     * outlives the cookie by its own expiry. Without this, logging out leaves
     * an id that still opens deals on the account for the next twelve hours —
     * on a shared machine, that is the whole point of logging out undone.
     */
    async signOut(message) {
      const platformId = "token" in message ? message.token?.platformId : undefined;
      if (typeof platformId !== "number") return;
      await prisma.tradingSession
        .deleteMany({ where: { userId: platformId } })
        .catch((error) => console.error("could not clear trading sessions:", error));
    },
  },

  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on the request that signs in.
      if (user) {
        token.platformId = user.platformId;
        token.emailConfirmed = user.emailConfirmed;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },

    session({ session, token }) {
      session.user.platformId = token.platformId;
      session.user.emailConfirmed = token.emailConfirmed;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
});
