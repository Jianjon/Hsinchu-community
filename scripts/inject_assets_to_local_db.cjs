
const fs = require('fs');
const path = require('path');

const ENRICHED_ASSETS_FILE = path.resolve('data/culture_assets_enriched.json');
const LOCAL_DB_ROOT = path.resolve('data/local_db');

function main() {
    console.log("🚀 Injecting Cultural Assets to Local DB...");

    if (!fs.existsSync(ENRICHED_ASSETS_FILE)) {
        console.error("❌ Enriched assets file not found:", ENRICHED_ASSETS_FILE);
        return;
    }

    const assets = JSON.parse(fs.readFileSync(ENRICHED_ASSETS_FILE, 'utf-8'));
    let updateCount = 0;
    let newCount = 0;

    // Group assets by communityId
    const assetsByCommunity = {};
    for (const asset of assets) {
        if (!assetsByCommunity[asset.communityId]) {
            assetsByCommunity[asset.communityId] = [];
        }
        assetsByCommunity[asset.communityId].push(asset);
    }

    for (const [commId, commAssets] of Object.entries(assetsByCommunity)) {
        // ID format: City_District_Village
        const parts = commId.split('_');
        if (parts.length !== 3) {
            console.warn(`⚠️ Invalid community ID format: ${commId}`);
            continue;
        }

        const [city, district, village] = parts;
        const villagePath = path.join(LOCAL_DB_ROOT, city, district, village);
        const cultureFile = path.join(villagePath, 'culture.json');

        if (!fs.existsSync(villagePath)) {
            // console.warn(`⚠️ Village folder not found: ${villagePath}`);
            continue;
        }

        let existingCulture = [];
        if (fs.existsSync(cultureFile)) {
            try {
                existingCulture = JSON.parse(fs.readFileSync(cultureFile, 'utf-8'));
            } catch (e) {
                console.warn(`⚠️ Error reading ${cultureFile}, resetting to empty.`);
            }
        }

        let modified = false;
        for (const asset of commAssets) {

            // Map category
            let category = 'historic_site'; // default
            if (asset.type === 'temple') category = 'temple';
            else if (asset.type === 'historic_building') category = 'historic_building';
            else if (asset.type === 'cultural_asset') category = 'cultural_asset';

            const newHeritage = {
                id: asset.id, // e.g. cult-1
                name: asset.name,
                description: asset.description,
                category: category,
                location: asset.location,
                // Remove City District from search query to make address cleaner
                address: asset.searchQuery.replace(`${city} `, '').replace(`${city}`, ''),
                tags: ['文化資產', '古蹟', asset.name.includes('廟') ? '寺廟' : '歷史建築'],
                era: asset.era,
                history: asset.history,
                photos: []
            };

            // Check if exists
            const existingIndex = existingCulture.findIndex(c => c.name === asset.name || (c.id && c.id === asset.id));
            if (existingIndex !== -1) {
                // Update
                existingCulture[existingIndex] = {
                    ...existingCulture[existingIndex],
                    ...newHeritage
                };
                updateCount++;
                modified = true;
            } else {
                // Add new
                existingCulture.push(newHeritage);
                newCount++;
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(cultureFile, JSON.stringify(existingCulture, null, 2));
        }
    }

    console.log(`\n🎉 Injection Complete! Added ${newCount} new assets, Updated ${updateCount} existing assets in Local DB.`);
}

main();
