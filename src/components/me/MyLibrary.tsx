"use client";

import Link from "next/link";
import { useState } from "react";
import { bookBySlug } from "@/data/books";
import { useShelf, type Status } from "@/lib/progress";
import { BookCard } from "@/components/books/BookCard";
import { ContinueReading } from "@/components/home/ContinueReading";
import { Icon } from "@/components/ui/Icon";

const tabs: { id: Status | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "reading", label: "Reading" },
  { id: "saved", label: "Saved for later" },
  { id: "completed", label: "Completed" },
];

export function MyLibrary() {
  const { shelf } = useShelf();
  const [tab, setTab] = useState<Status | "all">("all");
  const entries = Object.entries(shelf)
    .filter(([slug]) => bookBySlug[slug])
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt));
  const shown = tab === "all" ? entries : entries.filter(([, r]) => r.status === tab);
  const counts = (s: Status) => entries.filter(([, r]) => r.status === s).length;

  return (
    <div className="flex flex-col gap-10">
      <ContinueReading limit={4} />

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Shelves">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`h-10 rounded-full border px-4 text-[13px] transition-colors ${tab === t.id ? "border-gold bg-gold-tint text-gold" : "border-hairline-strong text-ink-muted hover:text-ink"}`}>
              {t.label} <span className="text-ink-subtle">{t.id === "all" ? entries.length : counts(t.id)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold-tint text-gold"><Icon name="bookmark" /></span>
            <p className="font-display text-[26px] text-ink">This shelf is empty.</p>
            <p className="font-serif text-[15px] text-ink-muted">Save any book with the bookmark on its cover.</p>
            <Link href="/library" className="mt-2 inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink hover:border-gold hover:text-gold">Explore the library <Icon name="arrow" size={15} /></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {shown.map(([slug]) => <BookCard key={slug} book={bookBySlug[slug]} />)}
          </div>
        )}
      </section>

      <section className="card-surface flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="eyebrow text-gold">Private shelf</p>
          <p className="mt-1 font-serif text-[15px] text-ink-muted">Books you own, uploaded to your account and read with the same reader.</p>
        </div>
        <Link href="/me/uploads" className="inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink hover:border-gold hover:text-gold">Your copies <Icon name="arrow" size={15} /></Link>
      </section>
    </div>
  );
}
