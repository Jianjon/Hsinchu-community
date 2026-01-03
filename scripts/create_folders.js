
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = path.join(__dirname, '..', 'data');
const JSON_SOURCE = path.join(DATA_ROOT, 'hsinchu_villages.json');

console.log(`Building data structure in: ${DATA_ROOT}`);

if (!fs.existsSync(DATA_ROOT)) {
    fs.mkdirSync(DATA_ROOT);
}

// Read the JSON source
let villages = [];
try {
    const fileContent = fs.readFileSync(JSON_SOURCE, 'utf-8');
    villages = JSON.parse(fileContent);
    console.log(`Loaded ${villages.length} villages from ${JSON_SOURCE}`);
} catch (error) {
    console.error(`Error reading ${JSON_SOURCE}:`, error.message);
    process.exit(1);
}

// Counters
let created = 0;
let existed = 0;

villages.forEach(loc => {
    const dirPath = path.join(DATA_ROOT, loc.city, loc.district, loc.village);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        // console.log(`Created: ${dirPath}`);
        created++;
    } else {
        existed++;
    }
});

console.log("========================================");
console.log(`Folder structure sync complete.`);
console.log(`Total Villages: ${villages.length}`);
console.log(`Created New:    ${created}`);
console.log(`Already Exists: ${existed}`);
console.log("========================================");
