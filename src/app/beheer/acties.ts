"use server";
// Alle wijzigingen door beheerders. Elke wijziging wordt meteen opgeslagen en in de historiek bijgehouden.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { huidigeBeheerder } from "@/lib/toegang";
import { verstuurMail, verstuurOpnieuw } from "@/lib/mail";
import { mailStatusG, mailStatusNG } from "@/lib/mailTeksten";
import { fotoBijlagen } from "@/lib/fotoBijlagen";

export type Resultaat = { ok: true; melding?: string } | { ok: false; fout: string };

async function beheerder(): Promise<string> {
  const email = await huidigeBeheerder();
  if (!email) throw new Error("Je bent niet (meer) aangemeld. Vernieuw de pagina.");
  return email;
}

async function veilig(fn: () => Promise<Resultaat>): Promise<Resultaat> {
  try {
    const r = await fn();
    revalidatePath("/beheer", "layout");
    return r;
  } catch (e) {
    return { ok: false, fout: e instanceof Error ? e.message : "Er liep iets mis." };
  }
}

function historiek(aanvraagId: string, door: string, veld: string, oud: string | null, nieuw: string | null) {
  return prisma.historiek.create({
    data: { aanvraagId, door, veld, oudeWaarde: oud || null, nieuweWaarde: nieuw || null },
  });
}

async function haal(id: string) {
  const a = await prisma.aanvraag.findUnique({ where: { id }, include: { klusjesman: true } });
  if (!a) throw new Error("Aanvraag niet gevonden.");
  return a;
}

export async function wijzigStatus(id: string, nieuw: "" | "G" | "NG", reden?: string) {
  return veilig(async () => {
    const door = await beheerder();
    const a = await haal(id);
    const nieuweStatus = nieuw === "" ? null : nieuw;
    if (a.status === nieuweStatus) return { ok: true }; // niets gewijzigd → geen mail
    const r = (reden ?? "").trim();
    if (nieuweStatus === "NG" && !r) return { ok: false, fout: "Vul een reden in." };

    const bijgewerkt = await prisma.aanvraag.update({
      where: { id },
      data: { status: nieuweStatus, ngReden: nieuweStatus === "NG" ? r : null },
    });
    await historiek(id, door, "Status", a.status, nieuweStatus);
    if (nieuweStatus === "NG") await historiek(id, door, "Reden NG", a.ngReden, r);

    if (nieuweStatus === "G" || nieuweStatus === "NG") {
      const m = nieuweStatus === "G" ? mailStatusG(bijgewerkt) : mailStatusNG(bijgewerkt, r);
      const mail = await verstuurMail({
        aanvraagId: id,
        type: nieuweStatus === "G" ? "STATUS_G" : "STATUS_NG",
        aan: [bijgewerkt.email],
        onderwerp: m.onderwerp,
        html: m.html,
      });
      if (mail.status === "MISLUKT")
        return {
          ok: false,
          fout: `De status werd opgeslagen, maar de mail kon niet verstuurd worden: ${mail.fout}`,
        };
      return {
        ok: true,
        melding: mail.status === "TEST" ? "Opgeslagen (testmodus: mail enkel gelogd)" : "Opgeslagen en mail verstuurd",
      };
    }
    return { ok: true };
  });
}

export async function wijzigPrioriteit(id: string, waarde: string) {
  return veilig(async () => {
    const door = await beheerder();
    const a = await haal(id);
    const nieuw = /^[123]$/.test(waarde) ? Number(waarde) : null;
    if (a.prioriteit === nieuw) return { ok: true };
    await prisma.aanvraag.update({ where: { id }, data: { prioriteit: nieuw } });
    await historiek(id, door, "Prioriteit", a.prioriteit?.toString() ?? null, nieuw?.toString() ?? null);
    return { ok: true };
  });
}

export async function wijzigKlusjesman(id: string, klusjesmanId: string) {
  return veilig(async () => {
    const door = await beheerder();
    const a = await haal(id);
    const nieuwId = klusjesmanId || null;
    if (a.klusjesmanId === nieuwId) return { ok: true };
    let naam: string | null = null;
    if (nieuwId) {
      const k = await prisma.klusjesman.findUnique({ where: { id: nieuwId } });
      if (!k || !k.actief) return { ok: false, fout: "Deze klusjesman is niet (meer) actief." };
      naam = k.naam;
    }
    await prisma.aanvraag.update({ where: { id }, data: { klusjesmanId: nieuwId } });
    await historiek(id, door, "Toegewezen aan", a.klusjesman?.naam ?? null, naam);
    return { ok: true };
  });
}

export async function wijzigControle(id: string, waarde: "" | "OK" | "NOK") {
  return veilig(async () => {
    const door = await beheerder();
    const a = await haal(id);
    const nieuw = waarde === "" ? null : waarde;
    if (a.controle === nieuw) return { ok: true };
    const controleDatum = nieuw === "OK" ? new Date() : null;
    await prisma.aanvraag.update({ where: { id }, data: { controle: nieuw, controleDatum } });
    await historiek(id, door, "Controle", a.controle, nieuw);
    if (nieuw === "OK") return { ok: true, melding: "Gecontroleerd: de aanvraag staat nu in het archief." };
    if (a.controle === "OK") return { ok: true, melding: "Teruggezet naar het actieve overzicht." };
    return { ok: true };
  });
}

export async function wijzigOpmerking(id: string, tekst: string) {
  return veilig(async () => {
    const door = await beheerder();
    const a = await haal(id);
    const nieuw = tekst.trim() || null;
    if ((a.interneOpmerking ?? null) === nieuw) return { ok: true };
    await prisma.aanvraag.update({ where: { id }, data: { interneOpmerking: nieuw } });
    await historiek(id, door, "Interne opmerking", a.interneOpmerking, nieuw);
    return { ok: true };
  });
}

/** Archief → terug naar actief overzicht (Controle terug op NOK, controledatum gewist). */
export async function zetTerugUitArchief(id: string) {
  return wijzigControle(id, "NOK");
}

/** "Niet uitgevoerd" → terug naar actief overzicht (status leeg, geen mail). */
export async function zetTerugUitNG(id: string) {
  return wijzigStatus(id, "");
}

export async function verstuurMailOpnieuw(mailId: string) {
  return veilig(async () => {
    await beheerder();
    const mail = await prisma.mail.findUnique({ where: { id: mailId } });
    if (!mail) return { ok: false, fout: "Mail niet gevonden." };
    const bijlagen =
      mail.type === "NIEUWE_AANVRAAG" && mail.aanvraagId ? ((await fotoBijlagen(mail.aanvraagId)) ?? []) : [];
    const r = await verstuurOpnieuw(mailId, bijlagen);
    if (r.status === "MISLUKT") return { ok: false, fout: `Versturen mislukt: ${r.fout}` };
    return { ok: true, melding: r.status === "TEST" ? "Gelogd (testmodus)" : "Mail verstuurd" };
  });
}

// ---- Klusjesmannen ----

export async function klusjesmanToevoegen(naam: string) {
  return veilig(async () => {
    await beheerder();
    const n = naam.trim();
    if (!n) return { ok: false, fout: "Vul een naam in." };
    await prisma.klusjesman.create({ data: { naam: n } });
    return { ok: true, melding: `${n} toegevoegd` };
  });
}

export async function klusjesmanWijzigen(id: string, naam: string) {
  return veilig(async () => {
    await beheerder();
    const n = naam.trim();
    if (!n) return { ok: false, fout: "Vul een naam in." };
    await prisma.klusjesman.update({ where: { id }, data: { naam: n } });
    return { ok: true, melding: "Naam gewijzigd" };
  });
}

export async function klusjesmanActief(id: string, actief: boolean) {
  return veilig(async () => {
    await beheerder();
    await prisma.klusjesman.update({ where: { id }, data: { actief } });
    return { ok: true, melding: actief ? "Opnieuw actief" : "Op inactief gezet" };
  });
}
