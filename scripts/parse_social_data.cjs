
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LOCAL_DB_BASE = path.resolve('data/local_db');

const FILE_CITY_CARE = 'data/新竹市社區照顧關懷據點名冊.xlsx';
const FILE_COUNTY_CARE = 'data/新竹縣社區照顧關懷據點名冊.csv';
const FILE_FOOD_BANK = 'data/新竹縣實(食)物銀行.csv';

// Helper to normalize strings for comparison
const normalize = (s) => s?.toString().replace(/ /g, '') || '';

function updateWiki(city, district, village, action) {
    const wikiPath = path.join(LOCAL_DB_BASE, city, district, village, 'wiki.json');
    if (!fs.existsSync(wikiPath)) {
        return false;
    }

    const wikiData = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
    if (!wikiData.careActions) wikiData.careActions = [];

    // Avoid duplicates
    const exists = wikiData.careActions.some(a => a.title === action.title && a.location === action.location);
    if (!exists) {
        wikiData.careActions.push(action);
        fs.writeFileSync(wikiPath, JSON.stringify(wikiData, null, 2));
        return true;
    }
    return false;
}

async function processCityCare() {
    console.log(`\n📋 Processing Hsinchu City Care Centers...`);
    const workbook = XLSX.readFile(FILE_CITY_CARE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let updated = 0;
    let startRow = 0;
    for (let i = 0; i < 5; i++) {
        if (data[i] && data[i].includes('區域')) {
            startRow = i + 1;
            break;
        }
    }

    for (let i = startRow; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        const district = normalize(row[2]); // 區域
        const village = normalize(row[3]);  // 里別
        const name = row[4];                // 單位名稱
        const time = row[5];                // 共餐據點時間
        const address = row[6];             // 地址
        const note = row[7];                // 備註

        if (!district || !village || !address) continue;

        const action = {
            title: `社區照顧關懷據點：${name}`,
            description: `提供共餐服務及關懷訪視。${time ? '服務時間：' + time : ''} ${note || ''}`,
            location: address,
            time: time,
            category: 'social_welfare'
        };

        if (updateWiki('新竹市', district, village, action)) {
            updated++;
        }
    }
    console.log(`✅ Updated ${updated} items in Hsinchu City.`);
}

async function processCountyCare() {
    console.log(`\n📋 Processing Hsinchu County Care Centers (Big5)...`);
    const buffer = fs.readFileSync(FILE_COUNTY_CARE);
    const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 950 });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

    let updated = 0;
    let matched = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        const name = row[1];
        const phone = row[4];
        const address = row[7];
        const status = row[8];

        if (!address) continue;

        const match = address.match(/新竹縣?\s*(.*?([鄉鎮市]))\s*(.*?([里村]))/);
        if (match) {
            matched++;
            const district = match[1];
            const village = match[3];

            const action = {
                title: `社區照顧關懷據點：${name}`,
                description: `提供關懷訪視及供餐服務。運作狀態：${status || '運作中'}。聯絡電話：${phone || '無'}`,
                location: address,
                phone: phone ? phone.toString() : '無',
                category: 'social_welfare'
            };

            if (updateWiki('新竹縣', district, village, action)) {
                updated++;
            }
        }
    }
    console.log(`✅ Matched ${matched} addresses, Updated ${updated} villages in Hsinchu County.`);
}

async function processFoodBank() {
    console.log(`\n📋 Processing Food Bank Data (Big5)...`);
    const buffer = fs.readFileSync(FILE_FOOD_BANK);
    const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 950 });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

    let updated = 0;
    let matched = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        const name = row[1];
        const phone = row[2];
        const address = row[7]; // Try index 7 based on raw head dump
        const area = row[8];
        const time = row[9];

        // If index 7 is empty, try index 5 (from probe columns)
        const finalAddress = address || row[5];
        if (!finalAddress) continue;

        if (i < 5) console.log(`Decoded Row [${i}] name: ${name} address: ${finalAddress}`);

        const match = finalAddress.match(/新竹縣?\s*(.*?([鄉鎮市]))\s*(.*?([里村]))/);
        if (match) {
            matched++;
            const district = match[1];
            const village = match[3];

            const action = {
                title: `實(食)物銀行：${name}`,
                description: `提供實物銀行物資發放。服務區域：${area || '全縣'}。服務時間：${time || '見官網'}。聯絡電話：${phone || '無'}`,
                location: finalAddress,
                time: time,
                category: 'social_welfare'
            };

            if (updateWiki('新竹縣', district, village, action)) {
                updated++;
            }
        }
    }
    console.log(`✅ Matched ${matched} addresses, Updated ${updated} Food Bank locations.`);
}

async function main() {
    await processCityCare();
    await processCountyCare();
    await processFoodBank();
    console.log(`\n🎉 Social data integration complete.`);
}

main().catch(console.error);
