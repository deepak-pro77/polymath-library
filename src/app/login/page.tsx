import type { Metadata } from "next";
import { LoginForm } from "@/components/me/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-8 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-3 text-center">
        <span className="eyebrow text-gold">Your account</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink">Sign in</h1>
        <p className="font-serif text-[16px] text-ink-muted">No password. We email you a link; opening it signs you in on this device.</p>
      </header>
      <LoginForm />
    </div>
  );
}
