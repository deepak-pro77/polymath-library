-- The Polymath Library — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent where practical.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type availability as enum ('here', 'elsewhere', 'review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type licence_kind as enum ('public_domain', 'public_domain_us', 'open_licence', 'authorized', 'copyrighted', 'needs_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reading_status as enum ('saved', 'reading', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type file_kind as enum ('epub', 'pdf');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Catalogue (public read)
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id          text primary key,              -- 'history', 'philosophy', …
  name        text not null,
  short       text not null,
  blurb       text not null default '',
  mark        text not null default 'gold',  -- 'gold' | 'oxblood' | 'sage'
  icon        text not null default 'book',
  sort_order  int  not null default 0
);

create table if not exists books (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  author          text not null,
  category_id     text not null references categories(id),
  tags            text[] not null default '{}',
  year            int,                         -- negative = BC
  pages           int,
  blurb           text not null default '',
  description     text not null default '',    -- longer overview for the details page
  publisher       text,
  isbn13          text,
  openlibrary_key text,                        -- e.g. '/works/OL45804W'
  cover_path      text,                        -- storage path in bucket 'covers'
  cover_url       text,                        -- external fallback (Open Library)
  availability    availability not null default 'elsewhere',
  licence         licence_kind not null default 'copyrighted',
  licence_note    text not null default '',
  file_kind       file_kind,
  file_path       text,                        -- storage path in bucket 'books'
  file_sha256     text,
  source_name     text,                        -- 'gutenberg' | 'standardebooks' | …
  source_url      text,
  external_links  jsonb not null default '[]', -- [{label, href}]
  ingest_status   text not null default 'pending', -- pending | resolved | downloaded | stored | linked | review | failed
  ingest_log      text not null default '',
  added_at        timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists books_category_idx on books (category_id);
create index if not exists books_availability_idx on books (availability);
create index if not exists books_search_idx on books using gin (to_tsvector('english', title || ' ' || author || ' ' || blurb));

-- ---------------------------------------------------------------------------
-- Per-user data (owner only)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle       text unique,
  is_public    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists user_books (
  user_id       uuid not null references auth.users(id) on delete cascade,
  book_id       uuid not null references books(id) on delete cascade,
  status        reading_status not null default 'saved',
  page          int not null default 0,
  location      text,                          -- EPUB CFI / PDF page anchor for exact resume
  started_at    timestamptz,
  finished_at   timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    uuid not null references books(id) on delete cascade,
  location   text not null,
  label      text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    uuid not null references books(id) on delete cascade,
  location   text,
  highlight  text,                              -- the selected passage (user's own copy, short)
  body       text not null default '',
  color      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reading_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_id    uuid not null references books(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  pages_read int not null default 0
);

create index if not exists user_books_user_idx on user_books (user_id, updated_at desc);
create index if not exists notes_user_book_idx on notes (user_id, book_id);
create index if not exists sessions_user_idx on reading_sessions (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger books_updated before update on books for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger user_books_updated before update on user_books for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger notes_updated before update on notes for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table categories       enable row level security;
alter table books            enable row level security;
alter table profiles         enable row level security;
alter table user_books       enable row level security;
alter table bookmarks        enable row level security;
alter table notes            enable row level security;
alter table reading_sessions enable row level security;

-- Catalogue: anyone can read; only the service role (the ingestion pipeline) writes.
drop policy if exists "categories are public" on categories;
create policy "categories are public" on categories for select using (true);
drop policy if exists "books are public" on books;
create policy "books are public" on books for select using (true);

-- Profiles: public rows readable by all, own row editable.
drop policy if exists "public profiles readable" on profiles;
create policy "public profiles readable" on profiles for select using (is_public or auth.uid() = id);
drop policy if exists "own profile writable" on profiles;
create policy "own profile writable" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Everything else: owner only.
drop policy if exists "own user_books" on user_books;
create policy "own user_books" on user_books for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own bookmarks" on bookmarks;
create policy "own bookmarks" on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own notes" on notes;
create policy "own notes" on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own sessions" on reading_sessions;
create policy "own sessions" on reading_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets: 'books' (public-domain files) and 'covers' — both public-read.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('books', 'books', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;

drop policy if exists "public read books bucket" on storage.objects;
create policy "public read books bucket" on storage.objects for select using (bucket_id = 'books');
drop policy if exists "public read covers bucket" on storage.objects;
create policy "public read covers bucket" on storage.objects for select using (bucket_id = 'covers');
-- Writes to both buckets happen only with the service role key (pipeline), so no insert policy for anon/auth.

-- ---------------------------------------------------------------------------
-- Seed the 12 categories
-- ---------------------------------------------------------------------------
insert into categories (id, name, short, blurb, mark, icon, sort_order) values
  ('history',    'History & Civilizations',          'History',    'How we got here, and who paid for it.',          'oxblood', 'column',  1),
  ('philosophy', 'Philosophy & Critical Thinking',   'Philosophy', 'The tools for thinking about thinking.',         'gold',    'laurel',  2),
  ('science',    'Science & Mathematics',            'Science',    'What the universe is made of.',                  'sage',    'atom',    3),
  ('psychology', 'Psychology & Human Behavior',      'Psychology', 'Why people do what they do.',                    'sage',    'brain',   4),
  ('economics',  'Economics & Finance',              'Economics',  'Incentives, markets and money.',                 'gold',    'chart',   5),
  ('technology', 'Technology & AI',                  'Technology', 'The machines, and what they want.',              'sage',    'chip',    6),
  ('literature', 'Literature & Writing',             'Literature', 'The novels that outlived their centuries.',      'oxblood', 'book',    7),
  ('politics',   'Politics & Society',               'Politics',   'Power, and how it is organised.',                'oxblood', 'scale',   8),
  ('geography',  'Geography & World Cultures',       'Geography',  'Places, peoples and the spaces between.',        'sage',    'globe',   9),
  ('biography',  'Biographies & Great Personalities','Biography',  'Lives worth studying closely.',                  'oxblood', 'bust',   10),
  ('mastery',    'Personal Development & Mastery',   'Mastery',    'Craft, discipline and deliberate practice.',     'gold',    'flame',  11),
  ('art',        'Art & Creativity',                 'Art',        'Making things, and making them well.',           'gold',    'palette',12)
on conflict (id) do update set name = excluded.name, short = excluded.short, blurb = excluded.blurb, mark = excluded.mark, icon = excluded.icon, sort_order = excluded.sort_order;
