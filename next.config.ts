import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Alleen het gecombineerde formulier (FORMULIER_URL) mag het formulier op "/" in een kader tonen.
// Alle andere pagina's (het beheer) mogen nergens ingebed worden.
function formulierOrigin(): string {
  try {
    return process.env.FORMULIER_URL ? new URL(process.env.FORMULIER_URL.trim()).origin : "";
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  // Het formulier en het beheer nooit uit de browsercache tonen: altijd de nieuwste versie.
  async headers() {
    const geenCache = [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }];
    const kaderFormulier = [{ key: "Content-Security-Policy", value: `frame-ancestors 'self' ${formulierOrigin()}`.trim() }];
    const geenKader = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [
      { source: "/", headers: [...geenCache, ...kaderFormulier] },
      { source: "/:pad+", headers: geenKader },
      { source: "/beheer/:pad*", headers: geenCache },
      { source: "/aanmelden", headers: geenCache },
    ];
  },
};

export default withBotId(nextConfig);
