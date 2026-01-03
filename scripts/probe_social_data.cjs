
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function probeFile(filePath) {
    console.log(`\n--- Probing: ${filePath} ---`);
    if (filePath.endsWith('.csv')) {
        // Try reading as Big5 if UTF-8 looks weird
        const buffer = fs.readFileSync(filePath);
        // We use XLSX to read the buffer, it handles various encodings
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log('Columns:', Object.keys(rows[0] || {}));
        console.log('Sample Row 1:', rows[0]);
    } else {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log('Columns:', Object.keys(rows[0] || {}));
        console.log('Sample Row 1:', rows[0]);
    }
}

probeFile('data/新竹市社區照顧關懷據點名冊.xlsx');
probeFile('data/新竹縣社區照顧關懷據點名冊.csv');
probeFile('data/新竹縣實(食)物銀行.csv');
