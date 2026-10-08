import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2A6.5 6.5 0 0 1 21.5 20" /></>,
  list: <><path d="m3.5 6 1.5 1.5L8 4.5M3.5 12.5 5 14l3-3M3.5 19 5 20.5l3-3" /><path d="M11.5 6h9M11.5 12.5h9M11.5 19h9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  car: <><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3h-3v-3M6 19H3v-3" /><circle cx="7.5" cy="13" r="1" /><circle cx="16.5" cy="13" r="1" /></>,
  shirt: <path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0Z" />,
  water: <><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /><path d="M9 14a3 3 0 0 0 3 3" /></>,
  umbrella: <><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" /><path d="M12 12v6.5a2 2 0 0 1-4 0" /></>,
  medkit: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M12 10.5v6M9 13.5h6" /></>,
  snack: <><path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3Z" /><circle cx="8.5" cy="10.5" r=".8" /><circle cx="14.5" cy="15.5" r=".8" /><circle cx="9.5" cy="16" r=".8" /></>,
  listen: <><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></>,
  cheer: <><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9.5v-5a1.5 1.5 0 0 1 3 0v5M13 9.5v-3a1.5 1.5 0 0 1 3 0v6" /><path d="M16 11a1.5 1.5 0 0 1 3 0v2a8 8 0 0 1-8 8h-.5A6.5 6.5 0 0 1 5 17l-1.6-3a1.5 1.5 0 0 1 2.6-1.5L7 14" /></>,
  baby: <><circle cx="12" cy="8" r="4.5" /><path d="M10.5 8h.01M13.5 8h.01M10.8 10a2 2 0 0 0 2.4 0" /><path d="M7 21v-2a5 5 0 0 1 10 0v2" /></>,
  gem: <><path d="M6 3h12l3 6-9 12L3 9l3-6Z" /><path d="M3 9h18M12 21 8.5 9 10 3M12 21l3.5-12L14 3" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  exit: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
  team: <><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M7 20a5 5 0 0 1 10 0M1.8 18a3.4 3.4 0 0 1 5-2.6M22.2 18a3.4 3.4 0 0 0-5-2.6" /></>,
  pin: <><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.4" /></>,
  crown: <><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  food: <><path d="M4 3v8a3 3 0 0 0 3 3v7M7 3v6M10 3v8a3 3 0 0 1-3 3" /><path d="M17 21V3c-2 0-3.5 2.5-3.5 6S15 14 17 14" /></>,
  megaphone: <><path d="M3 10v4a1 1 0 0 0 1 1h3l9 5V4L7 9H4a1 1 0 0 0-1 1Z" /><path d="M19.5 9.5a3.5 3.5 0 0 1 0 5" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="M13.5 6.5l4 4" /></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5M4 20h16" /></>,
  logout: <><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="M14 16l4-4-4-4M18 12H9" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  medal: <><circle cx="12" cy="15" r="6" /><path d="M8.5 3h7l-2 7h-3l-2-7Z" /><path d="m12 12.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3.9-1.8Z" /></>,
  heart: <path d="M12 20s-7.5-4.6-9.2-9.4A4.8 4.8 0 0 1 12 6.7a4.8 4.8 0 0 1 9.2 3.9C19.5 15.4 12 20 12 20Z" />,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>,
};

export default function Icon({ name, ...rest }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {P[name] ?? P.sparkle}
    </svg>
  );
}
