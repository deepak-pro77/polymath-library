# Phase 5 — accounts, sync, your own copies

Unzip over `S:\polymath-library\polymath-library` (18 files, all replace-or-add; nothing to delete).
Also run `npm install` once — no new packages, just a safety check — then `npm run dev`.

## 1. Database (once)
Supabase → SQL Editor → paste `supabase/migrations/0002_phase5.sql` → Run.
Creates: `user_progress`, `user_annotations`, `user_uploads` (all owner-only RLS), the private `uploads`
bucket (50 MB, EPUB/PDF, per-user folders), and a trigger that makes a `profiles` row on first sign-in.

## 2. Auth settings (once)
Supabase → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/login`
(When you deploy, add the Vercel URL and `https://<your-domain>/login` too.)

Authentication → Providers → Email: leave **Enable email provider** on. Magic links use Supabase's
built-in mailer, which is rate-limited (a handful per hour) — fine for personal use; add a custom
SMTP later if you open the site to others.

## 3. Use it
- Avatar (top right) → **Sign in** → enter your email → click the link in the mail → you land on
  `/login` signed in, then `/me`.
- Everything you already have in this browser (progress, bookmarks, highlights, notes) is pushed to
  your account on first sign-in and merged on every other device you sign in on. Newer wins; nothing
  is deleted by a merge.
- **Your Copies** (sidebar, or `/me/uploads`): upload an EPUB you own → it appears on your private
  shelf → **Read** opens it in the same reader with bookmarks, highlights, notes, page numbers and
  time left (page count is computed from the book itself). Files are private: the bucket is not
  public and the reader fetches them with a 6-hour signed URL.
- Settings → Account shows who's signed in and has **Sign out**.

Nothing changes when you're not signed in — the site keeps working from this browser's storage.
