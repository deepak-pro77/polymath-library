"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { books } from "@/data/books";
import { categoryById } from "@/data/categories";
import { BookCover } from "@/components/books/BookCover";
import { Icon } from "@/components/ui/Icon";
import { formatYear } from "@/lib/format";

const here = books.filter((b) => b.availability === "here");
const readable = here.length ? here : books;

/** Book of the day: rotates through the readable collection once per calendar day. */
export function FeaturedBook() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    setIndex(Math.floor((now.getTime() - start.getTime()) / 86400000) % readable.length);
  }, []);
  const book = readable[index];
  const cat = categoryById[book.category];
  const readHere = book.availability === "here";

  return (
    <section className="card-surface relative flex h-full flex-col gap-5 overflow-hidden p-5 sm:flex-row sm:gap-6" aria-labelledby="featured-title">
      {/* backdrop: the cover itself, blurred and dimmed, like a painting behind the desk */}
      {book.coverUrl && (
        <div className="pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(90deg,transparent_0%,black_60%)]" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={book.coverUrl} alt="" className="h-full w-full scale-125 object-cover blur-2xl saturate-50" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--surface-100)_30%,transparent_100%)]" aria-hidden="true" />

      <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-sm border border-gold/40 bg-surface-000/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold backdrop-blur"><Icon name="star" size={11} /> Featured book</span>

      <div className="relative mt-6 w-[128px] shrink-0 self-start sm:mt-8 sm:w-[150px]">
        <Link href={`/book/${book.slug}`} className="block transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1">
          <BookCover book={book} priority className="shadow-lift" />
        </Link>
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col gap-2 sm:pt-8">
        <h2 id="featured-title" className="font-display text-[30px] font-semibold leading-none text-ink sm:text-[34px]">
          <Link href={`/book/${book.slug}`} className="hover:text-gold-bright">{book.title}</Link>
        </h2>
        <p className="text-[13px] text-ink-muted">{book.author} · {formatYear(book.year)}</p>
        <p className="line-clamp-3 font-serif text-[15px] leading-relaxed text-ink">{book.blurb}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Link href={`/library/${cat.id}`} className="rounded-full border border-hairline-strong bg-surface-000/60 px-2.5 py-0.5 text-[11px] text-ink-muted transition-colors hover:border-gold hover:text-gold">{cat.short}</Link>
          <span className="rounded-full border border-hairline-strong bg-surface-000/60 px-2.5 py-0.5 text-[11px] text-ink-muted">{book.pages} pages</span>
          <span className="rounded-full border border-hairline-strong bg-surface-000/60 px-2.5 py-0.5 text-[11px] text-ink-muted">{readHere ? "Read here" : "Read elsewhere"}</span>
        </div>
        <div className="mt-auto pt-3">
          <Link href={readHere ? `/read/${book.slug}` : `/book/${book.slug}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-[13px] font-semibold text-on-accent transition-colors duration-200 hover:bg-gold-bright">
            {readHere ? "Start Reading" : "About this book"} <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
