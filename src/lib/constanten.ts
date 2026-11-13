export const CAMPUSSEN = [
  "Campus 3",
  "Campus 7/9",
  "Campus 11",
  "Campus 13",
  "Wijkschool Geleeg",
  "Wijkschool Strooiendorp",
] as const;

export const SOORT_LABEL: Record<"DEFECT" | "TAAK", string> = {
  DEFECT: "Defect",
  TAAK: "Taak",
};

export const MAIL_TYPE_LABEL: Record<string, string> = {
  NIEUWE_AANVRAAG: "Nieuwe aanvraag (beheerders)",
  ONTVANGST: "Ontvangstbevestiging",
  STATUS_G: "Status G",
  STATUS_NG: "Status NG",
};

export const MAX_FOTOS = 3;
export const MAX_FOTO_BYTES = 10 * 1024 * 1024;
export const TOEGELATEN_DOMEIN = "@sintmichiel.be";
