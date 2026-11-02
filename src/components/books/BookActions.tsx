"use client";

import Link from "next/link";
import { bookBySlug, externalLinks } from "@/data/books";
import { useShelf, percent } from "@/lib/progress";
import { Icon } from "@/components/ui/Icon";

export function BookActions({ slug }: { slug: string }) {
  const book = bookBySlug[slug];
  const { shelf, save, remove, complete } = useShelf();
  const rec = shelf[slug];
  const pct = rec ? percent(slug, rec.page) : 0;
  const primaryExternal = externalLinks(book)[0];

  return (
    <div className="flex flex-col gap-4">
      {rec && rec.status === "reading" && (
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-300"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
          <span className="text-[13px] text-ink-muted">Page {rec.page} of {book.pages} · {pct}%</span>
        </div>
      )}
      {rec && rec.status === "completed" && (
        <p className="flex items-center gap-2 text-[14px] text-gold"><Icon name="check" size={16} /> Completed{rec.finishedAt ? ` on ${new Date(rec.finishedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}` : ""}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {book.availability === "here" ? (
          <Link href={`/read/${slug}`} className="inline-flex h-12 items-center gap-2 rounded-md bg-gold px-6 text-[15px] font-medium text-on-accent transition-colors hover:bg-gold-bright">
            {rec?.status === "reading" ? "Continue reading" : rec?.status === "completed" ? "Read again" : "Start reading"} <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <a href={primaryExternal.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-md bg-gold px-6 text-[15px] font-medium text-on-accent transition-colors hover:bg-gold-bright">
            Read elsewhere <Icon name="external" size={16} />
          </a>
        )}

        <button type="button" onClick={() => (rec ? remove(slug) : save(slug))} aria-pressed={Boolean(rec)}
          className={`inline-flex h-12 items-center gap-2 rounded-md border px-5 text-[15px] font-medium transition-colors ${rec ? "border-gold text-gold" : "border-hairline-strong text-ink hover:border-gold hover:text-gold"}`}>
          <Icon name="bookmark" size={16} /> {rec ? "In my library" : "Save to my library"}
        </button>

        {rec?.status !== "completed" && (
          <button type="button" onClick={() => complete(slug)} className="inline-flex h-12 items-center gap-2 rounded-md px-3 text-[14px] text-ink-muted transition-colors hover:text-gold">
            <Icon name="check" size={16} /> Mark as completed
          </button>
        )}
      </div>
    </div>
  );
}
