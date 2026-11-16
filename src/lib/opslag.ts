// Foto-opslag, met automatische terugval zodat foto's altijd bewaard worden:
//   1. Vercel Blob, privé (voorkeur: enkel bereikbaar via de app na inloggen)
//   2. Vercel Blob, publiek (als de Blob-opslag als "Public" werd aangemaakt;
//      de link wordt nooit getoond, foto's gaan altijd via de app na inloggen)
//   3. De database zelf (als Blob ontbreekt of niet werkt)
// Lokaal zonder BLOB_READ_WRITE_TOKEN: map ".lokale-opslag" in het project.
//
// Met FOTO_OPSLAG=database worden foto's altijd in de database bewaard.
//
// Verwijzingen die in de tabel Foto bewaard worden:
//   "db:<id>"          → tabel FotoBestand
//   "blobpub:<url>"    → publieke Vercel Blob
//   "<pad>"            → privé Vercel Blob (of lokaal bestand zonder token)
import { put, get } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./prisma";

const LOKAAL = path.join(process.cwd(), ".lokale-opslag");
const TIJDSLIMIET = 10_000;

type Modus = "blob-privé" | "blob-publiek" | "database" | "lokaal";

// Onthoudt welke manier werkt, zodat volgende foto's meteen goed gaan.
let werkendeModus: Modus | null = null;

/** Breekt af als de opslag niet binnen de tijd antwoordt (anders kan een inzending blijven hangen). */
function metTijdslimiet<T>(p: Promise<T>, ms = TIJDSLIMIET): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, nok) =>
      setTimeout(() => nok(new Error(`Foto-opslag antwoordde niet binnen ${ms / 1000} seconden.`)), ms)
    ),
  ]);
}

function startModi(): Modus[] {
  if (process.env.FOTO_OPSLAG === "database") return ["database"];
  if (!process.env.BLOB_READ_WRITE_TOKEN) return process.env.VERCEL ? ["database"] : ["lokaal"];
  const alle: Modus[] = ["blob-privé", "blob-publiek", "database"];
  // Begin bij de manier die eerder werkte.
  return werkendeModus ? [werkendeModus, ...alle.filter((m) => m !== werkendeModus)] : alle;
}

async function bewaarMet(modus: Modus, pad: string, data: Buffer, contentType: string): Promise<string> {
  switch (modus) {
    case "blob-privé": {
      const r = await metTijdslimiet(
        put(pad, data, { access: "private", contentType, addRandomSuffix: true })
      );
      return r.pathname;
    }
    case "blob-publiek": {
      const r = await metTijdslimiet(
        put(pad, data, { access: "public", contentType, addRandomSuffix: true })
      );
      return `blobpub:${r.url}`;
    }
    case "database": {
      const r = await prisma.fotoBestand.create({
        data: { contentType, data: new Uint8Array(data) },
        select: { id: true },
      });
      return `db:${r.id}`;
    }
    case "lokaal": {
      const doel = path.join(LOKAAL, pad);
      await fs.mkdir(path.dirname(doel), { recursive: true });
      await fs.writeFile(doel, data);
      return pad;
    }
  }
}

export async function bewaar(pad: string, data: Buffer, contentType: string): Promise<string> {
  const fouten: string[] = [];
  for (const modus of startModi()) {
    try {
      const ref = await bewaarMet(modus, pad, data, contentType);
      if (werkendeModus !== modus) {
        if (fouten.length) console.warn(`[foto-opslag] Overgeschakeld naar "${modus}". Eerdere fouten: ${fouten.join(" | ")}`);
        werkendeModus = modus;
      }
      return ref;
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[foto-opslag] "${modus}" mislukt voor ${pad}: ${msg}`);
      fouten.push(`${modus}: ${msg}`);
    }
  }
  throw new Error(`Geen enkele opslag werkte. ${fouten.join(" | ")}`);
}

async function leesStream(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

export async function lees(ref: string): Promise<Buffer | null> {
  try {
    if (ref.startsWith("db:")) {
      const r = await prisma.fotoBestand.findUnique({ where: { id: ref.slice(3) } });
      return r ? Buffer.from(r.data) : null;
    }
    if (ref.startsWith("blobpub:")) {
      const r = await metTijdslimiet(fetch(ref.slice(8)));
      return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
    }
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const r = await metTijdslimiet(get(ref, { access: "private" }));
      return r?.stream ? await leesStream(r.stream) : null;
    }
    const veilig = path.normalize(ref).replace(/^(\.\.(\/|\\|$))+/, "");
    return await fs.readFile(path.join(LOKAAL, veilig));
  } catch (e) {
    console.error(`[foto-opslag] Lezen mislukt voor ${ref}:`, e);
    return null;
  }
}
