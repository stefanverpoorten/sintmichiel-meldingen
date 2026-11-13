import { prisma } from "@/lib/prisma";
import { leesFilters, filtersNaarQuery } from "@/lib/filters";
import { klusjesmanOpties, laadAanvragen, naarRij } from "@/lib/overzicht";
import { huidigSchooljaar, schooljaar } from "@/lib/datum";
import Filterbalk from "../Filterbalk";
import Tabel from "../Tabel";

export const dynamic = "force-dynamic";

export default async function Archief({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = leesFilters(await searchParams);
  const datums = await prisma.aanvraag.findMany({
    where: { controle: "OK", controleDatum: { not: null } },
    select: { controleDatum: true },
  });
  const jaren = new Set<string>([huidigSchooljaar(), ...datums.map((d) => schooljaar(d.controleDatum!))]);
  const schooljaren = [...jaren].sort().reverse();
  if (!filters.schooljaar || !schooljaren.includes(filters.schooljaar)) filters.schooljaar = huidigSchooljaar();

  const [aanvragen, klusjesmannen] = await Promise.all([laadAanvragen("archief", filters), klusjesmanOpties()]);
  const q = filtersNaarQuery(filters);
  return (
    <main className="inhoud">
      <div className="titelrij">
        <h1>
          Archief {filters.schooljaar} <span className="teller">({aanvragen.length})</span>
        </h1>
        <a className="knop secundair" href={`/api/export?weergave=archief&${q}`}>
          ⬇ Exporteren naar Excel
        </a>
      </div>
      <p className="intro">
        Gecontroleerde aanvragen (Controle = OK), ingedeeld per schooljaar volgens de controledatum
        (1 september t.e.m. 31 augustus).
      </p>
      <Filterbalk filters={filters} weergave="archief" klusjesmannen={klusjesmannen} schooljaren={schooljaren} />
      <Tabel rijen={aanvragen.map(naarRij)} weergave="archief" klusjesmannen={klusjesmannen} />
    </main>
  );
}
