"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const { user, ready, configured, signIn, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ sent?: boolean; error?: string; busy?: boolean }>({});

  useEffect(() => {
    // After the magic link lands here with a session, go to the library.
    if (ready && user && window.location.hash.includes("access_token")) router.replace("/me");
  }, [ready, user, router]);

  if (!configured) return <p className="card-surface p-6 font-serif text-[15px] text-ink-muted">Supabase isn&rsquo;t configured in <code>.env.local</code>, so sign-in is unavailable.</p>;
  if (!ready) return <div className="h-40 animate-pulse rounded-lg bg-surface-100" />;

  if (user) {
    return (
      <div className="card-surface flex flex-col items-center gap-4 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-gold-tint font-display text-[22px] font-semibold text-gold">{(user.email ?? "?")[0].toUpperCase()}</span>
        <p className="font-serif text-[16px] text-ink">Signed in as <span className="text-gold">{user.email}</span></p>
        <p className="text-[13px] text-ink-muted">Your progress, bookmarks and notes sync to this account.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push("/me")} className="h-10 rounded-md bg-gold px-4 text-[14px] font-medium text-on-accent hover:bg-gold-bright">My Library</button>
          <button type="button" onClick={() => signOut()} className="h-10 rounded-md border border-hairline-strong px-4 text-[14px] text-ink-muted hover:border-gold hover:text-gold">Sign out</button>
        </div>
      </div>
    );
  }

  if (state.sent) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-6 text-center">
        <Icon name="check" className="text-gold" size={28} />
        <p className="font-display text-[24px] text-ink">Check your inbox.</p>
        <p className="font-serif text-[15px] text-ink-muted">We sent a sign-in link to <span className="text-ink">{email}</span>. Open it on this device. It may take a minute; check spam if it doesn&rsquo;t arrive.</p>
      </div>
    );
  }

  return (
    <form
      className="card-surface flex flex-col gap-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ busy: true });
        const res = await signIn(email.trim());
        setState(res.error ? { error: res.error } : { sent: true });
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="eyebrow text-ink-subtle">Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
          className="h-12 rounded-md border border-hairline-strong bg-surface-000 px-4 text-[15px] text-ink outline-none transition-shadow focus:shadow-glow" />
      </label>
      {state.error && <p className="text-[13px] text-oxblood">{state.error}</p>}
      <button type="submit" disabled={state.busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold text-[15px] font-medium text-on-accent transition-colors hover:bg-gold-bright disabled:opacity-60">
        {state.busy ? "Sending…" : "Email me a sign-in link"} <Icon name="arrow" size={16} />
      </button>
    </form>
  );
}
