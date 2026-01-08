
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ENRICHED_ASSETS_FILE = path.join(__dirname, '../data/culture_assets_enriched.json');
const LOCAL_DB_ROOT = path.join(__dirname, '../data/local_db');

interface EnrichedAsset {
    id: string;
    name: string;
    type: string; // matches category values roughly
    description: string;
    searchQuery: string;
    city: string;
    district: string;
    location: [number, number];
    communityId: string; // e.g. "新竹市_北區_中央里"
}

interface CultureHeritage {
    id: string;
    name: string;
    description: string;
    category: string;
    location: [number, number];
    address?: string;
    tags?: string[];
    photos?: string[];
}

function main() {
    console.log("🚀 Injecting Cultural Assets to Local DB...");

    if (!fs.existsSync(ENRICHED_ASSETS_FILE)) {
        console.error("❌ Enriched assets file not found:", ENRICHED_ASSETS_FILE);
        return;
    }

    const assets: EnrichedAsset[] = JSON.parse(fs.readFileSync(ENRICHED_ASSETS_FILE, 'utf-8'));
    let updateCount = 0;

    // Group assets by communityId
    const assetsByCommunity: Record<string, EnrichedAsset[]> = {};
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
            console.warn(`⚠️ Village folder not found: ${villagePath}`);
            continue;
        }

        let existingCulture: CultureHeritage[] = [];
        if (fs.existsSync(cultureFile)) {
            try {
                existingCulture = JSON.parse(fs.readFileSync(cultureFile, 'utf-8'));
            } catch (e) {
                console.warn(`⚠️ Error reading ${cultureFile}, resetting to empty.`);
            }
        }

        // Merge new assets
        let modified = false;
        for (const asset of commAssets) {
            // Check duplications by name
            if (!existingCulture.find(c => c.name === asset.name)) {

                // Map category
                let category = 'historic_site'; // default
                if (asset.type === 'temple') category = 'temple';
                else if (asset.type === 'historic_building') category = 'historic_building';
                else if (asset.type === 'cultural_asset') category = 'cultural_asset';

                const newHeritage: CultureHeritage = {
                    id: asset.id, // e.g. cult-1
                    name: asset.name,
                    description: asset.description,
                    category: category,
                    location: asset.location,
                    address: asset.searchQuery.replace(`${city} `, '').replace(`${city}`, ''),
                    tags: ['文化資產', '古蹟', asset.name.includes('廟') ? '寺廟' : '歷史建築'],
                    photos: []
                };

                existingCulture.push(newHeritage);
                modified = true;
                updateCount++;
            }
        }

        if (modified) {
            fs.writeFileSync(cultureFile, JSON.stringify(existingCulture, null, 2));
            console.log(`✅ Updated ${village} with ${commAssets.length} assets.`);
        }
    }

    console.log(`\n🎉 Injection Complete! Added ${updateCount} assets to Local DB files.`);
}

main();
