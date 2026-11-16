"use client";
import Link from "next/link";
import type { KlusjesmanOptie, Rij } from "@/lib/overzicht";
import type { Weergave } from "@/lib/filters";
import {
  ActieKnop,
  Beschrijving,
  ControleVeld,
  KlusjesmanVeld,
  MailVinkje,
  Miniaturen,
  OpmerkingVeld,
  PrioriteitVeld,
  StatusVeld,
} from "./Velden";
import { zetTerugUitArchief, zetTerugUitNG } from "./acties";

export default function Tabel({
  rijen,
  weergave,
  klusjesmannen,
}: {
  rijen: Rij[];
  weergave: Weergave;
  klusjesmannen: KlusjesmanOptie[];
}) {
  if (rijen.length === 0) {
    return (
      <div className="tabel-wrap">
        <p className="leeg">Geen aanvragen gevonden.</p>
      </div>
    );
  }
  const actief = weergave === "actief";
  return (
    <div className="tabel-wrap">
      <table className="lijst">
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Ingediend</th>
            <th>Naam</th>
            <th>Soort</th>
            <th>Campus</th>
            <th>Locatie</th>
            <th>Beschrijving</th>
            <th>Foto&apos;s</th>
            <th>Status</th>
            {weergave === "ng" && <th>Reden NG</th>}
            <th>Mail</th>
            <th>Prio</th>
            <th>Toegewezen aan</th>
            {weergave !== "ng" && <th>Controle</th>}
            {weergave === "archief" && <th>Controledatum</th>}
            <th>Interne opmerking</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rijen.map((r) => (
            <tr key={r.id}>
              <td className="nr">
                <Link href={`/beheer/aanvraag/${r.id}`}>{r.volgnummer}</Link>
              </td>
              <td className="nowrap">
                {r.ingediendOp.split(" ")[0]}
                <div className="tijd">{r.ingediendOp.split(" ")[1]}</div>
              </td>
              <td>
                <span className="naam-met-mail" title={r.email}>
                  {r.naam}
                </span>
              </td>
              <td>
                <span className={`label ${r.soort === "DEFECT" ? "defect" : "taak"}`}>
                  {r.soort === "DEFECT" ? "Defect" : "Taak"}
                </span>
              </td>
              <td className="nowrap">{r.campus}</td>
              <td>{r.locatie}</td>
              <td>
                <Beschrijving tekst={r.beschrijving} titel={`${r.volgnummer} – ${r.campus}, ${r.locatie}`} />
              </td>
              <td>
                <Miniaturen fotoIds={r.fotoIds} />
              </td>
              <td>
                {actief ? (
                  <StatusVeld id={r.id} status={r.status} volgnummer={r.volgnummer} />
                ) : (
                  <span className={`label ${r.status === "NG" ? "fout" : r.status === "G" ? "ok" : "grijs"}`}>
                    {r.status ?? "–"}
                  </span>
                )}
              </td>
              {weergave === "ng" && (
                <td>
                  <Beschrijving tekst={r.ngReden ?? ""} titel={`Reden NG – ${r.volgnummer}`} max={60} />
                </td>
              )}
              <td>
                <MailVinkje mail={r.statusMail} />
              </td>
              <td>
                {actief ? (
                  <PrioriteitVeld id={r.id} prioriteit={r.prioriteit} />
                ) : r.prioriteit ? (
                  <span className={`label prio-${r.prioriteit}`}>{r.prioriteit}</span>
                ) : (
                  "–"
                )}
              </td>
              <td>
                {actief ? (
                  <KlusjesmanVeld id={r.id} klusjesmanId={r.klusjesmanId} opties={klusjesmannen} />
                ) : (
                  (r.klusjesmanNaam ?? "–")
                )}
              </td>
              {weergave !== "ng" && (
                <td>
                  {actief ? (
                    <ControleVeld id={r.id} controle={r.controle} volgnummer={r.volgnummer} />
                  ) : (
                    <span className="label ok">{r.controle}</span>
                  )}
                </td>
              )}
              {weergave === "archief" && <td className="nowrap">{r.controleDatum}</td>}
              <td>
                <OpmerkingVeld id={r.id} waarde={r.interneOpmerking} />
              </td>
              <td className="nowrap">
                <Link className="knop secundair klein" href={`/beheer/aanvraag/${r.id}`}>
                  Details
                </Link>
                {weergave === "archief" && (
                  <div style={{ marginTop: 6 }}>
                    <ActieKnop
                      label="Terugzetten"
                      actie={zetTerugUitArchief.bind(null, r.id)}
                      bevestig={`Aanvraag ${r.volgnummer} terugzetten naar het actieve overzicht?\nControle wordt NOK en de controledatum wordt gewist.`}
                    />
                  </div>
                )}
                {weergave === "ng" && (
                  <div style={{ marginTop: 6 }}>
                    <ActieKnop
                      label="Terugzetten"
                      actie={zetTerugUitNG.bind(null, r.id)}
                      bevestig={`Aanvraag ${r.volgnummer} terugzetten naar het actieve overzicht?\nDe status wordt leeggemaakt (er wordt geen mail verstuurd).`}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
