export const CAMPUSSEN = [
  "Campus 3",
  "Campus 7/9",
  "Campus 11",
  "Campus 13",
  "Wijkschool Geleeg",
  "Wijkschool Strooiendorp",
] as const;

export const SOORTEN = ["DEFECT", "TAAK", "GEVAARLIJK"] as const;
export type SoortCode = (typeof SOORTEN)[number];

export const SOORT_LABEL: Record<SoortCode, string> = {
  DEFECT: "Defect",
  TAAK: "Taak",
  GEVAARLIJK: "Gevaarlijke situatie",
};

/** CSS-klasse van het gekleurde label in het beheer. */
export const SOORT_KLASSE: Record<SoortCode, string> = {
  DEFECT: "defect",
  TAAK: "taak",
  GEVAARLIJK: "gevaarlijk",
};

/** Label met, bij een gevaarlijke situatie, de vermelding "direct gevaar". */
export function soortMetGevaar(soort: SoortCode, directGevaar: boolean | null | undefined): string {
  return soort === "GEVAARLIJK" && directGevaar ? `${SOORT_LABEL[soort]} – direct gevaar` : SOORT_LABEL[soort];
}

export const MAIL_TYPE_LABEL: Record<string, string> = {
  NIEUWE_AANVRAAG: "Nieuwe aanvraag (beheerders)",
  ONTVANGST: "Ontvangstbevestiging",
  STATUS_G: "Status G",
  STATUS_NG: "Status NG",
};

export const MAX_FOTOS = 3;
export const MAX_FOTO_BYTES = 10 * 1024 * 1024;
export const TOEGELATEN_DOMEIN = "@sintmichiel.be";
