import type { Book } from "@/data/books";
import { categoryById } from "@/data/categories";

/**
 * Typographic cover plate. Real cover images arrive with the ingestion pipeline
 * (book.coverUrl); until then every book gets a designed plate so the shelves look finished.
 */
const palettes = {
  oxblood: { bg: "linear-gradient(160deg, #3a1818 0%, #1a0d0d 60%, #120909 100%)", band: "#8b3a3a", ink: "#f3ede1" },
  gold: { bg: "linear-gradient(160deg, #2e2612 0%, #15110a 60%, #0f0c07 100%)", band: "#d4b872", ink: "#f3ede1" },
  sage: { bg: "linear-gradient(160deg, #1b2a1f 0%, #0e1511 60%, #0a0f0c 100%)", band: "#6b8c76", ink: "#f3ede1" },
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function BookCover({ book, className = "", priority = false }: { book: Book; className?: string; priority?: boolean }) {
  const cat = categoryById[book.category];
  if (book.coverUrl) {
    return (
      <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-surface-200 shadow-cover ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={book.coverUrl} alt={`${book.title} by ${book.author}`} loading={priority ? "eager" : "lazy"} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/10" />
      </div>
    );
  }
  const p = palettes[cat.mark];
  const variant = hash(book.slug) % 3;
  const long = book.title.length > 26;

  return (
    <div
      className={`@container relative aspect-[2/3] w-full select-none overflow-hidden rounded-sm shadow-cover ${className}`}
      style={{ background: p.bg }}
      role="img"
      aria-label={`${book.title} by ${book.author}`}
    >
      {/* paper grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, #fff 0, transparent 40%), radial-gradient(circle at 80% 90%, #fff 0, transparent 35%)" }} />
      {/* spine */}
      <div className="absolute inset-y-0 left-0 w-[7%]" style={{ background: p.band, opacity: 0.9 }} />
      <div className="absolute inset-y-0 left-[7%] w-px bg-black/40" />

      {variant === 0 && (
        <div className="absolute inset-y-[28%] right-[9%] w-px" style={{ background: p.band, opacity: 0.7 }} />
      )}
      {variant === 1 && (
        <div className="absolute right-[10%] top-[8%] h-[18%] w-[18%] rounded-full border" style={{ borderColor: p.band, opacity: 0.6 }} />
      )}
      {variant === 2 && (
        <div className="absolute right-[10%] top-[30%] flex w-[22%] flex-col gap-[3px]">
          <span className="h-px w-full" style={{ background: p.band }} />
          <span className="h-px w-2/3 self-end" style={{ background: p.band }} />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-between px-[13%] py-[10%] pl-[16%]">
        <span className="eyebrow truncate" style={{ color: p.band, fontSize: "clamp(7px, 1.6cqw, 10px)" }}>{cat.short}</span>
        <span
          className="font-display font-medium leading-[1.02]"
          style={{ color: p.ink, fontSize: long ? "clamp(13px, 11cqw, 26px)" : "clamp(15px, 13cqw, 32px)", fontWeight: priority ? 600 : 500 }}
        >
          {book.title}
        </span>
        <span className="font-sans leading-snug" style={{ color: p.ink, opacity: 0.75, fontSize: "clamp(8px, 4.2cqw, 12px)" }}>{book.author}</span>
      </div>
    </div>
  );
}
