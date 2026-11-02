/**
 * Site-level configuration. Edit here, not in components.
 */
export const site = {
  name: "The Polymath Library",
  tagline: "Explore Knowledge. Expand Perspective.",
  author: "Lumora Labs",
  /** Footer links. Replace the hrefs with your real profiles. */
  social: [
    { label: "YouTube", href: "https://www.youtube.com/", icon: "M22 8.5c0-1.6-1.2-2.9-2.8-3.1C16.6 5 12 5 12 5s-4.6 0-7.2.4C3.2 5.6 2 6.9 2 8.5v7c0 1.6 1.2 2.9 2.8 3.1C7.4 19 12 19 12 19s4.6 0 7.2-.4c1.6-.2 2.8-1.5 2.8-3.1zM10 15.5v-7l6 3.5z" },
    { label: "GitHub", href: "https://github.com/deepak-pro77", icon: "M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" },
    { label: "Website", href: "https://lumoralabs.example", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" },
  ],

  /**
   * Homepage hero photograph, served from /public. Set to e.g. "/images/hero.jpg", or null for the drawn scene only.
   * Museum photographs (The Met Open Access, Wikimedia Commons) sit on a grey studio backdrop; the hero keys that
   * backdrop into the dark so the statue appears lit from the darkness.
   */
  heroImage: "/images/hero.jpg" as string | null,
  heroImageCredit: "Marble portrait bust of the emperor Gaius (Caligula), 37–41 CE · The Met, public domain" as string | null,
  heroImageStyle: {
    /** "cover" crops to the panel (head and shoulders); "contain" shows the whole object. */
    fit: "cover" as "contain" | "cover",
    /** Which part of the photo to keep. "center 22%" keeps the face in the upper part of the panel. */
    position: "center 22%",
    /** Zoom. 1 = as cropped by the panel; 0.85 pulls back to show more shoulders; 1.15 moves closer. */
    scale: 1,
    /** Panel left edge and width, as % of the banner. */
    left: 50,
    width: 34,
    /** Lower = darker backdrop (0.5–0.8). Higher contrast = backdrop falls to black faster (1.6–2.4). */
    brightness: 0.62,
    contrast: 2.2,
    /** Warmth of the marble, 0–1. */
    sepia: 0.55,
  },

  /**
   * Optional library-hall photograph behind everything (a reading room, a baroque library). Public domain / CC0 only —
   * Wikimedia Commons: search "library interior" and open a file whose licence box says CC0 or Public domain.
   * It is dimmed, warmed and faded toward the text so the title stays legible.
   */
  heroBackground: "/images/library.jpg",
  heroBackgroundCredit: "Trinity College Long Room · photo: <author>, CC BY-SA 4.0",
  heroBackgroundStyle: {
    position: "center 40%",
    /** 0.35–0.6. Lower keeps the mood dark. */
    opacity: 0.45,
    brightness: 0.55,
    sepia: 0.5,
  },
};