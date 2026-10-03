"use client";

import { useState } from "react";

interface CookieNoticeProps {
  message: string;
  actionLabel: string;
}

export function CookieNotice({ message, actionLabel }: CookieNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      data-test-id="notification-position-container-block"
      className="fixed bottom-0 left-0 z-[99998] w-full max-w-full min-[600px]:bottom-6 min-[600px]:left-6 min-[600px]:w-[376px]"
    >
      <div
        data-test-id="notification-wrapper-block"
        className="relative z-10 w-full cursor-default overflow-hidden rounded-[3px] bg-avalon-surface opacity-[0.98] shadow-avalon transition-opacity duration-[400ms]"
      >
        {/* 3px accent edge: top on mobile, left from 600px up. */}
        <div
          data-test-id="notification-inner-block"
          className="box-border block border-0 border-solid border-avalon-info pb-5 pl-[18px] pr-10 pt-5 max-[599px]:border-t-[3px] min-[600px]:border-l-[3px]"
        >
          <div
            data-test-id="notification-message-block"
            className="block w-full font-avalon text-[12px] font-medium leading-5 text-avalon-text"
          >
            {message}
          </div>
          <div
            data-test-id="notification-action-block"
            className="mt-2 block w-full font-avalon text-[12px] font-medium leading-5 text-avalon-text"
          >
            <button
              type="button"
              onClick={() => setDismissed(true)}
              data-test-id="notification-action-label"
              className="inline-block cursor-pointer align-top font-avalon text-[12px] font-medium leading-5 text-avalon-primary"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
