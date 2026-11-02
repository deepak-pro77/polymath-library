import Link from "next/link";
import type { Category } from "@/data/categories";
import { Icon } from "@/components/ui/Icon";

export function CategoryTile({ category, count, compact = false }: { category: Category; count: number; compact?: boolean }) {
  return (
    <Link
      href={`/library/${category.id}`}
      title={`${count} ${count === 1 ? "book" : "books"}`}
      className={`group flex flex-col items-center justify-center gap-2 rounded-md border border-hairline bg-surface-200/50 text-center transition-all duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-gold/60 hover:bg-surface-200 hover:shadow-glow ${compact ? "min-h-[96px] px-2 py-3" : "min-h-[136px] px-4 py-5"}`}
    >
      <Icon name={category.icon} size={compact ? 26 : 30} className="text-gold transition-transform duration-300 group-hover:scale-110" strokeWidth={1.4} />
      <span className={`font-serif leading-snug text-ink ${compact ? "text-[12.5px]" : "text-[14px]"}`}>{category.name}</span>
      {!compact && <span className="eyebrow text-ink-subtle" style={{ fontSize: 10 }}>{count} {count === 1 ? "book" : "books"}</span>}
    </Link>
  );
}
