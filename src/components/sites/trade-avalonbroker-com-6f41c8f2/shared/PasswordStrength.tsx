"use client";

import { passwordProblems, passwordStrength, passwordMessage } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

/**
 * What is still wrong with a password, while it is being typed.
 *
 * The same rules the server applies, run here as well — not instead. The server
 * is the one that decides; this exists so the decision is not a surprise after
 * a round trip.
 *
 * It shows every unmet rule at once rather than the first, so the password can
 * be fixed in one edit instead of four.
 */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const problems = passwordProblems(password);
  const score = passwordStrength(password);

  return (
    <div className="mb-[18px] block w-full" data-test-id="password-strength">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              score >= step
                ? score <= 1
                  ? "bg-avalon-danger"
                  : score === 2
                    ? "bg-amber-500"
                    : "bg-avalon-primary"
                : "bg-black/10",
            )}
          />
        ))}
      </div>

      {problems.length > 0 && (
        <ul className="mt-2 list-none space-y-0.5 font-avalon text-[12px] leading-[18px] text-avalon-text">
          {problems.map((problem) => (
            <li key={problem}>{passwordMessage(problem)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
