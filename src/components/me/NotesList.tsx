"use client";

import Link from "next/link";
import { bookBySlug } from "@/data/books";
import { useAnnotations } from "@/lib/annotations";
import { Icon } from "@/components/ui/Icon";

const COLORS = { gold: "rgba(212,184,114,.42)", sage: "rgba(107,140,118,.45)", oxblood: "rgba(139,58,58,.45)" };

export function NotesList() {
  const { store } = useAnnotations();
  const books = Object.entries(store)
    .filter(([slug, a]) => bookBySlug[slug] && (a.highlights.length || a.bookmarks.length))
    .sort((a, b) => {
      const la = [...a[1].highlights, ...a[1].bookmarks].map((x) => x.createdAt).sort().pop() ?? "";
      const lb = [...b[1].highlights, ...b[1].bookmarks].map((x) => x.createdAt).sort().pop() ?? "";
      return lb.localeCompare(la);
    });
  const total = books.reduce((n, [, a]) => n + a.highlights.length, 0);

  if (books.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold-tint text-gold"><Icon name="notes" /></span>
        <p className="font-display text-[26px] text-ink">No notes yet.</p>
        <p className="max-w-[44ch] font-serif text-[15px] text-ink-muted">While reading, select any passage to highlight it in gold, sage or oxblood, or add a note. Everything lands here.</p>
        <Link href="/library?availability=here" className="mt-2 inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink hover:border-gold hover:text-gold">Find something to read <Icon name="arrow" size={15} /></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-[13px] text-ink-subtle">{total} {total === 1 ? "highlight" : "highlights"} across {books.length} {books.length === 1 ? "book" : "books"}</p>
      {books.map(([slug, a]) => {
        const book = bookBySlug[slug];
        return (
          <section key={slug} className="card-surface flex flex-col gap-4 p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[26px] font-semibold leading-tight text-ink"><Link href={`/book/${slug}`} className="hover:text-gold">{book.title}</Link></h2>
                <p className="text-[13px] text-ink-muted">{book.author} · {a.highlights.length} highlights · {a.bookmarks.length} bookmarks</p>
              </div>
              <Link href={`/read/${slug}`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[13px] text-ink hover:border-gold hover:text-gold">Open <Icon name="arrow" size={13} /></Link>
            </div>
            <ul className="flex flex-col divide-y divide-hairline">
              {[...a.highlights].sort((x, y) => x.createdAt.localeCompare(y.createdAt)).map((h) => (
                <li key={h.id} className="py-4 first:pt-0 last:pb-0">
                  {h.chapter && <p className="eyebrow mb-1.5 text-ink-subtle" style={{ fontSize: 10 }}>{h.chapter}</p>}
                  <p className="font-serif text-[16px] leading-relaxed text-ink"><span style={{ boxShadow: `inset 0 -0.45em 0 ${COLORS[h.color]}` }}>{h.text}</span></p>
                  {h.note && <p className="mt-2 border-l-2 border-gold pl-3 font-serif text-[14px] text-ink-muted">{h.note}</p>}
                  <p className="mt-2 text-[11px] text-ink-subtle">{new Date(h.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
