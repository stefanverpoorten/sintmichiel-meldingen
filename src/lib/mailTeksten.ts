// Inhoud van alle mails.
import type { Aanvraag } from "@prisma/client";
import { SOORT_LABEL } from "./constanten";
import { datumTijd } from "./datum";
import { config } from "./config";

export function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function kader(inhoud: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2d33">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#fff;border-radius:8px;padding:24px;border-top:6px solid #2d5e69">
${inhoud}
</div>
<p style="font-size:12px;color:#6b7b80;margin-top:16px">Sint-Michiel – Meldingen technische dienst. Dit is een automatische mail.</p>
</div></body></html>`;
}

function rij(label: string, waarde: string) {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b7b80;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0">${waarde}</td></tr>`;
}

function samenvatting(a: Aanvraag) {
  return `${a.volgnummer} (${SOORT_LABEL[a.soort]}, ${a.campus}, ${a.locatie})`;
}

export function mailNieuweAanvraag(a: Aanvraag, aantalFotos: number, fotosAlsBijlage: boolean) {
  const link = `${config.appUrl}/beheer/aanvraag/${a.id}`;
  const fotoTekst =
    aantalFotos === 0
      ? "Geen"
      : fotosAlsBijlage
        ? `${aantalFotos} (in bijlage)`
        : `${aantalFotos} (te bekijken via de link hieronder)`;
  return {
    onderwerp: `Nieuwe aanvraag ${a.volgnummer}: ${SOORT_LABEL[a.soort]} – ${a.campus}, ${a.locatie}`,
    html: kader(`
<h2 style="margin:0 0 16px;color:#2d5e69">Nieuwe aanvraag ${esc(a.volgnummer)}</h2>
<table style="border-collapse:collapse;font-size:15px">
${rij("Ingediend op", esc(datumTijd(a.ingediendOp)))}
${rij("Naam", esc(a.naam))}
${rij("E-mail", esc(a.email))}
${rij("Soort", esc(SOORT_LABEL[a.soort]))}
${rij("Campus", esc(a.campus))}
${rij("Locatie", esc(a.locatie))}
${rij("Beschrijving", esc(a.beschrijving).replace(/\n/g, "<br>"))}
${rij("Foto's", esc(fotoTekst))}
</table>
<p style="margin:24px 0 0"><a href="${link}" style="background:#2d5e69;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Open de aanvraag in het overzicht</a></p>`),
  };
}

export function mailOntvangst(a: Aanvraag) {
  return {
    onderwerp: `Ontvangen: je aanvraag ${a.volgnummer}`,
    html: kader(`
<p>Beste ${esc(a.naam)},</p>
<p>We hebben je aanvraag goed ontvangen. Je volgnummer is <strong>${esc(a.volgnummer)}</strong>.</p>
<table style="border-collapse:collapse;font-size:15px">
${rij("Soort", esc(SOORT_LABEL[a.soort]))}
${rij("Campus", esc(a.campus))}
${rij("Locatie", esc(a.locatie))}
${rij("Beschrijving", esc(a.beschrijving).replace(/\n/g, "<br>"))}
</table>
<p>Je krijgt een nieuwe mail zodra je aanvraag beoordeeld is.</p>
<p>Met vriendelijke groeten,<br>De directie</p>`),
  };
}

export function mailStatusG(a: Aanvraag) {
  return {
    onderwerp: `Je aanvraag ${a.volgnummer} werd doorgegeven`,
    html: kader(`
<p>Beste ${esc(a.naam)},</p>
<p>Je aanvraag ${esc(samenvatting(a))} werd doorgegeven aan de technische dienst.</p>
<p>Met vriendelijke groeten,<br>De directie</p>`),
  };
}

export function mailStatusNG(a: Aanvraag, reden: string) {
  return {
    onderwerp: `Je aanvraag ${a.volgnummer} wordt niet uitgevoerd`,
    html: kader(`
<p>Beste ${esc(a.naam)},</p>
<p>Je aanvraag ${esc(samenvatting(a))} wordt niet uitgevoerd.</p>
<p><strong>Reden:</strong><br>${esc(reden).replace(/\n/g, "<br>")}</p>
<p>Met vriendelijke groeten,<br>De directie</p>`),
  };
}
