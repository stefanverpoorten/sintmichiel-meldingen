// Foto-opslag. Op Vercel: Vercel Blob (privé: enkel bereikbaar via de app na inloggen).
// Lokaal zonder BLOB_READ_WRITE_TOKEN: map ".lokale-opslag" in het project.
import { put, get } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

const LOKAAL = path.join(process.cwd(), ".lokale-opslag");

function gebruiktBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function bewaar(pad: string, data: Buffer, contentType: string): Promise<string> {
  if (gebruiktBlob()) {
    const res = await put(pad, data, {
      access: "private",
      contentType,
      addRandomSuffix: true,
    });
    return res.pathname;
  }
  if (process.env.VERCEL) {
    throw new Error("BLOB_READ_WRITE_TOKEN ontbreekt: koppel Vercel Blob aan het project.");
  }
  const doel = path.join(LOKAAL, pad);
  await fs.mkdir(path.dirname(doel), { recursive: true });
  await fs.writeFile(doel, data);
  return pad;
}

export async function lees(pad: string): Promise<Buffer | null> {
  if (gebruiktBlob()) {
    const res = await get(pad, { access: "private" });
    if (!res || !res.stream) return null;
    const ab = await new Response(res.stream).arrayBuffer();
    return Buffer.from(ab);
  }
  try {
    const veilig = path.normalize(pad).replace(/^(\.\.(\/|\\|$))+/, "");
    return await fs.readFile(path.join(LOKAAL, veilig));
  } catch {
    return null;
  }
}
