"use client";

import Link from "next/link";
import { useJourneyStats } from "@/components/home/JourneyCard";
import { Icon } from "@/components/ui/Icon";
import { books } from "@/data/books";

export function Journey() {
  const s = useJourneyStats();
  const n = s.byCategory.length;
  const R = 150, cx = 200, cy = 200;

  // Radar: one axis per field, radius = share of that field completed.
  const point = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const poly = s.byCategory.map((c, i) => point(i, (Math.max(c.pct, 2) / 100) * R).join(",")).join(" ");
  const unexplored = s.byCategory.filter((c) => c.done === 0 && c.inProgress === 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="card-surface flex flex-col items-center gap-4 p-6" aria-label="Knowledge map">
        <h2 className="self-start font-display text-[26px] font-medium text-ink">Knowledge map</h2>
        <svg viewBox="0 0 400 400" className="w-full max-w-[440px]" role="img" aria-label="Radar chart of books completed per field">
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon key={k} points={s.byCategory.map((_, i) => point(i, R * k).join(",")).join(" ")} fill="none" stroke="var(--hairline-strong)" strokeWidth="1" />
          ))}
          {s.byCategory.map((_, i) => {
            const [x, y] = point(i, R);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" />;
          })}
          <polygon points={poly} fill="var(--gold)" fillOpacity="0.22" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
          {s.byCategory.map((c, i) => {
            const [x, y] = point(i, (Math.max(c.pct, 2) / 100) * R);
            const [lx, ly] = point(i, R + 26);
            return (
              <g key={c.category.id}>
                <circle cx={x} cy={y} r={c.done ? 4 : 2.5} fill={c.done ? "var(--gold-bright)" : "var(--ink-subtle)"} />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={c.done || c.inProgress ? "var(--ink)" : "var(--ink-subtle)"} fontFamily="var(--font-sans)">{c.category.short}</text>
              </g>
            );
          })}
        </svg>
        <p className="text-[13px] text-ink-subtle">{s.completed} of {books.length} books · {s.fieldsTouched} of 12 fields touched</p>
      </section>

      <section className="card-surface flex flex-col gap-4 p-6" aria-label="Progress by field">
        <h2 className="font-display text-[26px] font-medium text-ink">By field</h2>
        <ul className="flex flex-col gap-4">
          {s.byCategory.map((c) => (
            <li key={c.category.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <Link href={`/library/${c.category.id}`} className="flex items-center gap-2 text-[14px] text-ink hover:text-gold">
                  <Icon name={c.category.icon} size={15} className="text-gold" /> {c.category.name}
                </Link>
                <span className="text-[13px] text-ink-muted">
                  <span className="font-display text-[18px] font-semibold text-ink">{c.done}</span> / {c.total}
                  {c.inProgress > 0 && <span className="ml-2 text-ink-subtle">· {c.inProgress} in progress</span>}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-300">
                <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${c.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {unexplored.length > 0 && (
          <div className="mt-2 rounded-md border border-dashed border-hairline-strong p-4">
            <p className="eyebrow mb-2 text-ink-subtle">Unexplored territory</p>
            <p className="font-serif text-[15px] text-ink-muted">
              You haven&rsquo;t opened a book in {unexplored.length === 12 ? "any field yet" : unexplored.map((c) => c.category.short).join(", ")}. A polymath goes there next.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
