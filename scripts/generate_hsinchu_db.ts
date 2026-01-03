
import * as fs from 'fs';
import * as path from 'path';
import { HSINCHU_REGION_DATA } from '../src/data/hsinchu_administrative_data';

// --- Configuration ---
// Base output directory for the local database
const OUTPUT_BASE = path.resolve('data/local_db');

// --- INTERFACES (Mirrors mock_public.ts & fetch_open_data.ts) ---
// We use 'any' here for simplicity in generation, but the structure matches the strict types.

// --- MOCK DATA TEMPLATES (Factories) ---
const createWiki = (city: string, district: string, village: string) => ({
    introduction: `本社區(${village})位於${city}${district}，擁有獨特的風土民情。這裡是居民安居樂業的好地方，融合了傳統文化與現代生活的便利。`,
    population: Math.floor(Math.random() * 5000) + 1000,
    area: "2.5 sq km",
    features: ["社區公園", "便利交通", "友善鄰里"],
    chief: {
        name: "待填寫",
        phone: "03-XXXXXXX",
        officeAddress: `${city}${district}${village}辦公處`,
        officeHours: "週一至週五 08:00-17:00"
    },
    facilities: [
        {
            name: `${village}集會所`,
            type: "activity_center",
            address: `${city}${district}${village}XX號`,
            description: "提供居民聚會、研習活動使用。",
            openingHours: "08:00-21:00"
        }
    ]
});

const createCulture = (city: string, district: string, village: string) => ([
    {
        name: `${village}福德宮`,
        category: "temple",
        location: [24.8 + (Math.random() * 0.1), 120.9 + (Math.random() * 0.1)],
        address: `${city}${district}${village}XX街XX號`,
        description: "本里重要的信仰中心，香火鼎盛，守護著鄰里平安。",
        era: "1900年代",
        history: "建立於日治時期，經過多次修繕。",
        tags: ["土地公", "信仰"]
    }
]);

const createTravel = (city: string, district: string, village: string) => ([
    {
        name: `${village}河濱步道`,
        description: "沿著溪流設置的休閒步道，適合散步與騎自行車。",
        location: [24.8 + (Math.random() * 0.1), 120.9 + (Math.random() * 0.1)],
        address: `${city}${district}${village}河堤旁`,
        tags: ["散步", "自然"],
        seasonality: "四季皆宜",
        rating: 4.2
    }
]);

const createEvents = (city: string, district: string, village: string) => ([
    {
        title: `${village}中秋聯歡晚會`,
        date: "2026-09-25",
        time: "18:00",
        location: `${village}集會所前廣場`,
        type: "ceremony",
        description: "一年一度的中秋晚會，備有豐富摸彩品與表演。",
        tags: ["節慶", "聚會"]
    }
]);

const createProjects = (city: string, district: string, village: string) => ([
    {
        title: `${village}排水溝清淤工程`,
        description: "清理主要排水溝渠，預防汛期淹水。",
        what: "清理淤泥、修補破損溝壁。",
        progress: 0,
        status: "planning",
        budget: "50萬",
        owner: "建設課",
        tags: ["防災", "基礎建設"]
    }
]);

const createCare = (city: string, district: string, village: string) => ([
    {
        title: `${village}關懷據點共餐`,
        type: "meal_delivery",
        status: "ongoing",
        description: "每週三提供長者共餐服務，促進長輩交流。",
        beneficiaries: "65歲以上長者",
        owner: "志工隊"
    }
]);


async function main() {
    console.log("🚀 Starting Bulk Generation for Hsinchu Region...");

    // Create base directory
    if (!fs.existsSync(OUTPUT_BASE)) {
        fs.mkdirSync(OUTPUT_BASE, { recursive: true });
    }

    let villageCount = 0;

    for (const cityData of HSINCHU_REGION_DATA) {
        const city = cityData.city;
        console.log(`\n🏙️  Processing ${city}...`);

        for (const districtData of cityData.districts) {
            const district = districtData.name;
            console.log(`  📍 District: ${district} (${districtData.villages.length} villages)`);

            for (const village of districtData.villages) {
                // Construct path: data/local_db/{City}/{District}/{Village}
                const villageDir = path.join(OUTPUT_BASE, city, district, village);

                if (!fs.existsSync(villageDir)) {
                    fs.mkdirSync(villageDir, { recursive: true });
                }

                // Generate 6 Files
                fs.writeFileSync(path.join(villageDir, 'wiki.json'), JSON.stringify(createWiki(city, district, village), null, 2));
                fs.writeFileSync(path.join(villageDir, 'culture.json'), JSON.stringify(createCulture(city, district, village), null, 2));
                fs.writeFileSync(path.join(villageDir, 'travel.json'), JSON.stringify(createTravel(city, district, village), null, 2));
                fs.writeFileSync(path.join(villageDir, 'events.json'), JSON.stringify(createEvents(city, district, village), null, 2));
                fs.writeFileSync(path.join(villageDir, 'projects.json'), JSON.stringify(createProjects(city, district, village), null, 2));
                fs.writeFileSync(path.join(villageDir, 'care.json'), JSON.stringify(createCare(city, district, village), null, 2));

                villageCount++;
            }
        }
    }

    console.log(`\n✅ Generated database for ${villageCount} villages at: ${OUTPUT_BASE}`);
    console.log(`👉 Structure: data/local_db/{City}/{District}/{Village}/{channel}.json`);
}

main().catch(console.error);
