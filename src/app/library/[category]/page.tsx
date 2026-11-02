import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { Icon } from "@/components/ui/Icon";
import { booksInCategory } from "@/data/books";
import { categories, categoryById, type CategoryId } from "@/data/categories";

// Catalogue pages read their slug directly; a blocking route is fine here (silences the dev-mode instant-navigation notice).
export const instant = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/library/[category]">): Promise<Metadata> {
  const { category } = await params;
  const c = categoryById[category as CategoryId];
  return { title: c ? c.name : "Category" };
}

export default async function CategoryPage({ params }: PageProps<"/library/[category]">) {
  const { category } = await params;
  const c = categoryById[category as CategoryId];
  if (!c) notFound();
  const count = booksInCategory(c.id).length;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-start gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-tint text-gold"><Icon name={c.icon} size={26} /></span>
        <div className="flex flex-col gap-2">
          <span className="eyebrow text-gold">{count} {count === 1 ? "book" : "books"}</span>
          <h1 className="font-display text-[40px] font-medium leading-none text-ink sm:text-[52px]">{c.name}</h1>
          <p className="font-serif text-[17px] text-ink-muted">{c.blurb}</p>
        </div>
      </header>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-surface-100" />}>
        <LibraryBrowser lockedCategory={c.id} />
      </Suspense>
    </div>
  );
}
