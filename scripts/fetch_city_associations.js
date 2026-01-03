
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CITY_ASSOC_URL = "https://odws.hccg.gov.tw/001/Upload/25/opendata/9059/93/8b2a33c0-9602-47bc-ab2a-3cb5c51c06a9.json?1141104105136";
const OUTPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/public_hsinchu_city_associations.json');

async function main() {
    try {
        const res = await fetch(CITY_ASSOC_URL);
        const data = await res.json();
        const records = data.map(d => ({
            name: d['團體名稱'],
            address: d['會址'],
            phone: d['聯絡電話'],
            chairman: d['理事長']
        }));

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
        console.log(`Saved ${records.length} Hsinchu City Associations.`);
    } catch (e) {
        console.error(e);
    }
}
main();
