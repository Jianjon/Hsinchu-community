
import fs from 'fs';
import path from 'path';
import { resolveAddressToVillage } from './geo_match_care_resources.js';

// --- Types ---
interface TravelSpot {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rating: string;
    reviewCount: string;
    location: [number, number]; // Fix: Coordinates for Map
    address: string;  // For Geocoding
    tags: string[];
}

interface VillageWiki {
    travelSpots?: TravelSpot[];
    [key: string]: any;
}

const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/local_db');

// --- Curated Data ---
const TRAVEL_SPOTS_SOURCE = [
    {
        name: "司馬庫斯 (上帝的部落)",
        address: "新竹縣尖石鄉玉峰村14鄰司馬庫斯2號",
        description: "位於尖石鄉深山的泰雅族部落，擁有巨木群與原始自然的絕美景觀，被譽為「上帝的部落」。",
        imageUrl: "https://images.unsplash.com/photo-1596564233734-7ff534a6aa73?q=80&w=800",
        rating: "4.8",
        reviewCount: "2,403",
        tags: ["自然", "登山", "原住民文化"]
    },
    {
        name: "北埔老街",
        address: "新竹縣北埔鄉北埔街",
        description: "充滿客家風情的老街，匯集了金廣福公館、天水堂等古蹟，必嚐客家擂茶與石柿餅。",
        imageUrl: "https://images.unsplash.com/photo-1634316427339-4976c66a4087?q=80&w=800",
        rating: "4.4",
        reviewCount: "5,821",
        tags: ["古蹟", "美食", "客家文化"]
    },
    {
        name: "內灣老街",
        address: "新竹縣橫山鄉中正路",
        description: "懷舊的鐵道山城，以內灣吊橋、內灣戲院與野薑花粽聞名，是週末親子旅遊的熱門景點。",
        imageUrl: "https://images.unsplash.com/photo-1582260565507-66a704f475da?q=80&w=800",
        rating: "4.3",
        reviewCount: "8,120",
        tags: ["老街", "鐵道", "美食"]
    },
    {
        name: "綠世界生態農場",
        address: "新竹縣北埔鄉大湖村7鄰20號",
        description: "佔地廣大的生態農場，擁有天鵝湖、大探奇區與可愛的草泥馬，適合全家大小親近自然。",
        imageUrl: "https://images.unsplash.com/photo-1551604018-0285a7c29668?q=80&w=800",
        rating: "4.5",
        reviewCount: "6,932",
        tags: ["生態", "親子", "農場"]
    },
    {
        name: "六福村主題遊樂園",
        address: "新竹縣關西鎮仁安里拱子溝60號",
        description: "結合野生動物園與遊樂設施的主題樂園，擁有刺激的笑傲飛鷹與可愛的狐猴互動體驗。",
        imageUrl: "https://images.unsplash.com/photo-1626246473336-7c3093952f1e?q=80&w=800",
        rating: "4.6",
        reviewCount: "12,504",
        tags: ["樂園", "動物", "刺激"]
    },
    {
        name: "小叮噹科學主題樂園",
        address: "新竹縣新豐鄉松柏村康和路199號",
        description: "以科學教育為主題的戶外園區，擁有全台最大的室內滑雪場，寓教於樂的好去處。",
        imageUrl: "https://images.unsplash.com/photo-1550951163-1200bf4e0228?q=80&w=800",
        rating: "4.2",
        reviewCount: "3,100",
        tags: ["科學", "滑雪", "親子"]
    },
    {
        name: "新埔褒忠義民廟",
        address: "新竹縣新埔鎮義民路三段360號",
        description: "北台灣客家人的信仰中心，每年舉辦的義民節祭典是國家級的重要無形文化資產。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Yimin_Temple_20131102.jpg/800px-Yimin_Temple_20131102.jpg",
        rating: "4.7",
        reviewCount: "3,500",
        tags: ["宗教", "文化", "古蹟"]
    },
    {
        name: "The One 南園人文客棧",
        address: "新竹縣新埔鎮九芎湖32號",
        description: "融合江南庭園與閩南建築的古典園林，提供優雅的住宿與文化體驗，環境清幽。",
        imageUrl: "https://www.travel.taipei/d/a/s/2016053110360773_600.jpg",
        rating: "4.5",
        reviewCount: "1,200",
        tags: ["建築", "人文", "休閒"]
    },
    {
        name: "竹北豆腐岩",
        address: "新竹縣竹北市頭前溪畔",
        description: "頭前溪上排列整齊的消波塊，因形狀像豆腐而爆紅，是攝影愛好者拍攝晨昏美景的聖地。",
        imageUrl: "https://images.unsplash.com/photo-1618635836932-d11231f75328?q=80&w=800",
        rating: "4.1",
        reviewCount: "890",
        tags: ["攝影", "自然", "網美"]
    },
    {
        name: "新月沙灘",
        address: "新竹縣竹北市鳳岡路五段155巷",
        description: "形狀如新月的綿延沙灘，沙質細緻，是夏日戲水、觀賞夕陽與挖沙坑的熱門景點。",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
        rating: "4.3",
        reviewCount: "1,450",
        tags: ["海灘", "夕陽", "親子"]
    },
    {
        name: "張學良故居 (清泉溫泉)",
        address: "新竹縣五峰鄉桃山村清泉256-6號",
        description: "少帥張學良曾幽禁於此，館內陳列其生平事蹟；鄰近有清泉溫泉與三毛夢屋，充滿歷史韻味。",
        imageUrl: "https://images.unsplash.com/photo-1509653087866-91f6c2ab5e47?q=80&w=800",
        rating: "4.4",
        reviewCount: "2,100",
        tags: ["歷史", "溫泉", "文化"]
    },
    {
        name: "青蛙石天空步道",
        address: "新竹縣尖石鄉錦屏道路",
        description: "懸空於溪谷之上的玻璃步道，可近距離欣賞巨大的青蛙石與壯麗飛瀑，視覺效果震撼。",
        imageUrl: "https://images.unsplash.com/photo-1463131379965-f93d142f9b2d?q=80&w=800",
        rating: "4.2",
        reviewCount: "1,800",
        tags: ["步道", "自然", "景觀"]
    },
    {
        name: "新竹都城隍廟",
        address: "新竹市北區中山路75號",
        description: "全台位階最高的城隍廟，廟埕周邊聚集了米粉、貢丸、潤餅等在地小吃，香火鼎盛。",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Hsinchu_City_God_Temple_Front_View_20190623.jpg/800px-Hsinchu_City_God_Temple_Front_View_20190623.jpg",
        rating: "4.6",
        reviewCount: "18,200",
        tags: ["宗教", "美食", "古蹟"]
    },
    {
        name: "17公里海岸線",
        address: "新竹市北區海濱路173號",
        description: "北台灣著名的自行車道，沿途經過南寮漁港、香山濕地與賞蟹步道，風光旖旎。",
        imageUrl: "https://images.unsplash.com/photo-1579290076159-0062a40b8a4f?q=80&w=800",
        rating: "4.5",
        reviewCount: "5,400",
        tags: ["單車", "海景", "運動"]
    },
    {
        name: "香山濕地賞蟹步道",
        address: "新竹市香山區中華路五段320巷35號",
        description: "蜿蜒於潮間帶的心形步道，退潮時可觀察萬千招潮蟹，夕陽時分更是絕美。",
        imageUrl: "https://images.unsplash.com/photo-1623861214316-2d338ce10582?q=80&w=800",
        rating: "4.4",
        reviewCount: "3,200",
        tags: ["生態", "夕陽", "步道"]
    }
];

// --- Helper: Build File Map ---
// Same recursive walker as before, or use cached map if possible.
// For simplicity, we assume generic walker is robust.
function buildVillageMap(): Map<string, string> {
    const map = new Map<string, string>();
    function walk(dir: string, segments: string[]) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                walk(path.join(dir, item.name), [...segments, item.name]);
            } else if (item.name === 'wiki.json') {
                if (segments.length >= 3) {
                    const county = segments[0];
                    const town = segments[1];
                    const village = segments[2];
                    const key = `${county}_${town}_${village}`;
                    map.set(key, path.join(dir, item.name));
                }
            }
        }
    }
    walk(LOCAL_DB_PATH, []);
    return map;
}

// --- Main ---

async function run() {
    console.log("🚀 Injecting Travel Spots...");
    const villageMap = buildVillageMap();
    let injectedCount = 0;

    for (const spot of TRAVEL_SPOTS_SOURCE) {
        console.log(`\n📍 Processing: ${spot.name}`);

        // 1. Resolve Address
        let villageKey = null;
        let coordinates: [number, number] | null = null;
        try {
            const result = await resolveAddressToVillage(spot.address);
            if (result) {
                villageKey = `${result.county}_${result.town}_${result.village}`;
                coordinates = [result.lat, result.lon];
                console.log(`   Mapped to: ${villageKey}`);
            } else {
                console.warn(`   [Warn] Could not resolve address: ${spot.address}`);
            }
        } catch (e) {
            console.error("   Geocode Error:", e);
        }

        // 2. Inject
        if (villageKey && villageMap.has(villageKey)) {
            const wikiPath = villageMap.get(villageKey)!;
            try {
                let wiki: VillageWiki = {};
                try {
                    wiki = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
                } catch (e) { }

                if (!wiki.travelSpots) wiki.travelSpots = [];

                // Dedupe - Remove existing if name matches to ensure update
                const existingIndex = wiki.travelSpots.findIndex(s => s.name === spot.name);
                if (existingIndex !== -1) {
                    wiki.travelSpots.splice(existingIndex, 1); // Remove old to update
                }

                if (coordinates) {
                    const newSpot: TravelSpot = {
                        id: `travel_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        name: spot.name,
                        description: spot.description,
                        imageUrl: spot.imageUrl,
                        rating: spot.rating,
                        reviewCount: spot.reviewCount,
                        location: coordinates, // Coordinates!
                        address: spot.address,
                        tags: spot.tags
                    };

                    wiki.travelSpots.push(newSpot);
                    fs.writeFileSync(wikiPath, JSON.stringify(wiki, null, 2));
                    console.log(`   ✅ Injected into ${wikiPath}`);
                    injectedCount++;
                } else {
                    console.warn(`   ⚠️ Skipping ${spot.name} - No Coordinates`);
                }

            } catch (e) {
                console.error("   Write Error:", e);
            }
        } else {
            console.error(`   ❌ Target Village Wiki Not Found for key: ${villageKey}`);
        }
    }

    console.log(`\n✨ Done! Injected ${injectedCount} travel spots.`);
}

run();
