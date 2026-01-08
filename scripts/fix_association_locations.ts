
import fs from 'fs';
import path from 'path';

const ASSOCIATION_FILE = path.resolve('data/association_locations.json');
const CHIEF_FILE = path.resolve('data/chief_office_locations.json');

async function run() {
    console.log('🛠️ Fixing Association Locations (Removing Japan/Out-of-bounds coords)...');

    if (!fs.existsSync(ASSOCIATION_FILE)) {
        console.error('❌ Association file not found!');
        return;
    }

    const associations = JSON.parse(fs.readFileSync(ASSOCIATION_FILE, 'utf8'));
    const chiefs = fs.existsSync(CHIEF_FILE) ? JSON.parse(fs.readFileSync(CHIEF_FILE, 'utf8')) : {};

    let fixedCount = 0;
    const cleanedAssociations: Record<string, [number, number]> = {};

    for (const [id, coords] of Object.entries(associations)) {
        const [lat, lon] = coords as [number, number];

        // Detection: Japan is ~35N, Hsinchu is ~24.8N. Taipei fallback is 25.01N.
        // We only want Hsinchu area (~24.5 - 25.0)
        const isSuspicious = lat > 25.2 || lat < 24.0 || lon > 122 || lon < 120.5;

        if (isSuspicious) {
            const fallback = chiefs[id];
            if (fallback) {
                // Add tiny jitter to differentiate from chief office
                cleanedAssociations[id] = [
                    fallback[0] + (Math.random() - 0.5) * 0.0005,
                    fallback[1] + (Math.random() - 0.5) * 0.0005
                ];
                console.log(`✅ Fixed ${id}: [${lat}, ${lon}] -> [${cleanedAssociations[id][0]}, ${cleanedAssociations[id][1]}] (Fallback to Chief)`);
                fixedCount++;
            } else {
                console.warn(`⚠️ Suspicious location for ${id} [${lat}, ${lon}] but NO fallback found. Skipping.`);
            }
        } else {
            cleanedAssociations[id] = [lat, lon];
        }
    }

    fs.writeFileSync(ASSOCIATION_FILE, JSON.stringify(cleanedAssociations, null, 2), 'utf8');
    console.log(`\n🎉 Finished! Fixed ${fixedCount} locations.`);
}

run();
