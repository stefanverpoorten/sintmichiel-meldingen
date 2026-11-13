// Mails versturen via Microsoft Graph (sendMail) vanaf het vaste afzenderadres MAIL_FROM.
// In testmodus (MAIL_MODE niet "live") wordt niets verstuurd: de mail wordt enkel gelogd.
import { prisma } from "./prisma";
import { config } from "./config";
import type { MailType } from "@prisma/client";

export type Bijlage = { naam: string; contentType: string; data: Buffer };

let tokenCache: { token: string; geldigTot: number } | null = null;

async function haalToken(): Promise<string> {
  if (tokenCache && tokenCache.geldigTot > Date.now() + 60_000) return tokenCache.token;
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    throw new Error(
      "Mailinstellingen ontbreken (ENTRA_TENANT_ID, AUTH_MICROSOFT_ENTRA_ID_ID of AUTH_MICROSOFT_ENTRA_ID_SECRET)."
    );
  }
  const res = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Aanmelden bij Microsoft mislukt: ${json.error_description ?? res.status}`);
  }
  tokenCache = { token: json.access_token, geldigTot: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

async function verstuurViaGraph(aan: string[], onderwerp: string, html: string, bijlagen: Bijlage[]) {
  if (!config.afzender) throw new Error("MAIL_FROM is niet ingesteld.");
  const token = await haalToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.afzender)}/sendMail`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: onderwerp,
          body: { contentType: "HTML", content: html },
          toRecipients: aan.map((a) => ({ emailAddress: { address: a } })),
          attachments: bijlagen.map((b) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: b.naam,
            contentType: b.contentType,
            contentBytes: b.data.toString("base64"),
          })),
        },
        saveToSentItems: true,
      }),
    }
  );
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      if (j.error?.message) detail = `${res.status} – ${j.error.message}`;
    } catch {}
    throw new Error(`Microsoft Graph weigerde de mail: ${detail}`);
  }
}

/** Probeert de mail te versturen en werkt het logboek bij. Gooit nooit een fout. */
async function probeer(mailId: string, aan: string[], onderwerp: string, html: string, bijlagen: Bijlage[]) {
  if (config.mailTestmodus) {
    console.log(
      `\n📧 [TESTMODUS] Mail niet verstuurd\n   Aan: ${aan.join(", ")}\n   Onderwerp: ${onderwerp}\n   Bijlagen: ${bijlagen.map((b) => b.naam).join(", ") || "geen"}\n`
    );
    return prisma.mail.update({
      where: { id: mailId },
      data: { status: "TEST", fout: null, verstuurdOp: new Date() },
    });
  }
  try {
    await verstuurViaGraph(aan, onderwerp, html, bijlagen);
    return prisma.mail.update({
      where: { id: mailId },
      data: { status: "VERSTUURD", fout: null, verstuurdOp: new Date() },
    });
  } catch (e) {
    const fout = e instanceof Error ? e.message : String(e);
    console.error("Mail mislukt:", fout);
    return prisma.mail.update({ where: { id: mailId }, data: { status: "MISLUKT", fout } });
  }
}

export async function verstuurMail(opts: {
  aanvraagId?: string;
  type: MailType;
  aan: string[];
  onderwerp: string;
  html: string;
  bijlagen?: Bijlage[];
}) {
  const mail = await prisma.mail.create({
    data: {
      aanvraagId: opts.aanvraagId,
      type: opts.type,
      aan: opts.aan.join(", "),
      onderwerp: opts.onderwerp,
      inhoud: opts.html,
      status: "MISLUKT",
      fout: "Nog niet verstuurd",
    },
  });
  if (opts.aan.length === 0) {
    return prisma.mail.update({ where: { id: mail.id }, data: { fout: "Geen ontvangers ingesteld." } });
  }
  return probeer(mail.id, opts.aan, opts.onderwerp, opts.html, opts.bijlagen ?? []);
}

/** Opnieuw versturen van een mislukte mail (zelfde inhoud). */
export async function verstuurOpnieuw(mailId: string, bijlagen: Bijlage[] = []) {
  const mail = await prisma.mail.update({
    where: { id: mailId },
    data: { pogingen: { increment: 1 } },
  });
  const aan = mail.aan.split(",").map((s) => s.trim()).filter(Boolean);
  return probeer(mail.id, aan, mail.onderwerp, mail.inhoud, bijlagen);
}
