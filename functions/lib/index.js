"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerCrawler = exports.scheduledCrawler = exports.helloWorld = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crawler_1 = require("./crawler");
admin.initializeApp();
// 1. Hello World (Test)
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});
// 2. Scheduled Crawler (Runs every 24 hours)
// "0 5 * * *" = Everyday at 05:00 AM
exports.scheduledCrawler = functions.pubsub.schedule('0 5 * * *')
    .timeZone('Asia/Taipei')
    .onRun(async (context) => {
    functions.logger.info("🕷️ Scheduled Crawler triggered!", { context });
    await (0, crawler_1.runCrawlerLogic)();
    functions.logger.info("✅ Crawler job completed.");
    return null;
});
// 3. Manual Trigger (HTTP) - For Testing
exports.triggerCrawler = functions.https.onRequest(async (req, res) => {
    await (0, crawler_1.runCrawlerLogic)();
    res.send("Crawler Triggered Manually.");
});
//# sourceMappingURL=index.js.map