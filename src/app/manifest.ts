import type { MetadataRoute } from "next";

// Maakt het formulier installeerbaar als "app" op gsm (Zet op beginscherm / App installeren).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meldingen technische dienst – Sint-Michiel",
    short_name: "Meldingen",
    description: "Meld een defect of vraag een taak aan bij de technische dienst.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6f7",
    theme_color: "#2d5e69",
    lang: "nl-BE",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
