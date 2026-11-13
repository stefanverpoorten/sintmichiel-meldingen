import { prisma } from "./prisma";
import { bouwOrderBy, bouwWhere, type Filters, type Weergave } from "./filters";
import { datum, datumTijd } from "./datum";
import type { Prisma } from "@prisma/client";

export const aanvraagInclude = {
  fotos: { orderBy: { volgorde: "asc" } },
  klusjesman: true,
  mails: { orderBy: { aangemaakt: "desc" } },
} satisfies Prisma.AanvraagInclude;

export type AanvraagVolledig = Prisma.AanvraagGetPayload<{ include: typeof aanvraagInclude }>;

export type MailInfo = {
  id: string;
  status: "VERSTUURD" | "MISLUKT" | "TEST";
  fout: string | null;
  tijd: string;
};

export type Rij = {
  id: string;
  volgnummer: string;
  ingediendOp: string;
  naam: string;
  email: string;
  soort: "DEFECT" | "TAAK";
  campus: string;
  locatie: string;
  beschrijving: string;
  fotoIds: string[];
  status: "G" | "NG" | null;
  ngReden: string | null;
  prioriteit: number | null;
  klusjesmanId: string | null;
  klusjesmanNaam: string | null;
  controle: "OK" | "NOK" | null;
  controleDatum: string;
  interneOpmerking: string | null;
  statusMail: MailInfo | null;
};

export function naarRij(a: AanvraagVolledig): Rij {
  const type = a.status === "G" ? "STATUS_G" : a.status === "NG" ? "STATUS_NG" : null;
  const m = type ? a.mails.find((x) => x.type === type) : undefined;
  return {
    id: a.id,
    volgnummer: a.volgnummer,
    ingediendOp: datumTijd(a.ingediendOp),
    naam: a.naam,
    email: a.email,
    soort: a.soort,
    campus: a.campus,
    locatie: a.locatie,
    beschrijving: a.beschrijving,
    fotoIds: a.fotos.map((f) => f.id),
    status: a.status,
    ngReden: a.ngReden,
    prioriteit: a.prioriteit,
    klusjesmanId: a.klusjesmanId,
    klusjesmanNaam: a.klusjesman?.naam ?? null,
    controle: a.controle,
    controleDatum: datum(a.controleDatum),
    interneOpmerking: a.interneOpmerking,
    statusMail: m
      ? { id: m.id, status: m.status, fout: m.fout, tijd: datumTijd(m.verstuurdOp ?? m.aangemaakt) }
      : null,
  };
}

export async function laadAanvragen(weergave: Weergave, f: Filters) {
  return prisma.aanvraag.findMany({
    where: bouwWhere(weergave, f),
    orderBy: bouwOrderBy(f, weergave),
    include: aanvraagInclude,
  });
}

export async function klusjesmanOpties() {
  const alle = await prisma.klusjesman.findMany({ orderBy: { naam: "asc" } });
  return alle.map((k) => ({ id: k.id, naam: k.naam, actief: k.actief }));
}

export type KlusjesmanOptie = Awaited<ReturnType<typeof klusjesmanOpties>>[number];
