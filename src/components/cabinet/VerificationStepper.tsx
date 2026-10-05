/**
 * The three-point rail down the left of the verification page.
 *
 * A step is one of three states and each draws differently: done is a filled
 * teal ring with a tick, current is a teal ring with a teal dot, and the rest
 * are grey. The connecting line is teal only between steps that are behind
 * you, which is what makes the rail read as progress rather than as a list.
 */
export type StepState = "done" | "current" | "todo";

export type Step = { label: string; note?: string; state: StepState };

export function VerificationStepper({ steps }: { steps: Step[] }) {
  return (
    <ol className="w-full md:w-[306px] md:shrink-0">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const behind = step.state === "done";

        return (
          <li key={step.label} className="relative flex gap-3 pb-8 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-[22px] h-[calc(100%-22px)] w-px ${
                  behind ? "bg-avalon-primary" : "bg-avalon-border-muted/50"
                }`}
              />
            )}

            <span
              aria-hidden
              className={`relative z-10 mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border bg-white ${
                step.state === "todo" ? "border-avalon-border-muted/60" : "border-avalon-primary"
              }`}
            >
              {step.state === "done" && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                  <path d="M1 4l2.8 2.8L9 1.5" stroke="#09af8e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {step.state === "current" && <span className="size-[7px] rounded-full bg-avalon-primary" />}
              {step.state === "todo" && <span className="size-[7px] rounded-full bg-avalon-border-muted/50" />}
            </span>

            <span className="pt-0.5">
              <span
                className={`block text-[14px] font-semibold ${
                  step.state === "current" ? "text-avalon-text-strong" : "text-[#828182]"
                }`}
              >
                {step.label}
              </span>
              {step.note && <span className="mt-0.5 block text-[13px] font-medium text-[#828182]">{step.note}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
