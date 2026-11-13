"use client";
export default function AfdrukKnop() {
  return (
    <button className="knop" onClick={() => window.print()}>
      🖨 Afdrukken / opslaan als PDF
    </button>
  );
}
