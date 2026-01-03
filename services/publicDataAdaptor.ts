import { getAllVillageRecords } from './localDatabase';
import { PublicCommunity, PublicProject, PublicEvent, PublicPerson, MOCK_COMMUNITIES } from '../data/mock_public';
import { calculatePolygonCentroid } from './geoUtils';
// Imports removed to prevent bundling large JSONs
// import villageGeoData from '../data/public_hsinchu_villages.json';
// import villageCityGeoData from '../data/public_hsinchu_city_villages.json';

// Type definition for the imported GeoJSON
interface GeoJSONFeature {
    type: string;
    properties: {
        VILLCODE: string;
        COUNTYNAME: string;
        TOWNNAME: string;
        VILLNAME: string;
        VILLENG: string;
        [key: string]: any;
    };
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: any[];
    };
}

// Helper to flip coordinates from [lng, lat] (GeoJSON) to [lat, lng] (Leaflet)
// and flatten MultiPolygon to the largest Polygon for simplicity (or keep as MultiPolygon structure if Leaflet supports it)
// Leaflet supports MultiPolygon as [ [[lat,lng],..], [[lat,lng],..] ] (Array of Polygons)
// Coordinates in GeoJSON MultiPolygon: [ [ [lng,lat],... ], ... ] (Array of Polygons, where Polygon is Array of Rings)
const processGeometry = (geometry: any): { boundary: [number, number][], center: [number, number] } => {
    let coords: [number, number][] = [];

    if (geometry.type === 'Polygon') {
        // Polygon: [ [lng, lat], ... ] (Outer ring is index 0)
        coords = geometry.coordinates[0].map((p: any) => [p[1], p[0]]);
    } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon: Find largest polygon by length as primary boundary for prototype simplicity
        // Or specific logic. For now, take the first polygon's outer ring.
        // Usually index 0 is the main landmass.
        coords = geometry.coordinates[0][0].map((p: any) => [p[1], p[0]]);
    }

    const center = calculatePolygonCentroid(coords);
    return { boundary: coords, center };
};

export const getPublicCommunities = async (): Promise<PublicCommunity[]> => {
    try {
        const dbRecords = await getAllVillageRecords();
        // Fetch data at runtime
        const [villageGeoData, villageCityGeoData] = await Promise.all([
            fetch('/data/public_hsinchu_villages.json').then(res => res.json()),
            fetch('/data/public_hsinchu_city_villages.json').then(res => res.json())
        ]);

        const features = [
            ...(villageGeoData as any).features,
            ...(villageCityGeoData as any).features
        ] as GeoJSONFeature[];

        const communities: PublicCommunity[] = features.map(feature => {
            const props = feature.properties;
            const town = props.TOWNNAME;
            const village = props.VILLNAME;
            const county = props.COUNTYNAME;
            const id = `${county}_${town}_${village}`;

            // 1. Geometry Processing
            const { boundary, center } = processGeometry(feature.geometry);

            // 2. Find in DB
            const record = dbRecords.find(r => r.id === id);

            // 3. Find in Mock Data (for nice photos/descriptions if not in DB)
            const mock = MOCK_COMMUNITIES.find(m => m.name === village && m.district === town) ||
                MOCK_COMMUNITIES.find(m => m.name === village); // Relaxed match

            // Base Object
            let comm: PublicCommunity = {
                id: id,
                name: village,
                city: props.COUNTYNAME,
                district: town,
                location: center, // Real centroid
                boundary: boundary, // Real boundary
                description: `位於${props.COUNTYNAME}${town}的${village}。`,
                tags: [],
                projects: [],
                events: [],
                people: [],

                // Deep Wiki Fields (Default)
                chief: undefined,
                population: undefined,
                schools: [],
                facilities: [],
                ngos: [],
                faithCenters: [],
                travelSpots: [],
                communityBuildings: [],
                cultureHeritages: []
            };

            // Merge DB Data (Priority 1)
            if (record) {
                // ... (Logic to extract from DB markdown - simplified copy from previous)
                const lines = record.result.markdown.split('\n');
                const summary = lines.find(l => l.length > 20 && !l.startsWith('#')) || comm.description;

                const findValue = (label: string) => {
                    const line = lines.find(l => l.includes(`${label}**`) || l.includes(`${label}：`));
                    return line ? line.split('：')[1]?.trim() || line.split(':')[1]?.trim() : undefined;
                };
                const findListItems = (header: string) => {
                    const startIdx = lines.findIndex(l => l.includes(header));
                    if (startIdx === -1) return [];
                    const items = [];
                    for (let i = startIdx + 1; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.startsWith('#')) break;
                        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            const content = line.replace(/^[-*]\s*/, '').trim();
                            if (content && !content.includes("無")) items.push(content.replace(/\*\*/g, ''));
                        }
                    }
                    return items;
                };

                comm.description = summary.slice(0, 100) + "...";
                comm.chief = findValue("村里長") || comm.chief;
                comm.population = findValue("人口結構") || comm.population;

                // Clear AI-indexed facilities as per user request to avoid duplication.
                // These will be replaced by the wiki.facilities from generated data below.
                comm.facilities = [];
                comm.schools = [];

                comm.tags = ["AI分析", ...comm.tags];

                // Merge Wiki Data from Mock/Generated if available (to get Facilities, etc.)
                if (mock && mock.wiki) {
                    comm.wiki = {
                        ...mock.wiki,
                        // Ensure facilities and association from mock (GENERATED_COMMUNITIES) are used
                        facilities: mock.wiki.facilities || [],
                        association: mock.wiki.association
                    };
                }

                // If we also have DB facilities, we might want to merge them, 
                // but the user requested to CLEAR AI index, so we should prefer the wiki.facilities (empty)
                // if it came from our clean local_db.
                // Merge Mock Data (Priority 2, but effectively Priority 1 for static/generated content)
            } else if (mock) {
                // Copy ALL expanded fields from generated/mock data
                comm.description = mock.description || comm.description;
                comm.tags = [...comm.tags, ...(mock.tags || [])];

                // Content Arrays
                comm.projects = mock.projects || [];
                comm.events = mock.events || [];
                comm.travelSpots = mock.travelSpots || [];
                comm.communityBuildings = mock.communityBuildings || [];
                comm.cultureHeritages = mock.cultureHeritages || [];
                comm.careActions = mock.careActions || [];

                // Wiki & Administrative Data
                if (mock.wiki) {
                    comm.wiki = mock.wiki;
                    // Provide top-level fallbacks if needed, but UI should prefer wiki object
                    comm.population = mock.population || mock.wiki.population?.toString();
                    comm.chief = mock.chief || mock.wiki.chief?.name;
                } else {
                    comm.population = mock.population;
                    comm.chief = mock.chief;
                }

                // Keep Real Location/Boundary though!
            }

            // --- AUTO-GENERATE MOCK CONTENT FOR DEMO (If empty) ---
            if (comm.travelSpots.length === 0) {
                comm.travelSpots.push({
                    id: `travel_${comm.id}`,
                    name: `${comm.name}私房景點 (AI推薦)`,
                    description: `[AI自動生成遊程預覽]\n探索${comm.name}的隱藏秘境，感受${comm.district}的獨特風情。此處適合午後散步與拍照。\n\n🔗 [Google Map 導航](#)\n🔗 [部落格遊記連結](#)`,
                    location: [comm.location[0] + 0.002, comm.location[1] + 0.002],
                    tags: ["輕旅行", "打卡熱點"],
                    photo: "https://images.unsplash.com/photo-1542051841857-5f90071e7989"
                });
            }

            if (comm.events.length === 0) {
                comm.events.push({
                    id: `evt_${comm.id}`,
                    title: `${comm.name}週末市集`,
                    date: "2024-12-25",
                    time: "09:00",
                    location: `${comm.name}集會所廣場`,
                    description: `[即時活動]\n本週${comm.name}舉辦社區交流市集，歡迎共襄盛舉。\n\n🔗 [活動報名連結](#)`,
                    type: "market"
                });
            }

            if (comm.communityBuildings.length === 0) {
                comm.communityBuildings.push({
                    id: `bld_${comm.id}`,
                    name: `${comm.name}社區活動中心`,
                    description: `[地方建設]\n本社區重要的公共活動空間，提供長輩照護與青少年共學課程。`,
                    category: 'care_center',
                    location: [comm.location[0] - 0.002, comm.location[1] + 0.002],
                    tags: ["公共空間", "長輩照顧"]
                });
            }

            if (comm.cultureHeritages.length === 0) {
                comm.cultureHeritages.push({
                    id: `cul_${comm.id}`,
                    name: `${comm.name}百年伯公廟`,
                    description: `[文化資產]\n見證社區開發超過百年的歷史建築，是居民信仰的中心與情感連結。`,
                    category: 'temple',
                    location: [comm.location[0] + 0.002, comm.location[1] - 0.002],
                    tags: ["信仰中心", "歷史建築"]
                });
            }

            return comm;
        });

        return communities;

    } catch (error) {
        console.error("Failed to load public data:", error);
        return MOCK_COMMUNITIES;
    }
};

export const getPublicCommunity = async (id: string): Promise<PublicCommunity | undefined> => {
    const all = await getPublicCommunities();
    return all.find(c => c.id === id);
};

// --- TOWNSHIP DATA ---
// Imports removed
// import townshipGeoData from '../data/public_hsinchu_townships.json';
// import townshipCityGeoData from '../data/public_hsinchu_city_townships.json';

export interface PublicTownship {
    id: string; // e.g. "新竹縣_竹北市"
    name: string; // e.g. "竹北市"
    city: string; // e.g. "新竹縣"
    location: [number, number]; // Centroid
    boundary: [number, number][]; // Polygon geometry
}

export const getPublicTownships = async (): Promise<PublicTownship[]> => {
    try {
        const [townshipGeoData, townshipCityGeoData] = await Promise.all([
            fetch('/data/public_hsinchu_townships.json').then(res => res.json()),
            fetch('/data/public_hsinchu_city_townships.json').then(res => res.json())
        ]);

        const features = [
            ...(townshipGeoData as any).features,
            ...(townshipCityGeoData as any).features
        ] as GeoJSONFeature[];
        return features.map(feature => {
            const props = feature.properties;
            const { boundary, center } = processGeometry(feature.geometry);

            return {
                id: `${props.COUNTYNAME}_${props.TOWNNAME}`,
                name: props.TOWNNAME,
                city: props.COUNTYNAME,
                location: center,
                boundary: boundary
            };
        });
    } catch (error) {
        console.error("Failed to load townships:", error);
        return [];
    }
};
