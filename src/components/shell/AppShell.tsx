"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { AccountSync } from "@/lib/sync";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The reader is its own room: no sidebar, header or footer.
  if (pathname.startsWith("/read/")) {
    return <ThemeProvider><AuthProvider><AccountSync />{children}</AuthProvider></ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
      <AccountSync />
      <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <div className="lg:border-r lg:border-hairline lg:bg-surface-100">
          <Sidebar open={open} onClose={() => setOpen(false)} />
        </div>
        <div className="relative flex min-h-dvh min-w-0 flex-col">
          <TopBar onMenu={() => setOpen(true)} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
