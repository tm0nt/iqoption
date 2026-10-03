import type { SVGProps } from "react";

/**
 * Traderoom icons.
 *
 * The original paints its icons into a WebGL canvas, so there is no SVG to
 * extract. These are redrawn from 1:1 screenshots at the measured sizes and
 * inherit `currentColor` so the rail's active/idle states work.
 */

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

export const PortfolioIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="7" width="19" height="13" rx="2" />
    <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
    <path d="M2.5 12h19" />
  </svg>
);

export const HistoryIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ChatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5h16v10H8.5L4 19z" />
  </svg>
);

export const TutorialsIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="13" rx="1.6" />
    <path d="M3 9h18M8 5v13" />
  </svg>
);

export const PromoIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 10.5 17 5v14L4 13.5z" />
    <path d="M4 10.5H2.8v3H4" />
    <path d="M19 9.5a2.8 2.8 0 0 1 0 5" />
  </svg>
);

export const TrophyIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5.5H4.5V8a3 3 0 0 0 3 3M17 5.5h2.5V8a3 3 0 0 1-3 3" />
    <path d="M10 14h4v3h-4zM8 20h8" />
  </svg>
);

export const WebinarIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const AnalysisIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 17 9 11l3.5 3.5L20 7" />
    <path d="M15.5 7H20v4.5" />
  </svg>
);

export const LeaderboardIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="9" r="4.5" />
    <path d="M9 13.5 7.5 20l4.5-2.5L16.5 20 15 13.5" />
  </svg>
);

export const MoreIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...p}>
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.4" />
    <rect x="13" y="3" width="8" height="8" rx="1.4" />
    <rect x="3" y="13" width="8" height="8" rx="1.4" />
    <rect x="13" y="13" width="8" height="8" rx="1.4" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const CaretIcon = (p: P) => (
  <svg viewBox="0 0 10 6" fill="currentColor" aria-hidden focusable="false" {...p}>
    <path d="M0 0h10L5 6z" />
  </svg>
);

export const ChevronIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 9.5 12 15l6-5.5" />
  </svg>
);

export const DepositIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9M9.5 10.5h5M9.5 13.5h5" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.6" />
  </svg>
);

export const BellIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.5 10a5.5 5.5 0 1 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

export const SoundIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 9.5h3L11 6v12l-4-3.5H4z" />
    <path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10" />
  </svg>
);

export const GearIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
  </svg>
);

export const FullscreenIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 9V3.5H9M15 3.5h5.5V9M20.5 15v5.5H15M9 20.5H3.5V15" />
  </svg>
);

export const HeadsetIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
  </svg>
);

export const CandleIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...p}>
    <rect x="5" y="7" width="4.5" height="11" rx="0.8" />
    <rect x="6.6" y="4" width="1.3" height="16" />
    <rect x="14" y="10" width="4.5" height="8" rx="0.8" opacity="0.55" />
    <rect x="15.6" y="7" width="1.3" height="14" opacity="0.55" />
  </svg>
);

export const SignalIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="2.2" />
    <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
    <path d="M5 5a9.5 9.5 0 0 0 0 14M19 5a9.5 9.5 0 0 1 0 14" />
  </svg>
);

export const PencilIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4 20 1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z" />
  </svg>
);

export const IndicatorIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" />
  </svg>
);

export const CollapseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 4 4 9M4 4l5 5M15 20l5-5M20 20l-5-5" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" {...p}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="m7.5 12.3 3 3 6-6.6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="1.6" />
    <path d="M15 9V5.5A1.5 1.5 0 0 0 13.5 4H5.5A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15H9" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12v6.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V12" />
    <path d="M12 15V4M8 7.5 12 3.5l4 4" />
  </svg>
);

export const FilterIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </svg>
);

export const GlobeIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
  </svg>
);

export const QuestionIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.8 9.6a2.3 2.3 0 1 1 2.8 2.3v1.4M12.3 16.6v.4" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...p}>
    <circle cx="12" cy="8.6" r="4.2" />
    <path d="M3.8 21a8.2 8.2 0 0 1 16.4 0z" />
  </svg>
);
