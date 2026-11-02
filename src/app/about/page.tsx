import type { Metadata } from "next";
import { books } from "@/data/books";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const here = books.filter((b) => b.availability === "here").length;
  const review = books.filter((b) => b.availability === "review").length;
  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">The idea</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">A library for polymaths</h1>
      </header>
      <div className="flex flex-col gap-5 font-serif text-[18px] leading-relaxed text-ink">
        <p>A polymath is someone whose knowledge spans many fields. The Polymath Library is a reading room built around that idea: one hundred carefully chosen books across twelve disciplines, and a journey that is measured not in books finished but in worlds visited.</p>
        <p>It began as a personal project — a place to read every day and watch understanding grow across history, philosophy, science, economics, literature and more. It is being built in the open, as part of a software portfolio, and will open to everyone once the foundations are solid.</p>
      </div>
      <section id="licences" className="card-surface flex flex-col gap-3 p-6">
        <h2 className="font-display text-[26px] font-medium text-ink">Sources &amp; licences</h2>
        <p className="font-serif text-[16px] leading-relaxed text-ink-muted">
          No copyrighted book is hosted without permission. {here} of the {books.length} titles are public domain in both the United States and Pakistan, with public-domain English texts from Project Gutenberg and Standard Ebooks, and are read here. {review} are public domain in some countries but not others and stay link-only until decided. Everything else is catalogued with links to Open Library, publishers and bookshops.
        </p>
      </section>
      <section id="contact" className="flex flex-col gap-2">
        <h2 className="font-display text-[26px] font-medium text-ink">Contact</h2>
        <p className="font-serif text-[16px] text-ink-muted">Built by Deepak at Lumora Labs. [CONTACT EMAIL]</p>
      </section>
    </div>
  );
}
