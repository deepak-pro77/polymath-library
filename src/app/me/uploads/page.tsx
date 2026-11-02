import type { Metadata } from "next";
import { Uploads } from "@/components/me/Uploads";

export const metadata: Metadata = { title: "Your copies" };

export default function UploadsPage() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">Private shelf</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">Your copies</h1>
        <p className="max-w-[60ch] font-serif text-[17px] text-ink-muted">Books you own, read here with the same reader, highlights and notes. Visible only to your account.</p>
      </header>
      <Uploads />
    </div>
  );
}
