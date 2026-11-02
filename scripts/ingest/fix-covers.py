#!/usr/bin/env python3
"""
Fill in missing covers. For each book in the database without a cover:
  1. Project Gutenberg's own cover image (books with a Gutenberg number)
  2. Open Library, several query shapes, first edition that has a cover
  3. Open Library by ISBN, if we have one
Uploads the image to the `covers` bucket and updates the row. Safe to re-run.

  python fix-covers.py            # fix every book without a cover
  python fix-covers.py --force    # re-fetch covers for ALL books (use if some covers are wrong)
  python fix-covers.py --only meditations,capital-in-the-twenty-first-century
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ingest as ing  # noqa: E402  (reuse helpers, hints, supabase client)

COVERS = ing.COVERS


def ol_cover(book: dict, isbn: str | None) -> str | None:
    title, author = book["title"], book["author"].split("&")[0].strip()
    queries = [
        {"title": title, "author": author},
        {"q": f"{title} {author}"},
        {"title": title},
    ]
    for q in queries:
        try:
            docs = ing.get("https://openlibrary.org/search.json", params={**q, "limit": 20}).json().get("docs") or []
        except Exception:  # noqa: BLE001
            continue
        for d in docs:
            if d.get("cover_i") and ing.title_matches(title, d.get("title", "")) and ing.author_matches(book["author"], " ".join(d.get("author_name") or [])):
                return f"https://covers.openlibrary.org/b/id/{d['cover_i']}-L.jpg"
        for d in docs:  # looser: any matching title with a cover
            if d.get("cover_i") and ing.title_matches(title, d.get("title", "")):
                return f"https://covers.openlibrary.org/b/id/{d['cover_i']}-L.jpg"
    if isbn:
        url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
        try:
            if ing.requests.head(url, headers=ing.UA, timeout=20, allow_redirects=True).status_code == 200:
                return url
        except Exception:  # noqa: BLE001
            pass
    return None


def gutenberg_cover(gid: int | None) -> str | None:
    if not gid:
        return None
    try:
        item = ing.get(f"https://gutendex.com/books/{gid}").json()
        return (item.get("formats") or {}).get("image/jpeg")
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only")
    args = ap.parse_args()

    sb = ing.supabase_client()
    if sb is None:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in the project .env"); return 2
    catalogue = {b["slug"]: b for b in json.loads(ing.CATALOGUE.read_text(encoding="utf-8"))}
    state = json.loads(ing.STATE.read_text(encoding="utf-8")) if ing.STATE.exists() else {}
    only = set(args.only.split(",")) if args.only else None

    rows = sb.table("books").select("slug,cover_path,cover_url,isbn13,source_url").execute().data
    todo = [r for r in rows if (only and r["slug"] in only) or (not only and (args.force or not (r["cover_path"] or r["cover_url"])))]
    print(f"{len(todo)} books to fix")
    fixed = 0
    for r in todo:
        slug = r["slug"]; book = catalogue.get(slug)
        if not book:
            continue
        gid = (state.get(slug, {}).get("resolved") or {}).get("gutenberg_id")
        url = gutenberg_cover(gid) or ol_cover(book, r.get("isbn13"))
        if not url:
            print(f"  - {book['title']}: no cover found anywhere"); continue
        local = COVERS / f"{slug}.jpg"
        try:
            ing.download(url, local)
            if local.stat().st_size < 2000:        # Open Library's 1x1 placeholder
                raise RuntimeError("placeholder image")
            ing.upload(sb, "covers", f"{slug}.jpg", local, "image/jpeg")
            sb.table("books").update({"cover_path": f"{slug}.jpg", "cover_url": url}).eq("slug", slug).execute()
            print(f"  ✓ {book['title']}  ← {url}")
            fixed += 1
        except Exception as e:  # noqa: BLE001
            print(f"  ! {book['title']}: {e}")
    print(f"\n{fixed} covers added. Now run  npm run sync  in the project root (or restart npm run dev).")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    sys.exit(main())
