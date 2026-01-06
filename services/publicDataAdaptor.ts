import { getAllVillageRecords } from './localDatabase';
import { PublicCommunity, PublicProject, PublicEvent, PublicPerson, MOCK_COMMUNITIES } from '../data/mock_public';
import { calculatePolygonCentroid } from './geoUtils';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { app, initFirebase } from './firebase'; // Import initFirebase to ensure connection
import { CommunityWikiData } from '../types';
// Imports removed to prevent bundling large JSONs
// import villageGeoData from '../data/public_hsinchu_villages.json';
// import villageCityGeoData from '../data/public_hsinchu_city_villages.json';

// Lazy Firestore initialization to avoid "null container" error
let _db: Firestore | null = null;
const getDb = (): Firestore | null => {
    if (!_db && app) {
        try {
            _db = getFirestore(app);
        } catch (e) {
            console.warn('[publicDataAdaptor] Firestore not available:', e);
        }
    }
    return _db;
};

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
    try {
        let coords: [number, number][] = [];

        if (geometry.type === 'Polygon') {
            // Polygon: [ [lng, lat], ... ] (Outer ring is index 0)
            if (geometry.coordinates && geometry.coordinates[0]) {
                coords = geometry.coordinates[0].map((p: any) => [p[1], p[0]]);
            }
        } else if (geometry.type === 'MultiPolygon') {
            // MultiPolygon: Find largest polygon or take first
            if (geometry.coordinates && geometry.coordinates[0] && geometry.coordinates[0][0]) {
                coords = geometry.coordinates[0][0].map((p: any) => [p[1], p[0]]);
            }
        }

        if (coords.length === 0) {
            console.warn('[processGeometry] Empty coordinates found');
            return { boundary: [], center: [24.8, 121.0] }; // Fallback
        }

        const center = calculatePolygonCentroid(coords);
        return { boundary: coords, center };
    } catch (e) {
        console.error('[processGeometry] Error processing geometry:', e, geometry);
        return { boundary: [], center: [24.8, 121.0] };
    }
};

export const getPublicCommunities = async (): Promise<PublicCommunity[]> => {
    try {
        const dbRecords = await getAllVillageRecords();

        console.log("🚀 [API] Starting to fetch GeoJSON and Firestore data...");

        // Fetch GeoJSON and Firestore data in parallel
        const [villageGeoData, villageCityGeoData, firestoreSnap] = await Promise.all([
            fetch('/data/public_hsinchu_villages.json').then(res => {
                if (!res.ok) throw new Error(`Failed hsinchu_villages: ${res.status}`);
                console.log("✅ [API] Fetched hsinchu_villages");
                return res.json();
            }),
            fetch('/data/public_hsinchu_city_villages.json').then(res => {
                if (!res.ok) throw new Error(`Failed hsinchu__city_villages: ${res.status}`);
                console.log("✅ [API] Fetched hsinchu_city_villages");
                return res.json();
            }),
            // Fetch persisted village data from Firestore
            (async () => {
                let db = getDb();
                if (!db) {
                    console.log('🔄 [API] Firebase not ready, attempting auto-init...');
                    initFirebase();
                    db = getDb();
                }

                if (!db) {
                    console.warn('⚠️ [API] Firestore STILL not initialized after retry, skipping persistence.');
                    return null;
                }
                try {
                    console.log('🚀 [API] Fetching Firestore "villages" collection...');
                    return await getDocs(collection(db, 'villages'));
                } catch (e) {
                    console.error('⚠️ [API] Failed to fetch Firestore villages:', e);
                    return null;
                }
            })()
        ]);

        // Build a map of persisted village data from Firestore
        const firestoreData: Record<string, any> = {};
        if (firestoreSnap) {
            firestoreSnap.forEach(doc => {
                firestoreData[doc.id] = doc.data();
            });
            console.log(`✅ [API] Loaded ${Object.keys(firestoreData).length} villages from Firestore. Keys:`, Object.keys(firestoreData).slice(0, 3));
        } else {
            console.warn('⚠️ [API] firestoreSnap is null, no persisted data loaded.');
        }

        console.log(`📦 [API] GeoJSON Loaded. Counties: ${(villageGeoData as any).features?.length}, Cities: ${(villageCityGeoData as any).features?.length}`);

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

                // CRITICAL FIX: Always sync realtime care actions from mock data, even if DB record exists
                if (mock && mock.careActions) {
                    comm.careActions = mock.careActions;
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

            /*
            // UNIVERSAL BEILUN FIX: Apply outside of if/else to always run for Beilun Li
            // DEBUG: Log all communities being processed
            console.log(`[DataAdaptor] Processing: ${comm.name} in ${comm.district}`);
            if (comm.name && comm.name.includes('北崙') && comm.district && comm.district.includes('竹北')) {
                console.log('[DataAdaptor] ✅ MATCH FOUND: 北崙里 - Injecting Care Point!');
                // Prepend local care point to existing array (from mock), don't overwrite
                const localCarePoint = {
                    id: 'care-point-beilun',
                    title: '竹北市北崙社區發展協會 (據點)',
                    type: 'care_action',
                    area: '竹北市北崙里',
                    address: '竹北市北崙里博愛街 27-16 號',
                    location: [24.8385, 121.0050] as [number, number], // 竹北市北崙里博愛街正確座標
                    phone: '0966-830668',
                    time: '每週五次供餐',
                    status: 'ongoing' as const,
                    description: '北崙里社區關懷據點，提供在地長者五天完整共餐與關懷服務。',
                    beneficiaries: '65歲以上里民',
                    sdgs: [3, 11],
                    tags: ['社區共餐', '長者關懷']
                };
                // Check if already exists to avoid duplicates
                if (!comm.careActions?.find((c: any) => c.id === 'care-point-beilun')) {
                    comm.careActions = [localCarePoint, ...(comm.careActions || [])];
                }
            }
            */

            // ==========================================
            // FINAL PRIORITY: Firestore Persisted Data
            // ==========================================
            // If this village has saved data in Firestore, use it as the source of truth
            const persisted = firestoreData[id];
            if (persisted) {
                console.log(`[DataAdaptor] 🔥 Found Firestore data for ${id}`);

                // Override ALL content arrays with persisted versions if they exist
                if (persisted.careActions) {
                    console.log(`[DataAdaptor] 📥 Loading ${persisted.careActions.length} careActions from Firestore for ${id}`);
                    comm.careActions = persisted.careActions;
                }
                if (persisted.travelSpots) {
                    comm.travelSpots = persisted.travelSpots;
                }
                if (persisted.communityBuildings) {
                    comm.communityBuildings = persisted.communityBuildings;
                }
                if (persisted.cultureHeritages) {
                    comm.cultureHeritages = persisted.cultureHeritages;
                }
                if (persisted.events) {
                    comm.events = persisted.events;
                }
                if (persisted.people) {
                    comm.people = persisted.people;
                }
                if (persisted.projects) {
                    comm.projects = persisted.projects;
                }

                // Override metadata if persisted
                if (persisted.description) comm.description = persisted.description;
                if (persisted.tags) comm.tags = persisted.tags;
                if (persisted.chief) comm.chief = persisted.chief;
                if (persisted.population) comm.population = persisted.population;

                // Merge wiki data if present
                // Merge wiki data if present - STRICT PRIORITY
                if (persisted.wiki) {
                    console.log(`[DataAdaptor] 🧬 Merging Firestore Wiki for ${id}`, persisted.wiki);
                    comm.wiki = {
                        ...comm.wiki,       // Base defaults from Mock (if any)
                        ...persisted.wiki,  // OVERRIDE with Firestore data
                        _source: 'firestore' // explicit flag
                    };
                } else if (persisted.introduction || persisted.facilities) {
                    // Legacy migration case: flat fields on village document
                    comm.wiki = {
                        ...comm.wiki,
                        ...persisted,
                        _source: 'firestore_legacy'
                    };
                }
            }

            // AUTO-GENERATE MOCK CONTENT REMOVED to ensure only real data is shown
            // if (comm.travelSpots.length === 0) { ... }

            // AUTO-GENERATE MOCK CONTENT REMOVED to ensure only real data is shown
            // if (comm.events.length === 0) { ... }
            // if (!comm.careActions || comm.careActions.length === 0) { ... }

            return comm;
        });

        return communities;

    } catch (error) {
        console.error("❌ [API] Failed to load public data:", error);

        // Critical Fallback: Try to construct minimal viable data from MOCK if fetch fails
        // This ensures the map isn't empty even if JSONs create 404 or Parse Error
        console.warn("⚠️ [API] Switching to Emergency Mock Data Mode");
        return MOCK_COMMUNITIES.map(m => ({
            ...m,
            // Mock a boundary if missing so it renders something? 
            // Actually MOCK_COMMUNITIES usually have no boundary. 
            // Let's at least return them so the list sidebar works.
        }));
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
