-- Phase 5: accounts, sync, private uploads. Run after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Per-user annotations (bookmarks + highlights), one row per user per book.
-- book_key is a catalogue slug, or "u:<upload id>" for a private upload.
-- ---------------------------------------------------------------------------
create table if not exists user_annotations (
  user_id    uuid not null references auth.users(id) on delete cascade,
  book_key   text not null,
  bookmarks  jsonb not null default '[]',
  highlights jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  primary key (user_id, book_key)
);
alter table user_annotations enable row level security;
drop policy if exists "own annotations" on user_annotations;
create policy "own annotations" on user_annotations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Reading progress keyed by book_key (works for catalogue books and uploads alike).
-- (user_books from 0001 stays for the catalogue-joined queries later; this is the sync store.)
-- ---------------------------------------------------------------------------
create table if not exists user_progress (
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_key    text not null,
  status      reading_status not null default 'saved',
  page        int not null default 0,
  total       int,
  started_at  timestamptz,
  finished_at timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, book_key)
);
alter table user_progress enable row level security;
drop policy if exists "own progress" on user_progress;
create policy "own progress" on user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Private uploads: books the user owns. Files live in the private bucket `uploads`
-- under <user id>/<upload id>.epub; only that user can read them (signed URLs).
-- ---------------------------------------------------------------------------
create table if not exists user_uploads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  author      text not null default '',
  category_id text references categories(id),
  file_kind   file_kind not null default 'epub',
  file_path   text not null,
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);
create index if not exists user_uploads_user_idx on user_uploads (user_id, created_at desc);
alter table user_uploads enable row level security;
drop policy if exists "own uploads" on user_uploads;
create policy "own uploads" on user_uploads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 52428800, array['application/epub+zip', 'application/pdf', 'application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "own upload objects select" on storage.objects;
create policy "own upload objects select" on storage.objects for select
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own upload objects insert" on storage.objects;
create policy "own upload objects insert" on storage.objects for insert
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "own upload objects delete" on storage.objects;
create policy "own upload objects delete" on storage.objects for delete
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- Profiles row on first sign-in
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name) values (new.id, split_part(new.email, '@', 1)) on conflict (id) do nothing;
  return new;
end $$;
do $$ begin
  create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
exception when duplicate_object then null; end $$;
