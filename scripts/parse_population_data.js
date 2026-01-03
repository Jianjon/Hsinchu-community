
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');
const OUTPUT_PATH = path.join(__dirname, '../data/enriched_population.json');

const COUNTY_FILE = path.join(TEMP_DIR, '1222-01-02-2+新竹縣各鄉鎮市村里　現住人口數按性別及年齡分.XLSX');
const CITY_FILE = path.join(TEMP_DIR, '11107f01.xlsx');

const populationData = {}; // { "District_Village": { population: 123, male: 123, female: 123 } }

function parseCounty() {
    console.log("Parsing County Data...");
    if (!fs.existsSync(COUNTY_FILE)) {
        console.error("County file not found.");
        return;
    }

    const workbook = XLSX.readFile(COUNTY_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentTownship = "";

    data.forEach((row, index) => {
        if (index < 6) return; // Skip headers

        const regionCode = row[0] ? String(row[0]) : "";
        const regionName = row[1];
        const gender = row[2];
        const total = row[3];

        if (!regionCode || !regionName) return;

        // Township Check (8 digits or "計" for township)
        // Actually from previous probe: Row 10 ["10004010","竹北市","計"...]
        if (gender && gender.trim() === '計' && regionCode.length === 8) {
            currentTownship = regionName.trim();
            console.log(`[Township Detected] ${currentTownship} (Code: ${regionCode})`);
        }

        // Village Check (11 digits)
        if (gender && gender.trim() === '計' && regionCode.length === 11) {
            const village = regionName.trim();
            const key = `${currentTownship}_${village}`; // e.g. 竹北市_斗崙里

            // Debug specific missing villages
            if (village === '軟橋里' || village === '大崎村') {
                console.log(`[Debug Target] Found ${village} in ${currentTownship} (Code: ${regionCode}, Pop: ${total})`);
            }

            populationData[key] = {
                population: total,
                male: 0,
                female: 0
            };
        }

        // Debug rows 232 and 241 explicitly
        if (index === 232 || index === 241 || index === 511) {
            console.log(`[Row ${index}] Code: "${regionCode}" Len:${regionCode.length} Name: "${regionName}" Gender: "${gender}"`);
        }
    });
}

function parseCityNorth() {
    console.log("Parsing City Data (North)...");
    if (!fs.existsSync(CITY_FILE)) {
        console.error("City file not found.");
        return;
    }

    const workbook = XLSX.readFile(CITY_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Assuming North District based on probing
    const district = "北區";

    data.forEach((row, index) => {
        if (index < 2) return;
        // Row 5: [1,"西門里",10,303,"計",635...]
        const village = row[1];
        const gender = row[4];
        const total = row[5];

        if (gender === '計' && village && village !== '總計' && village !== '區域別') {
            const key = `${district}_${village}`;
            populationData[key] = {
                population: total
            };
        }
    });
}

parseCounty();
parseCityNorth();

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(populationData, null, 2));
console.log(`Saved population data for ${Object.keys(populationData).length} villages to ${OUTPUT_PATH}`);
