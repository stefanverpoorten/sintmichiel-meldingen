"use client";
// Als het formulier ingebed is in het gecombineerde formulier (sintmichiel-formulier),
// geeft deze component de hoogte door aan die pagina, zodat er geen dubbele schuifbalk komt.
import { useEffect } from "react";

export function meldAanOuder(ouder: string | null, bericht: Record<string, unknown>) {
  if (!ouder || typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ bron: "sintmichiel", ...bericht }, ouder);
}

export default function Ingebed({ ouder }: { ouder: string | null }) {
  useEffect(() => {
    if (!ouder || window.parent === window) return;
    document.documentElement.classList.add("ingebed");
    const stuur = () => meldAanOuder(ouder, { type: "hoogte", hoogte: document.documentElement.scrollHeight });
    const ro = new ResizeObserver(stuur);
    ro.observe(document.body);
    stuur();
    return () => ro.disconnect();
  }, [ouder]);
  return null;
}
