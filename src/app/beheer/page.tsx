import { leesFilters, filtersNaarQuery } from "@/lib/filters";
import { klusjesmanOpties, laadAanvragen, naarRij } from "@/lib/overzicht";
import Filterbalk from "./Filterbalk";
import Tabel from "./Tabel";

export const dynamic = "force-dynamic";

export default async function Overzicht({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = leesFilters(await searchParams);
  const [aanvragen, klusjesmannen] = await Promise.all([laadAanvragen("actief", filters), klusjesmanOpties()]);
  const q = filtersNaarQuery(filters);
  return (
    <main className="inhoud">
      <div className="titelrij">
        <h1>
          Actieve aanvragen <span className="teller">({aanvragen.length})</span>
        </h1>
        <a className="knop secundair" href={`/api/export?weergave=actief${q ? `&${q}` : ""}`}>
          ⬇ Exporteren naar Excel
        </a>
      </div>
      <Filterbalk filters={filters} weergave="actief" klusjesmannen={klusjesmannen} />
      <Tabel rijen={aanvragen.map(naarRij)} weergave="actief" klusjesmannen={klusjesmannen} />
    </main>
  );
}
