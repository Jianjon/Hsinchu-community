
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MOCK_COMMUNITIES } from '../data/mock_public';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const OUTPUT_FILE = join(__dirname, '../data/association_locations.json');
const DELAY_MS = 2500; // 2.5 seconds delay to be safe

// Interfaces
interface LocationMap {
    [communityId: string]: [number, number];
}

// Nominatim Geocoding Function
async function geocodeAddress(address: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=tw`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.google.com'
            }
        });

        if (response.status === 403 || response.status === 429) {
            console.warn(`   ⚠️  Blocked (${response.status}). Waiting 10s...`);
            await sleep(10000);
            return null;
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                // Validation for Taiwan Metadata [21-26N, 118-123E]
                if (lat < 21 || lat > 26 || lon < 118 || lon > 123) {
                    // console.warn(`   ⚠️  Ignored Out-of-bounds: ${lat}, ${lon}`);
                    return null;
                }
                return [lat, lon];
            }
        } catch (e) {
            // console.error(`Error parsing JSON`);
        }
    } catch (error) {
        console.error(`Error geocoding ${address}:`, error);
    }
    return null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('🌍 Low-and-Slow Association Geocoding (Hsinchu Focus)...');

    let locationMap: LocationMap = {};

    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            locationMap = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            console.log(`📂 Loaded ${Object.keys(locationMap).length} existing locations.`);
        } catch (e) { }
    }

    let processedCount = 0;
    let successCount = 0;
    let newFoundCount = 0;

    // Filter for Hsinchu only to prioritize user's view
    const targets = MOCK_COMMUNITIES.filter(c => c.city.includes('新竹'));
    console.log(`🎯 Targeting ${targets.length} Hsinchu communities.`);

    for (const community of targets) {
        if (locationMap[community.id]) {
            continue;
        }

        const strategies = [
            `${community.city}${community.district}${community.name}社區發展協會`,
            `${community.city}${community.name}社區發展協會`,
            `${community.city}${community.district}${community.name}里`, // Fallback to Village Center
            `${community.city}${community.district}${community.name}集會所`
        ];

        if (community.wiki?.association?.address) {
            const cleanAddr = community.wiki.association.address.replace(/\d+鄰/g, '').replace(/之\d+/g, '').trim();
            strategies.unshift(`${community.city}${cleanAddr.replace(community.city, '')}`);
        }

        process.stdout.write(`[${processedCount + 1}/${targets.length}] ${community.name}... `);

        let found = false;
        for (const strategy of [...new Set(strategies)]) {
            const coords = await geocodeAddress(strategy);
            if (coords) {
                console.log(`✅`);
                locationMap[community.id] = coords;
                newFoundCount++;
                successCount++;
                found = true;
                break;
            } else {
                await sleep(DELAY_MS);
            }
        }
        if (!found) console.log(`❌`);

        processedCount++;
        if (newFoundCount > 0 && newFoundCount % 5 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(locationMap, null, 2));
        }
        await sleep(DELAY_MS);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(locationMap, null, 2));
    console.log(`\n🎉 Done! New Found: ${newFoundCount}`);
}

main().catch(console.error);
