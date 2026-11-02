"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EpubReader, type ReaderBook } from "./EpubReader";
import { useAuth } from "@/lib/auth";
import { getUpload, uploadFileUrl, uploadKey } from "@/lib/uploads";

export function UploadReader({ id }: { id: string }) {
  const { user, ready, configured } = useAuth();
  const [book, setBook] = useState<ReaderBook | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");

  useEffect(() => {
    if (!ready) return;
    if (!user) { setState("missing"); return; }
    let on = true;
    (async () => {
      const u = await getUpload(id);
      const url = u ? await uploadFileUrl(u) : null;
      if (!on) return;
      if (!u || !url) { setState("missing"); return; }
      setBook({ key: uploadKey(u.id), title: u.title, author: u.author, file: { kind: u.file_kind, url }, backHref: "/me/uploads" });
      setState("ok");
    })();
    return () => { on = false; };
  }, [id, user, ready]);

  if (state === "ok" && book) {
    if (book.file.kind === "pdf") {
      return (
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-6 py-12">
          <p className="eyebrow text-gold">PDF</p>
          <h1 className="font-display text-[32px] text-ink">{book.title}</h1>
          <p className="font-serif text-[17px] text-ink-muted">PDFs open directly for now; the in-page PDF reader is coming.</p>
          <a href={book.file.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-fit items-center rounded-md bg-gold px-6 text-[15px] font-medium text-on-accent">Open PDF</a>
          <Link href="/me/uploads" className="text-[13px] text-ink-subtle hover:text-gold">← Your copies</Link>
        </div>
      );
    }
    return <EpubReader book={book} />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-000 text-ink">
      {state === "loading" ? (
        <span className="font-display text-[18px] italic text-ink-muted">Opening your copy…</span>
      ) : (
        <div className="flex max-w-[40ch] flex-col items-center gap-3 text-center">
          <p className="font-display text-[26px]">{!configured ? "Accounts aren't set up." : !user ? "Sign in to open your copies." : "This copy isn't on your shelf."}</p>
          <Link href={user ? "/me/uploads" : "/login"} className="inline-flex h-10 items-center rounded-md bg-gold px-4 text-[14px] font-medium text-on-accent">{user ? "Your copies" : "Sign in"}</Link>
        </div>
      )}
    </div>
  );
}
