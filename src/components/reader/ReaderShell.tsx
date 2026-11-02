"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookBySlug } from "@/data/books";
import { useShelf, percent } from "@/lib/progress";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/Icon";

/**
 * Reader shell — the frame the EPUB/PDF engine (Phase 4) renders into.
 * Everything around the page is already real: progress, last position, font size,
 * theme and keyboard navigation. The text area shows a placeholder until the book file exists.
 */
export function ReaderShell({ slug }: { slug: string }) {
  const book = bookBySlug[slug];
  const { shelf, setPage } = useShelf();
  const { theme, toggle } = useTheme();
  const rec = shelf[slug];
  const page = rec?.page && rec.status !== "completed" ? rec.page : rec?.status === "completed" ? book.pages : 0;
  const pct = percent(slug, page);
  const [fontSize, setFontSize] = useState(19);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("polymath:reader:font"));
      if (saved >= 15 && saved <= 26) setFontSize(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("polymath:reader:font", String(fontSize)); } catch {}
  }, [fontSize]);

  // Opening a book for the first time marks it as "reading" at page 1.
  useEffect(() => {
    if (!rec || (rec.status === "saved" && rec.page === 0)) setPage(slug, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage(slug, page + 1);
      if (e.key === "ArrowLeft") setPage(slug, page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, slug, setPage]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="sticky top-16 z-20 flex items-center gap-3 border-b border-hairline bg-surface-000/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href={`/book/${slug}`} className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-gold" aria-label="Back to book"><Icon name="arrow" className="rotate-180" size={18} /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[18px] font-semibold leading-tight text-ink">{book.title}</p>
          <p className="truncate text-[12px] text-ink-subtle">{book.author} · Page {page} of {book.pages} · {pct}%</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setFontSize((f) => Math.max(15, f - 1))} className="h-10 w-10 rounded-md text-[13px] text-ink-muted hover:text-gold" aria-label="Smaller text">A−</button>
          <button type="button" onClick={() => setFontSize((f) => Math.min(26, f + 1))} className="h-10 w-10 rounded-md text-[17px] text-ink-muted hover:text-gold" aria-label="Larger text">A+</button>
          <button type="button" onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:text-gold" aria-label="Toggle reading theme"><Icon name={theme === "dark" ? "sun" : "moon"} size={17} /></button>
        </div>
      </div>
      <div className="h-[2px] bg-surface-200"><div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>

      <article className="mx-auto w-full max-w-[68ch] flex-1 px-6 py-12 font-serif text-ink" style={{ fontSize, lineHeight: 1.65 }}>
        <p className="eyebrow mb-6 text-gold">Reader scaffold</p>
        <p className="mb-4">
          This is the frame the book will be read in. The text engine arrives in Phase 4: EPUBs from Standard Ebooks and Project Gutenberg, rendered with reflowable text, and PDFs where that is all that exists.
        </p>
        <p className="mb-4">
          Everything around the text already works — your position is saved as you turn pages, the progress bar and your journey update, and font size and theme persist. Use the arrow keys or the buttons below to turn pages.
        </p>
        <p className="text-ink-muted">Licence: {book.licence}.</p>
      </article>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-hairline bg-surface-000/90 px-4 py-3 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setPage(slug, page - 1)} disabled={page <= 1} className="inline-flex h-11 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink disabled:opacity-40 hover:border-gold hover:text-gold">
          <Icon name="arrow" className="rotate-180" size={15} /> Previous
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-3 text-[12px] text-ink-subtle">
          <span className="sr-only">Go to page</span>
          <input type="range" min={1} max={book.pages} value={Math.max(1, page)} onChange={(e) => setPage(slug, Number(e.target.value))} className="w-full accent-[var(--gold)]" aria-valuetext={`Page ${page}`} />
        </label>
        <button type="button" onClick={() => setPage(slug, page + 1)} disabled={page >= book.pages} className="inline-flex h-11 items-center gap-2 rounded-md bg-gold px-4 text-[14px] font-medium text-on-accent disabled:opacity-40 hover:bg-gold-bright">
          Next <Icon name="arrow" size={15} />
        </button>
      </div>
    </div>
  );
}
