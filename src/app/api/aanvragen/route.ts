// Ontvangt het openbare meldingsformulier.
import { NextResponse, after } from "next/server";
import { checkBotId } from "botid/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CAMPUSSEN, MAX_FOTOS, TOEGELATEN_DOMEIN } from "@/lib/constanten";
import { binnenLimiet } from "@/lib/ratelimit";
import { FotoFout, verwerkFoto } from "@/lib/afbeelding";
import { bewaar } from "@/lib/opslag";
import { volgendVolgnummer } from "@/lib/volgnummer";
import { verstuurMail } from "@/lib/mail";
import { mailNieuweAanvraag, mailOntvangst } from "@/lib/mailTeksten";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  naam: z.string().trim().min(1, "Vul je naam in.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vul een geldig e-mailadres in.")
    .refine((e) => e.endsWith(TOEGELATEN_DOMEIN), {
      message: `Je e-mailadres moet eindigen op ${TOEGELATEN_DOMEIN}.`,
    }),
  soort: z.enum(["DEFECT", "TAAK", "GEVAARLIJK"], { message: "Kies Defect, Taak of Gevaarlijke situatie." }),
  directGevaar: z.enum(["ja", "nee", ""]).optional(),
  campus: z.enum(CAMPUSSEN, { message: "Kies een campus." }),
  locatie: z.string().trim().min(1, "Vul de locatie of het lokaalnummer in.").max(200),
  beschrijving: z.string().trim().min(1, "Vul een beschrijving in.").max(5000),
}).refine((d) => d.soort !== "GEVAARLIJK" || d.directGevaar === "ja" || d.directGevaar === "nee", {
  message: "Duid aan of er direct gevaar is.",
});

function fout(bericht: string, status = 400) {
  return NextResponse.json({ ok: false, fout: bericht }, { status });
}

export async function POST(req: Request) {
  try {
    return await verwerk(req);
  } catch (e) {
    console.error("[aanvraag] Onverwachte fout:", e);
    return fout("Er liep iets mis op de server. Probeer het later opnieuw of meld het aan de directie.", 500);
  }
}

async function verwerk(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fout("De gegevens konden niet gelezen worden. Zijn de foto's misschien te groot?", 413);
  }

  // 1. Honeypot: dit veld is onzichtbaar voor mensen. Ingevuld = robot.
  if (String(form.get("website") ?? "").trim() !== "") {
    return NextResponse.json({ ok: true, volgnummer: "ontvangen" });
  }

  // 2. Onzichtbare bot-check (Vercel BotID). Werkt enkel op Vercel; lokaal wordt ze overgeslagen.
  if (process.env.VERCEL) {
    const botCheck = await checkBotId();
    if (botCheck.isBot) return fout("Je aanvraag werd geweigerd door de beveiliging.", 403);
  }

  // 3. Rate limiting per IP-adres.
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  if (!(await binnenLimiet(ip))) {
    return fout(
      `Je hebt te veel aanvragen kort na elkaar ingediend. Probeer het binnen ${config.rateLimitMinuten} minuten opnieuw.`,
      429
    );
  }

  // 4. Velden controleren.
  const parsed = schema.safeParse({
    naam: form.get("naam") ?? "",
    email: form.get("email") ?? "",
    soort: form.get("soort") ?? "",
    directGevaar: String(form.get("directGevaar") ?? ""),
    campus: form.get("campus") ?? "",
    locatie: form.get("locatie") ?? "",
    beschrijving: form.get("beschrijving") ?? "",
  });
  if (!parsed.success) return fout(parsed.error.issues[0]?.message ?? "Controleer je gegevens.");
  const { directGevaar, ...d } = parsed.data;
  const gevaar = d.soort === "GEVAARLIJK" ? directGevaar === "ja" : null;

  // 5. Foto's controleren en verkleinen (serverkant).
  const bestanden = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (bestanden.length > MAX_FOTOS) return fout(`Je kan maximaal ${MAX_FOTOS} foto's toevoegen.`);
  const verwerkt: { groot: Buffer; klein: Buffer; naam: string; grootte: number }[] = [];
  try {
    for (const f of bestanden) {
      const buf = Buffer.from(await f.arrayBuffer());
      const r = await verwerkFoto(buf, f.name);
      verwerkt.push({ ...r, naam: f.name.slice(0, 200), grootte: r.groot.length });
    }
  } catch (e) {
    if (e instanceof FotoFout) return fout(e.message);
    throw e;
  }

  // 6. Opslaan.
  const volgnummer = await volgendVolgnummer();
  const fotoData = [];
  let fotoFout: string | null = null;
  // Lukt het opslaan van de foto's niet, dan wordt de aanvraag toch bewaard (zonder foto's).
  try {
    for (const [i, f] of verwerkt.entries()) {
      const pad = await bewaar(`aanvragen/${volgnummer}/foto-${i + 1}.jpg`, f.groot, "image/jpeg");
      const miniatuur = await bewaar(`aanvragen/${volgnummer}/mini-${i + 1}.jpg`, f.klein, "image/jpeg");
      fotoData.push({ pad, miniatuur, bestandsnaam: f.naam, grootte: f.grootte, volgorde: i });
    }
  } catch (e) {
    fotoFout = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[foto-opslag] Foto's van ${volgnummer} niet opgeslagen:`, e);
    fotoData.length = 0;
  }

  const historiek: { door: string; veld: string; nieuweWaarde: string }[] = [
    { door: d.email, veld: "Aanvraag ingediend", nieuweWaarde: volgnummer },
  ];
  if (fotoFout)
    historiek.push({
      door: "systeem",
      veld: "Foto's niet opgeslagen",
      nieuweWaarde: `${verwerkt.length} foto('s) – ${fotoFout}`.slice(0, 500),
    });

  const aanvraag = await prisma.aanvraag.create({
    data: {
      volgnummer,
      ...d,
      directGevaar: gevaar,
      interneOpmerking: fotoFout
        ? `Let op: de aanvrager voegde ${verwerkt.length} foto('s) toe, maar die konden niet opgeslagen worden.`
        : undefined,
      fotos: { create: fotoData },
      historiek: { create: historiek },
    },
  });

  // 7. Mails na het antwoord versturen, zodat de aanvrager niet hoeft te wachten.
  after(async () => {
    const nieuw = await mailNieuweAanvraag(aanvraag);
    await verstuurMail({
      aanvraagId: aanvraag.id,
      type: "NIEUWE_AANVRAAG",
      aan: config.meldingOntvangers,
      onderwerp: nieuw.onderwerp,
      html: nieuw.html,
    });
    const ontvangst = await mailOntvangst(aanvraag);
    await verstuurMail({
      aanvraagId: aanvraag.id,
      type: "ONTVANGST",
      aan: [aanvraag.email],
      onderwerp: ontvangst.onderwerp,
      html: ontvangst.html,
    });
  });

  return NextResponse.json({
    ok: true,
    volgnummer,
    waarschuwing: fotoFout
      ? "Je aanvraag is goed ontvangen, maar je foto's konden niet bewaard worden. Je hoeft niets opnieuw in te dienen."
      : undefined,
  });
}
