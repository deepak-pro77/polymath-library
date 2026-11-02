import { Logo } from "./Logo";

export function Wordmark({ stacked = false }: { stacked?: boolean }) {
  if (stacked) {
    return (
      <span className="flex flex-col items-start gap-3">
        <Logo size={48} className="text-gold" />
        <span className="font-brand text-[17px] font-semibold uppercase leading-[1.2] tracking-[0.12em] gold-text">
          The
          <br />
          Polymath
          <br />
          Library
        </span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-3">
      <Logo size={30} className="text-gold" />
      <span className="font-brand text-[15px] font-semibold uppercase tracking-[0.14em] text-ink">The Polymath Library</span>
    </span>
  );
}
