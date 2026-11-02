import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/config/site";

/**
 * Hero banner, back to front:
 *   night sky → optional library photograph (dimmed, warm) → stars + faint arches → statue photograph (keyed) → globe.
 * Both photographs are configured in site.ts; nothing here is required.
 */
const stars = Array.from({ length: 90 }, (_, i) => {
  const s = (i * 9301 + 49297) % 233280;
  const t = (i * 7919 + 104729) % 233280;
  return { x: (s / 233280) * 1400, y: (t / 233280) * 260, r: 0.4 + ((i * 37) % 10) / 10, d: (i % 7) * 0.6 };
});

export function Hero() {
  const img = site.heroImage;
  // tone / glow / scale are optional in site.ts; older configs without them get the marble look.
  const cfg: typeof site.heroImageStyle & { tone?: "marble" | "gilded"; glow?: number; scale?: number } = site.heroImageStyle;
  const st = { ...cfg, tone: cfg.tone ?? "marble", glow: cfg.glow ?? 0.9, scale: cfg.scale ?? 1 };
  const bg = site.heroBackground;
  const bs = site.heroBackgroundStyle;
  return (
    // data-theme="dark" pins the banner to the night palette whatever the site theme is.
    <section data-theme="dark" className="relative overflow-hidden rounded-lg border border-gold/15 bg-surface-100 text-ink" aria-labelledby="hero-title">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* night sky */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_90%_at_70%_-10%,#1c2238_0%,#15141a_38%,#0f0d0b_70%)]" />

        {/* library photograph, dimmed and warmed, fading out toward the text */}
        {bg && (
          <div className="absolute inset-0 [mask-image:linear-gradient(90deg,transparent_8%,black_45%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg} alt="" className="h-full w-full object-cover" style={{ objectPosition: bs.position, opacity: bs.opacity, filter: `sepia(${bs.sepia}) brightness(${bs.brightness}) contrast(1.1) saturate(0.8)` }} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,13,11,0.55),transparent_40%,rgba(15,13,11,0.6))]" />
          </div>
        )}

        {/* stars and faint arches (drawn, subtle) */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1400 420" preserveAspectRatio="xMidYMax slice">
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--gold-bright)" style={{ animation: `twinkle ${3 + (i % 5)}s ease-in-out ${s.d}s infinite` }} />
          ))}
          {!bg && [620, 860, 1100].map((x) => (
            <g key={x} stroke="var(--gold)" fill="none">
              <path d={`M${x} 420 V250 A100 100 0 0 1 ${x + 200} 250 V420`} strokeOpacity="0.22" strokeWidth="1.2" />
              {[292, 334, 376].map((y) => <line key={y} x1={x + 18} y1={y} x2={x + 182} y2={y} strokeOpacity="0.16" />)}
            </g>
          ))}
        </svg>

        {/* keep the text side dark and legible */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface-100)_0%,rgba(18,17,13,0.88)_28%,rgba(18,17,13,0.35)_50%,transparent_68%)]" />

        {/* ember clouds, low in the frame (gilded tone only) */}
        {img && st.tone === "gilded" && (
          <>
            <div className="absolute -bottom-10 left-[30%] h-[70%] w-[50%] rounded-full bg-[radial-gradient(closest-side,rgba(214,120,40,0.28),rgba(160,80,20,0.12)_55%,transparent)] blur-2xl" style={{ opacity: st.glow }} />
            <div className="absolute -bottom-16 right-[2%] h-[80%] w-[36%] rounded-full bg-[radial-gradient(closest-side,rgba(226,140,56,0.22),transparent_70%)] blur-3xl" style={{ opacity: st.glow }} />
          </>
        )}

        {/* statue, keyed into the dark */}
        {img && (
          <div
            className="absolute inset-y-0 [mask-composite:intersect] [mask-image:radial-gradient(ellipse_50%_70%_at_50%_55%,black_50%,transparent_100%),linear-gradient(180deg,black_0%,black_78%,transparent_100%)]"
            style={{ left: `${st.left}%`, width: `${st.width}%` }}
          >
            {/* halo: a blurred, brightened copy of the statue behind itself */}
            {st.tone === "gilded" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full mix-blend-screen"
                style={{
                  objectFit: st.fit, objectPosition: st.position, transform: `scale(${st.scale * 1.04})`, transformOrigin: st.position,
                  filter: `grayscale(1) brightness(${st.brightness * 1.1}) contrast(${st.contrast}) sepia(1) saturate(4) hue-rotate(-12deg) blur(22px)`,
                  opacity: 0.55 * st.glow,
                }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              className="relative h-full w-full mix-blend-screen"
              style={{
                objectFit: st.fit, objectPosition: st.position, transform: `scale(${st.scale})`, transformOrigin: st.position,
                filter: st.tone === "gilded"
                  ? `grayscale(1) brightness(${st.brightness}) contrast(${st.contrast}) sepia(1) saturate(2.4) hue-rotate(-8deg)`
                  : `grayscale(1) brightness(${st.brightness}) contrast(${st.contrast}) sepia(${st.sepia})`,
              }}
            />
            {/* rim light from the upper left, like a lamp */}
            <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_40%_30%,rgba(255,200,120,0.28),transparent_70%)] mix-blend-overlay" />
          </div>
        )}

        {/* warm floor glow */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(212,184,114,0.08))]" />
      </div>

      <div className="relative flex min-h-[360px] flex-col justify-end gap-4 px-6 pb-9 pt-24 sm:px-10 lg:max-w-[52%] lg:px-12 lg:pb-11">
        <h1 id="hero-title" className="reveal font-brand text-[clamp(34px,4.4vw,56px)] font-semibold leading-[1.05] tracking-[0.02em] gold-text">
          The Polymath Library
        </h1>
        <p className="reveal reveal-2 font-display text-[clamp(21px,2.3vw,27px)] italic leading-tight text-ink">{site.tagline}</p>
        <p className="reveal reveal-3 max-w-[48ch] font-serif text-[16px] leading-relaxed text-ink-muted">
          A curated collection of 100 timeless books across history, science, philosophy, technology and more.
        </p>
        <div className="reveal reveal-4 mt-1 flex flex-wrap items-center gap-3">
          <Link href="/library" className="inline-flex h-11 items-center gap-2 rounded-md bg-gold px-5 text-[14px] font-semibold text-on-accent shadow-glow transition-colors duration-200 hover:bg-gold-bright">
            <Icon name="library" size={17} /> Start Exploring <Icon name="arrow" size={15} />
          </Link>
          <Link href="/me/journey" className="inline-flex h-11 items-center gap-2 rounded-md border border-gold/40 px-5 text-[14px] font-medium text-ink transition-colors duration-200 hover:border-gold hover:text-gold">
            My Journey
          </Link>
        </div>
        {(img || bg) && (
          <p className="text-[10px] text-ink-subtle/70">
            {[img && site.heroImageCredit, bg && site.heroBackgroundCredit].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}