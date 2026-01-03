
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_FILE = path.join(__dirname, '../data/community_wiki.json');
const BASE_DELAY_MS = 4000; // Increased base delay for Nominatim

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(address, retries = 3) {
    try {
        // Random jitter 0-2000ms
        const delay = BASE_DELAY_MS + Math.random() * 2000;
        await sleep(delay);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const headers = {
            'User-Agent': 'TaiwanVillageAnalyst/1.0 (https://github.com/example/project; mailto:dev@example.com)',
            'Referer': 'https://github.com/example/project'
        };

        const res = await fetch(url, { headers });

        if (res.status === 403 || res.status === 429) {
            if (retries > 0) {
                console.warn(`Blocked (403/429). Waiting 60s before retry... (${retries} left)`);
                await sleep(60000); // Wait 1 minute
                return geocodeAddress(address, retries - 1);
            } else {
                throw new Error("Rate limit exceeded persistently.");
            }
        }

        if (!res.ok) {
            console.error(`HTTP ${res.status}: ${res.statusText}`);
            const text = await res.text();
            console.error("Response:", text);
            throw new Error(res.statusText);
        }

        const data = await res.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.error(`Error geocoding ${address}:`, e.message);
    }
    return null;
}

async function main() {
    if (!fs.existsSync(WIKI_FILE)) {
        console.error("Wiki file not found.");
        return;
    }

    const communities = JSON.parse(fs.readFileSync(WIKI_FILE, 'utf-8'));
    let updatedCount = 0;

    console.log(`Checking ${communities.length} records for missing coordinates...`);

    for (let i = 0; i < communities.length; i++) {
        const comm = communities[i];

        // Skip if already has valid coords or no address
        if ((comm.location.lat !== 0 && comm.location.lng !== 0) || !comm.location.address) {
            continue;
        }

        console.log(`[${i + 1}/${communities.length}] Geocoding: ${comm.location.address} (${comm.location.name})...`);

        const coords = await geocodeAddress(comm.location.address);

        if (coords) {
            comm.location.lat = coords.lat;
            comm.location.lng = coords.lng;
            updatedCount++;
            console.log(`  -> Found: ${coords.lat}, ${coords.lng}`);
        } else {
            console.log(`  -> Not found.`);
        }

        // Save every 10 records to avoid data loss
        if (updatedCount % 10 === 0 && updatedCount > 0) {
            fs.writeFileSync(WIKI_FILE, JSON.stringify(communities, null, 2));
            console.log("  (Progress saved)");
        }

        await sleep(GEOCODE_DELAY_MS);
    }

    // Final save
    fs.writeFileSync(WIKI_FILE, JSON.stringify(communities, null, 2));
    console.log(`Done. Updated ${updatedCount} records.`);
}

main();
