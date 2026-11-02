import type { Metadata } from "next";
import { MyLibrary } from "@/components/me/MyLibrary";

export const metadata: Metadata = { title: "My Library" };

export default function MePage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">Your shelves</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">My Library</h1>
        <p className="max-w-[60ch] font-serif text-[17px] text-ink-muted">Saved, in progress and completed. Stored in this browser for now; your account arrives with Phase 5.</p>
      </header>
      <MyLibrary />
    </div>
  );
}
