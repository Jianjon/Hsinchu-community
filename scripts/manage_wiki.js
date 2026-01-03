
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WIKI_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/community_wiki.json');

function main() {
    if (!fs.existsSync(WIKI_FILE)) {
        console.log("No wiki file found.");
        return;
    }
    const data = JSON.parse(fs.readFileSync(WIKI_FILE, 'utf-8'));
    console.log(`Total Records: ${data.length}`);

    let missingCoords = 0;
    let missingAddr = 0;

    data.forEach(d => {
        if (d.location.lat === 0 || d.location.lng === 0) {
            missingCoords++;
        }
        if (!d.location.address) {
            missingAddr++;
        }
    });

    console.log(`Missing Coordinates: ${missingCoords} (${((missingCoords / data.length) * 100).toFixed(1)}%)`);
    console.log(`Missing Address: ${missingAddr}`);

    // Check distribution
    const byDistrict = {};
    data.forEach(d => {
        const key = d.adminRegion;
        byDistrict[key] = (byDistrict[key] || 0) + 1;
    });
    console.log("By District:", byDistrict);
}

main();
