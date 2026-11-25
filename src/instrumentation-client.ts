// Onzichtbare bot-check (Vercel BotID) voor het openbare formulier.
// Enkel actief op Vercel (zoals de controle op de server); lokaal wordt ze overgeslagen.
import { initBotId } from "botid/client/core";

if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
  initBotId({
    protect: [{ path: "/api/aanvragen", method: "POST" }],
  });
}
