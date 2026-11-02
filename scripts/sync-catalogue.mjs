// Pulls the live rows from Supabase (covers, hosted files) into src/data/live.json so pages stay static and fast.
// Runs automatically before `next build` and `next dev` (see package.json); harmless when Supabase isn't configured.
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "").trim();
  }
}
loadEnv(resolve(".env.local"));
loadEnv(resolve(".env"));

const real = (v) => v && !v.includes("YOUR-PROJECT") && !v.startsWith("eyJ...") ? v : null;
const url = real(process.env.NEXT_PUBLIC_SUPABASE_URL) || real(process.env.SUPABASE_URL);
const key = real(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || real(process.env.SUPABASE_SERVICE_ROLE_KEY);
const out = resolve("src/data/live.json");

if (!url || !key) {
  if (!existsSync(out)) writeFileSync(out, "{}\n");
  console.log("sync-catalogue: Supabase not configured, keeping existing live.json");
  console.log(`  NEXT_PUBLIC_SUPABASE_URL      = ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)"}`);
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY = ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 10) + "…" : "(missing)"}`);
  console.log("  → fix these in .env.local (project root), then restart npm run dev");
  process.exit(0);
}
console.log(`sync-catalogue: using ${url}`);

const res = await fetch(`${url}/rest/v1/books?select=slug,cover_url,cover_path,file_kind,file_path,availability,ingest_status&limit=1000`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!res.ok) {
  console.warn(`sync-catalogue: ${res.status} ${await res.text()} — keeping existing live.json`);
  process.exit(0);
}
const rows = await res.json();
const live = {};
for (const r of rows) {
  live[r.slug] = {
    cover: r.cover_path ? `${url}/storage/v1/object/public/covers/${r.cover_path}` : r.cover_url || null,
    file: r.file_path ? { kind: r.file_kind, url: `${url}/storage/v1/object/public/books/${r.file_path}` } : null,
    availability: r.availability,
  };
}
writeFileSync(out, JSON.stringify(live, null, 2) + "\n");
console.log(`sync-catalogue: ${rows.length} books, ${Object.values(live).filter((b) => b.file).length} readable here`);
