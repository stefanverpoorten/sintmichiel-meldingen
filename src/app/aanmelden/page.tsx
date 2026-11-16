import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { config, isBeheerder } from "@/lib/config";
import { controleerLoginInstellingen } from "@/lib/configCheck";

export default async function Aanmelden({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string; error?: string; als?: string }>;
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
              Je account heeft geen toegang tot het beheer.
              {sp.als && (
                <>
                  <br />
                  <small>
                    Microsoft meldde je aan als <strong>{String(sp.als).slice(0, 120)}</strong>. Dat adres staat
                    niet in de lijst ADMIN_EMAILS.
                  </small>
                </>
              )}
              {config.beheerders.length === 0 && (
                <>
                  <br />
                  <small>
                    ADMIN_EMAILS is leeg of ontbreekt in Vercel (Settings → Environment Variables, met
                    Production aangevinkt).
                  </small>
                </>
              )}
            </div>
          )}
          {sp.error && !geenToegang && (
            <div className="melding fout">
              Aanmelden is mislukt. Probeer het opnieuw.
              <br />
              <small>
                Foutcode: <strong>{String(sp.error).slice(0, 40)}</strong>
              </small>
              {sp.error === "Configuration" && (() => {
                const problemen = controleerLoginInstellingen();
                return problemen.length > 0 ? (
                  <ul style={{ textAlign: "left", margin: "8px 0 0", paddingLeft: 18, fontSize: ".9rem" }}>
                    {problemen.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ textAlign: "left", fontSize: ".9rem", margin: "8px 0 0" }}>
                    De instellingen zijn aanwezig en hebben de juiste vorm. Waarschijnlijk klopt een waarde niet
                    (bv. secret vervallen of van een andere app). Bekijk de details in Vercel → Logs (zoek op
                    &quot;[auth][error]&quot;).
                  </p>
                );
              })()}
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
