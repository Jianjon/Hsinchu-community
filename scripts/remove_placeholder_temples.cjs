
const fs = require('fs');
const path = require('path');

const LOCAL_DB_BASE = path.resolve('data/local_db');
const ENRICHED_ASSETS_FILE = path.resolve('data/culture_assets_enriched.json');

function main() {
    console.log("🚀 Removing Placeholder Fude Temples...");

    if (!fs.existsSync(ENRICHED_ASSETS_FILE)) {
        console.error("❌ Enriched assets file not found!");
        return;
    }

    const enrichedAssets = JSON.parse(fs.readFileSync(ENRICHED_ASSETS_FILE, 'utf8'));

    // Create detailed map of enriched assets to protect them
    // Key by both ID and Name to be safe
    const protectedIds = new Set();
    const protectedNames = new Set();

    enrichedAssets.forEach(a => {
        if (a.id) protectedIds.add(a.id);
        if (a.name) protectedNames.add(a.name);
    });

    const cities = fs.readdirSync(LOCAL_DB_BASE);
    let removedCount = 0;

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

                if (fs.existsSync(cultureFile)) {
                    let cultureBytes = fs.readFileSync(cultureFile, 'utf8');
                    if (!cultureBytes.trim()) continue;

                    let culture;
                    try {
                        culture = JSON.parse(cultureBytes);
                    } catch (e) { continue; }

                    let modified = false;
                    const newCulture = culture.filter(asset => {
                        const isFude = asset.name.includes('福德宮');
                        const isProtected = (asset.id && protectedIds.has(asset.id)) || protectedNames.has(asset.name);

                        // Condition to remove:
                        // It IS a Fude Temple AND is NOT protected
                        if (isFude && !isProtected) {
                            // console.log(`🗑️ Removing [${asset.name}] from ${village}`);
                            removedCount++;
                            modified = true;
                            return false; // Filter out
                        }

                        return true; // Keep
                    });

                    if (modified) {
                        fs.writeFileSync(cultureFile, JSON.stringify(newCulture, null, 2));
                    }
                }
            }
        }
    }

    console.log(`\n🎉 Removed ${removedCount} placeholder Fude Temples from Local DB.`);
}

main();
