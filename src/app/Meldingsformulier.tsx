"use client";
import { useRef, useState } from "react";
import { isToegelaten, MAX_BYTES, verkleinFoto } from "./fotoVerkleinen";

type Foto = { id: string; bestand: File; voorbeeld: string };

export default function Meldingsformulier({ campussen }: { campussen: string[] }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [bezig, setBezig] = useState(false);
  const [fotoBezig, setFotoBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [volgnummer, setVolgnummer] = useState<string | null>(null);
  const [gesloten, setGesloten] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fotoInput = useRef<HTMLInputElement>(null);

  async function fotosGekozen(e: React.ChangeEvent<HTMLInputElement>) {
    const gekozen = Array.from(e.target.files ?? []);
    e.target.value = "";
    setFout(null);
    const plaats = 3 - fotos.length;
    if (gekozen.length > plaats) {
      setFout(`Je kan maximaal 3 foto's toevoegen.`);
    }
    setFotoBezig(true);
    const nieuw: Foto[] = [];
    for (const f of gekozen.slice(0, Math.max(0, plaats))) {
      if (!isToegelaten(f)) {
        setFout(`"${f.name}" is geen jpg-, png- of heic-foto.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setFout(`"${f.name}" is groter dan 10 MB.`);
        continue;
      }
      try {
        const klein = await verkleinFoto(f);
        nieuw.push({ id: crypto.randomUUID(), bestand: klein, voorbeeld: URL.createObjectURL(klein) });
      } catch (err) {
        setFout(err instanceof Error ? err.message : `"${f.name}" kon niet gelezen worden.`);
      }
    }
    setFotos((v) => [...v, ...nieuw].slice(0, 3));
    setFotoBezig(false);
  }

  function verwijder(id: string) {
    setFotos((v) => v.filter((f) => f.id !== id));
  }

  async function verzend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFout(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim().toLowerCase();
    if (!email.endsWith("@sintmichiel.be")) {
      setFout("Je e-mailadres moet eindigen op @sintmichiel.be.");
      return;
    }
    const data = new FormData(form);
    data.delete("fotos-kiezen");
    for (const f of fotos) data.append("fotos", f.bestand, f.bestand.name);
    setBezig(true);
    try {
      const res = await fetch("/api/aanvragen", { method: "POST", body: data });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setFout(json?.fout ?? "Er liep iets mis bij het verzenden. Probeer het opnieuw.");
      } else {
        setVolgnummer(json.volgnummer);
        window.scrollTo({ top: 0 });
      }
    } catch {
      setFout("Geen verbinding. Controleer je internet en probeer het opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  function sluiten() {
    // Een browser laat een website enkel een venster sluiten dat ze zelf geopend heeft.
    // Lukt het niet (bv. link geopend vanuit mail of bladwijzer), dan tonen we een afsluitscherm.
    window.close();
    setTimeout(() => setGesloten(true), 300);
  }

  function nieuweMelding() {
    setGesloten(false);
    setVolgnummer(null);
    setFotos([]);
    setFout(null);
  }

  if (volgnummer && gesloten) {
    return (
      <div className="kaart bevestiging">
        <div className="vinkje" aria-hidden>✓</div>
        <h1>Bedankt!</h1>
        <p className="intro">
          Je aanvraag <strong>{volgnummer}</strong> is goed ontvangen. Je kan dit venster of tabblad nu
          sluiten.
        </p>
        <button className="knop secundair" onClick={nieuweMelding}>
          Toch nog iets melden
        </button>
      </div>
    );
  }

  if (volgnummer) {
    return (
      <div className="kaart bevestiging">
        <div className="vinkje" aria-hidden>✓</div>
        <h1>Bedankt, je aanvraag is ingediend!</h1>
        <p>Je volgnummer is</p>
        <div className="nummer">{volgnummer}</div>
        <p className="intro">
          Noteer dit nummer. Je krijgt ook een bevestiging per mail, en een nieuwe mail zodra je
          aanvraag beoordeeld is.
        </p>
        <div className="knoppen-rij">
          <button className="knop secundair" onClick={nieuweMelding}>
            Nog iets melden
          </button>
          <button className="knop" onClick={sluiten}>
            Sluiten
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="kaart" onSubmit={verzend} noValidate={false}>
      <h1>Defect melden of taak aanvragen</h1>
      <p className="intro">
        Vul het formulier in. Velden met <span className="verplicht">*</span> zijn verplicht.
      </p>

      {fout && <div className="melding fout" role="alert">{fout}</div>}

      <div className="veld">
        <label htmlFor="naam">Naam <span className="verplicht">*</span></label>
        <input id="naam" name="naam" type="text" required autoComplete="name" maxLength={120} />
      </div>

      <div className="veld">
        <label htmlFor="email">E-mailadres <span className="verplicht">*</span></label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voornaam.naam@sintmichiel.be"
          pattern=".+@[Ss][Ii][Nn][Tt][Mm][Ii][Cc][Hh][Ii][Ee][Ll]\.[Bb][Ee]"
          title="Je e-mailadres moet eindigen op @sintmichiel.be"
          onInvalid={(e) =>
            e.currentTarget.setCustomValidity(
              e.currentTarget.validity.valueMissing
                ? "Vul je e-mailadres in."
                : "Je e-mailadres moet eindigen op @sintmichiel.be."
            )
          }
          onInput={(e) => e.currentTarget.setCustomValidity("")}
        />
      </div>

      <fieldset className="veld">
        <legend>Soort <span className="verplicht">*</span></legend>
        <div className="keuzes">
          <label className="keuze">
            <input type="radio" name="soort" value="DEFECT" required />
            <span>🔧 Defect</span>
          </label>
          <label className="keuze">
            <input type="radio" name="soort" value="TAAK" required />
            <span>📋 Taak</span>
          </label>
        </div>
      </fieldset>

      <div className="veld">
        <label htmlFor="campus">Campus <span className="verplicht">*</span></label>
        <select id="campus" name="campus" required defaultValue="">
          <option value="" disabled>Kies een campus…</option>
          {campussen.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="veld">
        <label htmlFor="locatie">Locatie / lokaalnummer <span className="verplicht">*</span></label>
        <input id="locatie" name="locatie" type="text" required maxLength={200} placeholder="bv. lokaal 1.04, refter, speelplaats" />
      </div>

      <div className="veld">
        <label htmlFor="beschrijving">Beschrijving <span className="verplicht">*</span></label>
        <textarea id="beschrijving" name="beschrijving" required maxLength={5000} placeholder="Wat is er aan de hand of wat moet er gebeuren?" />
      </div>

      {/* Honeypot: onzichtbaar voor mensen, robots vullen dit in. */}
      <div className="honing" aria-hidden="true">
        <label htmlFor="website">Website (niet invullen)</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="veld">
        <label>Foto&apos;s (optioneel, max. 3)</label>
        {fotos.length < 3 && (
          <label className="foto-knop" htmlFor="fotos-kiezen">
            📷 {fotoBezig ? "Foto's verwerken…" : "Foto toevoegen"}
          </label>
        )}
        <input
          ref={fotoInput}
          id="fotos-kiezen"
          name="fotos-kiezen"
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png"
          multiple
          hidden
          onChange={fotosGekozen}
        />
        <div className="hulp">jpg, png of heic – max. 10 MB per foto. Foto&apos;s worden automatisch verkleind.</div>
        {fotos.length > 0 && (
          <div className="foto-lijst">
            {fotos.map((f) => (
              <div className="foto-voorbeeld" key={f.id}>
                <img src={f.voorbeeld} alt="Gekozen foto" />
                <button type="button" onClick={() => verwijder(f.id)} aria-label="Foto verwijderen">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="knop groot" type="submit" disabled={bezig || fotoBezig}>
        {bezig ? "Bezig met verzenden…" : "Aanvraag indienen"}
      </button>
    </form>
  );
}
