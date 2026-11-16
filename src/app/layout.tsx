import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meldingen technische dienst – Sint-Michiel",
  description: "Meld een defect of vraag een taak aan bij de technische dienst.",
  robots: { index: false, follow: false },
  applicationName: "Meldingen",
  appleWebApp: { capable: true, title: "Meldingen", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d5e69",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl-BE">
      <body>{children}</body>
    </html>
  );
}
