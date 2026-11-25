// Export van het (gefilterde) overzicht naar Excel (.xlsx).
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { huidigeBeheerder } from "@/lib/toegang";
import { bouwOrderBy, bouwWhere, leesFilters, type Weergave } from "@/lib/filters";
import { brusselsAlsUtc, datum, huidigSchooljaar, schooljaar } from "@/lib/datum";
import { SOORT_LABEL } from "@/lib/constanten";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await huidigeBeheerder())) return new Response("Geen toegang", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const weergave: Weergave = sp.weergave === "archief" || sp.weergave === "ng" ? sp.weergave : "actief";
  const filters = leesFilters(sp);
  if (weergave === "archief" && !filters.schooljaar) filters.schooljaar = huidigSchooljaar();

  const aanvragen = await prisma.aanvraag.findMany({
    where: bouwWhere(weergave, filters),
    orderBy: bouwOrderBy(filters, weergave),
    include: {
      klusjesman: true,
      _count: { select: { fotos: true } },
      historiek: { orderBy: { tijdstip: "asc" } },
      mails: { where: { type: { in: ["STATUS_G", "STATUS_NG"] } }, orderBy: { aangemaakt: "desc" } },
    },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Meldingen Sint-Michiel";
  const ws = wb.addWorksheet("Aanvragen", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Volgnummer", key: "volgnummer", width: 12 },
    { header: "Ingediend op", key: "ingediendOp", width: 17, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Naam", key: "naam", width: 22 },
    { header: "E-mail", key: "email", width: 30 },
    { header: "Soort", key: "soort", width: 20 },
    { header: "Direct gevaar", key: "directGevaar", width: 13 },
    { header: "Campus", key: "campus", width: 22 },
    { header: "Locatie", key: "locatie", width: 20 },
    { header: "Beschrijving", key: "beschrijving", width: 60 },
    { header: "Foto's", key: "fotos", width: 7 },
    { header: "Status", key: "status", width: 8 },
    { header: "Reden NG", key: "ngReden", width: 40 },
    { header: "Statusmail", key: "mail", width: 22 },
    { header: "Prioriteit", key: "prioriteit", width: 10 },
    { header: "Toegewezen aan", key: "klusjesman", width: 20 },
    { header: "Controle", key: "controle", width: 9 },
    { header: "Controledatum", key: "controleDatum", width: 17, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Schooljaar (controle)", key: "schooljaar", width: 12 },
    { header: "Interne opmerking", key: "opmerking", width: 40 },
  ];
  for (const a of aanvragen) {
    const m = a.mails.find((x) => x.type === (a.status === "G" ? "STATUS_G" : "STATUS_NG"));
    ws.addRow({
      volgnummer: a.volgnummer,
      ingediendOp: brusselsAlsUtc(a.ingediendOp),
      naam: a.naam,
      email: a.email,
      soort: SOORT_LABEL[a.soort],
      directGevaar: a.soort === "GEVAARLIJK" ? (a.directGevaar ? "Ja" : "Nee") : "",
      campus: a.campus,
      locatie: a.locatie,
      beschrijving: a.beschrijving,
      fotos: a._count.fotos,
      status: a.status ?? "",
      ngReden: a.ngReden ?? "",
      mail: a.status && m
        ? m.status === "MISLUKT" ? "MISLUKT" : `${m.status === "TEST" ? "test " : ""}${datum(m.verstuurdOp)}`
        : "",
      prioriteit: a.prioriteit ?? "",
      klusjesman: a.klusjesman?.naam ?? "",
      controle: a.controle ?? "",
      controleDatum: a.controleDatum ? brusselsAlsUtc(a.controleDatum) : null,
      schooljaar: a.controleDatum ? schooljaar(a.controleDatum) : "",
      opmerking: a.interneOpmerking ?? "",
    });
  }
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5E69" } };
  ws.autoFilter = { from: "A1", to: { row: 1, column: ws.columns.length } };
  ws.getColumn("beschrijving").alignment = { wrapText: true, vertical: "top" };

  const hs = wb.addWorksheet("Historiek", { views: [{ state: "frozen", ySplit: 1 }] });
  hs.columns = [
    { header: "Volgnummer", key: "nr", width: 12 },
    { header: "Tijdstip", key: "tijd", width: 17, style: { numFmt: "dd/mm/yyyy hh:mm" } },
    { header: "Door", key: "door", width: 34 },
    { header: "Veld", key: "veld", width: 20 },
    { header: "Oude waarde", key: "oud", width: 30 },
    { header: "Nieuwe waarde", key: "nieuw", width: 30 },
  ];
  for (const a of aanvragen)
    for (const h of a.historiek)
      hs.addRow({
        nr: a.volgnummer,
        tijd: brusselsAlsUtc(h.tijdstip),
        door: h.door,
        veld: h.veld,
        oud: h.oudeWaarde ?? "",
        nieuw: h.nieuweWaarde ?? "",
      });
  hs.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  hs.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5E69" } };

  const naam =
    weergave === "archief"
      ? `archief-${filters.schooljaar}`
      : weergave === "ng"
        ? "niet-uitgevoerd"
        : "actieve-aanvragen";
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${naam}-${datum(new Date()).replace(/\//g, "-")}.xlsx"`,
    },
  });
}
