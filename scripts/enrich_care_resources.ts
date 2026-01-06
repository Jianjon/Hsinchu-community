
import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

// --- Types ---
interface CareAction {
    id: string; // Unique ID
    title: string;
    type: 'care_action';
    subtype?: 'care_center' | 'food_bank' | 'other';
    description: string;
    phone?: string;
    address?: string;
    location?: [number, number];
    tags: string[];
    time?: string;
    status: 'ongoing';
    beneficiaries?: string;
}

interface VillageWiki {
    careActions?: CareAction[];
    [key: string]: any;
}

// --- Constants ---
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/local_db');
const DATA_DIR = path.resolve(process.cwd(), 'data');

const SOURCES = [
    { filename: '新竹縣社區照顧關懷據點名冊.csv', type: 'care_center' as const, city: '新竹縣' },
    { filename: '新竹縣實(食)物銀行.csv', type: 'food_bank' as const, city: '新竹縣' },
    { filename: '新竹市社區照顧關懷據點名冊.xlsx', type: 'care_center' as const, city: '新竹市' }
];

// --- Helpers ---

// 1. Build a Map of "County/Town/Village" -> FilePath
// Key format: "新竹縣_竹北市_北崙里" (Normalize strictly)
function buildVillageMap(): Map<string, string> {
    const map = new Map<string, string>();

    // Recursive walker
    function walk(dir: string, segments: string[]) {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                walk(path.join(dir, item.name), [...segments, item.name]);
            } else if (item.name === 'wiki.json') {
                // Found a wiki file.
                // Expected segments: [County, Town, Village]
                // But local_db structure might be flexible. 
                // Usually: local_db / County / Town / Village / wiki.json
                if (segments.length >= 3) {
                    const county = segments[0]; // e.g., 新竹縣
                    const town = segments[1];   // e.g., 竹北市
                    const village = segments[2];// e.g., 北崙里

                    const key = `${county}_${town}_${village}`;
                    map.set(key, path.join(dir, item.name));
                }
            }
        }
    }

    walk(LOCAL_DB_PATH, []);
    console.log(`[Init] Mapped ${map.size} villages from local_db.`);
    return map;
}

// 2. Parse Address to find Village Key
// returns "County_Town_Village" or null
function parseAddressToKey(address: string, defaultCity: string): string | null {
    if (!address) return null;

    // Normalize
    let addr = address.replace(/台/g, '臺').replace(/\s/g, '');

    // Extract County (City)
    let county = defaultCity;
    if (addr.startsWith('新竹市')) county = '新竹市';
    if (addr.startsWith('新竹縣')) county = '新竹縣';

    // Extract Town (Simple Regex)
    // Match "XX市/縣 XX區/鄉/鎮/市"
    // CAREFUL: "竹北市" is a town in "新竹縣". "東區" is a town(district) in "新竹市".

    let town = '';
    let village = '';

    // Try to find known townships in Hsinchu
    const TOWNS = ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '芎林鄉', '橫山鄉', '北埔鄉', '寶山鄉', '峨眉鄉', '尖石鄉', '五峰鄉', '東區', '北區', '香山區'];

    for (const t of TOWNS) {
        if (addr.includes(t)) {
            town = t;
            break;
        }
    }

    if (!town) return null; // Can't identify town

    // Extract Village
    // Heuristic: Look for "XX里" or "XX村" after the town position
    // Or just look for any "XX里" / "XX村" in the string

    // Simple regex for grabbing Village name: (.+?[村里])
    const villageRegex = new RegExp(`${town}.*?(.+?[村里])`);
    const match = addr.match(villageRegex);

    if (match && match[1]) {
        // cleanup village name
        // Sometimes match might include street name like "中正路XX里" (unlikely)
        // Usually address is "Town Village Street".
        // Let's refine: Look for 2-4 chars ending in 村 or 里
        const vCandidate = match[1];
        // Ensure it's not a street name like "建功里" inside "建功里XX路" is fine.
        // But "阿里山" is bad.
        // Let's rely on map validation.

        // Try strict extraction of just the village part if it's mixed
        // e.g., "竹北市北崙里博愛街" -> "北崙里"
        const vMatch = vCandidate.match(/([^\d\s區鄉鎮市]+?[村里])/);
        if (vMatch) {
            village = vMatch[1];
        } else {
            village = vCandidate;
        }
    }

    // --- Fallback for Missing Village ---
    // If we have Town but no Village, try to map to Main Village (Town Name + 村/里)
    if (town && !village) {
        // Remove '鄉'/'鎮'/'市' from town name for matching
        const townBase = town.replace(/[鄉鎮市區]/g, '');
        // Try constructing potential default villages
        // e.g., 橫山鄉 -> 橫山村
        return `${county}_${town}_${townBase}村`; // Optimistic Guess 1
        // Caller will check if this key exists in map. If not, it fails safely.
    }

    if (!village) return null;

    return `${county}_${town}_${village}`;
}


import { resolveAddressToVillage } from './geo_match_care_resources.js';

// ... existing imports ...

// ... buildVillageMap ...

// ... parseAddressToKey ...

// 3. Main Processing
async function run() {
    const villageMap = buildVillageMap();
    let stats = { processed: 0, matched: 0, updated: 0, geocoded: 0 };

    for (const source of SOURCES) {
        // ... (file reading logic same as before) ...
        const filePath = path.join(DATA_DIR, source.filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`[Skip] File not found: ${source.filename}`);
            continue;
        }

        console.log(`\n📂 Processing ${source.filename}...`);

        let rawData: any[][] = [];
        try {
            if (source.filename.endsWith('.csv')) {
                const buffer = fs.readFileSync(filePath);
                const decoder = new TextDecoder('big5');
                const csvStr = decoder.decode(buffer);
                const workbook = XLSX.read(csvStr, { type: 'string' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            } else {
                const workbook = XLSX.readFile(filePath);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            }
        } catch (e) {
            console.error("Failed to read xlsx/csv:", e);
            continue;
        }

        // Find Header Row
        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i] as string[];
            if (row.some(c => c && typeof c === 'string' && (c.includes('名稱') || c.includes('單位') || c.includes('站名')))) {
                headerRowIndex = i;
                headers = row.map(r => r ? String(r).trim() : '');
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.warn(`   [Skip] Could not find header row in ${source.filename}`);
            continue;
        }

        // Map Column Indices
        const colIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const idxName = colIdx(['名稱', '單位', '站名']);
        const idxAddr = colIdx(['地址', '地點']);
        const idxPhone = colIdx(['電話', '連絡']);
        const idxTime = colIdx(['時間', '時段']);

        const rowsToProcess = rawData.slice(headerRowIndex + 1);
        console.log(`   Processing ${rowsToProcess.length} data rows...`);

        // Use standard for...of to allow await
        for (const row of rowsToProcess) {
            stats.processed++;
            const getVal = (idx: number) => idx >= 0 ? String(row[idx] || '').trim() : '';

            const name = getVal(idxName);
            const address = getVal(idxAddr);
            const phone = getVal(idxPhone);
            const serviceTime = getVal(idxTime);

            if (!name) continue;

            let villageKey = parseAddressToKey(address, source.city);

            // If simple parsing failed OR parsed key not in map (e.g. invalid town/village name)
            if ((!villageKey || !villageMap.has(villageKey)) && address.length > 5) {
                // Try Geocoding
                try {
                    // console.log(`   [Geo Attempt] ${address}`);
                    const geoResult = await resolveAddressToVillage(address);
                    if (geoResult) {
                        const newKey = `${geoResult.county}_${geoResult.town}_${geoResult.village}`;
                        if (villageMap.has(newKey)) {
                            console.log(`   [Geo ✅] ${address} -> ${newKey} (${name})`);
                            villageKey = newKey;
                            stats.geocoded++;
                        } else {
                            // console.log(`   [Geo ❌] Matched ${newKey} but not in local_db.`);
                        }
                    }
                } catch (err) {
                    console.error("Geocode error", err);
                }
            }


            if (villageKey && villageMap.has(villageKey)) {
                stats.matched++;
                const wikiPath = villageMap.get(villageKey)!;

                // Read Wiki
                let wiki: VillageWiki = {};
                try {
                    wiki = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
                } catch (e) {
                    // Only log if file should exist
                }

                if (!wiki.careActions) wiki.careActions = [];

                const exists = wiki.careActions.find(c => c.title === name);
                if (!exists) {
                    const newAction: CareAction = {
                        id: `import_${source.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        title: name,
                        type: 'care_action',
                        subtype: source.type,
                        description: `[${source.type === 'food_bank' ? '實物銀行' : '關懷據點'}] 位於${address}的在地服務資源。`,
                        phone: phone || undefined,
                        address: address,
                        time: serviceTime || undefined,
                        tags: source.type === 'food_bank'
                            ? ['食物銀行', '物資發放', '社會救助']
                            : ['關懷據點', '老人共餐', '社區照顧'],
                        status: 'ongoing',
                        beneficiaries: source.type === 'care_center' ? '社區長者' : '弱勢家庭'
                    };

                    wiki.careActions.push(newAction);
                    fs.writeFileSync(wikiPath, JSON.stringify(wiki, null, 2));
                    stats.updated++;
                    // process.stdout.write('.'); 
                }
            }
        }
    }

    console.log(`\n\n✅ Done! Processed: ${stats.processed}, Matched: ${stats.matched} (Geocoded: ${stats.geocoded}), New/Updated: ${stats.updated}`);
}

run();
