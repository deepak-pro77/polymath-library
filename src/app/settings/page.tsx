import type { Metadata } from "next";
import { Settings } from "@/components/me/Settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow text-gold">Preferences</span>
        <h1 className="font-display text-[44px] font-medium leading-none text-ink sm:text-[56px]">Settings</h1>
      </header>
      <Settings />
    </div>
  );
}
