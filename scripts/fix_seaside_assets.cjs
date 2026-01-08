
const fs = require('fs');
const path = require('path');

const LOCAL_DB_BASE = path.resolve('data/local_db');
const CHIEF_LOCATIONS_FILE = path.resolve('data/chief_office_locations.json');

function main() {
    console.log("🚀 Fixing Seaside Assets in Local DB...");

    if (!fs.existsSync(CHIEF_LOCATIONS_FILE)) {
        console.error("❌ Chief locations file not found!");
        return;
    }

    const chiefLocations = JSON.parse(fs.readFileSync(CHIEF_LOCATIONS_FILE, 'utf8'));

    const cities = fs.readdirSync(LOCAL_DB_BASE);
    let fixedCount = 0;

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

                if (fs.existsSync(cultureFile)) {
                    let cultureBytes = fs.readFileSync(cultureFile, 'utf8');
                    if (!cultureBytes.trim()) continue;

                    let culture = JSON.parse(cultureBytes);
                    let modified = false;

                    const commLoc = chiefLocations[commId];
                    if (!commLoc) {
                        // console.warn(`⚠️ No chief location for ${commId}, skipping fixes.`);
                        continue;
                    }

                    for (const asset of culture) {
                        if (asset.location) {
                            const [lat, lng] = asset.location;
                            // Threshold: 120.93 (West of this is considered "Seaside/Ocean" zone for these errors)
                            // Zhubei/Hsinchu City/Hsinchu County mostly > 120.95. Nanliao is 120.92.
                            // The error cluster is ~120.90-120.92.
                            if (lng < 120.93) {
                                // Double check if it's a valid coastal community
                                // But even if it is, moving to Community Center (Chief Office) is safer than "Generic Seaside".

                                // Add random offset (0.001 deg ~ 100m)
                                const offsetLat = (Math.random() - 0.5) * 0.002;
                                const offsetLng = (Math.random() - 0.5) * 0.002;

                                asset.location = [commLoc[0] + offsetLat, commLoc[1] + offsetLng];
                                modified = true;
                                fixedCount++;
                                console.log(`🔧 Fixed [${asset.name}] in ${village} from [${lat}, ${lng}] to [${asset.location[0]}, ${asset.location[1]}]`);
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

    console.log(`\n🎉 Fixed ${fixedCount} seaside assets.`);
}

main();
