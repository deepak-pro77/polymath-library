# The Polymath Library

A premium digital reading room: one hundred books across twelve fields of knowledge, with a reading journey measured in disciplines, not page counts.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · self-hosted fonts via Fontsource · Supabase (Phase 2+) · Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
```

Node 20+ is required. Fonts are bundled with the app (no Google Fonts calls at build or run time).

## What exists (Phase 1)

| Route | What it does |
| --- | --- |
| `/` | Dashboard: hero, book of the day, 12 category tiles, reading journey card, starter shelf, continue reading, recently added |
| `/library` | The full catalogue with search, category chips, availability filter and sorting — all in the URL, so views are shareable |
| `/library/[category]` | One field of knowledge |
| `/book/[slug]` | Book details: metadata, licence, legitimate external links, save / mark completed, related books |
| `/read/[slug]` | Reader shell (readable books only): progress, last position, font size, theme, keyboard paging. The text engine arrives in Phase 4 |
| `/me` · `/me/journey` · `/me/notes` · `/settings` | Shelves, the knowledge map, notes placeholder, preferences and data export |

Reading progress and saved books live in `localStorage` (`src/lib/progress.tsx`). Phase 5 puts Supabase Auth behind the same hook and migrates local data to the account.

## Where things live

```
src/
  app/            routes (App Router)
  components/
    shell/        sidebar, top bar, footer
    home/         hero, featured, categories, journey card, continue reading
    books/        BookCover (typographic plates until real covers arrive), BookCard, BookActions
    library/      LibraryBrowser (client-side search/filter/sort)
    reader/       ReaderShell
    me/           MyLibrary, Journey, Settings
    ui/           Icon, Wordmark, SectionHeader
  data/
    categories.ts the 12 fields
    books.ts      the 100-book catalogue with licence triage
  lib/            theme, progress, formatting
  app/globals.css design tokens (dark + ivory themes) and utilities
```

## Catalogue and licences

`src/data/books.ts` holds every book with an `availability`:

- `here` — public domain in the US and Pakistan with a public-domain English text; will be hosted
- `elsewhere` — in copyright; catalogued with links to Open Library, Google Books, publishers
- `review` — public domain in some jurisdictions but not the US; link-only until decided

No copyrighted book is hosted without permission. The ingestion pipeline (Phase 2, `scripts/ingest/`) verifies each `here` title against Project Gutenberg / Standard Ebooks, downloads only confirmed public-domain files, fetches covers and metadata from Open Library, and fills `file` and `sourceUrl`.

## Phase 2 setup (Supabase + ingestion)

1. Create a Supabase project (free tier), open the SQL editor and run `supabase/migrations/0001_init.sql`. It creates the tables, row-level security, the `books` and `covers` buckets and seeds the 12 categories.
2. Copy `.env.example` to `.env.local` (frontend keys) and `.env` (pipeline keys) and fill them from Project Settings → API.
3. Run the pipeline — see `scripts/ingest/README.md`. Start with `--dry-run`.
4. `src/lib/catalogue.ts` reads from Supabase once `NEXT_PUBLIC_SUPABASE_*` are set; pages switch from the static catalogue to it in Phase 3.

### Hero photograph

Set `heroImage` in `src/config/site.ts` to a file in `public/images/`. Free, licence-safe sources for classical busts and library halls: The Met's Open Access collection (CC0, metmuseum.org/art/collection, filter "Open Access"), Wikimedia Commons (check each file's licence), Unsplash and Pexels. Keep the subject on the right third; the component masks it into the background.

## Phase 3–4 (live data + reader)

`npm run dev` / `npm run build` first run `scripts/sync-catalogue.mjs`, which pulls covers and hosted-file URLs from Supabase into `src/data/live.json` (git-ignored). Books with a hosted EPUB open in the in-page reader (`/read/<slug>`, epub.js): exact position saved per book, font size, dark/ivory, contents panel, arrow-key paging. Progress and the journey update as you read. Run `npm run sync` any time after re-ingesting.

## Phases

1. **Foundation + homepage + catalogue** ✅
2. **Supabase project, schema, ingestion pipeline, real covers** ✅
3. **Live data on every page** ✅ (OG images, sitemap pending)
4. **EPUB reader** ✅ (PDF reader, bookmarks, highlights, notes pending)
5. Auth, My Library sync, public profiles
6. Launch polish: accessibility audit, Lighthouse, domain
