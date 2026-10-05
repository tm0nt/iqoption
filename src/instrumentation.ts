/**
 * Work the web server does on its own, between requests.
 *
 * One job: keeping the affiliate ledger current. Deals are settled by the
 * market server, which knows nothing about affiliates, so the revenue share a
 * settled deal earns is written here, once a minute, by reading what has
 * settled and adding what is missing. The pages that show a ledger also bring
 * it up to date before they read it; this is what keeps it current for the
 * time nobody is looking. See src/lib/affiliate/accrual.ts.
 *
 * The timer is `unref`'d so it never keeps a process alive on its own, and it
 * does not start during `next build`, which also runs this file.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AFFILIATE_ACCRUAL === "off") return;

  const { accrueQuietly } = await import("@/lib/affiliate/accrual");

  let running = false;
  const tick = async () => {
    // A pass that takes longer than the interval is not run twice at once.
    if (running) return;
    running = true;
    try {
      await accrueQuietly();
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
}
