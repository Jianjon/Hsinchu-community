import * as fs from 'fs';
import * as path from 'path';

// Define Interfaces based on mock_public.ts and source JSONs
interface ChiefData {
    city: string;
    district: string;
    village: string;
    chiefName: string;
    phone: string;
    address: string;
}

interface AssociationData {
    name: string;
    address: string;
}

interface WikiData {
    communityName: string;
    villageName: string;
    basicInfo?: any;
    location?: any;
    facilities?: any;
    introduction?: string;
    features?: string[];
    geography?: any;
    type?: string;
}

const DISTRICT_LOCATIONS: Record<string, [number, number]> = {
    "竹北市": [24.8383, 121.0177],
    "竹東鎮": [24.7377, 121.0931],
    "新埔鎮": [24.8291, 121.0728],
    "關西鎮": [24.7944, 121.1764],
    "湖口鄉": [24.9038, 121.0436],
    "新豐鄉": [24.8996, 120.9840],
    "芎林鄉": [24.7744, 121.0792],
    "橫山鄉": [24.7196, 121.1147],
    "北埔鄉": [24.6986, 121.0575],
    "寶山鄉": [24.7610, 120.9874],
    "峨眉鄉": [24.6860, 121.0153],
    "尖石鄉": [24.7067, 121.2023],
    "五峰鄉": [24.6291, 121.1039]
};

// Paths
const DATA_DIR = path.join(__dirname, '../data');
const CHIEFS_PATH = path.join(DATA_DIR, 'hsinchu_county_chiefs.json');
const ASSOCIATIONS_PATH = path.join(DATA_DIR, 'hsinchu_county_associations.json');
const WIKI_PATH = path.join(DATA_DIR, 'community_wiki.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'generated_communities.json');

function loadJson(p: string) {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function main() {
    console.log("Loading data...");
    const chiefs: ChiefData[] = loadJson(CHIEFS_PATH);
    const associations: AssociationData[] = loadJson(ASSOCIATIONS_PATH);
    const existingWiki: WikiData[] = loadJson(WIKI_PATH);

    console.log(`Loaded ${chiefs.length} chiefs, ${associations.length} associations, ${existingWiki.length} wiki entries.`);

    const communities = chiefs.map((chief, index) => {
        const id = `${chief.city}_${chief.district}_${chief.village}`;

        // Find existing wiki data
        // Match by village name (e.g. "斗崙里") or community name
        const wiki = existingWiki.find(w => w.villageName === chief.village || w.communityName.includes(chief.village));

        // Find association
        // Match if association name includes village name
        const assoc = associations.find(a => a.name.includes(chief.village) || (chief.district && a.name.includes(chief.district) && a.address.includes(chief.village)));

        // Determine Location
        // If wiki has location (and not 0,0), use it.
        // Else use District center + small random jitter to avoid stacking
        let location = DISTRICT_LOCATIONS[chief.district] || [24.8, 121.0];
        if (wiki && wiki.location && wiki.location.lat !== 0) {
            location = [wiki.location.lat, wiki.location.lng];
        } else {
            // Jitter
            location = [
                location[0] + (Math.random() - 0.5) * 0.02,
                location[1] + (Math.random() - 0.5) * 0.02
            ];
        }

        // Construct PublicCommunity object (matching mock_public.ts structure)
        return {
            id: id,
            name: chief.village,
            city: chief.city,
            district: chief.district,
            description: wiki?.introduction ? wiki.introduction.substring(0, 50) + "..." : `${chief.district}${chief.village}的社區介紹。`,
            tags: wiki?.features || [`${chief.district}`],
            location: location,

            // Wiki Data
            wiki: {
                introduction: wiki?.introduction || `${chief.district}${chief.village}是一個優美的社區...`,
                population: wiki?.basicInfo?.population || 1000,
                area: wiki?.geography?.area || "N/A",
                type: wiki?.type || "mixed",
                chief: {
                    name: chief.chiefName,
                    phone: chief.phone,
                    officeAddress: chief.address,
                    officeHours: "09:00-17:00"
                },
                association: assoc ? {
                    chairman: "理事長", // Missing in JSON, using placeholder
                    contact: "請洽活動中心",
                    address: assoc.address
                } : undefined,
                facilities: wiki?.facilities?.generated || [],
                features: wiki?.features || []
            },

            // Default arrays
            projects: [],
            events: [],
            people: [],
            travelSpots: [],
            communityBuildings: [],
            cultureHeritages: []
        };
    });

    console.log(`Generated ${communities.length} community entries.`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(communities, null, 2), 'utf-8');
    console.log(`Saved to ${OUTPUT_PATH}`);
}

main();
