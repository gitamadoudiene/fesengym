/**
 * Worker autonome pour déploiement self-hosted (VPS/Docker Compose) sans
 * scheduler externe disponible — voir ARCHITECTURE.md §8 / DECISIONS.md D8.
 * Lancer via `npm run worker`, géré par systemd/pm2 en production.
 */
import cron from "node-cron";
import { runExpireLicensesJob } from "../lib/jobs/expireLicenses";

console.log("[worker] Démarré — expiration des licences planifiée tous les jours à 01h00.");

cron.schedule("0 1 * * *", async () => {
  console.log("[worker] Exécution du job d'expiration des licences...");
  try {
    const result = await runExpireLicensesJob();
    console.log("[worker] Terminé :", result);
  } catch (error) {
    console.error("[worker] Échec du job d'expiration :", error);
  }
});
