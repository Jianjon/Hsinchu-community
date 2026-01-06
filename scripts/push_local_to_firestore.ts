
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as readline from 'readline';

// --- Configuration ---
// 1. Attempt to read .env.local manually
const ENV_PATH = path.resolve(process.cwd(), '.env.local');
const env: Record<string, string> = {};

if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length > 0) {
            env[key.trim()] = vals.join('=').trim().replace(/["']/g, ''); // Remove quotes
        }
    });
    console.log('[Config] Loaded .env.local');
} else {
    console.warn('[Config] .env.local not found, using Fallback Defaults');
}

// 2. Build Config Object
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDlbVAeyH1uKQn2EezjiRNK0LnngBx81zQ",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "country-analyst-ai.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "country-analyst-ai",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "country-analyst-ai.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "616755013100",
    appId: env.VITE_FIREBASE_APP_ID || "1:616755013100:web:64d8784658f30d7d33ccc9",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-WKM127P92L"
};

console.log(`[Firebase] Initializing project: ${firebaseConfig.projectId}`);

// 3. Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Helpers ---
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/local_db');

interface VillageWiki {
    [key: string]: any;
}

// Recursive walker to find wiki.json
function walk(dir: string, segments: string[], callback: (id: string, path: string) => void) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            walk(path.join(dir, item.name), [...segments, item.name], callback);
        } else if (item.name === 'wiki.json') {
            // Confirm path structure: County/Town/Village
            // ID Format: County_Town_Village
            // e.g., 新竹縣_竹北市_北崙里
            if (segments.length >= 3) {
                // Try to construct ID from the last 3 segments 
                // Assuming structure is always data/local_db/County/Town/Village
                // But segments argument accumulates from LOCAL_DB_PATH down.

                // segments examples: ['新竹縣', '竹北市', '北崙里']
                const id = segments.join('_');
                callback(id, path.join(dir, item.name));
            }
        }
    }
}

// --- Auth Helper ---
function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

// --- Main ---
async function run() {
    console.log('🚀 Starting Push to Firestore...');
    console.log('🔒 Authentication Required');

    let email = process.env.ADMIN_EMAIL || '';
    let password = process.env.ADMIN_PASSWORD || '';

    if (!email) {
        email = await askQuestion('   Admin Email: ');
    } else {
        console.log('   Using Email from Environment');
    }

    if (!password) {
        password = await askQuestion('   Password: ');
    } else {
        console.log('   Using Password from Environment');
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ Logged in as ${email}`);
    } catch (e: any) {
        console.error(`❌ Login failed: ${e.message}`);
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    const tasks: Promise<void>[] = [];

    walk(LOCAL_DB_PATH, [], (id, filePath) => {
        // Read file
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Push to Firestore
            // console.log(`   Preparing: ${id}`);

            const task = setDoc(doc(db, 'villages', id), content, { merge: true })
                .then(() => {
                    successCount++;
                    process.stdout.write('+');
                })
                .catch((err) => {
                    console.error(`\n[Error] Failed to push ${id}:`, err.message);
                    errorCount++;
                    process.stdout.write('x');
                });

            tasks.push(task);

        } catch (e) {
            console.error(`\n[Error] Read invalid JSON at ${filePath}`);
        }
    });

    if (tasks.length === 0) {
        console.log('No wiki.json files found.');
        return;
    }

    console.log(`\nFound ${tasks.length} villages. Uploading in parallel...`);
    await Promise.all(tasks);

    console.log(`\n\n✅ Upload Complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors:  ${errorCount}`);

    // Force exit because Firebase app connection keeps process alive
    process.exit(0);
}

run().catch(e => console.error(e));
