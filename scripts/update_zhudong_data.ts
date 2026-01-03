
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_DB_PATH = path.resolve('data/local_db/新竹縣/竹東鎮');

// Real Data Map for Zhudong Villages
const VILLAGE_DATA_MAP: Record<string, any> = {
    "上舘里": { chief: "莊瑞琴", phone: "0927-989005", address: "上館里29鄰中豐路二段222巷8號", pop: 10994 },
    "中正里": { chief: "黃國樞", address: "中正里14鄰中正路94巷9號" },
    "三重里": { chief: "鍾煥明", address: "三重里9鄰中興路二段258號", pop: 7828 },
    "大鄉里": { chief: "孔維新", address: "大鄉里24鄰文林路190巷24號", pop: 5394 },
    "竹東里": { chief: "林秋連 (代理)", phone: "0928-804715", address: "竹東里三民街17號" },
    "忠孝里": { chief: "吳錦忠", phone: "0926-635182", address: "忠孝里3鄰長春路3段55號" },
    "五豐里": { chief: "羅晉弘", address: "五豐里34鄰五豐", pop: 9106 },
    "上坪里": { chief: "曾瑞琴", pop: 300 },
    "東寧里": { chief: "彭立傑", pop: 3740 },
    "商華里": { chief: "陳瑞玉" },
    "瑞峰里": { chief: "彭康麟" },
    "中山里": { chief: "孫光政" },
    "二重里": { chief: "林永銓", pop: 16290 }, // Top 1 population in Zhudong
    "仁愛里": { chief: "楊國雄", pop: 3933 },
    "員山里": { chief: "王靖文" },
    "榮華里": { chief: "林子丞", pop: 8696 },
    "員崠里": { chief: "王瀚立" },
    "軟橋里": { chief: "林德源" },
    "雞林里": { chief: "賴運土", pop: 4402 },
    "頭重里": { pop: 5177 }
};

async function main() {
    console.log("🚀 Starting Zhudong Data Refinement...");

    // Create base dir if it doesn't exist (should exist from generate step)
    if (!fs.existsSync(LOCAL_DB_PATH)) {
        console.error(`❌ Directory not found: ${LOCAL_DB_PATH}`);
        return;
    }

    const villages = fs.readdirSync(LOCAL_DB_PATH);

    for (const village of villages) {
        if (village === '.DS_Store') continue;

        const wikiPath = path.join(LOCAL_DB_PATH, village, 'wiki.json');
        if (!fs.existsSync(wikiPath)) continue;

        let wikiData = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));

        // Update with Real Data if available
        if (VILLAGE_DATA_MAP[village]) {
            const real = VILLAGE_DATA_MAP[village];

            // Textual updates
            wikiData.chief = {
                name: real.chief || "待確認",
                phone: real.phone || "03-5966177 (鎮公所代轉)", // Default to Town Office if unknown
                officeAddress: real.address ? `新竹縣竹東鎮${real.address}` : `新竹縣竹東鎮${village}辦公處`,
                officeHours: "週一至週五 08:00-17:00"
            };

            if (real.pop) {
                wikiData.population = real.pop;
            }

            // Standardize Features
            if (wikiData.features[0] === "社區公園") {
                wikiData.features = ["客家風情", "純樸鄰里", "宜居竹東"];
            }
            // Cleaning up the facilities generic names
            wikiData.facilities = wikiData.facilities.map((f: any) => ({
                ...f,
                name: (f.name.includes("XX") ? `${village}活動中心` : f.name),
                address: (f.address.includes("XX") ? `新竹縣竹東鎮${village}` : f.address)
            }));

            console.log(`✨ Refined [${village}] with real data.`);
        } else {
            // Cleanup only
            wikiData.facilities = wikiData.facilities.map((f: any) => ({
                ...f,
                name: (f.name.includes("XX") ? `${village}活動中心` : f.name),
                address: (f.address.includes("XX") ? `新竹縣竹東鎮${village}` : f.address)
            }));
            console.log(`🔹 Minor cleanup for [${village}].`);
        }

        fs.writeFileSync(wikiPath, JSON.stringify(wikiData, null, 2));
    }

    console.log("\n🎉 Zhudong Batch Update Complete!");
}

main().catch(console.error);
