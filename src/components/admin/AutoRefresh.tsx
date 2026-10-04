"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the page it sits on, on a timer.
 *
 * Running deals settle on their own, in a different process. Without this the
 * table is a photograph: a deal that expired thirty seconds ago still reads as
 * running, and the only way to find out is to reload by hand.
 *
 * `router.refresh()` re-runs the server component and swaps the result in; it
 * does not reload the document, so scroll position and any open menu survive.
 */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
