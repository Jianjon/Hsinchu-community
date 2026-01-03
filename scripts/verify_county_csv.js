
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = "https://www.hsinchu.gov.tw/OpenDataFileHit.ashx?ID=B86FF601E289E3F9&u=77DFE16E459DFCE35FD73AB1079B42BB9E50DC7F9A4BE52D3964AECED0E062CBFEB6E762971E174DC151AE0FDD528280688597C5F2CC036BC3F0C0D98580849819ACE3093CD679B0DBBEFF99D6E57C4DBCF11B2D32B3378045237A5D366EEB1A3A7D6338609E9F30";
const OUTPUT_FILE = path.join(__dirname, '../data/hsinchu_county_places_v2.json');

async function main() {
    console.log(`Fetching from ${CSV_URL}...`);
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        // Try decoding as Big5 which is common for Taiwan gov CSVs
        const decoder = new TextDecoder('big5');
        const text = decoder.decode(arrayBuffer);

        // Parse CSV text directly using XLSX
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log(`Parsed ${jsonData.length} records.`);
        if (jsonData.length > 0) {
            console.log("Sample Record Headers:", Object.keys(jsonData[0]));
            console.log("Sample Record:", JSON.stringify(jsonData[0], null, 2));
        }

        // Process and Save
        const processed = jsonData.map(r => {
            // Try to identify lat/lng columns
            // Common pairings: (X, Y), (經度, 緯度), (WGS84_X, WGS84_Y)
            const lat = r['緯度'] || r['Y'] || r['North'] || r['Lat'];
            const lng = r['經度'] || r['X'] || r['East'] || r['Lng'];
            const name = r['名稱'] || r['集會所名稱'] || r['Name'];
            const district = r['鄉鎮市'] || r['鄉鎮市區'] || r['鄉鎮市別'];
            const village = r['村里'] || r['村里別'];
            const address = r['地址'] || r['住址'];

            if (address) {
                return {
                    city: "新竹縣",
                    district,
                    village,
                    name,
                    address,
                    lat: lat ? parseFloat(lat) : 0,
                    lng: lng ? parseFloat(lng) : 0
                };
            }
            return null;
        }).filter(d => d !== null);

        console.log(`Extracted ${processed.length} valid records (some may need geocoding).`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processed, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
