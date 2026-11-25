// Gedeelde filterlogica voor overzicht, archieven en Excel-export.
import type { Prisma } from "@prisma/client";
import { schooljaarGrenzen } from "./datum";

export type Weergave = "actief" | "archief" | "ng";

export type Filters = {
  q?: string;
  campus?: string;
  soort?: string;
  status?: string;
  prioriteit?: string;
  klusjesman?: string;
  sort?: string;
  schooljaar?: string;
};

export function leesFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const s = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  return {
    q: s("q"),
    campus: s("campus"),
    soort: s("soort"),
    status: s("status"),
    prioriteit: s("prioriteit"),
    klusjesman: s("klusjesman"),
    sort: s("sort"),
    schooljaar: s("schooljaar"),
  };
}

export function filtersNaarQuery(f: Filters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  return p.toString();
}

export function bouwWhere(weergave: Weergave, f: Filters): Prisma.AanvraagWhereInput {
  const en: Prisma.AanvraagWhereInput[] = [];

  if (weergave === "actief") {
    en.push({ OR: [{ status: null }, { status: "G" }] });
    en.push({ OR: [{ controle: null }, { controle: "NOK" }] });
  } else if (weergave === "archief") {
    en.push({ controle: "OK" });
    en.push({ OR: [{ status: null }, { status: "G" }] });
    const g = f.schooljaar ? schooljaarGrenzen(f.schooljaar) : null;
    if (g) en.push({ controleDatum: { gte: g.van, lt: g.tot } });
  } else {
    en.push({ status: "NG" });
  }

  if (f.campus) en.push({ campus: f.campus });
  if (f.soort === "DEFECT" || f.soort === "TAAK" || f.soort === "GEVAARLIJK") en.push({ soort: f.soort });
  if (f.status === "leeg") en.push({ status: null });
  else if (f.status === "G" || f.status === "NG") en.push({ status: f.status });
  if (f.prioriteit === "leeg") en.push({ prioriteit: null });
  else if (f.prioriteit && /^[123]$/.test(f.prioriteit)) en.push({ prioriteit: Number(f.prioriteit) });
  if (f.klusjesman === "geen") en.push({ klusjesmanId: null });
  else if (f.klusjesman) en.push({ klusjesmanId: f.klusjesman });

  if (f.q?.trim()) {
    const q = f.q.trim();
    const m = { contains: q, mode: "insensitive" as const };
    en.push({
      OR: [
        { volgnummer: m },
        { naam: m },
        { email: m },
        { locatie: m },
        { beschrijving: m },
        { interneOpmerking: m },
        { ngReden: m },
        { campus: m },
      ],
    });
  }
  return { AND: en };
}

export function bouwOrderBy(
  f: Filters,
  weergave: Weergave
): Prisma.AanvraagOrderByWithRelationInput[] {
  switch (f.sort) {
    case "datum_op":
      return [{ ingediendOp: "asc" }];
    case "prio_op":
      return [{ prioriteit: { sort: "asc", nulls: "last" } }, { ingediendOp: "asc" }];
    case "prio_af":
      return [{ prioriteit: { sort: "desc", nulls: "last" } }, { ingediendOp: "asc" }];
    case "controle_af":
      return [{ controleDatum: { sort: "desc", nulls: "last" } }];
    default:
      return weergave === "archief"
        ? [{ controleDatum: { sort: "desc", nulls: "last" } }]
        : [{ ingediendOp: "desc" }];
  }
}
