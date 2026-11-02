import Link from "next/link";
import { Icon } from "./Icon";

export function SectionHeader({ id, eyebrow, title, href, linkLabel, lede, size = "md" }: { id?: string; eyebrow?: string; title: string; href?: string; linkLabel?: string; lede?: string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-[32px] sm:text-[40px]" : size === "sm" ? "text-[22px]" : "text-[26px] sm:text-[30px]";
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex flex-col gap-1">
        {eyebrow && <span className="eyebrow text-gold">{eyebrow}</span>}
        <h2 id={id} className={`font-display font-semibold leading-none text-ink ${cls}`}>{title}</h2>
        {lede && <p className="mt-1 max-w-[60ch] font-serif text-[15px] text-ink-muted">{lede}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-gold">
          {linkLabel ?? "View All"} <Icon name="arrow" size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
