
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = "https://ws.hsinchu.gov.tw/001/Upload/1/opendata/8774/2109/0a3a0392-96d4-4b1e-97eb-444cd54320bd.json";
const OUTPUT_FILE = path.join(__dirname, '../data/hsinchu_county_chiefs.json');

async function main() {
    try {
        const res = await fetch(URL);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();

        // Transform keys to English for consistency
        const cleanData = data.map(item => ({
            city: "新竹縣",
            district: item['鄉鎮市區'],
            village: item['村里別'],
            chiefName: item['負責人'],
            phone: item['電話'],
            address: item['地址'],
            updatedAt: item['最後更新時間']
        }));

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanData, null, 2));
        console.log(`Saved ${cleanData.length} records to ${OUTPUT_FILE}`);
    } catch (e) {
        console.error(e);
    }
}

main();
