import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/600.css";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: { default: "The Polymath Library", template: "%s · The Polymath Library" },
  description: "One hundred books across every discipline of human knowledge. A premium digital reading room.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a08",
};

// Applies the saved theme before paint so there is no flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem("polymath:theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
