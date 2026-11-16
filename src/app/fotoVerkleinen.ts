// Verkleint foto's in de browser vóór het uploaden (sneller op gsm, en Vercel aanvaardt max. ±4,5 MB).
const MAX_ZIJDE = 1600;
export const MAX_BYTES = 10 * 1024 * 1024;

export function isToegelaten(f: File): boolean {
  const naam = f.name.toLowerCase();
  return (
    // Elke foto die de browser kan lezen (jpg, png, heic, webp…); ze wordt hierna omgezet naar jpg.
    f.type.startsWith("image/") ||
    /\.(jpe?g|png|heic|heif|webp)$/.test(naam)
  );
}

function isHeic(f: File) {
  return f.type === "image/heic" || f.type === "image/heif" || /\.(heic|heif)$/i.test(f.name);
}

async function naarCanvasJpeg(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const schaal = Math.min(1, MAX_ZIJDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * schaal);
  const h = Math.round(bmp.height * schaal);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((ok, nok) =>
    canvas.toBlob((b) => (b ? ok(b) : nok(new Error("toBlob"))), "image/jpeg", 0.85)
  );
}

export async function verkleinFoto(f: File): Promise<File> {
  let bron: Blob = f;
  if (isHeic(f)) {
    try {
      // Safari kan HEIC zelf lezen; andere browsers via heic2any.
      await naarCanvasJpeg(f).then((b) => (bron = b));
      return new File([bron], f.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    } catch {
      const heic2any = (await import("heic2any")).default;
      const r = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.9 });
      bron = Array.isArray(r) ? r[0] : r;
    }
  }
  try {
    const jpeg = await naarCanvasJpeg(bron);
    return new File([jpeg], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // Verkleinen lukt niet in deze browser: stuur het origineel (de server verkleint ook).
    if (bron.size > 3.5 * 1024 * 1024) {
      throw new Error(`De foto "${f.name}" kon niet verkleind worden en is te groot.`);
    }
    return new File([bron], f.name, { type: bron.type || f.type });
  }
}
