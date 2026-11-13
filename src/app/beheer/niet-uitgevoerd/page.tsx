import { leesFilters, filtersNaarQuery } from "@/lib/filters";
import { klusjesmanOpties, laadAanvragen, naarRij } from "@/lib/overzicht";
import Filterbalk from "../Filterbalk";
import Tabel from "../Tabel";

export const dynamic = "force-dynamic";

export default async function NietUitgevoerd({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = leesFilters(await searchParams);
  const [aanvragen, klusjesmannen] = await Promise.all([laadAanvragen("ng", filters), klusjesmanOpties()]);
  const q = filtersNaarQuery(filters);
  return (
    <main className="inhoud">
      <div className="titelrij">
        <h1>
          Niet uitgevoerd (NG) <span className="teller">({aanvragen.length})</span>
        </h1>
        <a className="knop secundair" href={`/api/export?weergave=ng${q ? `&${q}` : ""}`}>
          ⬇ Exporteren naar Excel
        </a>
      </div>
      <p className="intro">Alle aanvragen met status NG, van alle schooljaren samen.</p>
      <Filterbalk filters={filters} weergave="ng" klusjesmannen={klusjesmannen} />
      <Tabel rijen={aanvragen.map(naarRij)} weergave="ng" klusjesmannen={klusjesmannen} />
    </main>
  );
}
