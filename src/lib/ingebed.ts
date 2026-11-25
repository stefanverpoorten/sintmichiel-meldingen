// Het gecombineerde formulier (sintmichiel-formulier) mag dit formulier tonen in een kader.
// FORMULIER_URL = het webadres van dat formulier, bv. https://sintmichiel-formulier.vercel.app

/** Het toegelaten adres van het gecombineerde formulier, of null als het niet ingesteld is. */
export function formulierOrigin(): string | null {
  const url = process.env.FORMULIER_URL?.trim();
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
