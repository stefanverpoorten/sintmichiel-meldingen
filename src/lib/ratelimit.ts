import { createHash } from "crypto";
import { prisma } from "./prisma";
import { config } from "./config";

export function hashIp(ip: string): string {
  const zout = process.env.IP_HASH_SALT ?? process.env.AUTH_SECRET ?? "sintmichiel";
  return createHash("sha256").update(`${zout}:${ip}`).digest("hex").slice(0, 32);
}

/** Registreert een poging en geeft true als het IP-adres nog onder de limiet zit. */
export async function binnenLimiet(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);
  const sinds = new Date(Date.now() - config.rateLimitMinuten * 60_000);
  const aantal = await prisma.inzending.count({
    where: { ipHash, tijdstip: { gte: sinds } },
  });
  if (aantal >= config.rateLimitMax) return false;
  await prisma.inzending.create({ data: { ipHash } });
  // oude registraties opruimen
  await prisma.inzending.deleteMany({
    where: { tijdstip: { lt: new Date(Date.now() - 24 * 3600_000) } },
  });
  return true;
}
