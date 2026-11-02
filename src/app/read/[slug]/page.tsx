import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { bookBySlug, books } from "@/data/books";
import { EpubReader } from "@/components/reader/EpubReader";
import { ReaderShell } from "@/components/reader/ReaderShell";

// Catalogue pages read their slug directly; a blocking route is fine here (silences the dev-mode instant-navigation notice).
export const instant = false;

export function generateStaticParams() {
  // Every book gets a route; the page itself 404s unless a hosted file exists.
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/read/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = bookBySlug[slug];
  return { title: b ? `Reading ${b.title}` : "Reader" };
}

export default async function ReadPage({ params }: PageProps<"/read/[slug]">) {
  const { slug } = await params;
  const book = bookBySlug[slug];
  if (!book || book.availability !== "here") notFound();
  if (book.file?.kind === "epub") return <EpubReader slug={slug} />;
  if (book.file?.kind === "pdf") {
    return (
      <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-6 py-12">
        <p className="eyebrow text-gold">PDF</p>
        <p className="font-serif text-[17px] text-ink-muted">This edition is a PDF. The in-page PDF reader is coming; open it directly for now.</p>
        <a href={book.file.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-fit items-center rounded-md bg-gold px-6 text-[15px] font-medium text-on-accent">Open PDF</a>
      </div>
    );
  }
  return <ReaderShell slug={slug} />;
}
