"use client";
// Bewerkbare beheervelden. Elke wijziging wordt meteen opgeslagen.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  wijzigStatus,
  wijzigPrioriteit,
  wijzigKlusjesman,
  wijzigControle,
  wijzigOpmerking,
  verstuurMailOpnieuw,
  type Resultaat,
} from "./acties";
import { useToast } from "./Toast";
import type { KlusjesmanOptie, MailInfo } from "@/lib/overzicht";

/** Voor knoppen (bv. "Opnieuw versturen"): toont het resultaat. */
function useActie() {
  const [bezig, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  function voerUit(fn: () => Promise<Resultaat>, bijSucces?: () => void) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (r.melding) toast(r.melding);
        if (r.waarschuwing) toast(r.waarschuwing, true);
        bijSucces?.();
      } else {
        toast(r.fout, true);
      }
      router.refresh();
    });
  }
  return { bezig, voerUit };
}

/**
 * Voor de beheervelden: de nieuwe waarde verschijnt meteen, het opslaan gebeurt op de achtergrond.
 * Er verschijnt enkel een melding als er iets misloopt (dan wordt de oude waarde teruggezet).
 */
function useAchtergrond<T>(serverWaarde: T) {
  const [waarde, setWaarde] = useState(serverWaarde);
  useEffect(() => setWaarde(serverWaarde), [serverWaarde]);
  const [, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  function sla(nieuw: T, fn: () => Promise<Resultaat>) {
    const vorige = waarde;
    setWaarde(nieuw);
    start(async () => {
      let r: Resultaat;
      try {
        r = await fn();
      } catch {
        r = { ok: false, fout: "Opslaan mislukt: geen verbinding met de server." };
      }
      if (!r.ok) {
        setWaarde(vorige);
        toast(r.fout, true);
      } else if (r.waarschuwing) {
        toast(r.waarschuwing, true);
      }
      router.refresh();
    });
  }
  return { waarde, sla };
}

export function Modal({ titel, children, sluit }: { titel: string; children: React.ReactNode; sluit: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && sluit();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sluit]);
  return (
    <div className="modal-achter" onClick={sluit}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        <h2>{titel}</h2>
        {children}
      </div>
    </div>
  );
}

export function StatusVeld({ id, status, volgnummer }: { id: string; status: "G" | "NG" | null; volgnummer: string }) {
  const { waarde, sla } = useAchtergrond<"G" | "NG" | null>(status);
  const [ngOpen, setNgOpen] = useState(false);
  const [reden, setReden] = useState("");

  function kies(w: string) {
    if (w === "NG") {
      setReden("");
      setNgOpen(true);
      return;
    }
    sla(w === "G" ? "G" : null, () => wijzigStatus(id, w as "" | "G"));
  }

  return (
    <>
      <select
        aria-label="Status"
        value={waarde ?? ""}
        onChange={(e) => kies(e.target.value)}
        className={waarde ? `status-${waarde}` : ""}
      >
        <option value="">–</option>
        <option value="G">G</option>
        <option value="NG">NG</option>
      </select>
      {ngOpen && (
        <Modal titel={`Aanvraag ${volgnummer} niet goedkeuren`} sluit={() => setNgOpen(false)}>
          <p>
            De aanvrager krijgt een mail dat de aanvraag niet wordt uitgevoerd, met de reden hieronder.
            De aanvraag verhuist naar &quot;Niet uitgevoerd&quot;.
          </p>
          <label htmlFor={`reden-${id}`} style={{ fontWeight: 600 }}>
            Reden <span className="verplicht">*</span>
          </label>
          <textarea id={`reden-${id}`} value={reden} onChange={(e) => setReden(e.target.value)} autoFocus />
          <div className="knoppen">
            <button className="knop secundair" onClick={() => setNgOpen(false)} type="button">
              Annuleren
            </button>
            <button
              className="knop gevaar"
              type="button"
              disabled={!reden.trim()}
              onClick={() => {
                setNgOpen(false);
                sla("NG", () => wijzigStatus(id, "NG", reden));
              }}
            >
              Bevestigen en mail versturen
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function PrioriteitVeld({ id, prioriteit }: { id: string; prioriteit: number | null }) {
  const { waarde, sla } = useAchtergrond(prioriteit?.toString() ?? "");
  return (
    <select
      aria-label="Prioriteit"
      value={waarde}
      onChange={(e) => {
        const w = e.target.value;
        sla(w, () => wijzigPrioriteit(id, w));
      }}
    >
      <option value="">–</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
    </select>
  );
}

export function KlusjesmanVeld({
  id,
  klusjesmanId,
  opties,
}: {
  id: string;
  klusjesmanId: string | null;
  opties: KlusjesmanOptie[];
}) {
  const { waarde, sla } = useAchtergrond(klusjesmanId ?? "");
  const zichtbaar = opties.filter((o) => o.actief || o.id === klusjesmanId || o.id === waarde);
  return (
    <select
      aria-label="Toegewezen aan"
      value={waarde}
      onChange={(e) => {
        const w = e.target.value;
        sla(w, () => wijzigKlusjesman(id, w));
      }}
    >
      <option value="">– niemand –</option>
      {zichtbaar.map((o) => (
        <option key={o.id} value={o.id} disabled={!o.actief}>
          {o.naam}
          {!o.actief ? " (inactief)" : ""}
        </option>
      ))}
    </select>
  );
}

export function ControleVeld({ id, controle, volgnummer }: { id: string; controle: "OK" | "NOK" | null; volgnummer: string }) {
  const { waarde, sla } = useAchtergrond<"" | "OK" | "NOK">(controle ?? "");
  return (
    <select
      aria-label="Controle"
      value={waarde}
      onChange={(e) => {
        const w = e.target.value as "" | "OK" | "NOK";
        if (w === "OK" && !confirm(`Aanvraag ${volgnummer} als gecontroleerd (OK) markeren?\nDe aanvraag verhuist naar het archief.`))
          return;
        sla(w, () => wijzigControle(id, w));
      }}
    >
      <option value="">–</option>
      <option value="OK">OK</option>
      <option value="NOK">NOK</option>
    </select>
  );
}

export function OpmerkingVeld({ id, waarde, rijen = 2 }: { id: string; waarde: string | null; rijen?: number }) {
  const { sla } = useAchtergrond(waarde ?? "");
  const [tekst, setTekst] = useState(waarde ?? "");
  useEffect(() => setTekst(waarde ?? ""), [waarde]);
  return (
    <textarea
      aria-label="Interne opmerking"
      rows={rijen}
      value={tekst}
      placeholder="Interne opmerking…"
      onChange={(e) => setTekst(e.target.value)}
      onBlur={() => {
        if (tekst.trim() !== (waarde ?? "").trim()) sla(tekst, () => wijzigOpmerking(id, tekst));
      }}
    />
  );
}

export function MailStatus({ mail }: { mail: MailInfo | null }) {
  const { bezig, voerUit } = useActie();
  if (!mail) return <span className="label grijs">geen</span>;
  if (mail.status === "MISLUKT")
    return (
      <div className="mailinfo">
        <span className="label fout">✗ mislukt</span>
        <span className="fouttekst">{mail.fout}</span>
        <button className="knop klein" disabled={bezig} onClick={() => voerUit(() => verstuurMailOpnieuw(mail.id))}>
          {bezig ? "Bezig…" : "Opnieuw versturen"}
        </button>
      </div>
    );
  return (
    <div className="mailinfo nowrap">
      <span className={`label ${mail.status === "TEST" ? "test" : "ok"}`}>
        {mail.status === "TEST" ? "✓ gelogd (test)" : "✓ verstuurd"}
      </span>
      <div>{mail.tijd}</div>
    </div>
  );
}

export function Beschrijving({ tekst, titel, max = 80 }: { tekst: string; titel: string; max?: number }) {
  const [open, setOpen] = useState(false);
  const kort = tekst.length > max ? tekst.slice(0, max).trimEnd() + "…" : tekst;
  return (
    <>
      <button className="beschrijving-kort" onClick={() => setOpen(true)} title="Klik om alles te lezen">
        {kort}
      </button>
      {open && (
        <Modal titel={titel} sluit={() => setOpen(false)}>
          <p style={{ whiteSpace: "pre-wrap" }}>{tekst}</p>
          <div className="knoppen">
            <button className="knop" onClick={() => setOpen(false)}>Sluiten</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Lightbox({ fotoId, sluit }: { fotoId: string; sluit: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && sluit();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sluit]);
  return (
    <div className="modal-achter" onClick={sluit}>
      <div className="lightbox">
        <img src={`/api/foto/${fotoId}`} alt="Foto in groot formaat" />
      </div>
    </div>
  );
}

export function Miniaturen({ fotoIds }: { fotoIds: string[] }) {
  const [groot, setGroot] = useState<string | null>(null);
  if (fotoIds.length === 0) return <span className="label grijs">–</span>;
  return (
    <>
      <div className="minis">
        {fotoIds.map((f) => (
          <button key={f} onClick={() => setGroot(f)} aria-label="Foto vergroten">
            <img src={`/api/foto/${f}?klein=1`} alt="" />
          </button>
        ))}
      </div>
      {groot && <Lightbox fotoId={groot} sluit={() => setGroot(null)} />}
    </>
  );
}

export function GroteFotos({ fotoIds }: { fotoIds: string[] }) {
  const [groot, setGroot] = useState<string | null>(null);
  if (fotoIds.length === 0) return <p className="intro">Geen foto&apos;s.</p>;
  return (
    <>
      <div className="fotos-groot">
        {fotoIds.map((f) => (
          <img key={f} src={`/api/foto/${f}`} alt="Foto bij de aanvraag" onClick={() => setGroot(f)} />
        ))}
      </div>
      {groot && <Lightbox fotoId={groot} sluit={() => setGroot(null)} />}
    </>
  );
}

export function ActieKnop({
  actie,
  label,
  bevestig,
  klasse = "knop secundair klein",
}: {
  actie: () => Promise<Resultaat>;
  label: string;
  bevestig?: string;
  klasse?: string;
}) {
  const { bezig, voerUit } = useActie();
  return (
    <button
      className={klasse}
      disabled={bezig}
      onClick={() => {
        if (bevestig && !confirm(bevestig)) return;
        voerUit(actie);
      }}
    >
      {bezig ? "Bezig…" : label}
    </button>
  );
}
