import { prisma } from "./prisma";
import { lees } from "./opslag";
import type { Bijlage } from "./mail";

// Microsoft Graph aanvaardt bij sendMail ongeveer 3 MB aan bijlagen.
const MAX_BIJLAGEN = 2.5 * 1024 * 1024;

export async function fotoBijlagen(aanvraagId: string): Promise<Bijlage[] | null> {
  const fotos = await prisma.foto.findMany({ where: { aanvraagId }, orderBy: { volgorde: "asc" } });
  const bijlagen: Bijlage[] = [];
  let totaal = 0;
  for (const [i, f] of fotos.entries()) {
    const data = await lees(f.pad);
    if (!data) continue;
    totaal += data.length;
    bijlagen.push({ naam: `foto-${i + 1}.jpg`, contentType: "image/jpeg", data });
  }
  return totaal > MAX_BIJLAGEN ? null : bijlagen;
}
