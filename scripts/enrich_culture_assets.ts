
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GENERATED_COMMUNITIES } from '../data/generated_communities';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_FILE = join(__dirname, '../data/culture_assets_enriched.json');
const CHIEF_LOCATIONS_FILE = join(__dirname, '../data/chief_office_locations.json');
const DELAY_MS = 1100;

// Load Chief Locations
let CHIEF_LOCATIONS: Record<string, [number, number]> = {};
if (fs.existsSync(CHIEF_LOCATIONS_FILE)) {
    CHIEF_LOCATIONS = JSON.parse(fs.readFileSync(CHIEF_LOCATIONS_FILE, 'utf-8'));
}

interface RawAsset {
    name: string;
    type: string;
    description: string;
    searchQuery: string; // "Name City"
    city: string; // Force match city
    district?: string; // Optional preferred district
}

const ASSETS: RawAsset[] = [
    { name: "竹塹城迎曦門", type: "historic_site", description: "新竹之心，國定古蹟，清代竹塹城僅存之城門。", searchQuery: "新竹市 竹塹城迎曦門", city: "新竹市", district: "東區" },
    { name: "新竹火車站", type: "historic_site", description: "國定古蹟，巴洛克風格建築，全台最古老之現役火車站。", searchQuery: "新竹市 新竹火車站", city: "新竹市", district: "東區" },
    { name: "新竹州廳", type: "historic_site", description: "國定古蹟，和洋混合風格，現為新竹市政府。", searchQuery: "新竹市 新竹市政府", city: "新竹市", district: "北區" },
    { name: "新竹都城隍廟", type: "temple", description: "市定古蹟，全台位階最高的城隍廟，香火鼎盛。", searchQuery: "新竹市 新竹都城隍廟", city: "新竹市", district: "北區" },
    { name: "新竹關帝廟", type: "temple", description: "市定古蹟，主祀關聖帝君，建築莊嚴。", searchQuery: "新竹市 新竹關帝廟", city: "新竹市", district: "東區" },
    { name: "新竹長和宮", type: "temple", description: "市定古蹟，供奉媽祖，為北門街上重要信仰中心。", searchQuery: "新竹市 長和宮", city: "新竹市", district: "北區" },
    { name: "新竹鄭氏家廟", type: "historic_building", description: "市定古蹟，鄭用錫後代所建，具有宗族文化價值。", searchQuery: "新竹市 鄭氏家廟", city: "新竹市", district: "北區" },
    { name: "新竹金山寺", type: "temple", description: "市定古蹟，位於科學園區旁，供奉觀世音菩薩。", searchQuery: "新竹市 金山寺", city: "新竹市", district: "東區" },
    { name: "張氏節孝坊", type: "historic_site", description: "市定古蹟，表彰張氏貞節牌坊。", searchQuery: "新竹市 張氏節孝坊", city: "新竹市", district: "北區" },
    { name: "蘇氏節孝坊", type: "historic_site", description: "市定古蹟，位於湳雅街。", searchQuery: "新竹市 蘇氏節孝坊", city: "新竹市", district: "北區" },
    { name: "楊氏節孝坊", type: "historic_site", description: "市定古蹟，位於石坊街，保存完整。", searchQuery: "新竹市 楊氏節孝坊", city: "新竹市", district: "北區" },
    { name: "李錫金孝子坊", type: "historic_site", description: "市定古蹟，全台唯一孝子坊。", searchQuery: "新竹市 李錫金孝子坊", city: "新竹市", district: "東區" },
    { name: "新竹水仙宮", type: "temple", description: "市定古蹟，位於長和宮旁，供奉水仙尊王。", searchQuery: "新竹市 水仙宮", city: "新竹市", district: "北區" },
    { name: "新竹神社殘蹟", type: "historic_site", description: "市定古蹟，保留部分神社遺跡，現為移民署收容所附近。", searchQuery: "新竹市 新竹神社", city: "新竹市", district: "北區" },
    { name: "新竹信用組合", type: "historic_building", description: "市定古蹟，日治時期金融建築，現為第一信用合作社。", searchQuery: "新竹市 新竹信用組合", city: "新竹市", district: "東區" },
    { name: "新竹州圖書館", type: "cultural_asset", description: "市定古蹟，洋式建築，曾為新光人壽資產，現已修復開放。", searchQuery: "新竹市 新竹州圖書館", city: "新竹市", district: "東區" },
    { name: "新竹專賣局", type: "historic_building", description: "市定古蹟，台灣菸酒公司新竹營業所。", searchQuery: "新竹市 新竹專賣局", city: "新竹市", district: "東區" },
    { name: "新竹市役所", type: "historic_building", description: "市定古蹟，紅磚建築，現為新竹市美術館。", searchQuery: "新竹市 新竹市美術館", city: "新竹市", district: "北區" },
    { name: "新竹高中劍道館", type: "historic_building", description: "市定古蹟，全台唯一保留之武道館建築。", searchQuery: "新竹市 新竹高中劍道館", city: "新竹市", district: "東區" },
    { name: "香山火車站", type: "historic_site", description: "市定古蹟，全台唯一入母屋造式檜木車站。", searchQuery: "新竹市 香山火車站", city: "新竹市", district: "香山區" },
    { name: "辛志平校長故居", type: "historic_building", description: "市定古蹟，日式宿舍建築，紀念辛志平校長。", searchQuery: "新竹市 辛志平校長故居", city: "新竹市", district: "東區" },
    { name: "新竹水道取水口", type: "historic_site", description: "市定古蹟，日治時期水道設施，現為展示館。", searchQuery: "新竹市 水道取水口展示館", city: "新竹市", district: "東區" },
    { name: "新竹水道水源地", type: "historic_site", description: "市定古蹟，位於新竹公園附近。", searchQuery: "新竹市 水源街 水源地", city: "新竹市", district: "東區" },
    { name: "香山天后宮", type: "temple", description: "歷史建築，香山地區重要信仰中心。", searchQuery: "新竹市 香山天后宮", city: "新竹市", district: "香山區" },
    { name: "竹蓮寺", type: "temple", description: "歷史建築，新竹著名觀音亭，香火極盛。", searchQuery: "新竹市 竹蓮寺", city: "新竹市", district: "東區" },
    { name: "內天后宮", type: "temple", description: "歷史建築，俗稱內媽祖。", searchQuery: "新竹市 內天后宮", city: "新竹市", district: "北區" },
    { name: "新竹市孔廟", type: "historic_site", description: "歷史建築，位於新竹公園內，儒家文化中心。", searchQuery: "新竹市 孔廟", city: "新竹市", district: "東區" },
    { name: "六燃新竹支廠", type: "historic_site", description: "歷史建築，二戰遺構，大煙囪為醒目地標。", searchQuery: "新竹市 大煙囪廠房", city: "新竹市", district: "東區" },
    { name: "有樂館", type: "cultural_asset", description: "歷史建築，全台首座有冷氣之戲院，現為影像博物館。", searchQuery: "新竹市 影像博物館", city: "新竹市", district: "東區" },
    { name: "新竹公會堂", type: "cultural_asset", description: "歷史建築，現為國立新竹生活美學館。", searchQuery: "新竹市 生活美學館", city: "新竹市", district: "東區" }
];

async function geocodeAddress(address: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'http://localhost:3000'
            }
        });
        const text = await response.text();
        const data = JSON.parse(text);
        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
    } catch (error) {
        console.error(`Error geocoding ${address}:`, error);
    }
    return null;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('🏛️  Starting Cultural Asset Enrichment (v2)...');
    const result = [];

    // Filter communities to Hsinchu City/County mostly
    // Pre-process communities to have valid locations (prefer Chief Locations)
    const validCommunities = GENERATED_COMMUNITIES.map(c => {
        const chiefLoc = CHIEF_LOCATIONS[c.id];
        return {
            ...c,
            // Use chief location, fall back to c.location
            effectiveLocation: chiefLoc || c.location
        };
    }).filter(c => c.effectiveLocation && c.effectiveLocation[0] !== 0);

    let i = 0;
    for (const asset of ASSETS) {
        i++;
        console.log(`[${i}/${ASSETS.length}] Processing ${asset.name}...`);

        let coords = await geocodeAddress(asset.searchQuery);

        // Hsinchu Bounding Box Check (Approx)
        // Lat: 24.6 ~ 25.0
        // Lon: 120.8 ~ 121.3
        if (coords) {
            if (coords[0] < 24.6 || coords[0] > 25.0 || coords[1] < 120.8 || coords[1] > 121.3) {
                console.warn(`   ⚠️  Coords out of bounds for ${asset.name}: ${coords}. Discarding.`);
                coords = null;
            }
        }

        if (!coords) {
            console.warn(`   ❌ Geocode failed/invalid for ${asset.searchQuery}, trying simplified...`);
            const simple = asset.name;
            await sleep(DELAY_MS);
            const retryQ = `新竹市 ${simple}`; // Force City
            coords = await geocodeAddress(retryQ);

            // Check bounds again
            if (coords) {
                if (coords[0] < 24.6 || coords[0] > 25.0 || coords[1] < 120.8 || coords[1] > 121.3) {
                    console.warn(`   ⚠️  Coords out of bounds for retry ${retryQ}: ${coords}. Discarding.`);
                    coords = null;
                }
            }
        }

        if (coords) {
            console.log(`   ✅ Found: ${coords[0]}, ${coords[1]}`);

            // Find closest community within the SAME CITY
            let closestId = '';
            let minDist = Infinity;

            // Filter candidates by asset.city to avoid cross-city assignment errors
            const candidates = validCommunities.filter(c => c.city === asset.city);

            // If asset has district preference, prioritize or only search there? 
            // Let's just search all in city, but maybe give weight to district?
            // For now, simple distance.

            for (const c of candidates) {
                const dist = getDistanceFromLatLonInKm(coords[0], coords[1], c.effectiveLocation[0], c.effectiveLocation[1]);
                if (dist < minDist) {
                    minDist = dist;
                    closestId = c.id;
                }
            }

            if (closestId) {
                const assignedC = validCommunities.find(c => c.id === closestId);
                console.log(`   📍 Assigned to: ${closestId} (${assignedC?.district}) (Dist: ${minDist.toFixed(3)}km)`);

                result.push({
                    ...asset,
                    location: coords,
                    communityId: closestId,
                    id: `cult-${i}`
                });
            } else {
                console.error(`   💀 No valid community found in ${asset.city} for ${asset.name}`);
            }

        } else {
            console.error(`   💀 GAVE UP on ${asset.name}`);
        }

        await sleep(DELAY_MS);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`\n🎉 Done! Saved ${result.length} assets to ${OUTPUT_FILE}`);
}

main().catch(console.error);
