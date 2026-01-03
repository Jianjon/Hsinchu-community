
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_DB_PATH = path.resolve('data/local_db/新竹縣/竹北市');

// 1. The "Gold Standard" Data for Zhongxing Li (From Screenshots)
const ZHONGXING_GOLD_DATA = {
    introduction: "中興里位於竹北高鐵特定區核心地帶，是融合「六家百年水圳記憶」與「現代科技生活」的活力社區。這裡不僅有明星學區的教育氛圍，更有居民自發組成的巡守隊守護每一條街道。社區致力於打造高品質、低碳且充滿互助精神的都會家園。",
    population: 12453,
    area: "0.61 平方公里",
    features: ["科技新市鎮", "明星學區", "水圳文化", "高鐵特區", "都市住宅", "縣治核心區"],
    chief: {
        name: "莊淙澍",
        phone: "0985-588100",
        officeAddress: "新竹縣竹北市中興里9鄰復興一街242號",
        officeHours: "週一至週五 08:00-17:00"
    },
    association: {
        chairman: "待查",
        contact: "新竹縣竹北市中興社區發展協會",
        address: "新竹縣竹北市興隆路三段37巷43號"
    },
    facilities: [
        {
            name: "中興里集會所",
            type: "activity_center",
            address: "新竹縣竹北市中興里",
            description: "社區活動中心，提供共餐與健康講座服務。",
            openingHours: "08:00-21:00"
        },
        {
            name: "中興公園",
            type: "park",
            address: "中興里內",
            description: "里內核心休憩綠地。",
            openingHours: "24H"
        },
        {
            name: "水圳森林公園",
            type: "park",
            address: "復興二路",
            description: "保留六家水圳文化的景觀公園。",
            openingHours: "24H"
        },
        {
            name: "興隆國小",
            type: "school",
            address: "文興路",
            description: "明星學區國小。",
            openingHours: "上學期間"
        },
        {
            name: "嘉興路福德宮",
            type: "temple",
            address: "嘉興路",
            description: "地方信仰中心。",
            openingHours: "06:00-21:00"
        }
    ]
};

// 2. Real Data Map for Other Villages (From Search Results)
const VILLAGE_DATA_MAP: Record<string, any> = {
    "鹿場里": { chief: "范光仁", phone: "0932-240970", address: "自強六街83號", pop: 16791 },
    "東平里": { chief: "林顥峰", phone: "0936-185678", address: "六家三街40號", pop: 19559 },
    "隘口里": { chief: "林洪文", phone: "0910-960990", address: "堤頂街131巷26號" },
    "東海里": { chief: "簡秀蓮", phone: "0933-979026", address: "東興路一段713號" },
    "東興里": { chief: "龍春廣", phone: "0937-537112", address: "興海街55巷16號" },
    "北興里": { chief: "田慶順", phone: "0937-139595", address: "十興路一段211號" },
    "十興里": { chief: "毛振福", phone: "0935-260243", address: "勝利六街196號" },
    "興安里": { chief: "彭垣均", phone: "0932-526487", address: "文愛街28號" },
    "文化里": { chief: "謝棋鈞", phone: "0963-031685", address: "文信路200號" },
    "斗崙里": { chief: "張琬媃", phone: "0919-517416", address: "福興路755巷27弄30號" },
    "北崙里": { chief: "洪燕卿", phone: "0966-830668", address: "博愛街27-16號" },
    "新崙里": { chief: "劉旦貴", phone: "0976-313918", address: "光明11路123巷20號" },
    "中崙里": { chief: "李金對", phone: "0939-510855", address: "光明9路202號" },
    "竹仁里": { chief: "劉堂隆", phone: "0933-755858", address: "中正東路121號", pop: 11056 },
    "福德里": { chief: "曾文忠", phone: "0932-375502", address: "中正東路425巷19號" },
    "竹北里": { chief: "李麗惠", phone: "0933-974395", address: "中山路174號", pop: 11371 },
    "竹義里": { chief: "徐明兆", phone: "0912-534496", address: "新光街233號" },
    "泰和里": { chief: "羅敏功", phone: "0911-242567", address: "新泰路36巷42號" },
    "新社里": { chief: "范植雄", phone: "0932-287868", address: "新國街50巷20弄12號" },
    "新國里": { chief: "吳勝隆", phone: "0912-535420", address: "新光街27號" },
    "聯興里": { chief: "陳威男", phone: "0937-990757", address: "新興路65巷7弄6號" },
    "麻園里": { chief: "許榮生", phone: "0910-001401", address: "麻園三路146號" }
};

async function main() {
    console.log("🚀 Starting Zhubei Data Refinement...");

    const villages = fs.readdirSync(LOCAL_DB_PATH);

    for (const village of villages) {
        if (village === '.DS_Store') continue;

        const wikiPath = path.join(LOCAL_DB_PATH, village, 'wiki.json');
        if (!fs.existsSync(wikiPath)) continue;

        let wikiData = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));

        // 1. Apply Gold Standard for Zhongxing Li
        if (village === '中興里') {
            wikiData = { ...wikiData, ...ZHONGXING_GOLD_DATA };
            console.log(`✅ Updated [中興里] to Gold Standard (Screenshot Data).`);
        }
        // 2. Update others with Real Data if available
        else if (VILLAGE_DATA_MAP[village]) {
            const real = VILLAGE_DATA_MAP[village];

            // Textual updates
            wikiData.chief = {
                name: real.chief,
                phone: real.phone,
                officeAddress: `新竹縣竹北市${village}${real.address}`, // Add Prefix
                officeHours: "週一至週五 08:00-17:00"
            };

            if (real.pop) {
                wikiData.population = real.pop;
            }

            // Standardize Features if they look generic
            if (wikiData.features[0] === "社區公園") {
                wikiData.features = ["竹北生活圈", "宜居社區", "新興發展"];
            }

            // Ensure Facilities are better named
            wikiData.facilities = wikiData.facilities.map((f: any) => ({
                ...f,
                name: (f.name.includes("XX") ? `${village}活動中心` : f.name),
                address: (f.address.includes("XX") ? `新竹縣竹北市${village}` : f.address)
            }));

            console.log(`✨ Refined [${village}] with real Chief/Contact info.`);
        } else {
            // For villages without specific data found yet, at least clean up "XX" placeholders
            wikiData.facilities = wikiData.facilities.map((f: any) => ({
                ...f,
                name: (f.name.includes("XX") ? `${village}活動中心` : f.name),
                address: (f.address.includes("XX") ? `新竹縣竹北市${village}` : f.address)
            }));
            console.log(`🔹 Minor cleanup for [${village}].`);
        }

        fs.writeFileSync(wikiPath, JSON.stringify(wikiData, null, 2));
    }

    console.log("\n🎉 Zhubei Batch Update Complete!");
}

main().catch(console.error);
