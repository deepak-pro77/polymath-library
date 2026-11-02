"use client";

/**
 * Account sync. The browser stores stay the source of truth for the UI (fast, offline-first);
 * when signed in, they are mirrored to Supabase and merged back on every sign-in and every change.
 * Merge rule: per book, the newer `updatedAt` wins. Nothing is ever deleted by a merge.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "./auth";
import { getSupabase } from "./supabase";
import { readShelf, replaceShelf, onShelfChange, type Shelf, type Record_ } from "./progress";
import { readAnnotations, replaceAnnotations, onAnnotationsChange, type AnnotationStore, type BookAnnotations } from "./annotations";

type ProgressRow = { book_key: string; status: Record_["status"]; page: number; total: number | null; started_at: string | null; finished_at: string | null; updated_at: string };
type AnnRow = { book_key: string; bookmarks: BookAnnotations["bookmarks"]; highlights: BookAnnotations["highlights"]; updated_at: string };

const annStamp = (a: BookAnnotations) => [...a.bookmarks, ...a.highlights].map((x) => x.createdAt).sort().pop() ?? "1970-01-01T00:00:00Z";

function mergeShelf(local: Shelf, remote: ProgressRow[]): Shelf {
  const out: Shelf = { ...local };
  for (const r of remote) {
    const l = local[r.book_key];
    if (!l || r.updated_at > l.updatedAt) {
      out[r.book_key] = { status: r.status, page: r.page, total: r.total ?? undefined, startedAt: r.started_at ?? undefined, finishedAt: r.finished_at ?? undefined, updatedAt: r.updated_at };
    }
  }
  return out;
}

function mergeAnnotations(local: AnnotationStore, remote: AnnRow[]): AnnotationStore {
  const out: AnnotationStore = { ...local };
  for (const r of remote) {
    const l = local[r.book_key] ?? { bookmarks: [], highlights: [] };
    // union by id, remote fills anything local lacks and vice-versa; notes take the newer side
    const byId = <T extends { id: string }>(a: T[], b: T[]) => { const m = new Map(a.map((x) => [x.id, x])); for (const x of b) if (!m.has(x.id)) m.set(x.id, x); return [...m.values()]; };
    const newerRemote = r.updated_at > annStamp(l);
    out[r.book_key] = {
      bookmarks: byId(newerRemote ? r.bookmarks : l.bookmarks, newerRemote ? l.bookmarks : r.bookmarks),
      highlights: byId(newerRemote ? r.highlights : l.highlights, newerRemote ? l.highlights : r.highlights),
    };
  }
  return out;
}

export function useAccountSync() {
  const { user } = useAuth();
  const sb = getSupabase();
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !sb) return;
    let cancelled = false;
    const uid = user.id;

    const push = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const shelf = readShelf();
        const rows = Object.entries(shelf).map(([book_key, r]) => ({
          user_id: uid, book_key, status: r.status, page: r.page, total: r.total ?? null,
          started_at: r.startedAt ?? null, finished_at: r.finishedAt ?? null, updated_at: r.updatedAt,
        }));
        if (rows.length) await sb.from("user_progress").upsert(rows, { onConflict: "user_id,book_key" });
        const ann = readAnnotations();
        const arows = Object.entries(ann).map(([book_key, a]) => ({ user_id: uid, book_key, bookmarks: a.bookmarks, highlights: a.highlights, updated_at: annStamp(a) }));
        if (arows.length) await sb.from("user_annotations").upsert(arows, { onConflict: "user_id,book_key" });
      } catch (e) {
        console.warn("sync push failed", e);
      } finally {
        busy.current = false;
      }
    };

    const pull = async () => {
      const [{ data: prog }, { data: ann }] = await Promise.all([
        sb.from("user_progress").select("book_key,status,page,total,started_at,finished_at,updated_at").eq("user_id", uid),
        sb.from("user_annotations").select("book_key,bookmarks,highlights,updated_at").eq("user_id", uid),
      ]);
      if (cancelled) return;
      busy.current = true; // don't echo the merge back as a change
      if (prog) replaceShelf(mergeShelf(readShelf(), prog as ProgressRow[]));
      if (ann) replaceAnnotations(mergeAnnotations(readAnnotations(), ann as AnnRow[]));
      busy.current = false;
      await push();
    };

    const schedule = () => {
      if (busy.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(push, 1500);
    };

    pull();
    const off1 = onShelfChange(schedule);
    const off2 = onAnnotationsChange(schedule);
    return () => { cancelled = true; off1(); off2(); if (timer.current) clearTimeout(timer.current); };
  }, [user, sb]);
}

export function AccountSync() {
  useAccountSync();
  return null;
}
