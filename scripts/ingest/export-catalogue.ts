// Exports the TypeScript catalogue to JSON for the Python pipeline.
// Run from the project root:  node --experimental-strip-types scripts/ingest/export-catalogue.ts
import { writeFileSync } from "node:fs";
import { books } from "../../src/data/books.ts";

const out = books.map((b) => ({
  slug: b.slug, title: b.title, author: b.author, category: b.category, year: b.year, pages: b.pages,
  availability: b.availability, licence: b.licence, blurb: b.blurb, added_at: b.addedAt,
}));
writeFileSync(new URL("./catalogue.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(`Wrote ${out.length} books to scripts/ingest/catalogue.json`);
