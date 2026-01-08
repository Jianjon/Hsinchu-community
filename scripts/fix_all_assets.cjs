
const fs = require('fs');
const path = require('path');

const LOCAL_DB_BASE = path.resolve('data/local_db');
const CHIEF_LOCATIONS_FILE = path.resolve('data/chief_office_locations.json');
const ENRICHED_ASSETS_FILE = path.resolve('data/culture_assets_enriched.json');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function main() {
    console.log("🚀 Running Comprehensive Asset Fix...");

    if (!fs.existsSync(CHIEF_LOCATIONS_FILE) || !fs.existsSync(ENRICHED_ASSETS_FILE)) {
        console.error("❌ Missing reference files!");
        return;
    }

    const chiefLocations = JSON.parse(fs.readFileSync(CHIEF_LOCATIONS_FILE, 'utf8'));
    const enrichedAssets = JSON.parse(fs.readFileSync(ENRICHED_ASSETS_FILE, 'utf8'));

    // Create map of enriched assets by ID for fast lookup
    const enrichedMap = {};
    enrichedAssets.forEach(a => {
        // Normalize ID (sometimes it might be cult-1 or similar)
        if (a.id) enrichedMap[a.id] = a;
    });

    const cities = fs.readdirSync(LOCAL_DB_BASE);
    let fixedDistCount = 0;
    let fixedEnrichedCount = 0;

    // Iterate through all villages
    for (const city of cities) {
        if (city.startsWith('.')) continue;
        const districts = fs.readdirSync(path.join(LOCAL_DB_BASE, city));

        for (const district of districts) {
            if (district.startsWith('.')) continue;
            const villages = fs.readdirSync(path.join(LOCAL_DB_BASE, city, district));

            for (const village of villages) {
                if (village.startsWith('.')) continue;

                const villagePath = path.join(LOCAL_DB_BASE, city, district, village);
                const cultureFile = path.join(villagePath, 'culture.json');
                const commId = `${city}_${district}_${village}`;
                const commLoc = chiefLocations[commId];

                if (fs.existsSync(cultureFile)) {
                    let cultureBytes = fs.readFileSync(cultureFile, 'utf8');
                    if (!cultureBytes.trim()) continue;

                    let culture;
                    try {
                        culture = JSON.parse(cultureBytes);
                    } catch (e) { continue; }

                    let modified = false;

                    for (const asset of culture) {

                        // 1. Check if it's an Enriched Asset (Real one)
                        if (asset.id && enrichedMap[asset.id]) {
                            const realData = enrichedMap[asset.id];
                            // Check if location matches
                            if (!asset.location ||
                                Math.abs(asset.location[0] - realData.location[0]) > 0.0001 ||
                                Math.abs(asset.location[1] - realData.location[1]) > 0.0001) {

                                console.log(`✨ Correcting Enriched Asset [${asset.name}] to real coords.`);
                                asset.location = realData.location;
                                // Also sync description/metadata if needed? User asked to "check content".
                                // Let's ensure description matches too to be safe.
                                asset.description = realData.description;
                                modified = true;
                                fixedEnrichedCount++;
                            }
                        }
                        // 2. If it's a Generated Placeholder (e.g. "Fude Temple")
                        else if (asset.location && commLoc) {
                            // Calculate distance to community center
                            const dist = getDistance(asset.location[0], asset.location[1], commLoc[0], commLoc[1]);

                            // If distance > 1.5km, it's likely misplaced random garbage
                            if (dist > 1.5) {
                                console.log(`📍 Relocating Misplaced Asset [${asset.name}] in ${village}. Dist: ${dist.toFixed(2)}km.`);
                                // Move to center + random jitter
                                const offsetLat = (Math.random() - 0.5) * 0.002;
                                const offsetLng = (Math.random() - 0.5) * 0.002;
                                asset.location = [commLoc[0] + offsetLat, commLoc[1] + offsetLng];
                                modified = true;
                                fixedDistCount++;
                            }
                        }
                    }

                    if (modified) {
                        fs.writeFileSync(cultureFile, JSON.stringify(culture, null, 2));
                    }
                }
            }
        }
    }

    console.log(`\n🎉 Summary:\n- Corrected ${fixedEnrichedCount} Enriched Assets (Real Content).\n- Relocated ${fixedDistCount} Misplaced Placeholder Assets (Distance Check).`);
}

main();
