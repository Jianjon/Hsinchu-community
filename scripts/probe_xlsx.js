
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.join(__dirname, '../temp/1222-01-02-2+新竹縣各鄉鎮市村里　現住人口數按性別及年齡分.XLSX');

try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetNames = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Searching for 竹東鎮...`);
    data.forEach((row, index) => {
        const str = JSON.stringify(row);
        if (str.includes("竹東鎮")) {
            console.log(`Found at Row ${index}:`, str);
        }
    });

} catch (e) {
    console.error("Error reading XLSX:", e);
}
