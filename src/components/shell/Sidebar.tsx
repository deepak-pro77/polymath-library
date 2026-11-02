"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Wordmark } from "@/components/ui/Wordmark";

const nav: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/", label: "Home", icon: "home", exact: true },
  { href: "/library", label: "Explore Library", icon: "library" },
  { href: "/me", label: "My Library", icon: "bookmark", exact: true },
  { href: "/me/journey", label: "My Journey", icon: "journey" },
  { href: "/me/notes", label: "Notes & Highlights", icon: "notes" },
  { href: "/me/uploads", label: "Your Copies", icon: "book" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Scrim on mobile */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-hairline bg-surface-100 transition-transform duration-300 ease-[var(--ease-out-soft)] lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0 lg:border-r-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-5">
          <Link href="/" className="block">
            <Wordmark stacked />
          </Link>
          <button type="button" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:text-ink lg:hidden" aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3" aria-label="Primary">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-11 items-center gap-3 rounded-md px-3 text-[15px] transition-colors duration-200 ${
                  active ? "bg-gold-tint text-ink" : "text-ink-muted hover:bg-surface-200 hover:text-ink"
                }`}
              >
                <span className={`absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full bg-gold transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`} />
                <Icon name={item.icon} size={18} className={active ? "text-gold" : "text-gold/70 transition-colors group-hover:text-gold"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-8">
          <div className="ornament mb-5 text-[10px]">◆</div>
          <p className="text-center font-display text-[19px] italic leading-snug text-ink-muted">
            &ldquo;A mind that explores never stops growing.&rdquo;
          </p>
          <div className="ornament mt-5 text-[10px]">◆</div>
          <p className="eyebrow mt-5 text-center text-ink-subtle" style={{ fontSize: 10 }}>100 books · 12 fields</p>
        </div>
      </aside>
    </>
  );
}
