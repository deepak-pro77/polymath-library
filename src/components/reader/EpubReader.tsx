"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Book as EpubBook, Rendition, NavItem, Contents } from "epubjs";
import type { EpubCFI as EpubCFIType } from "epubjs";
import { bookBySlug } from "@/data/books";
import { useShelf } from "@/lib/progress";
import { useAnnotations, loadPrefs, savePrefs, defaultPrefs, type ReaderPrefs, type Highlight } from "@/lib/annotations";
import { Icon } from "@/components/ui/Icon";

const locKey = (slug: string) => `polymath:reader:cfi:${slug}`;
const COVERISH = /cover|titlepage|title-page|wrap0000/i;
const WORDS_PER_LOCATION = 170; // epub.js locations are ~1000 chars
const WPM = 230;

const THEMES = {
  dark:  { bg: "#0b0a08", fg: "#e8e1d3", head: "#f3ede1", link: "#d4b872", chrome: "dark" },
  sepia: { bg: "#f1e7d0", fg: "#3b3224", head: "#2a2318", link: "#8f7334", chrome: "light" },
  ivory: { bg: "#f5f1e8", fg: "#16140f", head: "#16140f", link: "#8f7334", chrome: "light" },
} as const;
const FONTS = {
  serif: '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif',
  sans: '"Inter Variable", Inter, system-ui, sans-serif',
  display: '"Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif',
};
const WIDTHS = { narrow: "max-w-[58ch]", normal: "max-w-[72ch]", wide: "max-w-[90ch]" };
const HL_COLORS = { gold: "rgba(212,184,114,.42)", sage: "rgba(107,140,118,.45)", oxblood: "rgba(139,58,58,.45)" };

type Panel = "none" | "toc" | "marks" | "settings";

/** What the reader needs to know about a book; catalogue books and private uploads both fit. */
export interface ReaderBook { key: string; title: string; author: string; pages?: number; file: { kind: "epub" | "pdf"; url: string }; backHref: string }

export function EpubReader({ slug, book: given }: { slug?: string; book?: ReaderBook }) {
  const cat = slug ? bookBySlug[slug] : undefined;
  const book: ReaderBook = given ?? { key: slug!, title: cat!.title, author: cat!.author, pages: cat!.pages, file: cat!.file!, backHref: `/book/${slug}` };
  const key = book.key;
  const { shelf, setPage } = useShelf();
  const rec = shelf[key];
  const ann = useAnnotations(key);
  const annRef = useRef(ann); annRef.current = ann;

  const mount = useRef<HTMLDivElement>(null);
  const epubRef = useRef<EpubBook | null>(null);
  const rendRef = useRef<Rendition | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [prefs, setPrefs] = useState<ReaderPrefs>(defaultPrefs);
  const [pos, setPos] = useState({ pct: 0, loc: 0, total: 0, cfi: "", chapter: "", excerpt: "" });
  const [toc, setToc] = useState<NavItem[]>([]);
  const [panel, setPanel] = useState<Panel>("none");
  const [chrome, setChrome] = useState(true);
  const [sel, setSel] = useState<{ cfiRange: string; text: string; x: number; y: number } | null>(null);
  const [noteFor, setNoteFor] = useState<Highlight | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const t = THEMES[prefs.theme];

  // ---- preferences ----
  useEffect(() => { setPrefs(loadPrefs()); }, []);
  const update = (patch: Partial<ReaderPrefs>) => setPrefs((p) => { const n = { ...p, ...patch }; savePrefs(n); return n; });

  const applyPrefs = useCallback((r: Rendition, p: ReaderPrefs) => {
    const th = THEMES[p.theme];
    r.themes.register("polymath", {
      "html, body": { background: `${th.bg} !important`, color: `${th.fg} !important` },
      body: { "font-family": `${FONTS[p.font]} !important`, "line-height": `${p.lineHeight} !important`, padding: "0 !important", margin: "0 !important" },
      "p, div, span, li, td": { "font-family": "inherit !important", color: "inherit !important", "line-height": "inherit" },
      p: { "text-align": "left !important", "text-indent": "1.4em", margin: "0 0 0.4em 0 !important" },
      "h1, h2, h3, h4": { "font-family": `${FONTS.display} !important`, "font-weight": "500 !important", color: `${th.head} !important`, "text-align": "left !important" },
      a: { color: `${th.link} !important` },
      img: { "max-width": "100% !important", "max-height": "90vh !important" },
      "pre, blockquote": { "white-space": "pre-wrap" },
      "::selection": { background: "rgba(212,184,114,.35)" },
      ".pg-boilerplate, #pg-header, #pg-footer, .pgheader, .pgfooter, #pg-machine-header, #pg-start-separator, #pg-end-separator": { display: "none !important" },
    });
    r.themes.select("polymath");
    r.themes.fontSize(`${p.size}px`);
  }, []);
  useEffect(() => { if (rendRef.current) applyPrefs(rendRef.current, prefs); }, [prefs, applyPrefs]);

  // ---- auto-hide chrome ----
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = () => { setChrome(true); clearTimeout(timer); timer = setTimeout(() => setChrome(false), 4000); };
    show();
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    return () => { clearTimeout(timer); window.removeEventListener("mousemove", show); window.removeEventListener("touchstart", show); };
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ---- paint stored highlights ----
  const paintHighlight = useCallback((r: Rendition, h: Highlight) => {
    try {
      r.annotations.remove(h.cfiRange, "highlight");
    } catch {}
    r.annotations.add("highlight", h.cfiRange, {}, () => { setNoteFor(h); setNoteDraft(h.note ?? ""); setPanel("none"); }, `hl-${h.id}`, {
      fill: HL_COLORS[h.color], "fill-opacity": "1", "mix-blend-mode": "multiply",
    });
  }, []);

  // ---- load the book ----
  useEffect(() => {
    if (!book.file || !mount.current) return;
    let cancelled = false;
    let epub: EpubBook;
    let ro: ResizeObserver | undefined;

    (async () => {
      try {
        const epubjs = await import("epubjs");
        const ePub = epubjs.default;
        const cfiCompare: EpubCFIType = new epubjs.EpubCFI();
        if (cancelled || !mount.current) return;
        mount.current.innerHTML = "";
        epub = ePub(book.file!.url, { openAs: "epub" });
        epubRef.current = epub;
        const box = mount.current.getBoundingClientRect();
        const rendition = epub.renderTo(mount.current, { width: Math.floor(box.width), height: Math.floor(box.height), flow: "paginated", spread: "none", allowScriptedContent: false });
        rendRef.current = rendition;

        const fontCss = Array.from(document.styleSheets).flatMap((sheet) => {
          try {
            const base = sheet.href ?? window.location.href;
            return Array.from(sheet.cssRules).filter((r) => r instanceof CSSFontFaceRule)
              .map((r) => r.cssText.replace(/url\((["']?)([^"')]+)\1\)/g, (_m, q, u) => `url(${q}${new URL(u, base).href}${q})`));
          } catch { return []; }
        }).join("\n");
        rendition.hooks.content.register((contents: Contents) => {
          const style = contents.document.createElement("style");
          style.textContent = fontCss;
          contents.document.head.appendChild(style);
        });
        applyPrefs(rendition, loadPrefs());

        await epub.loaded.spine;
        const items = (epub.spine as unknown as { spineItems: { href: string; idref: string }[] }).spineItems ?? [];
        const nav = await epub.loaded.navigation;
        setToc(nav.toc);
        const firstReal =
          nav.toc.find((x) => !COVERISH.test(`${x.href} ${x.label}`) && !/contents|copyright|colophon|imprint|project gutenberg/i.test(x.label))?.href
          ?? items.find((it) => !COVERISH.test(`${it.href} ${it.idref}`))?.href;

        let saved: string | null = null;
        try { saved = localStorage.getItem(locKey(key)); } catch {}
        if (!saved || (rec?.page ?? 0) <= 1) saved = firstReal ?? null;
        await rendition.display(saved ?? undefined);
        if (cancelled) return;
        setStatus("ready");
        annRef.current.book.highlights.forEach((h) => paintHighlight(rendition, h));

        await epub.locations.generate(1000);
        const total = epub.locations.length();

        const relocate = () => {
          const loc = rendition.currentLocation() as unknown as { start?: { cfi: string; href: string } };
          if (!loc?.start) return;
          const p = epub.locations.percentageFromCfi(loc.start.cfi);
          const current = epub.locations.locationFromCfi(loc.start.cfi) as unknown as number;
          let excerpt = "";
          let chapter = "";
          try {
            const c = (rendition.getContents() as unknown as Contents[])[0];
            const doc = c?.document;
            if (doc) {
              // Chapter = the last ToC entry whose position (CFI) is at or before the current page. Exact, and works for
              // single-file books (Gutenberg) where every chapter is an anchor inside one document.
              const file = loc.start.href.split("#")[0];
              for (const x of nav.toc) {
                const [xf, anchor] = x.href.split("#");
                const sameFile = file.endsWith(xf) || xf.endsWith(file);
                if (!sameFile) {
                  // Other files: compare by spine order.
                  const sec = epub.spine.get(xf) as unknown as { index: number } | null;
                  const cur = epub.spine.get(file) as unknown as { index: number } | null;
                  if (sec && cur && sec.index < cur.index) chapter = x.label.trim();
                  continue;
                }
                if (!anchor) { chapter = x.label.trim(); continue; }
                const el = doc.getElementById(anchor);
                if (!el) continue;
                const cfi = (c as unknown as { cfiFromNode: (n: Node) => string }).cfiFromNode(el);
                if (cfiCompare.compare(cfi, loc.start.cfi) <= 0) chapter = x.label.trim();
              }
              // Excerpt = first visible text on this page. In paged mode the book's frame holds every column side by side
              // and the container scrolls across them, so the visible window is [scrollLeft, scrollLeft + page width].
              const container = mount.current?.querySelector<HTMLElement>(".epub-container");
              const pageW = mount.current?.getBoundingClientRect().width ?? 0;
              const from = container?.scrollLeft ?? 0;
              const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
              let n: Node | null = walker.nextNode();
              while (n) {
                const el = n as HTMLElement;
                const r = el.getBoundingClientRect();
                if (/^(P|H[1-6]|LI)$/.test(el.tagName) && r.width > 0 && r.left >= from - 2 && r.left < from + pageW && el.innerText.trim().length > 20) { excerpt = el.innerText.trim().slice(0, 90); break; }
                n = walker.nextNode();
              }
            }
          } catch {}
          // Before the first anchor of this file (e.g. on a hidden header): the first entry of the file is the chapter.
          if (!chapter) chapter = nav.toc.find((x) => loc.start!.href.includes(x.href.split("#")[0]))?.label.trim() ?? "";
          setPos({ pct: Math.round(p * 100), loc: Math.max(1, current + 1), total, cfi: loc.start.cfi, chapter, excerpt });
          // Catalogue books report against their known page count; uploads use the generated location count.
          if (book.pages) setPage(key, Math.max(1, Math.round(p * book.pages)));
          else setPage(key, Math.max(1, current + 1), total);
          try { localStorage.setItem(locKey(key), loc.start.cfi); } catch {}
        };
        rendition.on("relocated", relocate);
        relocate();

        rendition.on("keyup", (e: KeyboardEvent) => {
          if (e.key === "ArrowRight" || e.key === " ") rendition.next();
          if (e.key === "ArrowLeft") rendition.prev();
        });
        rendition.on("click", (e: MouseEvent) => {
          const w = (e.view as Window | null)?.innerWidth ?? 0;
          const selText = (e.view as Window | null)?.getSelection()?.toString() ?? "";
          if (!w || selText) return;
          setSel(null);
          if (e.clientX < w * 0.2) rendition.prev();
          else if (e.clientX > w * 0.8) rendition.next();
        });
        rendition.on("selected", (cfiRange: string, contents: Contents) => {
          const s = contents.window.getSelection();
          const text = s?.toString().trim() ?? "";
          if (!text) return;
          const range = s!.getRangeAt(0).getBoundingClientRect();
          const frameRect = (contents.document.defaultView?.frameElement as HTMLElement | null)?.getBoundingClientRect();
          setSel({ cfiRange, text, x: (frameRect?.left ?? 0) + range.left + range.width / 2, y: (frameRect?.top ?? 0) + range.top });
        });

        ro = new ResizeObserver(() => {
          const b = mount.current?.getBoundingClientRect();
          if (b && b.width > 0) rendition.resize(Math.floor(b.width), Math.floor(b.height));
        });
        ro.observe(mount.current);
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") rendRef.current?.next();
      if (e.key === "ArrowLeft") rendRef.current?.prev();
      if (e.key === "Escape") { setPanel("none"); setSel(null); setNoteFor(null); }
      if (e.key === "b") toggleBookmark();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      ro?.disconnect();
      window.removeEventListener("keydown", onKey);
      try { epub?.destroy(); } catch {}
      if (mount.current) mount.current.innerHTML = "";
      epubRef.current = null; rendRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, book.file.url]);

  // ---- actions ----
  const posRef = useRef(pos); posRef.current = pos;
  const bookmarked = ann.book.bookmarks.some((b) => b.cfi === pos.cfi);
  const toggleBookmark = () => {
    const p = posRef.current;
    const existing = annRef.current.book.bookmarks.find((b) => b.cfi === p.cfi);
    if (existing) annRef.current.removeBookmark(existing.id);
    else if (p.cfi) annRef.current.addBookmark({ cfi: p.cfi, excerpt: p.excerpt, chapter: p.chapter });
  };
  const highlightSelection = (color: Highlight["color"]) => {
    if (!sel || !rendRef.current) return;
    const h = ann.addHighlight({ cfiRange: sel.cfiRange, text: sel.text, color, chapter: pos.chapter });
    if (h) paintHighlight(rendRef.current, h);
    try { (rendRef.current.getContents() as unknown as Contents[])[0]?.window.getSelection()?.removeAllRanges(); } catch {}
    setSel(null);
    return h;
  };
  const noteOnSelection = () => {
    const h = highlightSelection("gold");
    if (h) { setNoteFor(h); setNoteDraft(""); }
  };
  const saveNote = () => {
    if (!noteFor) return;
    ann.updateHighlight(noteFor.id, { note: noteDraft.trim() || undefined });
    setNoteFor(null);
  };
  const deleteHighlight = (h: Highlight) => {
    try { rendRef.current?.annotations.remove(h.cfiRange, "highlight"); } catch {}
    ann.removeHighlight(h.id);
    if (noteFor?.id === h.id) setNoteFor(null);
  };
  const goTo = (target: string) => { rendRef.current?.display(target); setPanel("none"); };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const minutesLeft = pos.total ? Math.round(((pos.total - pos.loc) * WORDS_PER_LOCATION) / WPM) : 0;
  const timeLeft = minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left` : `${minutesLeft}m left`;
  const chromeCls = `transition-opacity duration-500 ${chrome || panel !== "none" || sel || noteFor ? "opacity-100" : "opacity-0 hover:opacity-100"}`;
  const light = t.chrome === "light";
  const ink = light ? "text-[#16140f]" : "text-ink";
  const muted = light ? "text-[#5a5445]" : "text-ink-muted";
  const subtle = light ? "text-[#75705f]" : "text-ink-subtle";
  const line = light ? "border-[#d6cdb8]" : "border-hairline";
  const panelBg = light ? "bg-[#ede6d6]" : "bg-surface-100";
  const hoverBg = light ? "hover:bg-black/5" : "hover:bg-surface-100";
  const iconBtn = `flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:text-gold ${hoverBg} ${muted}`;

  return (
    <div className={`fixed inset-0 flex flex-col ${ink}`} style={{ background: t.bg }}>
      {/* Top bar */}
      <header className={`flex h-14 shrink-0 items-center gap-1 border-b px-3 sm:px-5 ${line} ${chromeCls}`}>
        <Link href={book.backHref} className={iconBtn} aria-label="Back to book"><Icon name="arrow" className="rotate-180" size={18} /></Link>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate font-display text-[17px] font-semibold leading-tight">{book.title}</p>
          <p className={`truncate text-[11px] uppercase tracking-[0.14em] ${subtle}`}>{pos.chapter || book.author}</p>
        </div>
        <button type="button" onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"} className={`${iconBtn} ${bookmarked ? "!text-gold" : ""}`}>
          <Icon name="bookmark" size={18} style={bookmarked ? { fill: "currentColor" } : undefined} />
        </button>
        <button type="button" onClick={() => setPanel(panel === "marks" ? "none" : "marks")} aria-expanded={panel === "marks"} aria-label="Bookmarks and highlights" className={`${iconBtn} ${panel === "marks" ? "!text-gold" : ""}`}><Icon name="notes" size={18} /></button>
        <button type="button" onClick={() => setPanel(panel === "toc" ? "none" : "toc")} aria-expanded={panel === "toc"} aria-label="Contents" className={`${iconBtn} ${panel === "toc" ? "!text-gold" : ""}`}><Icon name="menu" size={18} /></button>
        <button type="button" onClick={() => setPanel(panel === "settings" ? "none" : "settings")} aria-expanded={panel === "settings"} aria-label="Reading settings" className={`${iconBtn} font-display text-[19px] ${panel === "settings" ? "!text-gold" : ""}`}>Aa</button>
        <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className={`${iconBtn} hidden sm:flex`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            {fullscreen ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /> : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
          </svg>
        </button>
      </header>

      {/* Page */}
      <div className="relative min-h-0 flex-1">
        {panel !== "none" && <button type="button" aria-label="Close panel" onClick={() => setPanel("none")} className="absolute inset-0 z-10 bg-black/40" />}

        {panel === "toc" && (
          <nav className={`absolute inset-y-0 left-0 z-20 w-80 max-w-[85%] overflow-y-auto border-r p-5 ${line} ${panelBg}`} aria-label="Contents">
            <p className="eyebrow mb-4 text-gold">Contents</p>
            <ul className="flex flex-col gap-0.5">
              {toc.map((x) => (
                <li key={x.id ?? x.href}>
                  <button type="button" onClick={() => goTo(x.href)} className={`w-full rounded-md px-3 py-2 text-left font-serif text-[15px] transition-colors ${hoverBg} ${x.label.trim() === pos.chapter ? "text-gold" : muted}`}>{x.label.trim()}</button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {panel === "marks" && (
          <aside className={`absolute inset-y-0 right-0 z-20 flex w-96 max-w-[90%] flex-col gap-6 overflow-y-auto border-l p-5 ${line} ${panelBg}`} aria-label="Bookmarks and highlights">
            <section>
              <p className="eyebrow mb-3 text-gold">Bookmarks</p>
              {ann.book.bookmarks.length === 0 ? <p className={`font-serif text-[14px] ${muted}`}>Press the bookmark icon (or <kbd>b</kbd>) to mark a page.</p> : (
                <ul className="flex flex-col gap-2">
                  {ann.book.bookmarks.map((b) => (
                    <li key={b.id} className={`group flex items-start gap-2 rounded-md border p-3 ${line}`}>
                      <button type="button" onClick={() => goTo(b.cfi)} className="min-w-0 flex-1 text-left">
                        <p className={`eyebrow mb-1 ${subtle}`} style={{ fontSize: 10 }}>{b.chapter || "Bookmark"}</p>
                        <p className={`line-clamp-2 font-serif text-[14px] ${ink}`}>{b.excerpt || "…"}</p>
                      </button>
                      <button type="button" onClick={() => ann.removeBookmark(b.id)} aria-label="Remove bookmark" className={`${subtle} hover:text-oxblood`}><Icon name="close" size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <p className="eyebrow mb-3 text-gold">Highlights &amp; notes</p>
              {ann.book.highlights.length === 0 ? <p className={`font-serif text-[14px] ${muted}`}>Select any passage to highlight it or add a note.</p> : (
                <ul className="flex flex-col gap-2">
                  {ann.book.highlights.map((h) => (
                    <li key={h.id} className={`group rounded-md border p-3 ${line}`}>
                      <button type="button" onClick={() => goTo(h.cfiRange)} className="w-full text-left">
                        <p className={`eyebrow mb-1 ${subtle}`} style={{ fontSize: 10 }}>{h.chapter || "Highlight"}</p>
                        <p className={`font-serif text-[14px] leading-snug ${ink}`} style={{ boxShadow: `inset 0 -0.45em 0 ${HL_COLORS[h.color]}` }}>{h.text.length > 180 ? h.text.slice(0, 180) + "…" : h.text}</p>
                        {h.note && <p className={`mt-2 border-l-2 border-gold pl-2 text-[13px] ${muted}`}>{h.note}</p>}
                      </button>
                      <div className="mt-2 flex gap-3 text-[12px]">
                        <button type="button" onClick={() => { setNoteFor(h); setNoteDraft(h.note ?? ""); setPanel("none"); }} className={`${muted} hover:text-gold`}>{h.note ? "Edit note" : "Add note"}</button>
                        <button type="button" onClick={() => deleteHighlight(h)} className={`${muted} hover:text-oxblood`}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        )}

        {panel === "settings" && (
          <aside className={`absolute right-4 top-2 z-20 w-80 max-w-[92%] rounded-lg border p-5 shadow-lift ${line} ${panelBg}`} aria-label="Reading settings">
            <p className="eyebrow mb-4 text-gold">Reading settings</p>
            <Row label="Theme">
              {(["dark", "sepia", "ivory"] as const).map((k) => (
                <button key={k} type="button" onClick={() => update({ theme: k })} aria-pressed={prefs.theme === k} className={`h-9 w-9 rounded-full border-2 ${prefs.theme === k ? "border-gold" : "border-transparent"}`} style={{ background: THEMES[k].bg }} aria-label={k} />
              ))}
            </Row>
            <Row label="Typeface">
              {(["serif", "sans", "display"] as const).map((k) => (
                <button key={k} type="button" onClick={() => update({ font: k })} aria-pressed={prefs.font === k} className={`h-9 rounded-md border px-3 text-[15px] ${prefs.font === k ? "border-gold text-gold" : `${line} ${muted}`}`} style={{ fontFamily: FONTS[k] }}>{k === "serif" ? "Serif" : k === "sans" ? "Sans" : "Garamond"}</button>
              ))}
            </Row>
            <Row label="Size">
              <button type="button" onClick={() => update({ size: Math.max(14, prefs.size - 1) })} className={`h-9 w-9 rounded-md border text-[13px] ${line} ${muted}`} aria-label="Smaller">A−</button>
              <span className={`w-10 text-center text-[13px] ${muted}`}>{prefs.size}</span>
              <button type="button" onClick={() => update({ size: Math.min(30, prefs.size + 1) })} className={`h-9 w-9 rounded-md border text-[17px] ${line} ${muted}`} aria-label="Larger">A+</button>
            </Row>
            <Row label="Spacing">
              {[1.5, 1.7, 1.9].map((v) => (
                <button key={v} type="button" onClick={() => update({ lineHeight: v })} aria-pressed={prefs.lineHeight === v} className={`h-9 rounded-md border px-3 text-[13px] ${prefs.lineHeight === v ? "border-gold text-gold" : `${line} ${muted}`}`}>{v === 1.5 ? "Tight" : v === 1.7 ? "Normal" : "Loose"}</button>
              ))}
            </Row>
            <Row label="Width">
              {(["narrow", "normal", "wide"] as const).map((k) => (
                <button key={k} type="button" onClick={() => update({ width: k })} aria-pressed={prefs.width === k} className={`h-9 rounded-md border px-3 text-[13px] capitalize ${prefs.width === k ? "border-gold text-gold" : `${line} ${muted}`}`}>{k}</button>
              ))}
            </Row>
          </aside>
        )}

        {status === "loading" && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${muted}`}>
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-hairline-strong border-t-gold" />
            <span className="font-display text-[18px] italic">Opening {book.title}…</span>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-[26px]">The book could not be opened.</p>
            <p className={`font-serif text-[15px] ${muted}`}>Check your connection and reload the page.</p>
          </div>
        )}

        <div className={`mx-auto h-full w-full px-6 py-6 sm:px-10 sm:py-8 ${WIDTHS[prefs.width]}`}>
          <div ref={mount} className="h-full w-full" />
        </div>

        {/* Selection popover */}
        {sel && (
          <div className={`absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border p-1 shadow-lift ${line} ${panelBg}`} style={{ left: Math.max(90, Math.min(sel.x, window.innerWidth - 90)), top: Math.max(70, sel.y - 8) }} role="toolbar" aria-label="Selection">
            {(["gold", "sage", "oxblood"] as const).map((c) => (
              <button key={c} type="button" onClick={() => highlightSelection(c)} aria-label={`Highlight ${c}`} className="h-8 w-8 rounded-full border border-black/10 transition-transform hover:scale-110" style={{ background: HL_COLORS[c].replace(/[\d.]+\)$/, "1)") }} />
            ))}
            <button type="button" onClick={noteOnSelection} className={`h-8 rounded-full px-3 text-[13px] ${ink} ${hoverBg}`}>Note</button>
            <button type="button" onClick={() => setSel(null)} aria-label="Dismiss" className={`${iconBtn} !h-8 !w-8`}><Icon name="close" size={13} /></button>
          </div>
        )}

        {/* Note editor */}
        {noteFor && (
          <div className={`absolute bottom-4 left-1/2 z-30 w-[min(560px,92%)] -translate-x-1/2 rounded-lg border p-4 shadow-lift ${line} ${panelBg}`}>
            <p className={`mb-2 line-clamp-2 font-serif text-[14px] ${muted}`} style={{ boxShadow: `inset 0 -0.45em 0 ${HL_COLORS[noteFor.color]}` }}>{noteFor.text}</p>
            <textarea autoFocus value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Your note…" rows={3}
              className={`w-full resize-none rounded-md border bg-transparent p-3 font-serif text-[15px] outline-none focus:border-gold ${line} ${ink}`} />
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => deleteHighlight(noteFor)} className={`text-[13px] ${muted} hover:text-oxblood`}>Delete highlight</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNoteFor(null)} className={`h-9 rounded-md px-3 text-[13px] ${muted}`}>Cancel</button>
                <button type="button" onClick={saveNote} className="h-9 rounded-md bg-gold px-4 text-[13px] font-medium text-on-accent hover:bg-gold-bright">Save note</button>
              </div>
            </div>
          </div>
        )}

        <button type="button" onClick={() => rendRef.current?.prev()} aria-label="Previous page"
          className={`absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur transition-all hover:border-gold hover:text-gold lg:flex ${line} ${muted} ${chromeCls}`}>
          <Icon name="arrow" className="rotate-180" size={18} />
        </button>
        <button type="button" onClick={() => rendRef.current?.next()} aria-label="Next page"
          className={`absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-gold-tint text-gold backdrop-blur transition-all hover:border-gold hover:bg-gold hover:text-on-accent lg:flex ${chromeCls}`}>
          <Icon name="arrow" size={18} />
        </button>
      </div>

      {/* Bottom bar */}
      <footer className={`flex h-11 shrink-0 items-center gap-4 border-t px-4 sm:px-6 ${line} ${chromeCls}`}>
        <button type="button" onClick={() => rendRef.current?.prev()} className={`${iconBtn} !h-9 !w-9 lg:hidden`} aria-label="Previous page"><Icon name="arrow" className="rotate-180" size={16} /></button>
        <span className={`hidden shrink-0 text-[12px] tabular-nums sm:block ${subtle}`}>{pos.total ? `Page ${pos.loc.toLocaleString()} of ${pos.total.toLocaleString()}` : ""}</span>
        <div className={`h-px flex-1 ${light ? "bg-black/15" : "bg-surface-300"}`}><div className="h-px bg-gold transition-[width] duration-500" style={{ width: `${pos.pct}%` }} /></div>
        <span className={`shrink-0 text-[12px] tabular-nums ${subtle}`}>{pos.pct}%{pos.total ? <span className="hidden sm:inline"> · {timeLeft}</span> : null}</span>
        <button type="button" onClick={() => rendRef.current?.next()} className={`${iconBtn} !h-9 !w-9 lg:hidden`} aria-label="Next page"><Icon name="arrow" size={16} /></button>
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 last:mb-0">
      <span className="eyebrow text-ink-subtle" style={{ fontSize: 10 }}>{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
