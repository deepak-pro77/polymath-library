import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="eyebrow text-gold">404</span>
      <h1 className="font-display text-[48px] font-medium leading-none text-ink">This shelf is empty.</h1>
      <p className="font-serif text-[17px] text-ink-muted">The page you were looking for isn&rsquo;t in the catalogue.</p>
      <Link href="/library" className="mt-2 inline-flex h-11 items-center rounded-md bg-gold px-5 text-[14px] font-medium text-on-accent hover:bg-gold-bright">Back to the library</Link>
    </div>
  );
}
