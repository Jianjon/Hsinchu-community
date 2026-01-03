import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { runCrawlerLogic } from "./crawler";

admin.initializeApp();

// 1. Hello World (Test)
export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

// 2. Scheduled Crawler (Runs every 24 hours)
// "0 5 * * *" = Everyday at 05:00 AM
export const scheduledCrawler = functions.pubsub.schedule('0 5 * * *')
    .timeZone('Asia/Taipei')
    .onRun(async (context) => {
        functions.logger.info("🕷️ Scheduled Crawler triggered!", { context });
        await runCrawlerLogic();
        functions.logger.info("✅ Crawler job completed.");
        return null;
    });

// 3. Manual Trigger (HTTP) - For Testing
export const triggerCrawler = functions.https.onRequest(async (req, res) => {
    await runCrawlerLogic();
    res.send("Crawler Triggered Manually.");
});
