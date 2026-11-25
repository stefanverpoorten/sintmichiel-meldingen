// Inhoud van alle mails, op basis van de (aanpasbare) mailsjablonen.
import type { Aanvraag, MailType } from "@prisma/client";
import { prisma } from "./prisma";
import { datumTijd } from "./datum";
import { config } from "./config";
import { bouwMail, STANDAARD, type Gegevens, type Sjabloon, type SjabloonType } from "./sjabloon";

export { esc } from "./sjabloon";

export async function haalSjabloon(type: SjabloonType): Promise<Sjabloon> {
  const s = await prisma.mailSjabloon.findUnique({ where: { type: type as MailType } });
  return s ? { onderwerp: s.onderwerp, inhoud: s.inhoud } : STANDAARD[type];
}

function gegevens(a: Aanvraag, reden?: string): Gegevens {
  return {
    naam: a.naam,
    volgnummer: a.volgnummer,
    soort: a.soort,
    directGevaar: a.directGevaar,
    campus: a.campus,
    locatie: a.locatie,
    beschrijving: a.beschrijving,
    datum: datumTijd(a.ingediendOp),
    reden,
    link: `${config.appUrl}/beheer/aanvraag/${a.id}`,
  };
}

export async function mailNieuweAanvraag(a: Aanvraag) {
  return bouwMail(await haalSjabloon("NIEUWE_AANVRAAG"), gegevens(a));
}

export async function mailOntvangst(a: Aanvraag) {
  return bouwMail(await haalSjabloon("ONTVANGST"), gegevens(a));
}

export async function mailStatusG(a: Aanvraag) {
  return bouwMail(await haalSjabloon("STATUS_G"), gegevens(a));
}

export async function mailStatusNG(a: Aanvraag, reden: string) {
  return bouwMail(await haalSjabloon("STATUS_NG"), gegevens(a, reden));
}
