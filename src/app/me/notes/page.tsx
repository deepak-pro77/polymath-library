import type { Metadata } from "next";
import { NotesList } from "@/components/me/NotesList";

export const metadata: Metadata = { title: "Notes & Highlights" };

export default function NotesPage() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">Marginalia</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">Notes &amp; Highlights</h1>
        <p className="max-w-[60ch] font-serif text-[17px] text-ink-muted">Every passage you marked, book by book.</p>
      </header>
      <NotesList />
    </div>
  );
}
