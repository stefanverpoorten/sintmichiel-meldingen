// Controleert de login-instellingen zonder ooit waarden te tonen.
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function controleerLoginInstellingen(): string[] {
  const p: string[] = [];
  const v = (n: string) => process.env[n];
  const heeftSpaties = (n: string) => !!v(n) && v(n) !== v(n)!.trim();

  if (!v("AUTH_SECRET")) p.push("AUTH_SECRET ontbreekt.");
  else if (v("AUTH_SECRET")!.trim().length < 32) p.push("AUTH_SECRET is te kort (minstens 32 tekens).");

  const tenant = v("ENTRA_TENANT_ID");
  if (!tenant) p.push("ENTRA_TENANT_ID ontbreekt.");
  else if (!GUID.test(tenant.trim()))
    p.push("ENTRA_TENANT_ID heeft niet de vorm van een ID (verwacht: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). Gebruik de 'Directory (tenant) ID'.");

  const client = v("AUTH_MICROSOFT_ENTRA_ID_ID");
  if (!client) p.push("AUTH_MICROSOFT_ENTRA_ID_ID ontbreekt.");
  else if (!GUID.test(client.trim()))
    p.push("AUTH_MICROSOFT_ENTRA_ID_ID heeft niet de vorm van een ID. Gebruik de 'Application (client) ID'.");
  else if (tenant && client.trim().toLowerCase() === tenant.trim().toLowerCase())
    p.push("AUTH_MICROSOFT_ENTRA_ID_ID en ENTRA_TENANT_ID zijn gelijk: één van beide is fout gekopieerd.");

  const secret = v("AUTH_MICROSOFT_ENTRA_ID_SECRET");
  if (!secret) p.push("AUTH_MICROSOFT_ENTRA_ID_SECRET ontbreekt.");
  else if (GUID.test(secret.trim()))
    p.push("AUTH_MICROSOFT_ENTRA_ID_SECRET lijkt de 'Secret ID' te zijn. Je hebt de 'Value' nodig (maak eventueel een nieuw secret aan).");

  for (const n of ["AUTH_SECRET", "ENTRA_TENANT_ID", "AUTH_MICROSOFT_ENTRA_ID_ID", "AUTH_MICROSOFT_ENTRA_ID_SECRET"])
    if (heeftSpaties(n)) p.push(`${n} bevat een spatie of witregel vooraan of achteraan.`);

  return p;
}
