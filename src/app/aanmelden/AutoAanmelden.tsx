"use client";
// Meldt automatisch aan met Microsoft als je via de DRBS-startpagina komt (?auto=1).
// Ben je al bij Microsoft aangemeld, dan gebeurt dat zonder klikken of wachtwoord.
import { useEffect, useRef } from "react";

export default function AutoAanmelden({ actief }: { actief: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (actief) ref.current?.closest("form")?.requestSubmit();
  }, [actief]);
  return <span ref={ref} hidden />;
}
