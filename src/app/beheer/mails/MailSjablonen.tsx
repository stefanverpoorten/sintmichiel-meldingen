"use client";
// Knoppen + popupvensters om onderwerp en inhoud van de mails aan te passen.
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "../Velden";
import { useToast } from "../Toast";
import { bewaarMailSjabloon, herstelMailSjabloon } from "../acties";
import {
  bouwMail,
  INVULVELDEN,
  onbekendeVelden,
  SJABLOON_INFO,
  STANDAARD,
  VOORBEELD,
  type SjabloonType,
} from "@/lib/sjabloon";

export type SjabloonRij = {
  type: SjabloonType;
  onderwerp: string;
  inhoud: string;
  aangepast: boolean;
  gewijzigd: string | null;
};

export default function MailSjablonen({ sjablonen }: { sjablonen: SjabloonRij[] }) {
  const [open, setOpen] = useState<SjabloonRij | null>(null);
  return (
    <section className="kaart" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>✉️ Mailteksten</h2>
      <p className="intro" style={{ marginTop: 0 }}>Klik op een mail om het onderwerp en de inhoud aan te passen.</p>
      <div className="sjabloon-knoppen">
        {sjablonen.map((s) => (
          <button key={s.type} type="button" className="sjabloon-knop" onClick={() => setOpen(s)}>
            <strong>{SJABLOON_INFO[s.type].titel}</strong>
            <span>{SJABLOON_INFO[s.type].ontvanger}</span>
            <span className={`label ${s.aangepast ? "taak" : "grijs"}`}>
              {s.aangepast ? `aangepast${s.gewijzigd ? ` op ${s.gewijzigd}` : ""}` : "standaardtekst"}
            </span>
          </button>
        ))}
      </div>
      {open && <Bewerker sjabloon={open} sluit={() => setOpen(null)} />}
    </section>
  );
}

function Bewerker({ sjabloon, sluit }: { sjabloon: SjabloonRij; sluit: () => void }) {
  const info = SJABLOON_INFO[sjabloon.type];
  const [onderwerp, setOnderwerp] = useState(sjabloon.onderwerp);
  const [inhoud, setInhoud] = useState(sjabloon.inhoud);
  const [bezig, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const inhoudRef = useRef<HTMLTextAreaElement>(null);
  const onderwerpRef = useRef<HTMLInputElement>(null);
  const laatsteVeld = useRef<"onderwerp" | "inhoud">("inhoud");

  const gewijzigd = onderwerp !== sjabloon.onderwerp || inhoud !== sjabloon.inhoud;
  const voorbeeld = useMemo(() => bouwMail({ onderwerp, inhoud }, VOORBEELD), [onderwerp, inhoud]);
  const onbekend = onbekendeVelden(sjabloon.type, `${onderwerp}\n${inhoud}`);

  function veiligSluiten() {
    if (gewijzigd && !confirm("Je wijzigingen zijn nog niet opgeslagen. Toch sluiten?")) return;
    sluit();
  }

  function voegIn(veld: string) {
    if (laatsteVeld.current === "onderwerp" && onderwerpRef.current) {
      const el = onderwerpRef.current;
      const p = el.selectionStart ?? onderwerp.length;
      setOnderwerp(onderwerp.slice(0, p) + veld + onderwerp.slice(el.selectionEnd ?? p));
      return;
    }
    const el = inhoudRef.current;
    const p = el?.selectionStart ?? inhoud.length;
    setInhoud(inhoud.slice(0, p) + veld + inhoud.slice(el?.selectionEnd ?? p));
  }

  function opslaan() {
    start(async () => {
      const r = await bewaarMailSjabloon(sjabloon.type, onderwerp, inhoud);
      if (r.ok) {
        toast("Mailtekst opgeslagen");
        router.refresh();
        sluit();
      } else toast(r.fout, true);
    });
  }

  function herstel() {
    if (!confirm("De standaardtekst terugzetten? Je aangepaste tekst gaat verloren.")) return;
    if (!sjabloon.aangepast) {
      setOnderwerp(STANDAARD[sjabloon.type].onderwerp);
      setInhoud(STANDAARD[sjabloon.type].inhoud);
      return;
    }
    start(async () => {
      const r = await herstelMailSjabloon(sjabloon.type);
      if (r.ok) {
        toast("Standaardtekst hersteld");
        router.refresh();
        sluit();
      } else toast(r.fout, true);
    });
  }

  return (
    <Modal titel={`Mailtekst: ${info.titel}`} sluit={veiligSluiten} breed>
      <p className="hulp" style={{ marginTop: -8 }}>Deze mail gaat {info.ontvanger}.</p>
      <div className="sjabloon-grid">
        <div>
          <label className="sjabloon-label" htmlFor="sj-onderwerp">Onderwerp</label>
          <input
            id="sj-onderwerp"
            ref={onderwerpRef}
            type="text"
            value={onderwerp}
            maxLength={250}
            onFocus={() => (laatsteVeld.current = "onderwerp")}
            onChange={(e) => setOnderwerp(e.target.value)}
          />
          <label className="sjabloon-label" htmlFor="sj-inhoud" style={{ marginTop: 12 }}>Inhoud</label>
          <textarea
            id="sj-inhoud"
            ref={inhoudRef}
            rows={12}
            value={inhoud}
            maxLength={5000}
            onFocus={() => (laatsteVeld.current = "inhoud")}
            onChange={(e) => setInhoud(e.target.value)}
          />
          <div className="hulp">
            Lege regel = nieuwe alinea. Zet tekst tussen **dubbele sterretjes** om hem <strong>vet</strong> te maken.
          </div>
          {onbekend.length > 0 && (
            <div className="melding fout" style={{ marginTop: 8 }}>
              Onbekend invulveld: {onbekend.join(", ")}
            </div>
          )}
          <div className="sjabloon-label" style={{ marginTop: 12 }}>Invulvelden (klik om in te voegen)</div>
          <div className="invulvelden">
            {info.velden.map((v) => (
              <button key={v} type="button" className="invulveld" title={INVULVELDEN[v]} onClick={() => voegIn(v)}>
                {v}
                <span>{INVULVELDEN[v]}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="sjabloon-label">Voorbeeld (met testgegevens)</div>
          <div className="voorbeeld-onderwerp">
            <span>Onderwerp:</span> {voorbeeld.onderwerp}
          </div>
          <iframe className="voorbeeld-mail" title="Voorbeeld van de mail" srcDoc={voorbeeld.html} sandbox="" />
        </div>
      </div>
      <div className="knoppen" style={{ justifyContent: "space-between" }}>
        <button type="button" className="knop secundair" onClick={herstel} disabled={bezig}>
          Standaardtekst herstellen
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="knop secundair" onClick={veiligSluiten} disabled={bezig}>
            Annuleren
          </button>
          <button type="button" className="knop" onClick={opslaan} disabled={bezig || onbekend.length > 0}>
            {bezig ? "Bezig…" : "Opslaan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
