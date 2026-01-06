
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

async function check() {
    try {
        if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
            const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
            initializeApp({ credential: cert(serviceAccount) });
        } else {
            console.log("No service account, trying ADC...");
            initializeApp({ projectId: 'country-analyst-ai' });
        }

        const db = getFirestore();
        const snapshot = await db.collection('villages').count().get();
        console.log(`Villages Count: ${snapshot.data().count}`);

        // Check a specific mock community
        const doc = await db.collection('villages').doc('新竹縣_竹北市_北崙里').get();
        if (doc.exists) {
            console.log("Found '北崙里': Yes");
            console.log("Data sample:", JSON.stringify(doc.data()?.introduction || "No introduction").substring(0, 50));
        } else {
            console.log("Found '北崙里': No");
        }

    } catch (e) {
        console.error("Check failed:", e);
    }
}

check();
