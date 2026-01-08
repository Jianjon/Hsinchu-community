
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MOCK_COMMUNITIES } from '../data/mock_public';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const OUTPUT_FILE = join(__dirname, '../data/chief_office_locations.json');
const DELAY_MS = 1100; // Nominatim requires 1s between requests

// Interfaces
interface LocationMap {
    [communityId: string]: [number, number];
}

// Nominatim Geocoding Function
async function geocodeAddress(address: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    try {
        const response = await fetch(url, {
            headers: {
                // Use a real browser UA or a proper app name with contact info
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // Or: 'TaiwanVillageAnalyst/1.0 (jon_dev_test@example.com)'
                'Referer': 'http://localhost:3000'
            }
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (e) {
            console.error(`Error parsing JSON for ${address}:`, text.substring(0, 200));
        }
    } catch (error) {
        console.error(`Error geocoding ${address}:`, error);
    }
    return null;
}

// Sleeping utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('🌍 Starting Village Chief Office Geocoding...');

    let locationMap: LocationMap = {};

    // Load existing map if exists to resume/update
    if (fs.existsSync(OUTPUT_FILE)) {
        console.log('📂 Loading existing location map...');
        try {
            locationMap = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch (e) {
            console.warn('⚠️ Could not parse existing map, starting fresh.');
        }
    }

    let processedCount = 0;
    let successCount = 0;
    let skippedCount = 0;

    for (const community of MOCK_COMMUNITIES) {
        // Skip if already has a geocoded location
        if (locationMap[community.id]) {
            skippedCount++;
            continue;
        }

        const chief = community.wiki?.chief;
        if (!chief?.officeAddress) {
            continue; // No address to geocode
        }

        // Clean Address Logic
        const rawAddress = chief.officeAddress
            .replace(/\d+鄰/g, '') // Remove neighborhood
            .replace(/\d+[F樓]/g, '') // Remove floor
            .replace(/之\d+/g, '') // Remove sub-number
            .trim();

        // Strategy List
        const strategies = [
            // 1. Full with City + District
            `${community.city}${community.district}${rawAddress.replace(community.city, '').replace(community.district, '')}`,
            // 2. Full without District (sometimes district data is missing/wrong in OSM or redundant)
            `${community.city}${rawAddress.replace(community.city, '').replace(community.district, '')}`,
            // 3. Road + Lane/Alley (Strip Number) - To find the street center at least
            `${community.city}${rawAddress.replace(community.city, '').replace(community.district, '').replace(/\d+號.*/, '')}`,
            // 4. Road Only (Strip Number, Lane, Alley)
            `${community.city}${rawAddress.replace(community.city, '').replace(community.district, '').replace(/(路|街|大道).*/, '$1')}`
        ];

        // Deduplicate strategies
        const uniqueStrategies = [...new Set(strategies)];

        console.log(`Processing [${processedCount + 1}/${MOCK_COMMUNITIES.length}] ${community.name}`);

        for (const strategy of uniqueStrategies) {
            // Skip empty or too short strategies
            if (strategy.length < 5) continue;

            const coords = await geocodeAddress(strategy);
            if (coords) {
                console.log(`   ✅ Found (${strategy}): ${coords[0]}, ${coords[1]}`);
                locationMap[community.id] = coords;
                successCount++;
                break; // Stop trying strategies
            } else {
                console.log(`   ❌ Failed: ${strategy}`);
                await sleep(DELAY_MS); // Wait before next retry
            }
        }

        if (!locationMap[community.id]) {
            console.warn(`   ⚠️  Could not geocode ${community.name} after all attempts.`);
        }

        processedCount++;
        // Save incrementally every 10 items
        if (successCount % 10 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(locationMap, null, 2));
        }
    }

    // Final Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(locationMap, null, 2));
    console.log(`\n🎉 Done! Processed ${processedCount}, Success ${successCount}, Skipped ${skippedCount}`);
    console.log(`Saved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
