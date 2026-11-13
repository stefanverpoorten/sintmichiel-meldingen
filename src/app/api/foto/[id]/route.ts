// Toont een foto, enkel voor ingelogde beheerders.
import { prisma } from "@/lib/prisma";
import { lees } from "@/lib/opslag";
import { huidigeBeheerder } from "@/lib/toegang";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await huidigeBeheerder())) return new Response("Geen toegang", { status: 401 });
  const { id } = await params;
  const foto = await prisma.foto.findUnique({ where: { id } });
  if (!foto) return new Response("Niet gevonden", { status: 404 });
  const klein = new URL(req.url).searchParams.get("klein") === "1";
  const data = await lees(klein ? foto.miniatuur : foto.pad);
  if (!data) return new Response("Niet gevonden", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
