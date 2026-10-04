"use client";

/**
 * The pill switch the profile pages use.
 *
 * It saves as soon as it is moved — there is no Save button on these pages —
 * and shows the new position straight away rather than after the round trip,
 * because a switch that lags feels broken. If the save fails it springs back
 * and says so, which is the only honest thing a control that lied can do.
 */
import { useState, useTransition } from "react";

export function Toggle({
  checked,
  onSave,
  label,
}: {
  checked: boolean;
  onSave: (next: boolean) => Promise<{ error?: string } | void>;
  label: string;
}) {
  const [on, setOn] = useState(checked);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    setError(null);

    start(async () => {
      const said = await onSave(next).catch(() => ({ error: "could not save that" }));
      if (said && "error" in said && said.error) {
        setOn(!next);
        setError(said.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={saving}
        onClick={toggle}
        className={`relative h-[26px] w-[48px] rounded-full transition-colors disabled:opacity-60 ${
          on ? "bg-avalon-primary" : "bg-avalon-surface-hover"
        }`}
      >
        <span
          className={`absolute top-[3px] size-5 rounded-full bg-white shadow transition-[left] ${
            on ? "left-[25px]" : "left-[3px]"
          }`}
        />
      </button>
      {error && <span className="text-[12px] text-avalon-danger">{error}</span>}
    </div>
  );
}

/** The square check the notification list uses, saved the same way. */
export function CheckRow({
  checked,
  label,
  onSave,
}: {
  checked: boolean;
  label: string;
  onSave: (next: boolean) => Promise<{ error?: string } | void>;
}) {
  const [on, setOn] = useState(checked);
  const [saving, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const said = await onSave(next).catch(() => ({ error: "x" }));
      if (said && "error" in said && said.error) setOn(!next);
    });
  }

  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-[3px] text-[14px] text-avalon-text-strong">
      <input type="checkbox" checked={on} disabled={saving} onChange={toggle} className="sr-only" />
      <span
        aria-hidden
        className={`flex size-[17px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
          on ? "border-avalon-primary bg-avalon-primary" : "border-avalon-border-muted"
        }`}
      >
        {on && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
