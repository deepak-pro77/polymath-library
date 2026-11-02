"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const overlay = pathname === "/";
  const { user, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (user?.email?.[0] ?? "D").toUpperCase();

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  useEffect(() => { setMenu(false); }, [pathname]);

  return (
    <header data-theme={overlay ? "dark" : undefined} className={overlay ? "absolute inset-x-0 top-0 z-30 text-ink" : "sticky top-0 z-30 border-b border-hairline bg-surface-000/85 backdrop-blur-md"}>
      <div className={`flex h-16 items-center gap-3 ${overlay ? "px-6 sm:px-8 lg:px-12" : "px-4 sm:px-6 lg:px-8"}`}>
        <button type="button" onClick={onMenu} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-muted hover:text-ink lg:hidden" aria-label="Open menu">
          <Icon name="menu" />
        </button>

        <form
          role="search"
          className={`flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border px-4 transition-shadow duration-200 focus-within:shadow-glow sm:max-w-xl ${overlay ? "border-gold/40 bg-surface-000/60 backdrop-blur" : "border-hairline-strong bg-surface-100"}`}
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/library?q=${encodeURIComponent(q.trim())}` : "/library");
          }}
        >
          <Icon name="search" size={17} className="shrink-0 text-ink-subtle" />
          <label htmlFor="site-search" className="sr-only">Search for books, authors or topics</label>
          <input
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for books, authors or topics…"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-subtle"
            autoComplete="off"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="hidden h-11 w-11 items-center justify-center rounded-full border border-hairline-strong text-ink-muted transition-colors duration-200 hover:border-gold hover:text-gold sm:flex">
            <Icon name="bell" size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to the ivory theme" : "Switch to the dark theme"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong text-ink-muted transition-colors duration-200 hover:border-gold hover:text-gold"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label="Account"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-gold-tint font-display text-[19px] font-semibold text-gold transition-colors duration-200 hover:border-gold"
            >
              {initial}
            </button>
            {menu && (
              <div role="menu" data-theme={undefined} className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 overflow-hidden rounded-lg border border-hairline-strong bg-surface-100 py-1.5 text-ink shadow-glow">
                <p className="truncate px-4 py-2 text-[12px] text-ink-subtle">{user ? user.email : "Not signed in · reading on this device"}</p>
                <MenuLink href="/me">My Library</MenuLink>
                <MenuLink href="/me/uploads">Your copies</MenuLink>
                <MenuLink href="/me/notes">Notes & highlights</MenuLink>
                <MenuLink href="/me/settings">Settings</MenuLink>
                <div className="my-1 border-t border-hairline" />
                {user ? (
                  <button type="button" role="menuitem" onClick={() => { setMenu(false); signOut(); }} className="block w-full px-4 py-2 text-left text-[14px] text-ink-muted hover:bg-surface-200 hover:text-gold">Sign out</button>
                ) : (
                  <MenuLink href="/login">Sign in</MenuLink>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} role="menuitem" className="block px-4 py-2 text-[14px] text-ink hover:bg-surface-200 hover:text-gold">{children}</Link>;
}
