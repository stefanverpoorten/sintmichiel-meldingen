import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  // Het formulier en het beheer nooit uit de browsercache tonen: altijd de nieuwste versie.
  async headers() {
    const geenCache = [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" }];
    return [
      { source: "/", headers: geenCache },
      { source: "/beheer/:pad*", headers: geenCache },
      { source: "/aanmelden", headers: geenCache },
    ];
  },
};

export default withBotId(nextConfig);
