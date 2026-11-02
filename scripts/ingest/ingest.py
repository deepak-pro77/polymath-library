#!/usr/bin/env python3
"""
The Polymath Library — collection ingestion pipeline.

For every book in catalogue.json:
  1. resolve   look up metadata + cover on Open Library; look for a public-domain edition on
               Project Gutenberg (via the Gutendex API) and Standard Ebooks
  2. decide    apply the licence rules: download ONLY when the catalogue says `here` AND the
               source itself confirms the text is public domain; `review` and `elsewhere` are never downloaded
  3. fetch     download the EPUB (preferred) or PDF, verify, hash — resumable, one file at a time
  4. store     upload file + cover to Supabase Storage (service role key)
  5. upsert    write the row to `books` with licence, source, status and external links
  6. report    ingest-report.md + state.json so a re-run skips what is done

Usage:
  python ingest.py --dry-run                 # resolve + decide only, write nothing, no downloads
  python ingest.py                           # full run
  python ingest.py --only meditations        # one book
  python ingest.py --limit 5 --no-upload     # download locally without touching Supabase
  python ingest.py --retry-failed

Sources used, and only these: openlibrary.org (metadata, covers), gutendex.com / gutenberg.org (files),
standardebooks.org (files). Nothing is scraped from commercial sites and no paywall is ever touched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass

HERE = Path(__file__).resolve().parent
CATALOGUE = HERE / "catalogue.json"
STATE = HERE / "state.json"
REPORT = HERE / "ingest-report.md"
DOWNLOADS = HERE / "downloads"        # downloads/<category>/<slug>.<ext>
COVERS = HERE / "downloads" / "_covers"

UA = {"User-Agent": "PolymathLibrary-ingest/1.0 (personal digital library; contact via site)"}
TIMEOUT = 60
RETRIES = 4

# ---------------------------------------------------------------------------------------------
# Licence rules. The catalogue's triage is the first gate; the source is the second.
# ---------------------------------------------------------------------------------------------
DOWNLOADABLE = {"here"}                 # catalogue availability values we may host
NEVER = {"elsewhere", "review"}         # never fetched, catalogue entry + links only

@dataclass
class Resolved:
    openlibrary_key: Optional[str] = None
    cover_url: Optional[str] = None
    first_publish_year: Optional[int] = None
    isbn13: Optional[str] = None
    gutenberg_id: Optional[int] = None
    gutenberg_url: Optional[str] = None
    gutenberg_copyright: Optional[bool] = None   # Gutendex: False = public domain in the US
    file_url: Optional[str] = None
    file_kind: Optional[str] = None               # epub | pdf
    source_name: Optional[str] = None
    standardebooks_url: Optional[str] = None
    notes: list[str] = field(default_factory=list)


@dataclass
class Result:
    slug: str
    status: str = "pending"      # resolved | downloaded | stored | linked | review | failed | skipped
    availability: str = "elsewhere"
    licence: str = "copyrighted"
    resolved: dict = field(default_factory=dict)
    file_path: Optional[str] = None
    file_sha256: Optional[str] = None
    cover_path: Optional[str] = None
    external_links: list = field(default_factory=list)
    log: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------------------------
def get(url: str, **kw) -> requests.Response:
    last: Exception | None = None
    for attempt in range(RETRIES):
        try:
            r = requests.get(url, headers=UA, timeout=TIMEOUT, **kw)
            if r.status_code == 429:
                time.sleep(5 * (attempt + 1)); continue
            r.raise_for_status()
            return r
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"GET failed after {RETRIES} tries: {url} ({last})")


def download(url: str, dest: Path) -> str:
    """Resumable download; returns sha256."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    have = part.stat().st_size if part.exists() else 0
    headers = dict(UA)
    if have:
        headers["Range"] = f"bytes={have}-"
    with requests.get(url, headers=headers, stream=True, timeout=TIMEOUT) as r:
        if r.status_code == 416:      # already complete
            pass
        else:
            r.raise_for_status()
            mode = "ab" if (have and r.status_code == 206) else "wb"
            with open(part, mode) as f:
                for chunk in r.iter_content(1 << 16):
                    f.write(chunk)
    part.replace(dest)
    h = hashlib.sha256()
    with open(dest, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def looks_like(kind: str, path: Path) -> bool:
    head = path.read_bytes()[:8]
    return head.startswith(b"PK") if kind == "epub" else head.startswith(b"%PDF")


# ---------------------------------------------------------------------------------------------
# Resolvers
# ---------------------------------------------------------------------------------------------
def norm(s: str) -> str:
    s = re.sub(r"[\u0300-\u036f]", "", __import__("unicodedata").normalize("NFD", s.lower()))
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s)).strip()


STOP = {"the", "a", "an", "of", "and", "on", "in", "to", "its", "his", "her", "or", "vol", "volume", "i", "ii", "1", "2"}


def tokens(s: str) -> set[str]:
    return {t for t in norm(s).split() if t not in STOP}


def title_matches(want: str, got: str) -> bool:
    """All significant words of our title appear in theirs (so 'Wealth of Nations' matches
    'An Inquiry into the Nature and Causes of the Wealth of Nations'). Subtitles after ':' or ';' are ignored,
    and a very short title must match their main title exactly ('The Prince' must not match 'The Prince and the Pauper')."""
    w = tokens(want)
    main = re.split(r"[:;(]", got)[0]
    g = tokens(main)
    if not w:
        return False
    if len(w) <= 1:
        return w == g
    return w <= g


AUTHOR_ALIASES = {"lao tzu": ["laozi", "lao tzu", "lao tse", "laotzu"], "confucius": ["confucius", "kongzi", "kong qiu"],
                  "herodotus": ["herodotus"], "seneca": ["seneca"], "plato": ["plato"], "aristotle": ["aristotle"]}


def author_matches(want: str, got: str) -> bool:
    """Surname prefix match, tolerant of transliteration (Dostoevsky / Dostoyevsky)."""
    if not want or want.lower().startswith("attributed"):
        return True
    w, g = norm(want.split("&")[0]), norm(got)
    for key, aliases in AUTHOR_ALIASES.items():
        if key in w:
            return any(a in g for a in aliases)
    parts = [t for t in w.split() if t not in {"jr", "sr", "iii", "ii"}]
    last = parts[-1] if parts else w
    return last[:4] in g


# Known Project Gutenberg editions and alternative titles. IDs are VERIFIED against Gutendex at run time
# (title + author must match) — a wrong hint falls back to search and is logged, never trusted blindly.
GUTENBERG_HINTS: dict[str, dict] = {
    "the-histories":                        {"ids": [2707, 2456], "titles": ["The History of Herodotus"]},
    "the-republic":                         {"ids": [1497]},
    "the-analects":                         {"titles": ["The Analects of Confucius", "Confucian Analects"]},
    "meditations":                          {"ids": [2680]},
    "beyond-good-and-evil":                 {"ids": [4363]},
    "thus-spoke-zarathustra":               {"ids": [1998], "titles": ["Thus Spake Zarathustra"]},
    "the-problems-of-philosophy":           {"ids": [5827]},
    "the-story-of-philosophy":              {"titles": ["The Story of Philosophy"]},
    "the-nicomachean-ethics":               {"ids": [8438], "titles": ["Ethics", "The Ethics of Aristotle"]},
    "letters-from-a-stoic":                 {"titles": ["Moral letters to Lucilius", "Seneca's Morals", "Epistles"]},
    "meditations-on-first-philosophy":      {"titles": ["Meditations on First Philosophy", "Meditations of First Philosophy"]},
    "the-origin-of-species":                {"ids": [1228, 2009]},
    "the-wealth-of-nations":                {"ids": [3300], "titles": ["An Inquiry into the Nature and Causes of the Wealth of Nations"]},
    "crime-and-punishment":                 {"ids": [2554]},
    "the-brothers-karamazov":               {"ids": [28054]},
    "the-great-gatsby":                     {"ids": [64317]},
    "pride-and-prejudice":                  {"ids": [1342]},
    "the-count-of-monte-cristo":            {"ids": [1184]},
    "don-quixote":                          {"ids": [996]},
    "the-prince":                           {"ids": [1232]},
    "the-social-contract":                  {"ids": [46333]},
    "the-communist-manifesto":              {"ids": [61], "titles": ["The Communist Manifesto", "Manifesto of the Communist Party"]},
    "democracy-in-america":                 {"ids": [815]},
    "the-autobiography-of-benjamin-franklin": {"ids": [20203, 148]},
    "the-elements-of-style":                {"ids": [37134]},
    "the-interpretation-of-dreams":         {"titles": ["The Interpretation of Dreams"]},
    "the-world-as-will-and-representation": {"ids": [38427], "titles": ["The World as Will and Idea"]},
    "tao-te-ching":                         {"ids": [216], "titles": ["Tao Teh King", "Tao Te Ching", "The Tao Teh King"]},
    "the-bhagavad-gita":                    {"ids": [2388], "titles": ["The Bhagavad-Gita", "The Song Celestial"]},
}


def resolve_openlibrary(book: dict, res: Resolved) -> None:
    q = {"title": book["title"], "author": book["author"].split("&")[0].strip(), "limit": 5}
    try:
        data = get("https://openlibrary.org/search.json", params=q).json()
    except Exception as e:  # noqa: BLE001
        res.notes.append(f"openlibrary: {e}"); return
    docs = data.get("docs") or []
    if not docs:
        res.notes.append("openlibrary: no match"); return
    doc = next((d for d in docs if title_matches(book["title"], d.get("title", ""))), docs[0])
    res.openlibrary_key = doc.get("key")
    res.first_publish_year = doc.get("first_publish_year")
    if doc.get("cover_i"):
        res.cover_url = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
    for isbn in doc.get("isbn") or []:
        if len(isbn) == 13:
            res.isbn13 = isbn; break


def _gutendex_item_ok(item: dict, book: dict, titles: list[str]) -> bool:
    title = item.get("title", "")
    authors = " ".join(a.get("name", "") for a in item.get("authors") or [])
    if not any(title_matches(t, title) for t in titles):
        return False
    if not author_matches(book["author"], authors):
        return False
    if "en" not in (item.get("languages") or ["en"]):
        return False
    return True


def _take_gutendex(item: dict, res: Resolved) -> None:
    fmts = item.get("formats") or {}
    epub = fmts.get("application/epub+zip")
    pdf = fmts.get("application/pdf")
    res.gutenberg_id = item.get("id")
    res.gutenberg_url = f"https://www.gutenberg.org/ebooks/{item.get('id')}"
    res.gutenberg_copyright = bool(item.get("copyright"))
    if epub or pdf:
        res.file_url, res.file_kind = (epub, "epub") if epub else (pdf, "pdf")
        res.source_name = "gutenberg"


def resolve_gutenberg(book: dict, res: Resolved) -> None:
    """Gutendex mirrors Project Gutenberg's catalogue. `copyright: false` means the text is in the US public domain.
    Order: pinned IDs (verified), then a search for each known title, up to 3 pages."""
    hint = GUTENBERG_HINTS.get(book["slug"], {})
    titles = [book["title"]] + list(hint.get("titles", []))

    for gid in hint.get("ids", []):
        try:
            item = get(f"https://gutendex.com/books/{gid}").json()
        except Exception as e:  # noqa: BLE001
            res.notes.append(f"gutendex #{gid}: {e}"); continue
        if _gutendex_item_ok(item, book, titles):
            _take_gutendex(item, res); return
        res.notes.append(f"gutendex #{gid} did not verify ({item.get('title')!r}) — ignored")

    for t in titles:
        url = "https://gutendex.com/books"
        params: dict | None = {"search": t, "languages": "en"}
        for _page in range(3):
            try:
                data = get(url, params=params).json()
            except Exception as e:  # noqa: BLE001
                res.notes.append(f"gutendex: {e}"); break
            for item in data.get("results") or []:
                if _gutendex_item_ok(item, book, titles):
                    _take_gutendex(item, res); return
            if not data.get("next"):
                break
            url, params = data["next"], None
    res.notes.append("gutendex: no confident match")


def resolve_standardebooks(book: dict, res: Resolved) -> None:
    """Standard Ebooks hosts carefully typeset public-domain EPUBs. We only use it to find the book page
    and its direct EPUB link; the search page is HTML, so this is best-effort and falls back silently."""
    try:
        html = get("https://standardebooks.org/ebooks", params={"query": book["title"]}).text
    except Exception as e:  # noqa: BLE001
        res.notes.append(f"standardebooks: {e}"); return
    for m in re.finditer(r'<a href="(/ebooks/[^"]+)"[^>]*>\s*<img[^>]*alt="([^"]+)"', html):
        href, alt = m.group(1), m.group(2)
        if title_matches(book["title"], alt):
            res.standardebooks_url = "https://standardebooks.org" + href
            # Prefer SE's EPUB over Gutenberg's when both exist: better typography.
            try:
                page = get(res.standardebooks_url).text
                epub = re.search(r'href="(/ebooks/[^"]+\.epub)"', page)
                if epub:
                    res.file_url = "https://standardebooks.org" + epub.group(1)
                    res.file_kind = "epub"
                    res.source_name = "standardebooks"
            except Exception as e:  # noqa: BLE001
                res.notes.append(f"standardebooks page: {e}")
            return


def external_links(book: dict, res: Resolved) -> list[dict]:
    q = requests.utils.quote(f"{book['title']} {book['author']}")
    links = []
    if res.openlibrary_key:
        links.append({"label": "Open Library", "href": f"https://openlibrary.org{res.openlibrary_key}"})
    else:
        links.append({"label": "Open Library", "href": f"https://openlibrary.org/search?q={q}"})
    if res.gutenberg_url:
        links.append({"label": "Project Gutenberg", "href": res.gutenberg_url})
    if res.standardebooks_url:
        links.append({"label": "Standard Ebooks", "href": res.standardebooks_url})
    links.append({"label": "Google Books", "href": f"https://www.google.com/books/edition/_/?q={q}"})
    return links


# ---------------------------------------------------------------------------------------------
# Decision
# ---------------------------------------------------------------------------------------------
def decide(book: dict, res: Resolved) -> tuple[str, str, str]:
    """Returns (action, availability, licence). action: download | link | review."""
    avail = book["availability"]
    if avail in NEVER:
        return ("review" if avail == "review" else "link"), avail, ("needs_review" if avail == "review" else "copyrighted")
    if avail not in DOWNLOADABLE:
        return "link", "elsewhere", "copyrighted"
    # Catalogue says public domain. The source must agree before we host anything.
    if res.source_name == "standardebooks" and res.file_url:
        return "download", "here", "public_domain"
    if res.source_name == "gutenberg" and res.file_url and res.gutenberg_copyright is False:
        return "download", "here", "public_domain"
    if res.gutenberg_copyright is True:
        res.notes.append("Gutendex flags this edition as copyrighted — not hosting; manual review")
        return "review", "review", "needs_review"
    res.notes.append("no public-domain edition found at Gutenberg or Standard Ebooks — manual review")
    return "review", "review", "needs_review"


# ---------------------------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------------------------
def supabase_client():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    from supabase import create_client  # lazy import so --no-upload works without the package
    return create_client(url, key)


def upload(sb, bucket: str, path: str, local: Path, content_type: str) -> None:
    with open(local, "rb") as f:
        sb.storage.from_(bucket).upload(path, f, {"content-type": content_type, "upsert": "true"})


def upsert_row(sb, book: dict, res: Resolved, result: Result) -> None:
    row = {
        "slug": book["slug"], "title": book["title"], "author": book["author"],
        "category_id": book["category"], "year": book["year"], "pages": book["pages"],
        "blurb": book["blurb"], "availability": result.availability, "licence": result.licence,
        "licence_note": book["licence"], "openlibrary_key": res.openlibrary_key, "isbn13": res.isbn13,
        "cover_url": res.cover_url, "cover_path": result.cover_path,
        "file_kind": res.file_kind if result.file_path else None, "file_path": result.file_path,
        "file_sha256": result.file_sha256, "source_name": res.source_name if result.file_path else None,
        "source_url": res.gutenberg_url or res.standardebooks_url,
        "external_links": result.external_links, "ingest_status": result.status,
        "ingest_log": "\n".join(result.log + res.notes), "added_at": book["added_at"],
    }
    sb.table("books").upsert(row, on_conflict="slug").execute()


# ---------------------------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="resolve and decide only; no downloads, no writes")
    ap.add_argument("--only", help="process only these slugs (comma-separated)")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--no-upload", action="store_true", help="download locally but do not touch Supabase")
    ap.add_argument("--retry-failed", action="store_true")
    ap.add_argument("--force", action="store_true", help="re-process books already done")
    ap.add_argument("--check", action="store_true", help="test the Supabase connection and exit")
    args = ap.parse_args()

    if args.check:
        return check_connection()

    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    state: dict[str, Any] = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    sb = None if (args.dry_run or args.no_upload) else supabase_client()
    if not args.dry_run and not args.no_upload and sb is None:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — use --no-upload or --dry-run", file=sys.stderr)
        return 2

    only = set(args.only.split(",")) if args.only else None
    todo = [b for b in catalogue if not only or b["slug"] in only]
    if args.limit:
        todo = todo[: args.limit]

    for i, book in enumerate(todo, 1):
        slug = book["slug"]
        prev = state.get(slug)
        if prev and not args.force and prev.get("status") in {"stored", "linked", "review"} and not (args.retry_failed and prev["status"] == "failed"):
            continue
        print(f"[{i}/{len(todo)}] {book['title']} — {book['author']}")
        res, result = Resolved(), Result(slug=slug, availability=book["availability"])
        try:
            resolve_openlibrary(book, res)
            if book["availability"] in DOWNLOADABLE:
                resolve_gutenberg(book, res)
                resolve_standardebooks(book, res)
            action, result.availability, result.licence = decide(book, res)
            result.external_links = external_links(book, res)
            result.resolved = asdict(res)
            result.log.append(f"decision: {action}")

            if action == "download" and not args.dry_run:
                ext = res.file_kind
                dest = DOWNLOADS / book["category"] / f"{slug}.{ext}"
                sha = download(res.file_url, dest)
                if not looks_like(ext, dest):
                    raise RuntimeError(f"downloaded file is not a valid {ext}")
                result.file_sha256 = sha
                result.log.append(f"downloaded {dest.relative_to(HERE)} ({dest.stat().st_size // 1024} KB) from {res.source_name}")
                cover_local = None
                if res.cover_url:
                    cover_local = COVERS / f"{slug}.jpg"
                    try:
                        download(res.cover_url, cover_local)
                    except Exception as e:  # noqa: BLE001
                        result.log.append(f"cover download failed: {e}"); cover_local = None
                if sb:
                    storage_path = f"{book['category']}/{slug}.{ext}"
                    upload(sb, "books", storage_path, dest, "application/epub+zip" if ext == "epub" else "application/pdf")
                    result.file_path = storage_path
                    if cover_local:
                        upload(sb, "covers", f"{slug}.jpg", cover_local, "image/jpeg")
                        result.cover_path = f"{slug}.jpg"
                    result.status = "stored"
                else:
                    result.status = "downloaded"
            elif action == "download":
                result.status = "resolved"
            else:
                result.status = "review" if action == "review" else "linked"

            if sb:
                upsert_row(sb, book, res, result)
        except Exception as e:  # noqa: BLE001
            result.status = "failed"
            result.log.append(f"error: {type(e).__name__}: {e}")
            print(f"   ! {type(e).__name__}: {e}")
            if sb and "download" not in str(e).lower() and i == 1:
                print("\nStopping: the very first book failed at the database/storage step. Run  python ingest.py --check  to diagnose.")
                state[slug] = asdict(result)
                STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")
                return 1

        matched = f" ← #{res.gutenberg_id}" if res.gutenberg_id else ""
        print(f"   → {result.status}{matched}  ({', '.join(res.notes) or 'ok'})")
        state[slug] = asdict(result)
        if not args.dry_run:
            STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")
        time.sleep(1.0)   # be polite to the APIs

    write_report(catalogue, state)
    return 0


def check_connection() -> int:
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    print(f"SUPABASE_URL: {url or '(missing)'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'(missing)' if not key else key[:12] + '…  (' + str(len(key)) + ' chars)'}")
    if not url or not key:
        print("→ add both to the .env file in the PROJECT ROOT (next to package.json), not in scripts/ingest"); return 2
    try:
        sb = supabase_client()
        n = sb.table("categories").select("id", count="exact").execute()
        print(f"database: ok — {n.count} categories")
        buckets = [b.name for b in sb.storage.list_buckets()]
        print(f"storage: ok — buckets {buckets}")
        missing = {"books", "covers"} - set(buckets)
        if missing:
            print(f"→ missing buckets {missing}: re-run the storage part of 0001_init.sql or create them in Storage"); return 2
        probe = {"slug": "_probe", "title": "probe", "author": "probe", "category_id": "history", "availability": "elsewhere", "licence": "copyrighted"}
        sb.table("books").upsert(probe, on_conflict="slug").execute()
        sb.table("books").delete().eq("slug", "_probe").execute()
        print("write: ok")
        return 0
    except Exception as e:  # noqa: BLE001
        print(f"FAILED: {type(e).__name__}: {e}")
        print("→ if this mentions 'Invalid API key' or 401/403, the key is not the service_role / secret key;")
        print("  if it mentions a column or enum, the migration did not run completely.")
        return 1


def write_report(catalogue: list[dict], state: dict) -> None:
    rows = []
    counts: dict[str, int] = {}
    for b in catalogue:
        r = state.get(b["slug"], {})
        st = r.get("status", "pending")
        counts[st] = counts.get(st, 0) + 1
        rv = r.get("resolved") or {}
        src = rv.get("source_name") or "-"
        if rv.get("gutenberg_id"):
            src += f" #{rv['gutenberg_id']}"
        rows.append(f"| {b['title']} | {b['author']} | {b['category']} | {r.get('availability', b['availability'])} | {st} | {src} |")
    summary = " · ".join(f"{k}: {v}" for k, v in sorted(counts.items()))
    REPORT.write_text(
        "# Ingestion report\n\n" + summary + "\n\n| Title | Author | Category | Availability | Status | Source |\n|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n",
        encoding="utf-8",
    )
    print(f"\nReport: {REPORT}  ({summary})")


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # Windows console
    except Exception:  # noqa: BLE001
        pass
    sys.exit(main())
