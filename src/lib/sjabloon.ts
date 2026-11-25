// Mailsjablonen: standaardteksten, invulvelden en het omzetten naar een opgemaakte mail.
// Dit bestand wordt zowel op de server als in de browser (voorbeeld in het popupvenster) gebruikt.

export type SjabloonType = "NIEUWE_AANVRAAG" | "ONTVANGST" | "STATUS_G" | "STATUS_NG";

export const SJABLOON_TYPES: SjabloonType[] = ["NIEUWE_AANVRAAG", "ONTVANGST", "STATUS_G", "STATUS_NG"];

export type Sjabloon = { onderwerp: string; inhoud: string };

export const INVULVELDEN: Record<string, string> = {
  "{naam}": "naam van de aanvrager",
  "{volgnummer}": "bv. 2026-0012",
  "{soort}": "defect, taak of gevaarlijke situatie (kleine letters)",
  "{Soort}": "Defect, Taak of Gevaarlijke situatie (hoofdletter)",
  "{campus}": "bv. Campus 3",
  "{locatie}": "bv. Lokaal 1.04",
  "{beschrijving}": "de beschrijving van de aanvrager",
  "{datum}": "indieningsdatum en -uur",
  "{reden}": "de reden bij NG",
  "{knop}": "knop 'Open de aanvraag in het overzicht'",
};

export const SJABLOON_INFO: Record<SjabloonType, { titel: string; ontvanger: string; velden: string[] }> = {
  NIEUWE_AANVRAAG: {
    titel: "Nieuwe aanvraag",
    ontvanger: "naar directeur en beheerder, bij elke nieuwe aanvraag",
    velden: ["{naam}", "{volgnummer}", "{soort}", "{Soort}", "{campus}", "{locatie}", "{beschrijving}", "{datum}", "{knop}"],
  },
  ONTVANGST: {
    titel: "Ontvangstbevestiging",
    ontvanger: "naar de aanvrager, meteen na het indienen",
    velden: ["{naam}", "{volgnummer}", "{soort}", "{Soort}", "{campus}", "{locatie}", "{beschrijving}", "{datum}"],
  },
  STATUS_G: {
    titel: "Goedgekeurd (G)",
    ontvanger: "naar de aanvrager, als de status op G gezet wordt",
    velden: ["{naam}", "{volgnummer}", "{soort}", "{Soort}", "{campus}", "{locatie}", "{beschrijving}", "{datum}"],
  },
  STATUS_NG: {
    titel: "Niet goedgekeurd (NG)",
    ontvanger: "naar de aanvrager, als de status op NG gezet wordt",
    velden: ["{naam}", "{volgnummer}", "{soort}", "{Soort}", "{campus}", "{locatie}", "{beschrijving}", "{datum}", "{reden}"],
  },
};

export const STANDAARD: Record<SjabloonType, Sjabloon> = {
  NIEUWE_AANVRAAG: {
    onderwerp: "Nieuwe aanvraag {volgnummer}: {Soort} – {campus}, {locatie}",
    inhoud: "Er is een nieuwe aanvraag voor een {soort} ingediend.\n\nJe kan deze bekijken via:\n\n{knop}",
  },
  ONTVANGST: {
    onderwerp: "Ontvangen: je aanvraag {volgnummer}",
    inhoud:
      "Beste {naam},\n\nWe hebben je aanvraag goed ontvangen. Je volgnummer is **{volgnummer}**.\n\n" +
      "Soort: {Soort}\nCampus: {campus}\nLocatie: {locatie}\nBeschrijving: {beschrijving}\n\n" +
      "Je krijgt een nieuwe mail zodra je aanvraag beoordeeld is.\n\nMet vriendelijke groeten,\nDe directie",
  },
  STATUS_G: {
    onderwerp: "Je aanvraag {volgnummer} werd doorgegeven",
    inhoud:
      "Beste {naam},\n\nJe aanvraag {volgnummer} ({Soort}, {campus}, {locatie}) werd doorgegeven aan de technische dienst.\n\n" +
      "Met vriendelijke groeten,\nDe directie",
  },
  STATUS_NG: {
    onderwerp: "Je aanvraag {volgnummer} wordt niet uitgevoerd",
    inhoud:
      "Beste {naam},\n\nJe aanvraag {volgnummer} ({Soort}, {campus}, {locatie}) wordt niet uitgevoerd.\n\n" +
      "**Reden:**\n{reden}\n\nMet vriendelijke groeten,\nDe directie",
  },
};

export type Gegevens = {
  naam: string;
  volgnummer: string;
  soort: "DEFECT" | "TAAK" | "GEVAARLIJK";
  /** Enkel bij een gevaarlijke situatie. */
  directGevaar?: boolean | null;
  campus: string;
  locatie: string;
  beschrijving: string;
  datum: string;
  reden?: string;
  link: string;
};

export const VOORBEELD: Gegevens = {
  naam: "An Peeters",
  volgnummer: "2026-0012",
  soort: "DEFECT",
  campus: "Campus 3",
  locatie: "Lokaal 1.04",
  beschrijving: "De beamer gaat niet meer aan. Lampje knippert oranje.",
  datum: "16/11/2026 14:35",
  reden: "Dit valt onder het onderhoudscontract van de leverancier; het secretariaat contacteert hen.",
  link: "#",
};

export function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Bij een gevaarlijke situatie met direct gevaar staat dat er meteen bij, ook in het onderwerp van de mail.
function soortTekst(g: Gegevens): string {
  if (g.soort === "GEVAARLIJK") return g.directGevaar ? "Gevaarlijke situatie (DIRECT GEVAAR)" : "Gevaarlijke situatie";
  return g.soort === "DEFECT" ? "Defect" : "Taak";
}

function waarden(g: Gegevens): Record<string, string> {
  return {
    "{naam}": g.naam,
    "{volgnummer}": g.volgnummer,
    "{soort}": soortTekst(g).toLowerCase(),
    "{Soort}": soortTekst(g),
    "{campus}": g.campus,
    "{locatie}": g.locatie,
    "{beschrijving}": g.beschrijving,
    "{datum}": g.datum,
    "{reden}": g.reden ?? "",
  };
}

/** Invulvelden die in de tekst staan maar niet bestaan voor deze mail (bv. tikfout {naaam}). */
export function onbekendeVelden(type: SjabloonType, tekst: string): string[] {
  const gebruikt = tekst.match(/\{[A-Za-z]+\}/g) ?? [];
  return [...new Set(gebruikt.filter((v) => !SJABLOON_INFO[type].velden.includes(v)))];
}

export function vulOnderwerpIn(onderwerp: string, g: Gegevens): string {
  let s = onderwerp;
  for (const [k, v] of Object.entries(waarden(g))) s = s.split(k).join(v);
  return s.replace(/\{knop\}/g, "").replace(/[\r\n]+/g, " ").trim();
}

function knop(link: string) {
  return `<a href="${esc(link)}" style="background:#2d5e69;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Open de aanvraag in het overzicht</a>`;
}

/** Zet de tekst om naar HTML: lege regel = nieuwe alinea, **tekst** = vet. */
export function vulInhoudIn(inhoud: string, g: Gegevens): string {
  let h = esc(inhoud.replace(/\r\n/g, "\n").trim());
  for (const [k, v] of Object.entries(waarden(g))) h = h.split(k).join(esc(v));
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const alineas = h.split(/\n\s*\n/).map((p) => {
    const t = p.trim();
    if (t === "{knop}") return `<p style="margin:20px 0">${knop(g.link)}</p>`;
    return `<p>${t.replace(/\{knop\}/g, knop(g.link)).replace(/\n/g, "<br>")}</p>`;
  });
  return alineas.join("\n");
}

export function kader(inhoud: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2d33;font-size:15px;line-height:1.5">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#fff;border-radius:8px;padding:24px;border-top:6px solid #2d5e69">
${inhoud}
</div>
<p style="font-size:12px;color:#6b7b80;margin-top:16px">Sint-Michiel – Meldingen technische dienst. Dit is een automatische mail.</p>
</div></body></html>`;
}

export function bouwMail(s: Sjabloon, g: Gegevens): { onderwerp: string; html: string } {
  return { onderwerp: vulOnderwerpIn(s.onderwerp, g), html: kader(vulInhoudIn(s.inhoud, g)) };
}
