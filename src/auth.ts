// Inloggen voor beheerders via Microsoft 365 (Entra ID).
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { config, isBeheerder } from "@/lib/config";

const providers: Provider[] = [
  MicrosoftEntraID({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`,
    authorization: { params: { scope: "openid profile email User.Read" } },
  }),
];

// Testlogin zonder Microsoft – enkel lokaal (AUTH_DEV_LOGIN=true en niet op Vercel).
if (config.devLogin) {
  providers.push(
    Credentials({
      id: "testlogin",
      name: "Testlogin",
      credentials: { email: { label: "E-mail", type: "email" } },
      authorize(c) {
        const email = String(c?.email ?? "").toLowerCase();
        return isBeheerder(email) ? { id: email, email, name: email } : null;
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/aanmelden", error: "/aanmelden" },
  trustHost: true,
  callbacks: {
    signIn({ user, profile }) {
      const email = (
        (profile?.email as string | undefined) ??
        (profile?.preferred_username as string | undefined) ??
        user.email ??
        ""
      ).toLowerCase();
      if (!isBeheerder(email)) {
        console.warn(`Aanmelden geweigerd voor "${email}": niet in ADMIN_EMAILS (${config.beheerders.length} adres(sen) ingesteld).`);
        return `/aanmelden?fout=geen-toegang&als=${encodeURIComponent(email)}`;
      }
      user.email = email;
      return true;
    },
    jwt({ token, user, profile }) {
      if (user?.email) token.email = user.email.toLowerCase();
      if (profile?.preferred_username && !token.email)
        token.email = String(profile.preferred_username).toLowerCase();
      return token;
    },
    session({ session, token }) {
      if (token.email) session.user.email = token.email as string;
      return session;
    },
  },
});
