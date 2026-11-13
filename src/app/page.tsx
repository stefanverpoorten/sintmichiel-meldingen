import Meldingsformulier from "./Meldingsformulier";
import { CAMPUSSEN } from "@/lib/constanten";

export default function Home() {
  return (
    <>
      <div className="balk" />
      <main className="publiek">
        <div className="publiek-kop">
          <img src="/logo.jpg" alt="Sint-Michiel" />
        </div>
        <Meldingsformulier campussen={[...CAMPUSSEN]} />
      </main>
    </>
  );
}
