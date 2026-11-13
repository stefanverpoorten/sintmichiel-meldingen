// Datums altijd tonen als dd/mm/jjjj in de tijdzone Europe/Brussels.
const TZ = "Europe/Brussels";

function delen(d: Date) {
  const p = new Intl.DateTimeFormat("nl-BE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return {
    dag: get("day"),
    maand: get("month"),
    jaar: get("year"),
    uur: get("hour"),
    minuut: get("minute"),
  };
}

export function datum(d: Date | null | undefined): string {
  if (!d) return "";
  const x = delen(d);
  return `${x.dag}/${x.maand}/${x.jaar}`;
}

export function datumTijd(d: Date | null | undefined): string {
  if (!d) return "";
  const x = delen(d);
  return `${x.dag}/${x.maand}/${x.jaar} ${x.uur}:${x.minuut}`;
}

/** Jaar (kalenderjaar) in Brussel. */
export function jaarBrussel(d: Date): number {
  return Number(delen(d).jaar);
}

/** Datum als "wandklok-tijd" in Brussel, opgeslagen als UTC (voor Excel). */
export function brusselsAlsUtc(d: Date): Date {
  const x = delen(d);
  return new Date(
    Date.UTC(+x.jaar, +x.maand - 1, +x.dag, +x.uur, +x.minuut)
  );
}

/** Schooljaar (1 sept t.e.m. 31 aug) op basis van een datum, bv. "2026-2027". */
export function schooljaar(d: Date): string {
  const x = delen(d);
  const j = +x.jaar;
  return +x.maand >= 9 ? `${j}-${j + 1}` : `${j - 1}-${j}`;
}

/** Huidig schooljaar. */
export function huidigSchooljaar(): string {
  return schooljaar(new Date());
}

/**
 * Begin- en eindmoment van een schooljaar.
 * 1 september 00:00 in Brussel valt altijd in de zomertijd (UTC+2).
 */
export function schooljaarGrenzen(sj: string): { van: Date; tot: Date } | null {
  const m = /^(\d{4})-(\d{4})$/.exec(sj);
  if (!m || +m[2] !== +m[1] + 1) return null;
  const start = +m[1];
  return {
    van: new Date(Date.UTC(start, 8, 1, 0, 0) - 2 * 3600_000),
    tot: new Date(Date.UTC(start + 1, 8, 1, 0, 0) - 2 * 3600_000),
  };
}
