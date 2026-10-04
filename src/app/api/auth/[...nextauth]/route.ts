/**
 * Auth.js's own endpoints: sign-in, sign-out, session, CSRF.
 *
 * The handlers come from the configuration in `src/auth.ts`; nothing is
 * implemented here. Registration is ours and lives at `/api/auth/register`,
 * which this route does not shadow — Auth.js only claims the paths it knows.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
