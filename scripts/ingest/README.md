# Ingestion pipeline

Builds the collection from `catalogue.json` legally and reproducibly. See the docstring in `ingest.py` for the full flow.

```bash
cd scripts/ingest
python -m venv .venv && .venv\Scripts\activate        # Windows
pip install --timeout 120 -r requirements.txt

# 1. export the catalogue from TypeScript (from the project root)
node --experimental-strip-types scripts/ingest/export-catalogue.ts

# 2. see what would happen, write nothing
python ingest.py --dry-run

# 3. download the public-domain files locally (no Supabase yet)
python ingest.py --no-upload

# 4. full run into Supabase (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the project's .env)
python ingest.py
```

Re-runs are cheap: `state.json` remembers what is done; `--retry-failed` retries only failures; `--force` redoes everything. Downloads resume if the connection drops.

Rules the pipeline enforces:

- A book is downloaded only if the catalogue marks it `here` **and** the source confirms public domain (Gutendex `copyright: false`, or a Standard Ebooks edition).
- `review` and `elsewhere` titles are never fetched — they get metadata, a cover URL and external links.
- Only openlibrary.org, gutendex.com / gutenberg.org and standardebooks.org are contacted.
- Every hosted file carries its source URL and SHA-256 in the database.

`downloads/` and `state.json` are git-ignored.
