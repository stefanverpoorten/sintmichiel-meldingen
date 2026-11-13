// Onzichtbare bot-check (Vercel BotID) voor het openbare formulier.
import { initBotId } from "botid/client/core";

initBotId({
  protect: [{ path: "/api/aanvragen", method: "POST" }],
});
