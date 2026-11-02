import type { SVGProps } from "react";

export type IconName =
  | "home" | "library" | "bookmark" | "journey" | "notes" | "settings" | "search" | "sun" | "moon" | "bell"
  | "menu" | "close" | "arrow" | "external" | "star" | "check" | "clock" | "book"
  | "column" | "laurel" | "atom" | "brain" | "chart" | "chip" | "scale" | "globe" | "bust" | "flame" | "palette";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" />,
  library: <path d="M4 5h4v15H4zM10 5h4v15h-4zM16.5 5.5l3.8-.9 3.3 14-3.8.9z" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  journey: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  notes: <path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M19 14v6H5V6h6" />,
  star: <path d="m12 3 2.8 6 6.2.7-4.6 4.3 1.3 6.3L12 17l-5.7 3.3 1.3-6.3L3 9.7l6.2-.7z" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  book: <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 5v16M8 7h8" />,
  column: <path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10h18L12 4z" />,
  laurel: <path d="M12 3v18M12 7c-3 0-5 2-5 5M12 7c3 0 5 2 5 5M12 12c-3 0-5 2-5 5M12 12c3 0 5 2 5 5M7 20c2 0 4-1 5-3M17 20c-2 0-4-1-5-3" />,
  atom: <><circle cx="12" cy="12" r="1.5" /><ellipse cx="12" cy="12" rx="9" ry="3.5" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" /></>,
  brain: <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1V5a3 3 0 0 1 3-1z" />,
  chart: <path d="M3 20h18M5 16l4-5 4 3 7-8M16 6h4v4" />,
  chip: <><rect x="7" y="7" width="10" height="10" /><path d="M10 2v5M14 2v5M10 17v5M14 17v5M2 10h5M2 14h5M17 10h5M17 14h5" /></>,
  scale: <path d="M12 3v18M5 21h14M12 6l-7 2 3 7a4 4 0 0 0 8 0zM12 6l7 2-3 7a4 4 0 0 1-8 0" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  bust: <path d="M8 21h8M12 3a4 4 0 0 1 4 4c0 2-1 3-2 4v2h-4v-2c-1-1-2-2-2-4a4 4 0 0 1 4-4zM7 21v-3a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3" />,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 1-6 1-9z" />,
  palette: <><path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 1.5-3.4 1.5 1.5 0 0 1 1.1-2.6H17a4 4 0 0 0 0-8z" /><circle cx="7.5" cy="12" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14.5" cy="7.5" r="1" /></>,
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
