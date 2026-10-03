export function SiteFooter({ label }: { label: string }) {
  return (
    <footer
      data-test-id="footer-wrapper"
      className="block h-[65px] w-full shrink-0 border-t border-avalon-border-muted bg-avalon-surface"
    >
      <div className="mx-auto box-border w-full max-w-[1120px] px-4 min-[480px]:px-6 min-[600px]:px-12 min-[840px]:px-9 min-[960px]:px-24 min-[1280px]:px-[65px]">
        <div className="box-border flex min-h-16 w-full items-center justify-center py-3">
          <div
            data-test-id="footer-copyright"
            className="block text-center font-avalon text-[14px] font-medium leading-[20.3px] text-avalon-text"
          >
            {label}
          </div>
        </div>
      </div>
    </footer>
  );
}
