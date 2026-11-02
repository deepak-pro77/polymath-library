"use client";

import Link from "next/link";
import { availabilityLabel, type Book } from "@/data/books";
import { categoryById } from "@/data/categories";
import { useShelf, percent } from "@/lib/progress";
import { BookCover } from "./BookCover";
import { Icon } from "@/components/ui/Icon";

export function AvailabilityBadge({ a, className = "" }: { a: Book["availability"]; className?: string }) {
  const styles = {
    here: "bg-gold-tint text-gold border-gold/40",
    elsewhere: "bg-surface-200 text-ink-muted border-hairline-strong",
    review: "bg-surface-200 text-ink-subtle border-hairline-strong border-dashed",
  }[a];
  return (
    <span className={`eyebrow inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 ${styles} ${className}`} style={{ fontSize: 10 }}>
      {a === "here" && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
      {availabilityLabel[a]}
    </span>
  );
}

export function BookCard({ book, showCategory = true }: { book: Book; showCategory?: boolean }) {
  const { shelf, save, remove } = useShelf();
  const rec = shelf[book.slug];
  const pct = rec ? percent(book.slug, rec.page) : 0;
  const saved = Boolean(rec);

  return (
    <article className="group relative flex flex-col gap-3">
      <Link href={`/book/${book.slug}`} className="relative block rounded-sm transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1.5">
        <BookCover book={book} className="transition-shadow duration-300 group-hover:shadow-lift" />
        <AvailabilityBadge a={book.availability} className="absolute left-[10%] top-2.5" />
        {rec && rec.status !== "saved" && (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/50">
            <div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </Link>

      <button
        type="button"
        onClick={() => (saved ? remove(book.slug) : save(book.slug))}
        aria-label={saved ? `Remove ${book.title} from my library` : `Save ${book.title} to my library`}
        aria-pressed={saved}
        className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all duration-200 ${
          saved ? "border-gold bg-gold text-on-accent opacity-100" : "border-hairline-strong bg-surface-000/70 text-ink-muted opacity-0 hover:border-gold hover:text-gold group-hover:opacity-100 focus-visible:opacity-100"
        }`}
      >
        <Icon name="bookmark" size={15} />
      </button>

      <div className="flex flex-col gap-1">
        {showCategory && <span className="eyebrow text-ink-subtle">{categoryById[book.category].short}</span>}
        <Link href={`/book/${book.slug}`} className="font-display text-[19px] font-semibold leading-tight text-ink">
          <span className="bg-[linear-gradient(var(--gold),var(--gold))] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
            {book.title}
          </span>
        </Link>
        <span className="text-[13px] text-ink-muted">{book.author}</span>
        {rec && rec.status === "reading" && <span className="text-[12px] text-ink-subtle">{pct}% read</span>}
        {rec && rec.status === "completed" && <span className="flex items-center gap-1 text-[12px] text-gold"><Icon name="check" size={12} /> Completed</span>}
      </div>
    </article>
  );
}
