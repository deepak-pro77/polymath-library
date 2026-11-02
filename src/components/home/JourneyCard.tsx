"use client";

import Link from "next/link";
import { books, bookBySlug } from "@/data/books";
import { categories } from "@/data/categories";
import { useEffect, useState } from "react";
import { useShelf } from "@/lib/progress";

/** The current time, known only after mount (keeps prerendering deterministic). */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  return now;
}
import { Icon } from "@/components/ui/Icon";

export function useJourneyStats() {
  const { shelf } = useShelf();
  const now = useNow();
  const entries = Object.entries(shelf);
  const completed = entries.filter(([, r]) => r.status === "completed");
  const reading = entries.filter(([, r]) => r.status === "reading");
  const pagesRead = entries.reduce((n, [, r]) => n + r.page, 0);
  const overall = Math.round((completed.length / books.length) * 100);
  const thisMonth = now ? completed.filter(([, r]) => r.finishedAt && new Date(r.finishedAt).getMonth() === now.getMonth() && new Date(r.finishedAt).getFullYear() === now.getFullYear()).length : 0;
  const byCategory = categories.map((c) => {
    const total = books.filter((b) => b.category === c.id).length;
    const done = completed.filter(([slug]) => bookBySlug[slug]?.category === c.id).length;
    const inProgress = reading.filter(([slug]) => bookBySlug[slug]?.category === c.id).length;
    return { category: c, total, done, inProgress, pct: total ? Math.round((done / total) * 100) : 0 };
  });
  const fieldsTouched = byCategory.filter((c) => c.done > 0 || c.inProgress > 0).length;
  const hours = Math.round((pagesRead * 1.6) / 60); // ~1.6 minutes per catalogue page
  // Activity over the last 7 days: one unit per book touched that day.
  const days = Array.from({ length: 7 }, (_, i) => {
    if (!now) return { label: "", count: 0 };
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return { label: d.toLocaleDateString(undefined, { weekday: "narrow" }), count: entries.filter(([, r]) => new Date(r.updatedAt).toDateString() === key).length };
  });
  return { completed: completed.length, reading: reading.length, pagesRead, overall, thisMonth, byCategory, fieldsTouched, hours, days };
}

export function JourneyCard() {
  const s = useJourneyStats();
  const r = 42;
  const circ = 2 * Math.PI * r;
  const max = Math.max(1, ...s.days.map((d) => d.count));

  return (
    <section className="card-surface flex h-full flex-col gap-4 p-5" aria-labelledby="journey-title">
      <div className="flex items-center justify-between">
        <h2 id="journey-title" className="font-display text-[22px] font-semibold text-ink">Your Reading Journey</h2>
        <Link href="/me/journey" className="text-ink-subtle transition-colors hover:text-gold" aria-label="Open my journey"><Icon name="arrow" size={16} /></Link>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-300)" strokeWidth="5" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - s.overall / 100)} className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-soft)]" style={{ filter: "drop-shadow(0 0 6px rgba(212,184,114,.45))" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[30px] font-semibold leading-none text-ink">{s.overall}%</span>
            <span className="mt-1 text-[11px] text-ink-subtle">Overall</span>
          </div>
        </div>
      </div>

      <dl className="flex flex-col gap-2.5">
        <Stat icon="book" label="Books" value={`${s.completed} / ${books.length}`} />
        <Stat icon="clock" label="Hours read" value={String(s.hours)} />
        <Stat icon="star" label="This month" value={String(s.thisMonth)} />
      </dl>

      <div className="mt-auto">
        <div className="flex h-12 items-end gap-1.5" aria-label="Activity, last 7 days">
          {s.days.map((d, i) => (
            <span key={i} title={`${d.count} ${d.count === 1 ? "book" : "books"}`} className="flex-1 rounded-t-sm bg-gold transition-[height] duration-500" style={{ height: `${Math.max(12, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }} />
          ))}
        </div>
        <div className="mt-1 flex gap-1.5">
          {s.days.map((d, i) => <span key={i} className="flex-1 text-center text-[9px] uppercase text-ink-subtle">{d.label}</span>)}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: "book" | "clock" | "star"; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={15} className="text-gold" />
      <dt className="flex-1 text-[13px] text-ink-muted">{label}</dt>
      <dd className="font-display text-[17px] font-semibold text-ink">{value}</dd>
    </div>
  );
}
