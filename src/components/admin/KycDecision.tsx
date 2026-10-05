"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { buttonClass, textareaClass } from "./ui";

/**
 * Approve, or reject with a reason.
 *
 * The reason is written for the person, not for the file: it is shown on
 * their verification page as the thing to fix. The presets are the reasons
 * that come up every day, worded so someone can act on them; picking one
 * fills the box, where it can still be edited.
 */
export function KycDecision({ id, locale }: { id: number; locale: string }) {
  const t = adminMoneyCopy(locale).kyc;
  const failed = adminMoneyCopy(locale).common.actionFailed;
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function decide(action: "approve" | "reject") {
    if (action === "reject" && !reason.trim()) {
      setError(t.needReason);
      return;
    }
    if (action === "approve" && !window.confirm(t.confirmApprove)) return;
    setError(null);
    start(async () => {
      const response = await fetch(`/api/admin/kyc/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      }).catch(() => null);
      if (!response?.ok) {
        const said = await response?.json().catch(() => null);
        setError(said?.error ?? failed);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {t.presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setReason(preset)}
            className="max-w-full truncate rounded border border-white/10 px-2 py-1 text-left text-[11.5px] text-[#a0a1a6] transition-colors hover:border-white/25 hover:text-white"
            title={preset}
          >
            {preset.length > 48 ? `${preset.slice(0, 46)}…` : preset}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t.reasonPlaceholder}
        rows={2}
        maxLength={1000}
        disabled={busy}
        className={textareaClass}
      />
      {error && <p className="text-[12px] text-[#ff8a99]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => decide("approve")} disabled={busy} className={buttonClass("primary")}>
          {t.approve}
        </button>
        <button type="button" onClick={() => decide("reject")} disabled={busy} className={buttonClass("danger")}>
          {t.reject}
        </button>
      </div>
    </div>
  );
}
