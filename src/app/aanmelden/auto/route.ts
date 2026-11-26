// Snel automatisch aanmelden vanuit DRBS: geen tussenpagina, meteen door.
// Al aangemeld → meteen naar /beheer. Anders → meteen naar Microsoft; wie al bij Microsoft
// aangemeld is (via DRBS), komt zonder klikken of wachtwoord terug.
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { auth, signIn } from "@/auth";
import { isBeheerder } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (isBeheerder((await auth())?.user?.email)) return NextResponse.redirect(new URL("/beheer", req.url));
  try {
    await signIn("microsoft-entra-id", { redirectTo: "/beheer" });
  } catch (e) {
    unstable_rethrow(e); // de doorverwijzing naar Microsoft zelf
    console.error("[auth] Automatisch aanmelden mislukt:", e instanceof Error ? e.name : "onbekend");
  }
  return NextResponse.redirect(new URL("/aanmelden?error=Configuration", req.url));
}
