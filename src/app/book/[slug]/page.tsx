import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookBySlug, books, booksInCategory, externalLinks } from "@/data/books";
import { categoryById } from "@/data/categories";
import { BookCover } from "@/components/books/BookCover";
import { BookCard, AvailabilityBadge } from "@/components/books/BookCard";
import { BookActions } from "@/components/books/BookActions";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatYear } from "@/lib/format";

// Catalogue pages read their slug directly; a blocking route is fine here (silences the dev-mode instant-navigation notice).
export const instant = false;

export function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/book/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = bookBySlug[slug];
  return b ? { title: `${b.title} — ${b.author}`, description: b.blurb } : { title: "Book" };
}

export default async function BookPage({ params }: PageProps<"/book/[slug]">) {
  const { slug } = await params;
  const book = bookBySlug[slug];
  if (!book) notFound();
  const cat = categoryById[book.category];
  const related = booksInCategory(book.category).filter((b) => b.slug !== book.slug).slice(0, 6);
  const links = externalLinks(book);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-14 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-2 text-[13px] text-ink-subtle" aria-label="Breadcrumb">
        <Link href="/library" className="hover:text-gold">Library</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/library/${cat.id}`} className="hover:text-gold">{cat.short}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
        <div className="mx-auto w-[220px] lg:mx-0 lg:w-full">
          <BookCover book={book} priority className="shadow-lift" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="eyebrow text-gold">{cat.name}</span>
            <h1 className="font-display text-[40px] font-semibold leading-[1.02] text-ink sm:text-[56px]">{book.title}</h1>
            <p className="font-serif text-[18px] text-ink-muted">{book.author}</p>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-y border-hairline py-4 text-[14px]">
            <Meta label="Published" value={formatYear(book.year)} />
            <Meta label="Length" value={`${book.pages.toLocaleString()} pages`} />
            <Meta label="Availability" value={<AvailabilityBadge a={book.availability} />} />
          </dl>

          <p className="max-w-[62ch] font-serif text-[18px] leading-relaxed text-ink">{book.blurb}</p>

          <BookActions slug={book.slug} />

          <div className="card-surface flex flex-col gap-3 p-5">
            <span className="eyebrow text-ink-subtle">Licence &amp; sources</span>
            <p className="font-serif text-[15px] text-ink-muted">{book.licence}.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-hairline-strong px-3 text-[13px] text-ink-muted transition-colors hover:border-gold hover:text-gold">
                  {l.label} <Icon name="external" size={13} />
                </a>
              ))}
            </div>
            {book.availability === "review" && (
              <p className="text-[13px] text-ink-subtle">This title is public domain in some countries but not others. It stays link-only until the collection policy decides.</p>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-5" aria-labelledby="related-title">
          <SectionHeader id="related-title" eyebrow="Same field" title={`More in ${cat.short}`} href={`/library/${cat.id}`} />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((b) => <BookCard key={b.slug} book={b} showCategory={false} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
