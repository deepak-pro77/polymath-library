import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { books } from "@/data/books";

export const metadata: Metadata = { title: "Explore the Library" };

export default function LibraryPage() {
  const readable = books.filter((b) => b.availability === "here").length;
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">The collection</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">Explore the Library</h1>
        <p className="max-w-[60ch] font-serif text-[17px] leading-relaxed text-ink-muted">
          One hundred books across twelve fields. {readable} are readable here; the rest link to where you can read or buy them legitimately.
        </p>
      </header>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-surface-100" />}>
        <LibraryBrowser />
      </Suspense>
    </div>
  );
}
