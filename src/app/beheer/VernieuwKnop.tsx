"use client";
// Haalt de nieuwste gegevens op (bv. pas binnengekomen meldingen) zonder de hele pagina te herladen.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function uur(d: Date) {
  return d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });
}

export default function VernieuwKnop() {
  const router = useRouter();
  const [bezig, start] = useTransition();
  const [tijd, setTijd] = useState<string>("");

  useEffect(() => setTijd(uur(new Date())), []);

  return (
    <button
      type="button"
      className="knop secundair klein"
      disabled={bezig}
      title={tijd ? `Laatst bijgewerkt om ${tijd}` : undefined}
      onClick={() =>
        start(() => {
          router.refresh();
          setTijd(uur(new Date()));
        })
      }
    >
      <span className={bezig ? "draait" : ""} aria-hidden>⟳</span> {bezig ? "Bezig…" : "Vernieuwen"}
      {tijd && !bezig && <span className="bijgewerkt">({tijd})</span>}
    </button>
  );
}
