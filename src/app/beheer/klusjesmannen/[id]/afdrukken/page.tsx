import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { datum } from "@/lib/datum";
import { SOORT_LABEL } from "@/lib/constanten";
import AfdrukKnop from "./AfdrukKnop";

export const dynamic = "force-dynamic";

export default async function Afdruklijst({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = await prisma.klusjesman.findUnique({ where: { id } });
  if (!k) notFound();
  const aanvragen = await prisma.aanvraag.findMany({
    where: { klusjesmanId: id, status: "G", OR: [{ controle: null }, { controle: "NOK" }] },
    orderBy: [{ prioriteit: { sort: "asc", nulls: "last" } }, { campus: "asc" }, { ingediendOp: "asc" }],
  });
  return (
    <main className="afdruk">
      <div className="niet-afdrukken" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Link className="knop secundair" href="/beheer/klusjesmannen">← Terug</Link>
        <AfdrukKnop />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Werklijst – {k.naam}</h1>
          <div>Afgedrukt op {datum(new Date())} – {aanvragen.length} openstaande aanvra{aanvragen.length === 1 ? "ag" : "gen"}</div>
        </div>
        <img src="/logo.jpg" alt="Sint-Michiel" style={{ height: 44 }} />
      </div>
      {aanvragen.length === 0 ? (
        <p>Geen openstaande aanvragen.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Prio</th>
              <th>Nr.</th>
              <th>Soort</th>
              <th>Campus</th>
              <th>Locatie</th>
              <th>Beschrijving</th>
              <th>Klaar</th>
            </tr>
          </thead>
          <tbody>
            {aanvragen.map((a) => (
              <tr key={a.id}>
                <td style={{ textAlign: "center" }}>{a.prioriteit ? <span className={`label prio-${a.prioriteit}`}>{a.prioriteit}</span> : "–"}</td>
                <td style={{ whiteSpace: "nowrap" }}>{a.volgnummer}</td>
                <td>{SOORT_LABEL[a.soort]}</td>
                <td style={{ whiteSpace: "nowrap" }}>{a.campus}</td>
                <td>{a.locatie}</td>
                <td style={{ whiteSpace: "pre-wrap" }}>{a.beschrijving}</td>
                <td style={{ textAlign: "center" }}><span className="vak" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
