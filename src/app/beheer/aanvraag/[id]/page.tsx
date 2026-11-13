import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { aanvraagInclude, klusjesmanOpties, naarRij } from "@/lib/overzicht";
import { datumTijd, schooljaar } from "@/lib/datum";
import { MAIL_TYPE_LABEL, SOORT_LABEL } from "@/lib/constanten";
import {
  ActieKnop,
  ControleVeld,
  GroteFotos,
  KlusjesmanVeld,
  MailStatus,
  OpmerkingVeld,
  PrioriteitVeld,
  StatusVeld,
} from "../../Velden";
import { zetTerugUitArchief, zetTerugUitNG } from "../../acties";

export const dynamic = "force-dynamic";

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.aanvraag.findUnique({
    where: { id },
    include: { ...aanvraagInclude, historiek: { orderBy: { tijdstip: "desc" } } },
  });
  if (!a) notFound();
  const r = naarRij(a);
  const klusjesmannen = await klusjesmanOpties();
  const plaats =
    a.status === "NG"
      ? { label: "Niet uitgevoerd", href: "/beheer/niet-uitgevoerd" }
      : a.controle === "OK"
        ? { label: `Archief ${schooljaar(a.controleDatum!)}`, href: `/beheer/archief?schooljaar=${schooljaar(a.controleDatum!)}` }
        : { label: "Actief overzicht", href: "/beheer" };

  return (
    <main className="inhoud">
      <p>
        <Link href={plaats.href}>← {plaats.label}</Link>
      </p>
      <div className="titelrij">
        <h1>Aanvraag {a.volgnummer}</h1>
        <span className={`label ${a.soort === "DEFECT" ? "defect" : "taak"}`}>{SOORT_LABEL[a.soort]}</span>
      </div>

      <div className="detail-grid">
        <div style={{ display: "grid", gap: 16 }}>
          <section className="kaart">
            <dl className="gegevens">
              <dt>Ingediend op</dt><dd>{datumTijd(a.ingediendOp)}</dd>
              <dt>Naam</dt><dd>{a.naam}</dd>
              <dt>E-mail</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt>Soort</dt><dd>{SOORT_LABEL[a.soort]}</dd>
              <dt>Campus</dt><dd>{a.campus}</dd>
              <dt>Locatie</dt><dd>{a.locatie}</dd>
              <dt>Beschrijving</dt><dd>{a.beschrijving}</dd>
              {a.ngReden && (<><dt>Reden NG</dt><dd>{a.ngReden}</dd></>)}
              {a.controleDatum && (<><dt>Controledatum</dt><dd>{datumTijd(a.controleDatum)}</dd></>)}
              <dt>Plaats</dt><dd>{plaats.label}</dd>
            </dl>
          </section>
          <section className="kaart">
            <h2 style={{ marginTop: 0 }}>Foto&apos;s</h2>
            <GroteFotos fotoIds={r.fotoIds} />
          </section>
          <section className="kaart">
            <h2 style={{ marginTop: 0 }}>Historiek</h2>
            <ul className="tijdlijn">
              {a.historiek.map((h) => (
                <li key={h.id}>
                  <div className="wanneer">{datumTijd(h.tijdstip)} – {h.door}</div>
                  <strong>{h.veld}</strong>
                  {h.veld !== "Aanvraag ingediend" ? (
                    <>: {h.oudeWaarde ?? "–"} → {h.nieuweWaarde ?? "–"}</>
                  ) : (
                    <> ({h.nieuweWaarde})</>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <section className="kaart beheer-velden">
            <h2 style={{ margin: 0 }}>Beheer</h2>
            <div>
              <label>Status</label>
              <StatusVeld id={a.id} status={a.status} volgnummer={a.volgnummer} />
            </div>
            <div>
              <label>Mail voor huidige status</label>
              <MailStatus mail={r.statusMail} />
            </div>
            <div>
              <label>Prioriteit</label>
              <PrioriteitVeld id={a.id} prioriteit={a.prioriteit} />
            </div>
            <div>
              <label>Toegewezen aan</label>
              <KlusjesmanVeld id={a.id} klusjesmanId={a.klusjesmanId} opties={klusjesmannen} />
            </div>
            <div>
              <label>Controle</label>
              <ControleVeld id={a.id} controle={a.controle} volgnummer={a.volgnummer} />
            </div>
            <div>
              <label>Interne opmerking</label>
              <OpmerkingVeld id={a.id} waarde={a.interneOpmerking} rijen={4} />
            </div>
            {a.controle === "OK" && (
              <ActieKnop label="Terugzetten naar actief overzicht" actie={zetTerugUitArchief.bind(null, a.id)}
                bevestig="Controle terug op NOK zetten? De controledatum wordt gewist." />
            )}
            {a.status === "NG" && (
              <ActieKnop label="Terugzetten naar actief overzicht" actie={zetTerugUitNG.bind(null, a.id)}
                bevestig="Status leegmaken? Er wordt geen mail verstuurd." />
            )}
          </section>
          <section className="kaart">
            <h2 style={{ marginTop: 0 }}>Mails</h2>
            {a.mails.length === 0 && <p className="intro">Nog geen mails.</p>}
            <ul className="tijdlijn">
              {a.mails.map((m) => (
                <li key={m.id}>
                  <div className="wanneer">{MAIL_TYPE_LABEL[m.type]} – aan {m.aan}</div>
                  <MailStatus mail={{ id: m.id, status: m.status, fout: m.fout, tijd: datumTijd(m.verstuurdOp ?? m.aangemaakt) }} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
