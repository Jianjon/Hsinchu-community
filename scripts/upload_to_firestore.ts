
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
// NOTE: User needs to provide serviceAccountKey.json for Admin SDK to work locally
// Or uses `gcloud auth application-default login`

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

async function main() {
    console.log("🚀 Starting Upload to Firestore...");

    // Check Auth
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn("⚠️  No serviceAccountKey.json found. Assuming Application Default Credentials (ADC) or Emulator.");
        initializeApp({ projectId: 'country-analyst-ai' });
    } else {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
            initializeApp({ credential: cert(serviceAccount) });
        } catch (e) {
            initializeApp({ projectId: 'country-analyst-ai' });
        }
    }

    const db = getFirestore();
    const DATA_DIR = path.resolve('src/data/enrichment');

    // 1. Upload Refined Wiki
    // This implies the user has renamed 'raw_wiki_draft.json' to 'refined_wiki.json' or edits in place.
    // We'll look for 'refined_wiki.json' first, then 'raw_wiki_draft.json'
    const wikiFile = fs.existsSync(path.join(DATA_DIR, 'refined_wiki.json'))
        ? path.join(DATA_DIR, 'refined_wiki.json')
        : path.join(DATA_DIR, 'raw_wiki_draft.json');

    if (fs.existsSync(wikiFile)) {
        console.log(`📤 Uploading from ${path.basename(wikiFile)}...`);
        const wikiData = JSON.parse(fs.readFileSync(wikiFile, 'utf8'));

        // Target specifically "Hsinchu_North_Central" for this demo
        await db.collection('communities').doc('Hsinchu_North_Central').set({
            wiki: wikiData
        }, { merge: true });
        console.log("✅ Wiki Uploaded.");
    }

    // 2. Upload Culture
    const cultureFile = fs.existsSync(path.join(DATA_DIR, 'refined_culture.json'))
        ? path.join(DATA_DIR, 'refined_culture.json')
        : path.join(DATA_DIR, 'raw_culture_draft.json');

    if (fs.existsSync(cultureFile)) {
        console.log(`📤 Uploading from ${path.basename(cultureFile)}...`);
        const cultureData = JSON.parse(fs.readFileSync(cultureFile, 'utf8'));

        // Map to CultureHeritage[]
        const cultureItems = cultureData.map((c: any, idx: number) => ({
            id: `cult_import_${idx}_${Date.now()}`,
            name: c.name,
            description: c.description,
            category: c.category,
            location: c.location,
            address: c.address,
            era: c.era, // New field
            history: c.history, // New field
            tags: c.tags,
            coverImage: c.coverImage || undefined
        }));

        await db.collection('communities').doc('Hsinchu_North_Central').set({
            cultureHeritages: cultureItems
        }, { merge: true });
        console.log("✅ Culture Uploaded.");
    }

    // 3. Upload Travel
    const travelFile = fs.existsSync(path.join(DATA_DIR, 'refined_travel.json'))
        ? path.join(DATA_DIR, 'refined_travel.json')
        : path.join(DATA_DIR, 'raw_travel_draft.json');

    if (fs.existsSync(travelFile)) {
        console.log(`📤 Uploading from ${path.basename(travelFile)}...`);
        const travelData = JSON.parse(fs.readFileSync(travelFile, 'utf8'));

        // Map to PublicTravelSpot[]
        const travelItems = travelData.map((t: any, idx: number) => ({
            id: `travel_import_${idx}_${Date.now()}`,
            name: t.name,
            description: t.description,
            location: t.location,
            address: t.address,
            tags: t.tags,
            seasonality: t.seasonality, // New field
            rating: t.rating, // New field
            coverImage: t.coverImage || undefined
        }));

        await db.collection('communities').doc('Hsinchu_North_Central').set({
            travelSpots: travelItems
        }, { merge: true });
        console.log("✅ Travel Uploaded.");
    }

    // 4. Upload Events
    const eventsFile = fs.existsSync(path.join(DATA_DIR, 'refined_events.json'))
        ? path.join(DATA_DIR, 'refined_events.json')
        : path.join(DATA_DIR, 'raw_events_draft.json');

    if (fs.existsSync(eventsFile)) {
        console.log(`📤 Uploading from ${path.basename(eventsFile)}...`);
        const eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));

        const eventItems = eventsData.map((e: any, idx: number) => ({
            id: `event_import_${idx}_${Date.now()}`,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location,
            type: e.type,
            description: e.description,
            tags: e.tags,
            imageUrl: e.imageUrl || undefined
        }));

        await db.collection('communities').doc('Hsinchu_North_Central').set({
            events: eventItems
        }, { merge: true });
        console.log("✅ Events Uploaded.");
    }

    // 5. Upload Projects
    const projectsFile = fs.existsSync(path.join(DATA_DIR, 'refined_projects.json'))
        ? path.join(DATA_DIR, 'refined_projects.json')
        : path.join(DATA_DIR, 'raw_projects_draft.json');

    if (fs.existsSync(projectsFile)) {
        console.log(`📤 Uploading from ${path.basename(projectsFile)}...`);
        const projectsData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));

        const projectItems = projectsData.map((p: any, idx: number) => ({
            id: `proj_import_${idx}_${Date.now()}`,
            title: p.title,
            description: p.description,
            what: p.what,
            progress: p.progress,
            status: p.status,
            budget: p.budget,
            owner: p.owner,
            tags: p.tags,
            imageUrl: p.imageUrl || undefined
        }));

        await db.collection('communities').doc('Hsinchu_North_Central').set({
            projects: projectItems
        }, { merge: true });
        console.log("✅ Projects Uploaded.");
    }

    // 6. Upload Care
    const careFile = fs.existsSync(path.join(DATA_DIR, 'refined_care.json'))
        ? path.join(DATA_DIR, 'refined_care.json')
        : path.join(DATA_DIR, 'raw_care_draft.json');

    if (fs.existsSync(careFile)) {
        console.log(`📤 Uploading from ${path.basename(careFile)}...`);
        const careData = JSON.parse(fs.readFileSync(careFile, 'utf8'));

        const careItems = careData.map((c: any, idx: number) => ({
            id: `care_import_${idx}_${Date.now()}`,
            title: c.title,
            type: c.type,
            status: c.status,
            description: c.description,
            beneficiaries: c.beneficiaries,
            date: c.date,
            owner: c.owner
        }));

        await db.collection('communities').doc('Hsinchu_North_Central').set({
            careActions: careItems
        }, { merge: true });
        console.log("✅ Care Actions Uploaded.");
    }

    console.log("\n🎉 All Data Uploaded Successfully!");
}

main().catch(console.error);
