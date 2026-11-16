// Testgegevens. Gebruik dit ENKEL lokaal of in een testomgeving: alle bestaande gegevens worden gewist!
import { PrismaClient, type Prisma } from "@prisma/client";
import sharp from "sharp";
import { bewaar } from "../src/lib/opslag";

const prisma = new PrismaClient();

if (process.env.VERCEL_ENV === "production" && process.env.SEED_FORCE !== "true") {
  console.error("Seed geweigerd: dit lijkt de productiedatabase. Zet SEED_FORCE=true als je het echt wil.");
  process.exit(1);
}

const BEHEERDER = "stefan.verpoorten@sintmichiel.be";
const DIRECTEUR = "geert.demeulemeester@sintmichiel.be";

async function testfoto(tekst: string, kleur: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
    <rect width="100%" height="100%" fill="${kleur}"/>
    <text x="50%" y="50%" font-size="72" font-family="sans-serif" fill="#fff" text-anchor="middle" dominant-baseline="middle">${tekst}</text>
  </svg>`;
  const groot = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  const klein = await sharp(groot).resize(320).jpeg({ quality: 70 }).toBuffer();
  return { groot, klein };
}

function dagen(n: number, uur = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(uur, 15, 0, 0);
  return d;
}

type Test = {
  soort: "DEFECT" | "TAAK";
  campus: string;
  locatie: string;
  beschrijving: string;
  naam: string;
  ingediend: Date;
  status?: "G" | "NG";
  ngReden?: string;
  prioriteit?: number;
  klusjesman?: number;
  controleDatum?: Date;
  controle?: "OK" | "NOK";
  opmerking?: string;
  fotos?: number;
};

async function main() {
  console.log("Bestaande gegevens wissen…");
  await prisma.historiek.deleteMany();
  await prisma.mail.deleteMany();
  await prisma.foto.deleteMany();
  await prisma.fotoBestand.deleteMany();
  await prisma.aanvraag.deleteMany();
  await prisma.klusjesman.deleteMany();
  await prisma.teller.deleteMany();
  await prisma.inzending.deleteMany();

  const km = await Promise.all(
    ["Jan (test)", "Marc (test)", "Luc (test, inactief)"].map((naam, i) =>
      prisma.klusjesman.create({ data: { naam, actief: i < 2 } })
    )
  );

  const tests: Test[] = [
    { soort: "DEFECT", campus: "Campus 3", locatie: "Lokaal 1.04", beschrijving: "De beamer gaat niet meer aan. Lampje knippert oranje.", naam: "An Peeters", ingediend: dagen(1), fotos: 2 },
    { soort: "TAAK", campus: "Campus 7/9", locatie: "Refter", beschrijving: "Graag 4 extra tafels klaarzetten voor het oudercontact van vrijdag.", naam: "Bert Claes", ingediend: dagen(2), status: "G", prioriteit: 2, klusjesman: 0 },
    { soort: "DEFECT", campus: "Campus 11", locatie: "Toiletten jongens, gelijkvloers", beschrijving: "Kraan blijft lopen in het tweede toilet.\nEr staat al water op de vloer.", naam: "Chris Janssens", ingediend: dagen(3), status: "G", prioriteit: 1, klusjesman: 0, fotos: 1 },
    { soort: "DEFECT", campus: "Wijkschool Geleeg", locatie: "Speelplaats", beschrijving: "Losliggende tegel aan de zandbak, struikelgevaar.", naam: "Dirk Wouters", ingediend: dagen(4), status: "G", prioriteit: 1, klusjesman: 1, controle: "NOK", opmerking: "Eerste herstelling niet goed, opnieuw bekijken." },
    { soort: "TAAK", campus: "Campus 13", locatie: "Lokaal B12", beschrijving: "Whiteboard ophangen naast het bord.", naam: "Els Maes", ingediend: dagen(6), prioriteit: 3 },
    { soort: "DEFECT", campus: "Wijkschool Strooiendorp", locatie: "Klas 3de leerjaar", beschrijving: "Raam sluit niet meer goed, het tocht erg.", naam: "Frank Jacobs", ingediend: dagen(8), status: "G", prioriteit: 2, klusjesman: 1 },
    // Niet uitgevoerd
    { soort: "TAAK", campus: "Campus 3", locatie: "Leraarskamer", beschrijving: "Nieuwe koffiemachine installeren.", naam: "Greet Mertens", ingediend: dagen(10), status: "NG", ngReden: "Valt niet onder de technische dienst; aankoop via het secretariaat aanvragen." },
    // Archief dit schooljaar (2026-2027)
    { soort: "DEFECT", campus: "Campus 7/9", locatie: "Turnzaal", beschrijving: "Basketbalring hangt scheef.", naam: "Hilde Willems", ingediend: dagen(40), status: "G", prioriteit: 2, klusjesman: 0, controle: "OK", controleDatum: dagen(30), fotos: 1 },
    { soort: "TAAK", campus: "Campus 11", locatie: "Gang 1ste verdieping", beschrijving: "Prikbord ophangen.", naam: "Ivo Goossens", ingediend: dagen(50), status: "G", prioriteit: 3, klusjesman: 2, controle: "OK", controleDatum: dagen(45) },
    // Archief vorig schooljaar (2025-2026)
    { soort: "DEFECT", campus: "Campus 13", locatie: "Lokaal A03", beschrijving: "Radiator wordt niet warm.", naam: "Joke De Smet", ingediend: new Date("2026-03-02T08:30:00Z"), status: "G", prioriteit: 1, klusjesman: 2, controle: "OK", controleDatum: new Date("2026-03-10T14:00:00Z") },
    { soort: "TAAK", campus: "Campus 3", locatie: "Bib", beschrijving: "Boekenrek verplaatsen naar de andere muur.", naam: "Karel Hermans", ingediend: new Date("2026-06-15T09:00:00Z"), status: "G", prioriteit: 3, klusjesman: 0, controle: "OK", controleDatum: new Date("2026-08-31T12:00:00Z") },
  ];

  // Volgnummers per kalenderjaar, chronologisch
  const gesorteerd = [...tests].sort((a, b) => +a.ingediend - +b.ingediend);
  const tellers: Record<number, number> = {};
  const kleuren = ["#2d5e69", "#00a19a", "#e54e14", "#9f3646"];

  for (const t of gesorteerd) {
    const jaar = t.ingediend.getUTCFullYear();
    tellers[jaar] = (tellers[jaar] ?? 0) + 1;
    const volgnummer = `${jaar}-${String(tellers[jaar]).padStart(4, "0")}`;
    const email = t.naam.toLowerCase().replace(/ /g, ".").replace(/[^a-z.]/g, "") + "@sintmichiel.be";

    const fotos: Prisma.FotoCreateWithoutAanvraagInput[] = [];
    for (let i = 0; i < (t.fotos ?? 0); i++) {
      const f = await testfoto(`${volgnummer} – foto ${i + 1}`, kleuren[i % kleuren.length]);
      fotos.push({
        pad: await bewaar(`aanvragen/${volgnummer}/foto-${i + 1}.jpg`, f.groot, "image/jpeg"),
        miniatuur: await bewaar(`aanvragen/${volgnummer}/mini-${i + 1}.jpg`, f.klein, "image/jpeg"),
        bestandsnaam: `testfoto-${i + 1}.jpg`,
        grootte: f.groot.length,
        volgorde: i,
      });
    }

    const hist: Prisma.HistoriekCreateWithoutAanvraagInput[] = [
      { door: email, veld: "Aanvraag ingediend", nieuweWaarde: volgnummer, tijdstip: t.ingediend },
    ];
    const later = (min: number) => new Date(+t.ingediend + min * 60_000);
    if (t.status) hist.push({ door: DIRECTEUR, veld: "Status", nieuweWaarde: t.status, tijdstip: later(60) });
    if (t.ngReden) hist.push({ door: DIRECTEUR, veld: "Reden NG", nieuweWaarde: t.ngReden, tijdstip: later(60) });
    if (t.prioriteit) hist.push({ door: BEHEERDER, veld: "Prioriteit", nieuweWaarde: String(t.prioriteit), tijdstip: later(90) });
    if (t.klusjesman !== undefined) hist.push({ door: BEHEERDER, veld: "Toegewezen aan", nieuweWaarde: km[t.klusjesman].naam, tijdstip: later(95) });
    if (t.controle) hist.push({ door: BEHEERDER, veld: "Controle", nieuweWaarde: t.controle, tijdstip: t.controleDatum ?? later(2000) });

    const mails: Prisma.MailCreateWithoutAanvraagInput[] = [
      { type: "NIEUWE_AANVRAAG", aan: `${DIRECTEUR}, ${BEHEERDER}`, onderwerp: `Nieuwe aanvraag ${volgnummer}`, inhoud: "(testgegevens)", status: "TEST", verstuurdOp: t.ingediend, aangemaakt: t.ingediend },
      { type: "ONTVANGST", aan: email, onderwerp: `Ontvangen: je aanvraag ${volgnummer}`, inhoud: "(testgegevens)", status: "TEST", verstuurdOp: t.ingediend, aangemaakt: t.ingediend },
    ];
    if (t.status)
      mails.push({
        type: t.status === "G" ? "STATUS_G" : "STATUS_NG",
        aan: email,
        onderwerp: `Statusmail ${volgnummer}`,
        inhoud: "(testgegevens)",
        // één mislukte mail om de knop "Opnieuw versturen" te kunnen testen
        status: t.naam === "Frank Jacobs" ? "MISLUKT" : "TEST",
        fout: t.naam === "Frank Jacobs" ? "Testfout: Microsoft Graph niet bereikbaar" : null,
        verstuurdOp: t.naam === "Frank Jacobs" ? null : later(60),
        aangemaakt: later(60),
      });

    await prisma.aanvraag.create({
      data: {
        volgnummer,
        ingediendOp: t.ingediend,
        naam: t.naam,
        email,
        soort: t.soort,
        campus: t.campus,
        locatie: t.locatie,
        beschrijving: t.beschrijving,
        status: t.status,
        ngReden: t.ngReden,
        prioriteit: t.prioriteit,
        klusjesmanId: t.klusjesman !== undefined ? km[t.klusjesman].id : undefined,
        controle: t.controle,
        controleDatum: t.controle === "OK" ? t.controleDatum : undefined,
        interneOpmerking: t.opmerking,
        fotos: { create: fotos },
        historiek: { create: hist },
        mails: { create: mails },
      },
    });
  }
  for (const [jaar, laatste] of Object.entries(tellers))
    await prisma.teller.create({ data: { jaar: Number(jaar), laatste } });

  console.log(`✓ ${tests.length} testaanvragen en ${km.length} testklusjesmannen aangemaakt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
