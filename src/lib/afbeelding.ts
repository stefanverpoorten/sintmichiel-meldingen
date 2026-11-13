// Controle en verkleining van foto's aan de serverkant.
import sharp from "sharp";
import { MAX_FOTO_BYTES } from "./constanten";

export type FotoType = "jpeg" | "png" | "heic";

/** Bepaalt het echte bestandstype op basis van de inhoud (niet de extensie). */
export function detecteerType(buf: Buffer): FotoType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const merk = buf.subarray(8, 12).toString("ascii");
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(merk))
      return "heic";
  }
  return null;
}

export class FotoFout extends Error {}

export async function verwerkFoto(buf: Buffer, naam: string) {
  if (buf.length > MAX_FOTO_BYTES) {
    throw new FotoFout(`De foto "${naam}" is groter dan 10 MB.`);
  }
  const type = detecteerType(buf);
  if (!type) {
    throw new FotoFout(`"${naam}" is geen geldige foto (enkel jpg, png of heic).`);
  }
  try {
    const basis = sharp(buf, { failOn: "error" }).rotate();
    const groot = await basis
      .clone()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const klein = await basis
      .clone()
      .resize({ width: 320, height: 320, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
    return { groot, klein };
  } catch {
    throw new FotoFout(
      type === "heic"
        ? `De HEIC-foto "${naam}" kon niet verwerkt worden. Probeer ze als jpg te uploaden.`
        : `De foto "${naam}" kon niet gelezen worden.`
    );
  }
}
