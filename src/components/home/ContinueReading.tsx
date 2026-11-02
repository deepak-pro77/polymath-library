"use client";

import Link from "next/link";
import { bookBySlug } from "@/data/books";
import { categoryById } from "@/data/categories";
import { useShelf, percent } from "@/lib/progress";
import { BookCover } from "@/components/books/BookCover";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ContinueReading({ limit = 1, title = "Continue Reading" }: { limit?: number; title?: string }) {
  const { shelf } = useShelf();
  const reading = Object.entries(shelf)
    .filter(([slug, r]) => r.status === "reading" && bookBySlug[slug])
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
    .slice(0, limit);

  return (
    <section className="flex h-full flex-col gap-3" aria-labelledby="continue-title">
      <SectionHeader id="continue-title" title={title} href="/me" linkLabel="View All" />
      {reading.length === 0 ? (
        <div className="card-surface flex flex-1 items-center gap-5 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold-tint text-gold"><Icon name="book" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] text-ink">Nothing in progress yet.</p>
            <p className="font-serif text-[14px] text-ink-muted">Open any book marked <span className="text-gold">Read here</span> — your place is remembered.</p>
          </div>
          <Link href="/library?availability=here" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[13px] font-medium text-ink transition-colors hover:border-gold hover:text-gold">Find a book <Icon name="arrow" size={14} /></Link>
        </div>
      ) : (
        <div className={`grid flex-1 gap-3 ${limit > 1 ? "md:grid-cols-2" : ""}`}>
          {reading.map(([slug, r]) => {
            const book = bookBySlug[slug];
            const pct = percent(slug, r.page);
            return (
              <article key={slug} className="card-surface relative flex gap-5 overflow-hidden p-5">
                {book.coverUrl && (
                  <div className="pointer-events-none absolute inset-0 opacity-45 [mask-image:linear-gradient(90deg,transparent_35%,black_100%)]" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={book.coverUrl} alt="" className="h-full w-full scale-125 object-cover blur-xl saturate-50" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--surface-100)_45%,transparent_100%)]" aria-hidden="true" />
                <Link href={`/read/${slug}`} className="relative w-[84px] shrink-0 self-center"><BookCover book={book} /></Link>
                <div className="relative flex min-w-0 flex-1 flex-col gap-1.5 self-center">
                  <span className="eyebrow text-ink-subtle" style={{ fontSize: 10 }}>{categoryById[book.category].short}</span>
                  <h3 className="font-display text-[24px] font-semibold leading-tight text-ink"><Link href={`/book/${slug}`}>{book.title}</Link></h3>
                  <p className="text-[13px] text-ink-muted">{book.author}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-300"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
                    <span className="text-[12px] text-ink-muted">{pct}%</span>
                  </div>
                  <Link href={`/read/${slug}`} className="mt-2 inline-flex h-9 w-fit items-center gap-2 rounded-md bg-gold px-4 text-[13px] font-semibold text-on-accent transition-colors hover:bg-gold-bright">
                    Continue Reading <Icon name="arrow" size={14} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
