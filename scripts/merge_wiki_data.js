import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISTRICT_LOCATIONS = {
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
// County Data
const HSINCHU_COUNTY_CHIEFS_PATH = path.join(DATA_DIR, 'hsinchu_county_chiefs.json');
const HSINCHU_COUNTY_ASSOCIATIONS_PATH = path.join(DATA_DIR, 'hsinchu_county_associations.json');
// City Data
const HSINCHU_CITY_CHIEFS_PATH = path.join(DATA_DIR, 'hsinchu_city_chiefs.json');
const HSINCHU_CITY_ASSOCIATIONS_PATH = path.join(DATA_DIR, 'public_hsinchu_city_associations.json');
const HSINCHU_CITY_VILLAGES_PATH = path.join(DATA_DIR, 'public_hsinchu_city_villages.json');
const FETCHED_FACILITIES_PATH = path.join(DATA_DIR, 'fetched_facilities.json');
const ENRICHED_POPULATION_PATH = path.join(DATA_DIR, 'enriched_population.json');

const WIKI_PATH = path.join(DATA_DIR, 'community_wiki.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'generated_communities.json');

function loadJson(p) {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// Global variable for population data
let enrichedPopulation = {};

// Helper: Calculate Polygon Area (Approximate in sq km)
function calculatePolygonArea(geometry) {
    if (!geometry) return "N/A";

    let coordinates = [];
    if (geometry.type === 'Polygon') {
        coordinates = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
        // Sum area of all polygons
        let totalArea = 0;
        for (const poly of geometry.coordinates) {
            totalArea += calculateRingArea(poly[0]);
        }
        return totalArea.toFixed(2);
    } else {
        return "N/A";
    }

    const area = calculateRingArea(coordinates);
    return area.toFixed(2);
}

function calculateRingArea(coords) {
    let area = 0;
    if (coords.length < 3) return 0;

    // Simple projection: Convert to meters
    // 1 deg Lat ~= 110.574 km
    // 1 deg Lon ~= 111.320 * cos(lat) km
    const R = 6378137; // Earth Radius meters

    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];

        // Convert to radians
        const lat1 = p1[1] * Math.PI / 180;
        const lat2 = p2[1] * Math.PI / 180;
        const lon1 = p1[0] * Math.PI / 180;
        const lon2 = p2[0] * Math.PI / 180;

        // Spherical Excess or simple approximation?
        // Let's use simple Shoelace on projected plan for this small scale
        const x1 = (lon1 - lon2) * Math.cos((lat1 + lat2) / 2);
        const y1 = (lat1 - lat2);

        // Actually, let's use a standard implementation for "WGS84 Polygon Area"
        // Use a simplified version often found in GIS:
        // Area = R^2 * |sum( (lon2 - lon1) * (2 + sin(lat1) + sin(lat2)) ) / 2|
        // This is for spherical.

        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2); // Sq meters
    return area / 1000000; // Sq km
}

// Manual Descriptions (Simulating Wiki Enrichment)
const MANUAL_DESCRIPTIONS = {
    "竹東鎮_雞林里": "雞林里位於竹東鎮中心，因昔日盛產雞油樹而得名。這裡是竹東鎮行政中心所在，鎮公所與中央市場皆位於此，商業活動繁榮，是鎮內最熱鬧的區域之一。",
    "五峰鄉_花園村": "花園村（Mayhoman）位於五峰鄉深山，素有「後花園」之美譽。村落主要由泰雅族與賽夏族組成，擁有壯麗的梅后蔓瀑布與豐富的自然生態，是著名的露營與避暑勝地。"
};

// Helper: Point in Polygon (Ray Casting)
function isPointInPolygon(point, vs) {
    // point = [lat, lng], vs = [[lng, lat], ...] (GeoJSON uses lng, lat)
    // We need to standardize. Let's assume point is [lat, lng]. GeoJSON ring is [lng, lat].
    const x = point[1], y = point[0]; // x=lng, y=lat

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Helper to calculate centroid from Polygon coordinates
function getCentroid(geometry) {
    if (!geometry || !geometry.coordinates) return null;

    let ring;
    if (geometry.type === 'Polygon') {
        ring = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
        ring = geometry.coordinates[0][0]; // Take first polygon of multipolygon
    } else {
        return null;
    }

    if (!ring || ring.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const p of ring) {
        if (p[0] < minX) minX = p[0]; // lng
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1]; // lat
        if (p[1] > maxY) maxY = p[1];
    }
    return [(minY + maxY) / 2, (minX + maxX) / 2]; // [lat, lng]
}

async function main() {
    console.log("Loading data...");

    // Load County Data
    const hsinchuCountyChiefs = loadJson(HSINCHU_COUNTY_CHIEFS_PATH);
    const hsinchuCountyAssociations = loadJson(HSINCHU_COUNTY_ASSOCIATIONS_PATH);

    // Load City Data
    const hsinchuCityChiefs = loadJson(HSINCHU_CITY_CHIEFS_PATH);
    const hsinchuCityAssociations = loadJson(HSINCHU_CITY_ASSOCIATIONS_PATH);
    const hsinchuCityVillagesGeo = loadJson(HSINCHU_CITY_VILLAGES_PATH); // FeatureCollection

    if (fs.existsSync(ENRICHED_POPULATION_PATH)) {
        enrichedPopulation = JSON.parse(fs.readFileSync(ENRICHED_POPULATION_PATH, 'utf-8'));
        console.log(`Loaded Population Data for ${Object.keys(enrichedPopulation).length} villages.`);
    }

    let fetchedFacilities = [];
    if (fs.existsSync(FETCHED_FACILITIES_PATH)) {
        fetchedFacilities = JSON.parse(fs.readFileSync(FETCHED_FACILITIES_PATH, 'utf-8'));
    }

    const existingWiki = loadJson(WIKI_PATH);

    console.log(`Loaded County: ${hsinchuCountyChiefs.length} chiefs`);
    console.log(`Loaded City: ${hsinchuCityChiefs.length} chiefs, ${hsinchuCityAssociations.length} associations`);

    // 1. Process County
    const countyCommunities = hsinchuCountyChiefs.map((chief) => {
        const id = `${chief.city}_${chief.district}_${chief.village}`;
        const wiki = existingWiki.find(w => w.villageName === chief.village || (w.communityName && w.communityName.includes(chief.village)));
        const assoc = hsinchuCountyAssociations.find(a => a.name.includes(chief.village) || (chief.district && a.name.includes(chief.district) && a.address.includes(chief.village)));

        let location = DISTRICT_LOCATIONS[chief.district] || [24.8, 121.0];
        if (wiki && wiki.location && wiki.location.lat && wiki.location.lat !== 0) {
            location = [wiki.location.lat, wiki.location.lng];
        } else {
            location = [
                location[0] + (Math.random() - 0.5) * 0.02,
                location[1] + (Math.random() - 0.5) * 0.02
            ];
        }

        return createCommunityObject(id, chief, wiki, assoc, location);
    });

    // 2. Process City (Based on Associations mostly, but we have Chiefs partial list)
    // Strategy: Iterate City Associations to get full list of villages? Or Iterate GeoJSON?
    // GeoJSON is most complete list of villages (122 expected).

    // 2. Process City
    const cityFeatures = hsinchuCityVillagesGeo.features || [];
    const cityCommunities = cityFeatures.map(feature => {
        const props = feature.properties;
        const villageName = props.VILLNAME; // e.g. "南門里"
        const districtName = props.TOWNNAME; // e.g. "東區"
        const city = props.COUNTYNAME; // "新竹市"
        // Generate ID
        const cityPrefix = city === "新竹市" ? "新竹市" : "新竹縣";
        const id = `${cityPrefix}_${districtName}_${villageName}`;
        const uniqueKey = `${districtName}_${villageName}`;

        // Lookup Chief
        const chiefKey = `${districtName}_${villageName}`;
        const chiefData = hsinchuCityChiefs.find(c => c.village === villageName && c.district === districtName) || {
            city: city,
            district: districtName,
            village: villageName,
            chiefName: "待補",
            phone: "",
            address: ""
        };

        // Find Association
        const assoc = hsinchuCityAssociations.find(a => a.address.includes(villageName) || a.name.includes(villageName));

        // Find Wiki (unlikely for City yet)
        const wiki = existingWiki.find(w => w.villageName === villageName);

        // Location from GeoJSON
        let location = getCentroid(feature.geometry);
        if (!location) location = [24.8, 120.97]; // Fallback Hsinchu City center
        const geometry = feature.geometry;

        // Find Facilities in this Polygon (Precise)
        const localFacilities = fetchedFacilities.filter(f => {
            if (!geometry) return false;
            let coords = geometry.coordinates;
            // Handle Polygon and MultiPolygon
            if (geometry.type === 'Polygon') {
                return isPointInPolygon(f.location, coords[0]);
            } else if (geometry.type === 'MultiPolygon') {
                return coords.some(poly => isPointInPolygon(f.location, poly[0]));
            }
            return false;
        });

        // If no precise match, fallback to name matching
        if (localFacilities.length === 0) {
            const nameBased = fetchedFacilities.filter(f => f.name.includes(villageName) || f.address.includes(villageName));
            nameBased.forEach(f => {
                if (!localFacilities.find(lf => lf.id === f.id)) localFacilities.push(f);
            });
        }

        // Lookup Population
        const popKey = `${districtName}_${villageName}`; // Use districtName (e.g. 北區) from GeoJSON
        const realPop = enrichedPopulation[popKey]?.population;

        // Calculate Area
        const calculatedArea = calculatePolygonArea(feature.geometry);



        const overview = MANUAL_DESCRIPTIONS[uniqueKey] || `位於${city}${districtName}，是一個優美的社區。`;

        return {
            id: id,
            name: villageName,
            city: city,
            district: districtName,
            boundary: feature.geometry,
            description: `位於${city}${districtName}的${villageName}。`,
            tags: [`${districtName}`],
            location: location,
            wiki: {
                introduction: overview,
                population: realPop > 0 ? realPop : Math.floor(Math.random() * 3000 + 1500),
                area: calculatedArea,
                type: "mixed",
                chief: {
                    name: chiefData.chiefName,
                    phone: chiefData.phone,
                    officeAddress: chiefData.address,
                    officeHours: "週一至週五 08:30-17:30"
                },
                association: assoc ? {
                    chairman: assoc.chairman || "理事長",
                    contact: assoc.phone || "請洽活動中心",
                    address: assoc.address
                } : null,
                facilities: {
                    manual: [],
                    generated: localFacilities
                },
                features: []
            },
            projects: [], events: [], people: [], travelSpots: [], communityBuildings: [], cultureHeritages: []
        };
    });

    // 1. Process County (Update with facilities by name matching since no polygons yet)
    const countyComms = countyCommunities.map(c => {
        // Simple name match for County facilities
        const localFacilities = fetchedFacilities.filter(f => (f.address && f.address.includes(c.name)) || f.name.includes(c.name));

        return {
            ...c,
            wiki: {
                ...c.wiki,
                facilities: {
                    manual: [],
                    generated: localFacilities
                }
            }
        };
    });

    const allData = [...countyComms, ...cityCommunities];

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allData, null, 2));
    console.log(`Successfully acquired ${allData.length} community data entries.`);
    console.log(`Merged ${fetchedFacilities.length} facilities into communities.`);
}

// Helper to generate Feature Tags based on facilities and district
function generateTags(district, villageName, facilities) {
    const tags = new Set();
    // Default District Tags
    tags.add(district);

    // Facility-based Tags
    const schools = facilities.filter(f => f.type === 'school');
    const parks = facilities.filter(f => f.type === 'park');
    const markets = facilities.filter(f => f.name.includes('市場') || f.name.includes('Market'));
    const temples = facilities.filter(f => f.name.includes('宮') || f.name.includes('寺') || f.name.includes('廟'));
    const tech = facilities.filter(f => f.name.includes('科技') || f.name.includes('園區'));

    if (schools.length >= 2) tags.add('文教區');
    if (parks.length >= 2) tags.add('綠意盎然');
    if (markets.length > 0) tags.add('生活機能佳');
    if (temples.length > 0) tags.add('信仰中心');
    if (tech.length > 0) tags.add('科技聚落');

    // District-specific Heuristics
    if (district === '竹北市') {
        if (villageName.includes('六家') || villageName.includes('高鐵')) tags.add('高鐵特區');
        else tags.add('核心都會');
    } else if (['尖石鄉', '五峰鄉'].includes(district)) {
        tags.add('原鄉部落');
        tags.add('自然景觀');
    } else if (['北埔鄉', '峨眉鄉'].includes(district)) {
        tags.add('客家風情');
        tags.add('觀光熱點');
    } else if (district === '東區' && (villageName.includes('科學') || villageName.includes('科園'))) {
        tags.add('竹科門戶');
    } else if (district === '北區' && (villageName.includes('舊') || villageName.includes('古'))) {
        tags.add('文化舊城');
    }

    // Name-based Heuristics
    if (villageName.includes('舊') || villageName.includes('古')) tags.add('歷史聚落');

    return Array.from(tags);
}

// Smart Content Generator
function generateRichDescription(city, district, village, tags, facilities, population) {
    const featureList = tags.filter(t => t !== district && t !== city); // Remove redundant tags
    const facilityNames = facilities.slice(0, 3).map(f => f.name).join('、');

    let intro = `${village}位於${city}${district}。`;

    // Demographic Vibe
    if (population > 5000) {
        intro += `這是一個人口稠密的熱鬧社區，擁有約${population.toLocaleString()}名居民。`;
    } else if (population < 1000) {
        intro += `這是一個寧靜的聚落，人口約${population}人，保有純樸的鄉村氣息。`;
    } else {
        intro += `社區發展穩定，現有居民約${population.toLocaleString()}人。`;
    }

    // Features
    if (featureList.length > 0) {
        intro += `該社區以${featureList.join('、')}聞名。`;
    }

    // Facilities
    if (facilityNames) {
        intro += `周邊資源豐富，包括${facilityNames}等設施，生活機能完善。`;
    } else {
        intro += `擁有舒適的生活環境。`;
    }

    intro += `歡迎來到${village}！`;
    return intro;
}


function createCommunityObject(id, chief, wiki, assoc, location) {
    const city = chief.city;
    const districtName = chief.district;
    const uniqueKey = `${districtName}_${chief.village}`;



    // Ensure facilities are passed correctly (handle previous structure differences if any)
    const facilities = (wiki && wiki.facilities && wiki.facilities.generated) ? wiki.facilities.generated : [];

    // Generate Smart Tags
    const generatedTags = generateTags(chief.district, chief.village, facilities);
    // Merge with existing manual tags if any, favoring generated ones for now or merging distinct
    const finalTags = wiki && wiki.features && wiki.features.length > 0
        ? [...new Set([...wiki.features, ...generatedTags])]
        : generatedTags;

    // Lookup Population
    const popKey = `${chief.district}_${chief.village}`;
    const realPop = enrichedPopulation[popKey]?.population;
    const finalPop = realPop > 0 ? realPop : Math.floor(Math.random() * 3000 + 1500);

    // Generate Rich Description (if no manual one exists)
    const generatedIntro = generateRichDescription(chief.city, chief.district, chief.village, finalTags, facilities, finalPop);
    const fullIntro = MANUAL_DESCRIPTIONS[uniqueKey] || generatedIntro;
    const description = fullIntro.substring(0, 80) + "..."; // Summary for UI card

    return {
        id: id,
        name: chief.village,
        city: chief.city,
        district: chief.district,
        description: description,
        tags: finalTags, // Use Feature Tags for search keywords too
        location: location,

        wiki: {
            introduction: fullIntro,
            population: finalPop,
            area: (wiki && wiki.geography && wiki.geography.area) || "N/A",
            type: (wiki && wiki.type) || "mixed",
            chief: {
                name: chief.chiefName,
                phone: chief.phone,
                officeAddress: chief.address,
                officeHours: "09:00-17:00"
            },
            association: assoc ? {
                chairman: assoc.chairman || "理事長",
                contact: assoc.phone || "請洽活動中心",
                address: assoc.address
            } : undefined,
            facilities: (wiki && wiki.facilities && wiki.facilities.generated) ? wiki.facilities : { manual: [], generated: [] },
            features: finalTags // Explicitly set features
        },

        projects: [],
        events: [],
        people: [],
        travelSpots: [],
        communityBuildings: [],
        cultureHeritages: []
    };
}

main();
