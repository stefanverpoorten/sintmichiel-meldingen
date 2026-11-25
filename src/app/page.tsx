import Meldingsformulier, { type SoortCode } from "./Meldingsformulier";
import Ingebed from "./Ingebed";
import { CAMPUSSEN } from "@/lib/constanten";
import { formulierOrigin } from "@/lib/ingebed";

export const dynamic = "force-dynamic";

const SOORTEN: SoortCode[] = ["DEFECT", "TAAK", "GEVAARLIJK"];

export default async function Home({ searchParams }: { searchParams: Promise<{ soort?: string; ingebed?: string }> }) {
  const sp = await searchParams;
  const ouder = sp.ingebed === "1" ? formulierOrigin() : null;
  const vasteSoort = SOORTEN.find((s) => s === sp.soort) ?? null;
  return (
    <>
      {!ouder && <div className="balk" />}
      <main className="publiek">
        {!ouder && (
          <div className="publiek-kop">
            <img src="/logo.jpg" alt="Sint-Michiel" />
          </div>
        )}
        <Meldingsformulier campussen={[...CAMPUSSEN]} vasteSoort={vasteSoort} ouder={ouder} />
      </main>
      <Ingebed ouder={ouder} />
    </>
  );
}
