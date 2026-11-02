"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categories, type CategoryId } from "@/data/categories";
import { useAuth } from "@/lib/auth";
import { useShelf, percent } from "@/lib/progress";
import { addUpload, listUploads, removeUpload, sniffEpub, uploadKey, type Upload } from "@/lib/uploads";
import { Icon } from "@/components/ui/Icon";

export function Uploads() {
  const { user, ready } = useAuth();
  const { shelf } = useShelf();
  const [items, setItems] = useState<Upload[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) listUploads().then(setItems); }, [user]);

  if (!ready) return <div className="h-40 animate-pulse rounded-lg bg-surface-100" />;
  if (!user) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="font-display text-[26px] text-ink">Sign in to keep your own copies here.</p>
        <p className="max-w-[46ch] font-serif text-[15px] text-ink-muted">Books you own — bought EPUBs, files you already have — upload to a private shelf only your account can open.</p>
        <Link href="/login" className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-gold px-4 text-[14px] font-medium text-on-accent hover:bg-gold-bright">Sign in <Icon name="arrow" size={15} /></Link>
      </div>
    );
  }

  const onPick = async (f: File | null) => {
    setFile(f); setError(null);
    if (f && f.name.toLowerCase().endsWith(".epub")) {
      const m = await sniffEpub(f);
      if (m.title && !title) setTitle(m.title);
      if (m.author && !author) setAuthor(m.author);
    }
    if (f && !title) setTitle(f.name.replace(/\.(epub|pdf)$/i, ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const u = await addUpload(user.id, file, { title: title.trim() || file.name, author: author.trim(), category_id: category || null });
      setItems((xs) => [u, ...(xs ?? [])]);
      setFile(null); setTitle(""); setAuthor(""); setCategory("");
      (document.getElementById("upload-file") as HTMLInputElement | null)?.value && ((document.getElementById("upload-file") as HTMLInputElement).value = "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submit} className="card-surface flex flex-col gap-4 p-6">
        <p className="eyebrow text-gold">Add a copy you own</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-hairline-strong px-6 py-8 text-center transition-colors hover:border-gold">
          <Icon name="book" className="text-gold" />
          <span className="font-serif text-[15px] text-ink">{file ? file.name : "Choose an EPUB (or PDF)"}</span>
          <span className="text-[12px] text-ink-subtle">Up to 50 MB · stays private to your account</span>
          <input id="upload-file" type="file" accept=".epub,.pdf,application/epub+zip,application/pdf" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required /></Field>
          <Field label="Author"><input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} /></Field>
          <Field label="Field of knowledge">
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | "")} className={inputCls}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id} className="bg-surface-100">{c.name}</option>)}
            </select>
          </Field>
        </div>
        {error && <p className="text-[13px] text-oxblood">{error}</p>}
        <p className="text-[12px] text-ink-subtle">Only upload books you own. Uploads are never shared or listed publicly.</p>
        <button type="submit" disabled={!file || busy} className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-gold px-5 text-[14px] font-medium text-on-accent hover:bg-gold-bright disabled:opacity-50">
          {busy ? "Uploading…" : "Add to my shelf"} <Icon name="arrow" size={15} />
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <p className="eyebrow text-gold">Your copies {items ? `· ${items.length}` : ""}</p>
        {items === null ? <div className="h-24 animate-pulse rounded-lg bg-surface-100" /> : items.length === 0 ? (
          <p className="font-serif text-[15px] text-ink-muted">Nothing here yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((u) => {
              const rec = shelf[uploadKey(u.id)];
              const pct = rec ? percent(uploadKey(u.id), rec.page, rec.total) : 0;
              const cat = categories.find((c) => c.id === u.category_id);
              return (
                <li key={u.id} className="card-surface flex gap-4 p-4">
                  <div className="flex h-[88px] w-[60px] shrink-0 items-end rounded-sm border-l-4 border-gold bg-surface-200 p-1.5 shadow-cover">
                    <span className="line-clamp-3 font-display text-[11px] leading-tight text-ink">{u.title}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {cat && <span className="eyebrow text-ink-subtle" style={{ fontSize: 10 }}>{cat.short}</span>}
                    <h3 className="truncate font-display text-[19px] font-semibold leading-tight text-ink">{u.title}</h3>
                    <p className="truncate text-[13px] text-ink-muted">{u.author || "Unknown author"}</p>
                    {rec && rec.status !== "saved" && (
                      <div className="mt-1 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-300"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div><span className="text-[11px] text-ink-subtle">{pct}%</span></div>
                    )}
                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <Link href={`/read/u/${u.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gold px-3 text-[13px] font-medium text-on-accent hover:bg-gold-bright">{rec?.status === "reading" ? "Continue" : "Read"} <Icon name="arrow" size={13} /></Link>
                      <button type="button" onClick={async () => { if (confirm(`Remove “${u.title}” from your shelf?`)) { await removeUpload(u); setItems((xs) => (xs ?? []).filter((x) => x.id !== u.id)); } }} className="text-[12px] text-ink-subtle hover:text-oxblood">Remove</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

const inputCls = "h-11 w-full rounded-md border border-hairline-strong bg-surface-000 px-3 text-[14px] text-ink outline-none focus:border-gold";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="eyebrow text-ink-subtle" style={{ fontSize: 10 }}>{label}</span>{children}</label>;
}
