"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useShelf } from "@/lib/progress";
import { Icon } from "@/components/ui/Icon";

export function Settings() {
  const { theme, toggle } = useTheme();
  const { user, configured, signOut } = useAuth();
  const { shelf, remove } = useShelf();
  const [confirm, setConfirm] = useState(false);
  const count = Object.keys(shelf).length;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(shelf, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "polymath-library-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-5">
      <Row title="Appearance" desc="The library is dark by design. The ivory theme is for daylight reading.">
        <button type="button" onClick={toggle} className="inline-flex h-11 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink hover:border-gold hover:text-gold">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} /> Switch to {theme === "dark" ? "ivory" : "dark"}
        </button>
      </Row>
      <Row title="Your data" desc={`${count} ${count === 1 ? "book" : "books"} on your shelves, stored in this browser. Export a copy any time.`}>
        <button type="button" onClick={exportJson} disabled={count === 0} className="inline-flex h-11 items-center gap-2 rounded-md border border-hairline-strong px-4 text-[14px] text-ink disabled:opacity-40 hover:border-gold hover:text-gold">Export progress</button>
      </Row>
      <Row title="Start over" desc="Clears every saved book and all reading progress from this browser.">
        {confirm ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { Object.keys(shelf).forEach(remove); setConfirm(false); }} className="h-11 rounded-md bg-oxblood px-4 text-[14px] font-medium text-white">Yes, clear everything</button>
            <button type="button" onClick={() => setConfirm(false)} className="h-11 rounded-md px-3 text-[14px] text-ink-muted hover:text-ink">Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} disabled={count === 0} className="inline-flex h-11 items-center rounded-md border border-hairline-strong px-4 text-[14px] text-ink-muted disabled:opacity-40 hover:border-oxblood hover:text-ink">Clear my shelves</button>
        )}
      </Row>
      <Row title="Account" desc={user ? `Signed in as ${user.email}. Progress, bookmarks and highlights sync to this account on every device you sign in on.` : configured ? "Sign in with a magic link to sync progress, bookmarks and highlights across devices and keep your own copies." : "Accounts need Supabase configured (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local)."}>
        {user ? (
          <button type="button" onClick={signOut} className="inline-flex h-10 items-center rounded-md border border-hairline-strong px-4 text-[13px] text-ink hover:border-gold hover:text-gold">Sign out</button>
        ) : (
          <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-gold px-4 text-[13px] font-medium text-on-accent hover:bg-gold-bright">Sign in</Link>
        )}
      </Row>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] font-medium text-ink">{title}</h2>
        <p className="max-w-[52ch] font-serif text-[15px] text-ink-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
