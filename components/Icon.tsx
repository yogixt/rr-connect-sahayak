import type { JSX } from "react";

/**
 * Inline line-icon set (stroke = currentColor) keyed by the icon names the backend
 * sends with each node and option. Unknown keys fall back to a neutral dot.
 */
const PATHS: Record<string, JSX.Element> = {
  home: (
    <>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </>
  ),
  "id-card": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <circle cx="8" cy="11" r="2.2" />
      <path d="M5.5 16c.6-1.6 4.4-1.6 5 0" />
      <path d="M14 10h4M14 13.5h4" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3 13h18M12 9v11" />
      <path d="M12 9C12 9 11 4 8 4a2.2 2.2 0 0 0 0 5zM12 9c0 0 1-5 4-5a2.2 2.2 0 0 1 0 5z" />
    </>
  ),
  rupee: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M9 9.5h6M9 12h6M11.5 9.5c2 0 2 4.5-1 4.5l3 1.5" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9 12 4l9 5" />
      <path d="M5 9v8M9.5 9v8M14.5 9v8M19 9v8" />
      <path d="M3 20h18" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2.5v2.5M20.5 14.5v6M14.5 20.5h3" />
    </>
  ),
  star: (
    <>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="3.5" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="3.5" height="6" rx="1.5" />
      <path d="M20 19a3 3 0 0 1-3 3h-2" />
    </>
  ),
  phone: (
    <>
      <path d="M21 16.5v2.6a1.8 1.8 0 0 1-2 1.8 17.6 17.6 0 0 1-7.7-2.7 17.3 17.3 0 0 1-5.3-5.3A17.6 17.6 0 0 1 3.3 5.2 1.8 1.8 0 0 1 5.1 3.2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9L8.6 10.6a14 14 0 0 0 5.3 5.3l1.5-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.9z" />
    </>
  ),
  checklist: (
    <>
      <path d="M21 11.5V12a9 9 0 1 1-5.3-8.2" />
      <path d="M21 4.5 12 13.5l-2.7-2.7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20.5l1.8-5.4A8 8 0 1 1 21 11.5z" />
    </>
  ),
  wave: (
    <>
      <path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20.5l1.8-5.4A8 8 0 1 1 21 11.5z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.6 6.3a3.8 3.8 0 0 0-5 4.9L4 16.8l3.2 3.2 5.6-5.6a3.8 3.8 0 0 0 4.9-5l-2.7 2.7-2.1-2.1z" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9 5 4h14l1.5 5" />
      <path d="M4.5 9v11h15V9" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-12H12z" />,
  plug: (
    <>
      <path d="M9 2v4M15 2v4" />
      <path d="M7 6h10v3a5 5 0 0 1-10 0z" />
      <path d="M12 14v6" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </>
  ),
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.4-5.9" />
      <path d="M20.5 4v4.5H16" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />,
};

export default function Icon({
  name,
  size = 24,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const glyph = (name && PATHS[name]) || PATHS.dot;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
}
