import Link from "next/link";
import { books, booksInCategory } from "@/data/books";
import { categories } from "@/data/categories";
import { Hero } from "@/components/home/Hero";
import { FeaturedBook } from "@/components/home/FeaturedBook";
import { JourneyCard } from "@/components/home/JourneyCard";
import { CategoryTile } from "@/components/home/CategoryTile";
import { ContinueReading } from "@/components/home/ContinueReading";
import { BookCard } from "@/components/books/BookCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

// Editor's picks until there are readers to rank by.
const popularSlugs = ["meditations", "the-origin-of-species", "the-wealth-of-nations", "the-prince", "pride-and-prejudice", "crime-and-punishment"];
const popular = popularSlugs.map((s) => books.find((b) => b.slug === s)!).filter(Boolean);
const recent = [...books].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title)).slice(0, 6);

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-4 pb-8 pt-3 sm:px-5 lg:px-6">
      <Hero />

      {/* Row 1: featured · categories · journey */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)_280px]">
        <FeaturedBook />
        <section className="card-surface flex flex-col gap-3 p-5" aria-labelledby="categories-title" id="categories">
          <SectionHeader id="categories-title" title="Explore by Category" href="/library" size="sm" />
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
            {categories.map((c) => <CategoryTile key={c.id} category={c} count={booksInCategory(c.id).length} compact />)}
          </div>
        </section>
        <JourneyCard />
      </div>

      {/* Row 2: popular · continue reading */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <section className="flex flex-col gap-3" aria-labelledby="popular-title">
          <SectionHeader id="popular-title" title="Popular Books" href="/library?availability=here" size="sm" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {popular.map((b) => <BookCard key={b.slug} book={b} showCategory={false} />)}
          </div>
        </section>
        <ContinueReading />
      </div>

      {/* Row 3: recently added */}
      <section className="flex flex-col gap-3" aria-labelledby="recent-title">
        <SectionHeader id="recent-title" title="Recently Added" href="/library?sort=added" size="sm" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 xl:grid-cols-12">
          {recent.map((b) => <BookCard key={b.slug} book={b} />)}
          {[...books].sort((a, b) => a.title.localeCompare(b.title)).filter((b) => !recent.includes(b)).slice(0, 6).map((b) => <BookCard key={b.slug} book={b} />)}
        </div>
      </section>

      <section className="card-surface relative overflow-hidden px-6 py-8 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(212,184,114,0.14),transparent_60%)]" aria-hidden="true" />
        <p className="eyebrow text-gold">My Intellectual Journey</p>
        <h2 className="mx-auto mt-2 max-w-[24ch] font-display text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">Not how many books. How many worlds.</h2>
        <p className="mx-auto mt-2 max-w-[58ch] font-serif text-[15px] leading-relaxed text-ink-muted">Your journey is drawn across twelve disciplines, so you can see where your mind has travelled and where it has never been.</p>
        <Link href="/me/journey" className="mt-5 inline-flex h-10 items-center rounded-md border border-gold/40 px-5 text-[13px] font-medium text-ink transition-colors hover:border-gold hover:text-gold">Open my journey</Link>
      </section>
    </div>
  );
}
