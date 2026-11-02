"use client";

/**
 * Reading progress, persisted per browser in localStorage for now.
 * Phase 5 moves this behind Supabase Auth and migrates local records to the account.
 */
import { useCallback, useSyncExternalStore } from "react";
import { bookBySlug } from "@/data/books";

export type Status = "saved" | "reading" | "completed";

export interface Record_ {
  status: Status;
  page: number;
  /** Page count for books outside the catalogue (uploads); catalogue books use book.pages. */
  total?: number;
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
}

export type Shelf = Record<string, Record_>;

const KEY = "polymath:shelf";
const listeners = new Set<() => void>();
let cache: Shelf | null = null;
const EMPTY: Shelf = {};

function read(): Shelf {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Shelf;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Shelf) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useShelf() {
  const shelf = useSyncExternalStore(subscribe, read, () => EMPTY);

  const save = useCallback((slug: string) => {
    const cur = read();
    const now = new Date().toISOString();
    const prev = cur[slug];
    write({ ...cur, [slug]: prev ? { ...prev, updatedAt: now } : { status: "saved", page: 0, updatedAt: now } });
  }, []);

  const setPage = useCallback((slug: string, page: number, total?: number) => {
    const cur = read();
    const book = bookBySlug[slug];
    const now = new Date().toISOString();
    const prev = cur[slug];
    const max = book?.pages ?? total ?? prev?.total ?? page;
    const clamped = Math.max(0, Math.min(page, max));
    const done = max > 0 && clamped >= max && (Boolean(book) || Boolean(total ?? prev?.total));
    write({
      ...cur,
      [slug]: {
        status: done ? "completed" : "reading",
        page: clamped,
        total: book ? undefined : (total ?? prev?.total),
        startedAt: prev?.startedAt ?? now,
        finishedAt: done ? (prev?.finishedAt ?? now) : undefined,
        updatedAt: now,
      },
    });
  }, []);

  const complete = useCallback((slug: string) => {
    const book = bookBySlug[slug];
    if (book) setPage(slug, book.pages);
  }, [setPage]);

  const remove = useCallback((slug: string) => {
    const cur = read();
    const next = { ...cur };
    delete next[slug];
    write(next);
  }, []);

  return { shelf, save, setPage, complete, remove };
}

export function percent(slug: string, page: number, total?: number) {
  const book = bookBySlug[slug];
  const max = book?.pages ?? total;
  if (!max) return 0;
  return Math.min(100, Math.round((page / max) * 100));
}

/** Replace the whole shelf (used by account sync). */
export function replaceShelf(next: Shelf) { write(next); }
export function readShelf(): Shelf { return read(); }
export function onShelfChange(l: () => void) { return subscribe(l); }
