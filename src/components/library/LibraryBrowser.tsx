"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo } from "react";
import { books, type Availability, type Book } from "@/data/books";
import { categories, type CategoryId } from "@/data/categories";
import { BookCard } from "@/components/books/BookCard";
import { Icon } from "@/components/ui/Icon";

type Sort = "title" | "author" | "year" | "added" | "pages";

const sorts: { id: Sort; label: string }[] = [
  { id: "title", label: "Title A–Z" },
  { id: "author", label: "Author A–Z" },
  { id: "year", label: "Oldest first" },
  { id: "added", label: "Recently added" },
  { id: "pages", label: "Shortest first" },
];

const availabilities: { id: Availability | "all"; label: string }[] = [
  { id: "all", label: "All books" },
  { id: "here", label: "Read here" },
  { id: "elsewhere", label: "Read elsewhere" },
];

function normalise(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function LibraryBrowser({ lockedCategory }: { lockedCategory?: CategoryId }) {
  const params = useSearchParams();
  const router = useRouter();

  const q = params.get("q") ?? "";
  const dq = useDeferredValue(q);
  const cat = (lockedCategory ?? params.get("category") ?? "all") as CategoryId | "all";
  const availability = (params.get("availability") ?? "all") as Availability | "all";
  const sort = (params.get("sort") ?? "title") as Sort;

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || (key === "sort" && value === "title")) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const results = useMemo(() => {
    const needle = normalise(dq.trim());
    let list: Book[] = books;
    if (cat !== "all") list = list.filter((b) => b.category === cat);
    if (availability !== "all") list = list.filter((b) => (availability === "here" ? b.availability === "here" : b.availability !== "here"));
    if (needle) {
      list = list.filter((b) => {
        const hay = normalise(`${b.title} ${b.author} ${b.blurb}`);
        return needle.split(/\s+/).every((w) => hay.includes(w));
      });
    }
    const by: Record<Sort, (a: Book, b: Book) => number> = {
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => a.author.split(" ").pop()!.localeCompare(b.author.split(" ").pop()!),
      year: (a, b) => a.year - b.year,
      added: (a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title),
      pages: (a, b) => a.pages - b.pages,
    };
    return [...list].sort(by[sort] ?? by.title);
  }, [dq, cat, availability, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-hairline-strong bg-surface-000 px-4 transition-shadow focus-within:shadow-glow sm:max-w-md">
            <Icon name="search" size={17} className="shrink-0 text-ink-subtle" />
            <span className="sr-only">Search</span>
            <input type="search" value={q} onChange={(e) => set("q", e.target.value)} placeholder="Title, author or topic" className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-subtle" />
          </label>

          <div className="flex h-11 items-center gap-2 rounded-md border border-hairline-strong bg-surface-000 px-3">
            <label htmlFor="sort" className="text-[12px] text-ink-subtle">Sort</label>
            <select id="sort" value={sort} onChange={(e) => set("sort", e.target.value)} className="bg-transparent text-[14px] text-ink outline-none">
              {sorts.map((s) => <option key={s.id} value={s.id} className="bg-surface-100 text-ink">{s.label}</option>)}
            </select>
          </div>

          <div className="flex overflow-hidden rounded-md border border-hairline-strong" role="group" aria-label="Availability">
            {availabilities.map((a) => (
              <button key={a.id} type="button" onClick={() => set("availability", a.id)} aria-pressed={availability === a.id}
                className={`h-11 px-3 text-[13px] transition-colors ${availability === a.id ? "bg-gold-tint text-gold" : "text-ink-muted hover:text-ink"}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {!lockedCategory && (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            <Chip active={cat === "all"} onClick={() => set("category", "all")}>All fields</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => set("category", c.id)}>{c.short}</Chip>
            ))}
          </div>
        )}
      </div>

      <p className="text-[13px] text-ink-subtle" aria-live="polite">
        {results.length} {results.length === 1 ? "book" : "books"}{dq.trim() ? ` for “${dq.trim()}”` : ""}
      </p>

      {results.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-[26px] text-ink">Nothing on this shelf.</p>
          <p className="font-serif text-[15px] text-ink-muted">Try another spelling, or clear the filters.</p>
          <button type="button" onClick={() => router.replace("?", { scroll: false })} className="mt-2 h-10 rounded-md border border-hairline-strong px-4 text-[14px] text-ink hover:border-gold hover:text-gold">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {results.map((b) => <BookCard key={b.slug} book={b} showCategory={!lockedCategory} />)}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`h-9 shrink-0 rounded-full border px-4 text-[13px] transition-colors duration-200 ${active ? "border-gold bg-gold-tint text-gold" : "border-hairline-strong text-ink-muted hover:border-gold hover:text-ink"}`}>
      {children}
    </button>
  );
}
