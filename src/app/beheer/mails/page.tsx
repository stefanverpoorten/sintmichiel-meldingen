import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { datumTijd } from "@/lib/datum";
import { MAIL_TYPE_LABEL } from "@/lib/constanten";
import { config } from "@/lib/config";
import { MailStatus, Beschrijving } from "../Velden";
import MailSjablonen, { type SjabloonRij } from "./MailSjablonen";
import { SJABLOON_TYPES, STANDAARD } from "@/lib/sjabloon";

export const dynamic = "force-dynamic";

export default async function Mails({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const { fout } = await searchParams;
  const opgeslagen = await prisma.mailSjabloon.findMany();
  const sjablonen: SjabloonRij[] = SJABLOON_TYPES.map((type) => {
    const s = opgeslagen.find((x) => x.type === type);
    return {
      type,
      onderwerp: s?.onderwerp ?? STANDAARD[type].onderwerp,
      inhoud: s?.inhoud ?? STANDAARD[type].inhoud,
      aangepast: !!s,
      gewijzigd: s ? datumTijd(s.gewijzigdOp) : null,
    };
  });
  const mails = await prisma.mail.findMany({
    where: fout ? { status: "MISLUKT" } : undefined,
    orderBy: { aangemaakt: "desc" },
    take: 300,
    include: { aanvraag: { select: { id: true, volgnummer: true } } },
  });
  return (
    <main className="inhoud">
      <div className="titelrij">
        <h1>Mails</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className={`knop ${fout ? "secundair" : ""}`} href="/beheer/mails">Alle</Link>
          <Link className={`knop ${fout ? "" : "secundair"}`} href="/beheer/mails?fout=1">Enkel mislukte</Link>
        </div>
      </div>
      <MailSjablonen sjablonen={sjablonen} />
      <h2>Verstuurde mails</h2>
      <p className="intro">
        Afzender: <strong>{config.afzender || "(MAIL_FROM niet ingesteld)"}</strong> – modus:{" "}
        <strong>{config.mailTestmodus ? "TEST (niets wordt echt verstuurd)" : "LIVE"}</strong>. De laatste 300 mails.
      </p>
      <div className="tabel-wrap">
        {mails.length === 0 ? (
          <p className="leeg">Geen mails.</p>
        ) : (
          <table className="lijst">
            <thead>
              <tr>
                <th>Aangemaakt</th>
                <th>Aanvraag</th>
                <th>Soort mail</th>
                <th>Aan</th>
                <th>Onderwerp</th>
                <th>Status</th>
                <th>Pogingen</th>
              </tr>
            </thead>
            <tbody>
              {mails.map((m) => (
                <tr key={m.id}>
                  <td className="nowrap">{datumTijd(m.aangemaakt)}</td>
                  <td className="nr">
                    {m.aanvraag ? <Link href={`/beheer/aanvraag/${m.aanvraag.id}`}>{m.aanvraag.volgnummer}</Link> : "–"}
                  </td>
                  <td>{MAIL_TYPE_LABEL[m.type]}</td>
                  <td>{m.aan}</td>
                  <td>
                    <Beschrijving tekst={m.onderwerp} titel="Onderwerp" max={60} />
                  </td>
                  <td>
                    <MailStatus mail={{ id: m.id, status: m.status, fout: m.fout, tijd: datumTijd(m.verstuurdOp ?? m.aangemaakt) }} />
                  </td>
                  <td>{m.pogingen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
