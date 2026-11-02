import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-surface-100">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-4 py-6 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Wordmark />
            <span className="hidden text-ink-subtle sm:inline">·</span>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted" aria-label="Footer">
              <Link href="/library" className="hover:text-gold">Explore</Link>
              <Link href="/me" className="hover:text-gold">My Library</Link>
              <Link href="/me/journey" className="hover:text-gold">Journey</Link>
              <Link href="/about" className="hover:text-gold">About</Link>
              <Link href="/about#licences" className="hover:text-gold">Sources &amp; licences</Link>
            </nav>
          </div>
          <p className="ornament flex-1 px-6 font-display text-[16px] italic text-ink-muted"><span className="px-3">&ldquo;Knowledge is the key to a greater life.&rdquo;</span></p>
          <div className="flex items-center gap-2">
            {site.social.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong text-ink-muted transition-colors hover:border-gold hover:text-gold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={s.icon} /></svg>
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-[12px] text-ink-subtle">
          <span>© 2026 The Polymath Library · Built by {site.author}</span>
          <span>No copyrighted book is hosted without permission.</span>
        </div>
      </div>
    </footer>
  );
}
