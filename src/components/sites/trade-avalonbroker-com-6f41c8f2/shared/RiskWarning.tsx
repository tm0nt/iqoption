interface RiskWarningProps {
  legend: string;
  body: string;
}

export function RiskWarning({ legend, body }: RiskWarningProps) {
  return (
    <div
      data-test-id="auth-warning-block"
      className="relative mb-[22px] mt-8 box-border flex w-full flex-col items-center rounded-[4px] border border-avalon-border-muted p-4 font-avalon text-[12px] font-medium leading-[18px] text-avalon-text"
    >
      {/* Fieldset-style legend: absolutely positioned and pulled up to straddle the border. */}
      <div className="absolute inset-x-0 top-0 block -translate-y-1/2 text-center">
        <div className="inline-block bg-white px-2 text-center text-[14px] font-bold uppercase leading-[18px] text-avalon-text">
          <span>{legend}</span>
        </div>
      </div>
      <span>{body}</span>
    </div>
  );
}
