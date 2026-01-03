
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const OUTPUT_DIR = path.resolve('src/data/enrichment');

// --- INTERFACES (Mirrors mock_public.ts) ---
interface CultureDraft {
    name: string;
    description: string;
    category: 'historic_building' | 'temple' | 'traditional_market' | 'cultural_asset';
    location: [number, number]; // [lat, lng]
    address: string;
    era?: string; // e.g., "Qing Dynasty"
    history?: string;
    tags: string[];
}

interface TravelDraft {
    name: string;
    description: string;
    location: [number, number];
    address: string;
    tags: string[]; // e.g., ["Nature", "Family"]
    seasonality?: string; // e.g., "All Year"
    rating?: number;
}

interface WikiDraft {
    introduction: string; // 200 words
    population: number;
    area: string;
    features: string[]; // e.g. ["Windy", "Tech Hub"]
    chief: {
        name: string;
        phone: string;
        officeAddress: string;
        officeHours: string;
    };
    facilities: {
        name: string;
        type: 'park' | 'library' | 'activity_center' | 'market' | 'gov' | 'school';
        address: string;
        description: string;
        openingHours?: string;
    }[];
}

// 4. Events
interface EventDraft {
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    location: string;
    type: 'market' | 'tour' | 'travel' | 'workshop' | 'volunteer' | 'ceremony';
    description: string;
    tags: string[];
    imageUrl?: string;
}

// 5. Projects
interface ProjectDraft {
    title: string;
    description: string;
    what: string;
    progress: number; // 0-100
    status: 'planning' | 'active' | 'completed';
    budget?: string; // e.g. "50萬"
    owner: string;
    imageUrl?: string;
    beforeImage?: string; // URL
    afterImage?: string; // URL
    tags?: string[];
}

// 6. Care (Community Action)
interface CareDraft {
    title: string;
    type: 'care_visit' | 'meal_delivery' | 'maintenance' | 'patrol' | 'other';
    status: 'ongoing' | 'completed' | 'planned';
    description: string;
    beneficiaries?: string;
    date?: string;
    owner?: string;
}

// --- MOCK DATA (High Quality Template) ---
const MOCK_DATA = {
    culture: [
        {
            name: "新竹州廳 (Hsinchu City Hall)",
            category: "historic_building",
            location: [24.8068, 120.9687],
            address: "新竹市北區中正路120號",
            description: "國定古蹟，建於1925年，為和洋混合風格建築，紅磚與洗石子相間。",
            era: "1925 (日治時期)",
            history: "原為新竹州廳，現為新竹市政府辦公大樓，見證了新竹地區近百年的行政發展。",
            tags: ["國定古蹟", "日治建築", "官署"]
        },
        {
            name: "新竹都城隍廟",
            category: "temple",
            location: [24.8045, 120.9665],
            address: "新竹市北區中山路75號",
            description: "全臺位階最高的城隍廟，香火鼎盛，周邊小吃林立。",
            era: "1748 (清乾隆)",
            history: "列屬三級古蹟，廟埕廣場為新竹著名的小吃聚集地。",
            tags: ["信仰中心", "廟口小吃", "古蹟"]
        },
        {
            name: "進士第",
            category: "historic_building",
            location: [24.8090, 120.9640],
            address: "新竹市北區北門街",
            description: "開臺進士鄭用錫宅第，保留精美燕尾脊與磚雕。",
            era: "1838",
            tags: ["進士", "傳統民居"]
        }
    ] as CultureDraft[],

    travel: [
        {
            name: "新竹南寮漁港 (Nanliao Fishing Port)",
            description: "十七公里海岸線的起點，擁有希臘風情建築與寬廣草地，適合放風箏與騎單車。",
            location: [24.8497, 120.9275],
            address: "新竹市北區南寮街",
            tags: ["海岸", "親子", "自行車", "網美打卡"],
            seasonality: "全年皆宜 (夏季炎熱)",
            rating: 4.5
        },
        {
            name: "青草湖",
            description: "新竹八景之一，湖光山色，適合環湖步道散步。",
            location: [24.7760, 120.9695],
            address: "新竹市東區青草湖",
            tags: ["湖泊", "散步", "自然"],
            seasonality: "四季",
            rating: 4.0
        }
    ] as TravelDraft[],

    wiki: {
        introduction: "本社區位於新竹市核心地帶，也是台灣高科技產業的重鎮。這裡融合了古老的文化遺產與現代的科技生活，擁有全台最高的所得水準與年輕的人口結構。社區內古蹟眾多，生活機能完善，是宜居的幸福城市。",
        population: 450000,
        area: "104.15 sq km",
        features: ["九降風", "科技城", "古蹟群", "米粉貢丸"],
        chief: {
            name: "待填寫 (請輸入里長姓名)",
            phone: "03-5216121",
            officeAddress: "新竹市北區中正路120號",
            officeHours: "週一至週五 08:00-17:00"
        },
        facilities: [
            {
                name: "北區區公所",
                type: "gov",
                address: "新竹市北區國華街69號",
                description: "辦理里民行政事務、健保卡申請等服務。",
                openingHours: "08:00-17:00"
            },
            {
                name: "新竹市文化局圖書館",
                type: "library",
                address: "新竹市東大路二段15巷1號",
                description: "藏書豐富，提供兒童閱覽室與自修空間。",
                openingHours: "09:00-21:00 (週一休館)"
            }
        ]
    } as WikiDraft,

    // 4. Events
    events: [
        {
            title: "週末親子市集",
            date: "2026-02-15",
            time: "10:00",
            location: "社區活動中心廣場",
            type: "market",
            description: "邀請在地小農與手作職人擺攤，還有精彩的街頭藝人表演。",
            tags: ["市集", "親子", "週末"]
        },
        {
            title: "元宵節燈籠製作工作坊",
            date: "2026-02-10",
            time: "14:00",
            location: "里民教室2F",
            type: "workshop",
            description: "免費教導小朋友製作傳統燈籠，材料由里辦公室提供。",
            tags: ["文化", "手作"]
        }
    ] as EventDraft[],

    // 5. Projects
    projects: [
        {
            title: "閒置空地綠化計畫",
            description: "將社區角落的閒置空地改造成為可食地景與口袋公園。",
            what: "整地、種植原生樹種、設置休憩座椅。",
            progress: 35,
            status: "active",
            budget: "20萬",
            owner: "環境保護志工隊",
            tags: ["綠美化", "環保"]
        },
        {
            title: "通學步道改善工程",
            description: "重新鋪設學校周邊人行道，確保學童上下學安全。",
            what: "移除障礙物、增設照明、重新鋪面。",
            progress: 0,
            status: "planning",
            budget: "150萬",
            owner: "建設課/里長",
            tags: ["交通", "安全"]
        }
    ] as ProjectDraft[],

    // 6. Care
    care: [
        {
            title: "獨居長者送餐服務",
            type: "meal_delivery",
            status: "ongoing",
            description: "每週一至週五中午，為社區內行動不便的長者配送熱食。",
            beneficiaries: "社區獨居長者 15 位",
            owner: "愛心媽媽志工團"
        },
        {
            title: "社區巡守隊排班",
            type: "patrol",
            status: "ongoing",
            description: "夜間巡邏，維護巷弄治安。",
            date: "每晚 20:00-22:00",
            owner: "社區巡守隊"
        }
    ] as CareDraft[]
};

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log("🚀 Starting Design-Aligned Data Fetch...");

    // 1. Wiki
    console.log("📦 Generating Wiki Template (Basic Info)...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_wiki_draft.json'), JSON.stringify(MOCK_DATA.wiki, null, 2));

    // 2. Culture
    console.log("📦 Generating Culture Data...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_culture_draft.json'), JSON.stringify(MOCK_DATA.culture, null, 2));

    // 3. Travel
    console.log("📦 Generating Travel Data...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_travel_draft.json'), JSON.stringify(MOCK_DATA.travel, null, 2));

    // 4. Events
    console.log("📦 Generating Events Data...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_events_draft.json'), JSON.stringify(MOCK_DATA.events, null, 2));

    // 5. Projects
    console.log("📦 Generating Projects Data...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_projects_draft.json'), JSON.stringify(MOCK_DATA.projects, null, 2));

    // 6. Care
    console.log("📦 Generating Care Data...");
    fs.writeFileSync(path.join(OUTPUT_DIR, 'raw_care_draft.json'), JSON.stringify(MOCK_DATA.care, null, 2));

    console.log("\n✅  All 6 Channels Generated! \n👉 Please open 'src/data/enrichment/*.json' to verify fields match your UI design.");
}

main().catch(console.error);
