import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { config, isBeheerder } from "@/lib/config";

export default async function Aanmelden({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string; error?: string }>;
}) {
  const sessie = await auth();
  if (isBeheerder(sessie?.user?.email)) redirect("/beheer");
  const sp = await searchParams;
  const geenToegang = sp.fout === "geen-toegang" || sp.error === "AccessDenied";

  return (
    <>
      <div className="balk" />
      <main className="aanmelden">
        <img src="/logo.jpg" alt="Sint-Michiel" />
        <div className="kaart">
          <h1>Beheer meldingen</h1>
          <p className="intro">Enkel voor de directie en de beheerder.</p>
          {geenToegang && (
            <div className="melding fout">
              Je account heeft geen toegang tot het beheer. Vraag de beheerder om je toe te voegen.
            </div>
          )}
          {sp.error && !geenToegang && (
            <div className="melding fout">
              Aanmelden is mislukt. Probeer het opnieuw.
              <br />
              <small>
                Foutcode: <strong>{String(sp.error).slice(0, 40)}</strong>
                {sp.error === "Configuration" &&
                  " – controleer AUTH_SECRET, ENTRA_TENANT_ID, AUTH_MICROSOFT_ENTRA_ID_ID en AUTH_MICROSOFT_ENTRA_ID_SECRET in Vercel."}
              </small>
            </div>
          )}
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/beheer" });
            }}
          >
            <button className="knop groot" type="submit">
              Aanmelden met Microsoft 365
            </button>
          </form>

          {config.devLogin && (
            <form
              style={{ marginTop: 24, textAlign: "left" }}
              action={async (fd: FormData) => {
                "use server";
                await signIn("testlogin", { email: fd.get("email"), redirectTo: "/beheer" });
              }}
            >
              <div className="melding info">
                Testlogin (enkel lokaal zichtbaar): meld aan met een adres uit ADMIN_EMAILS.
              </div>
              <input type="email" name="email" defaultValue={config.beheerders[0] ?? ""} />
              <button className="knop secundair" style={{ marginTop: 8 }} type="submit">
                Testlogin
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
