/**
 * The Polymath mark: an open book whose pages rise into the ring of an astrolabe,
 * with a single star above — knowledge, instruments, the sky. One gold line.
 */
export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {/* astrolabe ring */}
      <circle cx="32" cy="27" r="21" strokeOpacity="0.55" />
      <ellipse cx="32" cy="27" rx="21" ry="7.5" strokeOpacity="0.35" transform="rotate(-20 32 27)" />
      {/* star */}
      <path d="M32 8.5v4M30 10.5h4" />
      {/* open book */}
      <path d="M12 44c6-3.5 13-3.5 20 0 7-3.5 14-3.5 20 0v10c-6-3.5-13-3.5-20 0-7-3.5-14-3.5-20 0z" fill="currentColor" fillOpacity="0.12" />
      <path d="M32 44v10" />
      <path d="M16 47.5c4.5-2 9-2.2 13-1M48 47.5c-4.5-2-9-2.2-13-1" strokeOpacity="0.7" />
      {/* pages rising into the ring */}
      <path d="M26 41c1.5-5 3-9 6-13 3 4 4.5 8 6 13" strokeOpacity="0.8" />
    </svg>
  );
}
