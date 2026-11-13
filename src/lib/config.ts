// Alle instellingen komen uit omgevingsvariabelen (in Vercel: Settings → Environment Variables).

function lijst(waarde: string | undefined): string[] {
  return (waarde ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  get beheerders() {
    return lijst(process.env.ADMIN_EMAILS);
  },
  get meldingOntvangers() {
    return lijst(process.env.NOTIFY_EMAILS);
  },
  get afzender() {
    return (process.env.MAIL_FROM ?? "").trim();
  },
  /** "live" = echt versturen, alles anders = testmodus (enkel loggen) */
  get mailTestmodus() {
    return (process.env.MAIL_MODE ?? "test").toLowerCase() !== "live";
  },
  get tenantId() {
    return process.env.ENTRA_TENANT_ID ?? "";
  },
  get clientId() {
    return process.env.AUTH_MICROSOFT_ENTRA_ID_ID ?? "";
  },
  get clientSecret() {
    return process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ?? "";
  },
  get appUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return "http://localhost:3000";
  },
  get rateLimitMax() {
    return Number(process.env.RATE_LIMIT_MAX ?? 5);
  },
  get rateLimitMinuten() {
    return Number(process.env.RATE_LIMIT_WINDOW_MIN ?? 15);
  },
  /** Testlogin zonder Microsoft: enkel lokaal, nooit op Vercel. */
  get devLogin() {
    return process.env.AUTH_DEV_LOGIN === "true" && !process.env.VERCEL;
  },
};

export function isBeheerder(email: string | null | undefined): boolean {
  if (!email) return false;
  return config.beheerders.includes(email.toLowerCase());
}
