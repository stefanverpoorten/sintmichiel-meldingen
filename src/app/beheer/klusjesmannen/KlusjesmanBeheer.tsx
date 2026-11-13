"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { klusjesmanActief, klusjesmanToevoegen, klusjesmanWijzigen, type Resultaat } from "../acties";
import { useToast } from "../Toast";

type K = { id: string; naam: string; actief: boolean; open: number };

export default function KlusjesmanBeheer({ lijst }: { lijst: K[] }) {
  const [nieuw, setNieuw] = useState("");
  const [bewerk, setBewerk] = useState<{ id: string; naam: string } | null>(null);
  const [bezig, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function doe(fn: () => Promise<Resultaat>, na?: () => void) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.melding) toast(r.melding);
        na?.();
      } else toast(r.fout, true);
      router.refresh();
    });
  }

  return (
    <>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          doe(() => klusjesmanToevoegen(nieuw), () => setNieuw(""));
        }}
      >
        <label style={{ flex: 1 }}>
          Nieuwe klusjesman
          <input type="text" value={nieuw} onChange={(e) => setNieuw(e.target.value)} placeholder="Naam" style={{ width: "100%" }} />
        </label>
        <button className="knop" disabled={bezig || !nieuw.trim()}>Toevoegen</button>
      </form>

      <div className="tabel-wrap">
        {lijst.length === 0 ? (
          <p className="leeg">Nog geen klusjesmannen. Voeg hierboven de eerste toe.</p>
        ) : (
          <table className="lijst">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Actief</th>
                <th>Openstaand</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lijst.map((k) => (
                <tr key={k.id}>
                  <td>
                    {bewerk?.id === k.id ? (
                      <form
                        style={{ display: "flex", gap: 6 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          doe(() => klusjesmanWijzigen(k.id, bewerk.naam), () => setBewerk(null));
                        }}
                      >
                        <input type="text" value={bewerk.naam} autoFocus onChange={(e) => setBewerk({ id: k.id, naam: e.target.value })} />
                        <button className="knop klein" disabled={bezig}>Bewaren</button>
                        <button className="knop secundair klein" type="button" onClick={() => setBewerk(null)}>Annuleren</button>
                      </form>
                    ) : (
                      <strong style={{ color: k.actief ? undefined : "var(--grijs)" }}>{k.naam}</strong>
                    )}
                  </td>
                  <td>
                    <span className={`label ${k.actief ? "ok" : "grijs"}`}>{k.actief ? "actief" : "inactief"}</span>
                  </td>
                  <td>{k.open}</td>
                  <td className="nowrap" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Link className="knop klein" href={`/beheer/klusjesmannen/${k.id}/afdrukken`}>🖨 Afdruklijst</Link>
                    <button className="knop secundair klein" onClick={() => setBewerk({ id: k.id, naam: k.naam })}>Naam wijzigen</button>
                    <button className="knop secundair klein" disabled={bezig} onClick={() => doe(() => klusjesmanActief(k.id, !k.actief))}>
                      {k.actief ? "Op inactief zetten" : "Opnieuw actief maken"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
