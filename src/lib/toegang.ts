import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isBeheerder } from "./config";

/** Voor pagina's: stuurt door naar de aanmeldpagina als je geen beheerder bent. */
export async function vereisBeheerder(): Promise<string> {
  const sessie = await auth();
  const email = sessie?.user?.email;
  if (!email || !isBeheerder(email)) redirect("/aanmelden");
  return email.toLowerCase();
}

/** Voor acties en API: geeft null als je geen beheerder bent. */
export async function huidigeBeheerder(): Promise<string | null> {
  const sessie = await auth();
  const email = sessie?.user?.email;
  return email && isBeheerder(email) ? email.toLowerCase() : null;
}
