import Link from "next/link";
import { signOut } from "@/auth";
import { vereisBeheerder } from "@/lib/toegang";
import { config } from "@/lib/config";
import Navigatie from "./Navigatie";
import { ToastProvider } from "./Toast";
import VernieuwKnop from "./VernieuwKnop";

export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  const email = await vereisBeheerder();
  return (
    <>
      <div className="balk niet-afdrukken" />
      {config.mailTestmodus && (
        <div className="testbanner niet-afdrukken">
          TESTMODUS – mails worden niet echt verstuurd, enkel gelogd (zie &quot;Mails&quot;).
        </div>
      )}
      <header className="kop niet-afdrukken">
        <div className="kop-binnen">
          <Link href="/beheer">
            <img src="/logo.jpg" alt="Sint-Michiel" />
          </Link>
          <Navigatie />
          <div className="gebruiker">
            <VernieuwKnop />
            <span>{email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/aanmelden" });
              }}
            >
              <button className="knop secundair klein" type="submit">Afmelden</button>
            </form>
          </div>
        </div>
      </header>
      <ToastProvider>{children}</ToastProvider>
    </>
  );
}
