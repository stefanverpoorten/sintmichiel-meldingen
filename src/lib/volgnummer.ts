import { prisma } from "./prisma";
import { jaarBrussel } from "./datum";

/** Geeft het volgende volgnummer, bv. 2026-0001. Veilig bij gelijktijdige inzendingen. */
export async function volgendVolgnummer(nu = new Date()): Promise<string> {
  const jaar = jaarBrussel(nu);
  const rijen = await prisma.$queryRaw<{ laatste: number }[]>`
    INSERT INTO "Teller" ("jaar", "laatste") VALUES (${jaar}, 1)
    ON CONFLICT ("jaar") DO UPDATE SET "laatste" = "Teller"."laatste" + 1
    RETURNING "laatste"`;
  return `${jaar}-${String(rijen[0].laatste).padStart(4, "0")}`;
}
