import type { Metadata } from "next";
import { Journey } from "@/components/me/Journey";

export const metadata: Metadata = { title: "My Intellectual Journey" };

export default function JourneyPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">Across disciplines</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">My Intellectual Journey</h1>
        <p className="max-w-[60ch] font-serif text-[17px] text-ink-muted">Not how many books — how many worlds. Where your mind has travelled, and where it has never been.</p>
      </header>
      <Journey />
    </div>
  );
}
