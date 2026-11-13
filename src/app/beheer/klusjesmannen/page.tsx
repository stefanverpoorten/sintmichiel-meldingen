import Link from "next/link";
import { prisma } from "@/lib/prisma";
import KlusjesmanBeheer from "./KlusjesmanBeheer";

export const dynamic = "force-dynamic";

export default async function Klusjesmannen() {
  const lijst = await prisma.klusjesman.findMany({
    orderBy: [{ actief: "desc" }, { naam: "asc" }],
    include: {
      _count: {
        select: {
          aanvragen: { where: { status: "G", OR: [{ controle: null }, { controle: "NOK" }] } },
        },
      },
    },
  });
  return (
    <main className="inhoud" style={{ maxWidth: 900 }}>
      <h1>Klusjesmannen</h1>
      <p className="intro">
        Klusjesmannen krijgen geen mail en hebben geen toegang tot de app. Zet iemand op inactief in plaats
        van te verwijderen, zodat de historiek blijft kloppen. Via &quot;Afdruklijst&quot; maak je een lijst
        (of PDF) met de openstaande aanvragen om mee te geven.
      </p>
      <KlusjesmanBeheer
        lijst={lijst.map((k) => ({ id: k.id, naam: k.naam, actief: k.actief, open: k._count.aanvragen }))}
      />
      <p className="hulp">
        &quot;Openstaand&quot; = toegewezen, status G en nog niet op Controle OK.{" "}
        <Link href="/beheer">Naar het overzicht</Link>
      </p>
    </main>
  );
}
