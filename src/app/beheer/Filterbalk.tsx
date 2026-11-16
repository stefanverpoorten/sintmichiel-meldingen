// Filters werken via de adresbalk, zodat je een gefilterd overzicht kan bladwijzeren.
import { CAMPUSSEN } from "@/lib/constanten";
import { huidigSchooljaar } from "@/lib/datum";
import type { Filters, Weergave } from "@/lib/filters";
import type { KlusjesmanOptie } from "@/lib/overzicht";

export default function Filterbalk({
  filters,
  weergave,
  klusjesmannen,
  schooljaren,
}: {
  filters: Filters;
  weergave: Weergave;
  klusjesmannen: KlusjesmanOptie[];
  schooljaren?: string[];
}) {
  return (
    <form className="filters" method="get">
      {schooljaren && (
        <label>
          Schooljaar
          <select name="schooljaar" defaultValue={filters.schooljaar ?? ""}>
            {schooljaren.map((s) => (
              <option key={s} value={s}>
                {s} (01/09/{s.slice(0, 4)} – 31/08/{s.slice(5)}){s === huidigSchooljaar() ? " – huidig" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="zoek">
        Zoeken
        <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="nummer, naam, locatie, tekst…" />
      </label>
      <label>
        Campus
        <select name="campus" defaultValue={filters.campus ?? ""}>
          <option value="">Alle</option>
          {CAMPUSSEN.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Soort
        <select name="soort" defaultValue={filters.soort ?? ""}>
          <option value="">Alle</option>
          <option value="DEFECT">Defect</option>
          <option value="TAAK">Taak</option>
        </select>
      </label>
      {weergave !== "ng" && (
        <label>
          Status
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">Alle</option>
            <option value="leeg">Nog niet beoordeeld</option>
            <option value="G">G</option>
          </select>
        </label>
      )}
      <label>
        Prioriteit
        <select name="prioriteit" defaultValue={filters.prioriteit ?? ""}>
          <option value="">Alle</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="leeg">Geen</option>
        </select>
      </label>
      <label>
        Klusjesman
        <select name="klusjesman" defaultValue={filters.klusjesman ?? ""}>
          <option value="">Alle</option>
          <option value="geen">Niet toegewezen</option>
          {klusjesmannen.map((k) => (
            <option key={k.id} value={k.id}>
              {k.naam}
              {!k.actief ? " (inactief)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sorteren
        <select name="sort" defaultValue={filters.sort ?? ""}>
          <option value="">{weergave === "archief" ? "Controledatum (nieuwste eerst)" : "Datum (nieuwste eerst)"}</option>
          <option value="datum_op">Datum (oudste eerst)</option>
          <option value="prio_op">Prioriteit (1 eerst)</option>
          <option value="prio_af">Prioriteit (3 eerst)</option>
          {weergave === "archief" && <option value="controle_af">Controledatum</option>}
        </select>
      </label>
      <button className="knop" type="submit">Toepassen</button>
      <a className="knop secundair" href="?">Wissen</a>
    </form>
  );
}
