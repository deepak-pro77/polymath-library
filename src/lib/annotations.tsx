"use client";

/**
 * Bookmarks, highlights and notes — per browser for now (Phase 5 syncs them to the account).
 * Everything is keyed by book slug and anchored to an EPUB CFI, so it survives font and layout changes.
 */
import { useCallback, useSyncExternalStore } from "react";

export interface Bookmark { id: string; cfi: string; excerpt: string; chapter?: string; createdAt: string }
export interface Highlight { id: string; cfiRange: string; text: string; note?: string; color: "gold" | "sage" | "oxblood"; chapter?: string; createdAt: string }
export interface BookAnnotations { bookmarks: Bookmark[]; highlights: Highlight[] }
export type AnnotationStore = Record<string, BookAnnotations>;

const KEY = "polymath:annotations";
const EMPTY: AnnotationStore = {};
const listeners = new Set<() => void>();
let cache: AnnotationStore | null = null;

function read(): AnnotationStore {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as AnnotationStore; } catch { cache = {}; }
  return cache;
}
function write(next: AnnotationStore) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
const id = () => Math.random().toString(36).slice(2, 10);

/** Whole-store access for account sync. */
export function readAnnotations(): AnnotationStore { return read(); }
export function replaceAnnotations(next: AnnotationStore) { write(next); }
export function onAnnotationsChange(l: () => void) { return subscribe(l); }
const forBook = (s: AnnotationStore, slug: string): BookAnnotations => s[slug] ?? { bookmarks: [], highlights: [] };

export function useAnnotations(slug?: string) {
  const store = useSyncExternalStore(subscribe, read, () => EMPTY);
  const book = slug ? forBook(store, slug) : { bookmarks: [], highlights: [] };

  const addBookmark = useCallback((b: Omit<Bookmark, "id" | "createdAt">) => {
    if (!slug) return;
    const cur = read(); const cb = forBook(cur, slug);
    if (cb.bookmarks.some((x) => x.cfi === b.cfi)) return;
    write({ ...cur, [slug]: { ...cb, bookmarks: [...cb.bookmarks, { ...b, id: id(), createdAt: new Date().toISOString() }] } });
  }, [slug]);

  const removeBookmark = useCallback((bid: string) => {
    if (!slug) return;
    const cur = read(); const cb = forBook(cur, slug);
    write({ ...cur, [slug]: { ...cb, bookmarks: cb.bookmarks.filter((x) => x.id !== bid) } });
  }, [slug]);

  const addHighlight = useCallback((h: Omit<Highlight, "id" | "createdAt">) => {
    if (!slug) return null;
    const cur = read(); const cb = forBook(cur, slug);
    const next: Highlight = { ...h, id: id(), createdAt: new Date().toISOString() };
    write({ ...cur, [slug]: { ...cb, highlights: [...cb.highlights, next] } });
    return next;
  }, [slug]);

  const updateHighlight = useCallback((hid: string, patch: Partial<Highlight>) => {
    if (!slug) return;
    const cur = read(); const cb = forBook(cur, slug);
    write({ ...cur, [slug]: { ...cb, highlights: cb.highlights.map((x) => (x.id === hid ? { ...x, ...patch } : x)) } });
  }, [slug]);

  const removeHighlight = useCallback((hid: string) => {
    if (!slug) return;
    const cur = read(); const cb = forBook(cur, slug);
    write({ ...cur, [slug]: { ...cb, highlights: cb.highlights.filter((x) => x.id !== hid) } });
  }, [slug]);

  return { store, book, addBookmark, removeBookmark, addHighlight, updateHighlight, removeHighlight };
}

/** Reader preferences, shared across books. */
export interface ReaderPrefs { font: "serif" | "sans" | "display"; size: number; lineHeight: number; width: "narrow" | "normal" | "wide"; theme: "dark" | "sepia" | "ivory" }
export const defaultPrefs: ReaderPrefs = { font: "serif", size: 19, lineHeight: 1.7, width: "normal", theme: "dark" };
const PREF_KEY = "polymath:reader:prefs";
export function loadPrefs(): ReaderPrefs {
  try { return { ...defaultPrefs, ...(JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") as Partial<ReaderPrefs>) }; } catch { return defaultPrefs; }
}
export function savePrefs(p: ReaderPrefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {}
}
