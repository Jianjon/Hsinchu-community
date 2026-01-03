
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = "https://odws.hccg.gov.tw/001/Upload/25/opendataback/9059/1179/f5d54124-747d-4180-b74c-006323145455.csv";
const OUTPUT_FILE = path.join(__dirname, '../data/hsinchu_county_places.json');

async function main() {
    console.log(`Fetching data from ${CSV_URL}...`);
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Read using XLSX
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log(`Parsed ${jsonData.length} records.`);

        // Transform to simplified JSON
        // Expected columns based on gov open data: 鄉鎮市別, 村里別, 集會所名稱, 地址, 東經, 北緯
        // Note: Column names might be in Chinese. We need to inspect or handle varied names.
        // Let's assume standard names for now and log valid ones.

        const simplifiedData = jsonData.map((record) => {
            // Safe access to keys (trim spaces)
            const getVal = (keys) => {
                for (const k of keys) {
                    const val = record[k] || record[Object.keys(record).find(key => key.trim() === k)];
                    if (val) return val;
                }
                return null;
            };

            const city = getVal(['鄉鎮市別', '鄉鎮市']);
            const village = getVal(['村里別', '村里']);
            const name = getVal(['集會所名稱', '名稱', '活動中心名稱']);
            const address = getVal(['地址', '住址']);
            const lng = getVal(['東經', '經度', 'X']);
            const lat = getVal(['北緯', '緯度', 'Y']);

            if (!lat || !lng) return null;

            return {
                city: "新竹縣", // Hardcode if known source
                district: city,
                village: village,
                name: name,
                address: address,
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
        }).filter(x => x !== null);

        console.log(`Processed ${simplifiedData.length} valid location records.`);

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(simplifiedData, null, 2), 'utf-8');
        console.log(`Saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

main();
