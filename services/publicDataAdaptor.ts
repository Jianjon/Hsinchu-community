import { getAllVillageRecords } from './localDatabase';
import { PublicCommunity, PublicProject, PublicEvent, PublicPerson, MOCK_COMMUNITIES } from '../data/mock_public';
import { calculatePolygonCentroid } from './geoUtils';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { app, initFirebase } from './firebase'; // Import initFirebase to ensure connection
import { CommunityWikiData } from '../types';
import { enrichCommunityData } from './dataEnrichment';
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
            // Fetch persisted village data from Firestore - REMOVED FOR PERFORMANCE
            // We now load this ON DEMAND per township
            Promise.resolve(null)
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
                // Also sync other generated content (Culture, Travel, etc.) that comes from local_db JSONs via sync_to_frontend
                if (mock) {
                    comm.cultureHeritages = mock.cultureHeritages || [];
                    comm.travelSpots = mock.travelSpots || [];
                    comm.events = mock.events || [];
                    comm.projects = mock.projects || [];
                    comm.communityBuildings = mock.communityBuildings || [];
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
            // console.log(`[DataAdaptor] Processing: ${comm.name} in ${comm.district}`);
            if (comm.name && comm.name.includes('北崙') && comm.district && comm.district.includes('竹北')) {
                // console.log('[DataAdaptor] ✅ MATCH FOUND: 北崙里 - Injecting Care Point!');
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
                // Override ALL content arrays with persisted versions if they exist

                // Sanitize tags: Ensure string[]
                if (persisted.tags && Array.isArray(persisted.tags)) {
                    comm.tags = persisted.tags.map((t: any) => {
                        if (typeof t === 'string') return t;
                        if (typeof t === 'object' && t !== null) {
                            return t.name || t.id || t.title || JSON.stringify(t);
                        }
                        return String(t);
                    });
                }

                // Sanitize People: Ensure name/role are strings
                if (persisted.people && Array.isArray(persisted.people)) {
                    comm.people = persisted.people.map((p: any) => ({
                        ...p,
                        name: typeof p.name === 'string' ? p.name : (p.name?.name || "未知"),
                        role: typeof p.role === 'string' ? p.role : (p.role?.name || "成員"),
                        title: typeof p.title === 'string' ? p.title : ""
                    })).filter((p: any) => p.name && typeof p.name === 'string');
                }

                // Sanitize Projects: Ensure title/status are valid
                if (persisted.projects && Array.isArray(persisted.projects)) {
                    comm.projects = persisted.projects.map((p: any) => ({
                        ...p,
                        title: typeof p.title === 'string' ? p.title : "未命名專案",
                        description: typeof p.description === 'string' ? p.description : "",
                        status: typeof p.status === 'string' ? p.status : "planning"
                    }));
                }

                // Sanitize Events: Ensure valid strings
                if (persisted.events && Array.isArray(persisted.events)) {
                    comm.events = persisted.events.map((e: any) => ({
                        ...e,
                        title: typeof e.title === 'string' ? e.title : "未命名活動",
                        location: typeof e.location === 'string' ? e.location : "未定",
                        date: typeof e.date === 'string' ? e.date : new Date().toISOString().split('T')[0]
                    }));
                }

                if (persisted.careActions) comm.careActions = mergeUnique(comm.careActions, persisted.careActions);
                if (persisted.travelSpots) comm.travelSpots = mergeUnique(comm.travelSpots, persisted.travelSpots);
                if (persisted.communityBuildings) comm.communityBuildings = mergeUnique(comm.communityBuildings, persisted.communityBuildings);
                if (persisted.cultureHeritages) comm.cultureHeritages = mergeUnique(comm.cultureHeritages, persisted.cultureHeritages);

                // Override metadata if persisted
                if (persisted.description) comm.description = typeof persisted.description === 'string' ? persisted.description : JSON.stringify(persisted.description);

                // Sanitize chief
                if (persisted.chief) {
                    comm.chief = typeof persisted.chief === 'object' && persisted.chief.name
                        ? persisted.chief.name
                        : typeof persisted.chief === 'string' ? persisted.chief : JSON.stringify(persisted.chief);
                }

                // Sanitize population
                if (persisted.population) {
                    comm.population = typeof persisted.population === 'string'
                        ? persisted.population
                        : String(persisted.population);
                }

                // Merge wiki data if present
                if (persisted.wiki) {
                    comm.wiki = {
                        ...comm.wiki,       // Base defaults from Mock (if any)
                        ...persisted.wiki,  // OVERRIDE with Firestore data
                        _source: 'firestore'
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

            // --------------------------------------------------------
            // FINAL SANITIZATION: ABSOLUTE SAFETY CHECK
            // --------------------------------------------------------
            // Ensure chief is NEVER an object (regardless of source: Mock or Firestore)
            if (comm.chief && typeof comm.chief === 'object') {
                const c = comm.chief as any;
                comm.chief = c.name || c.id || JSON.stringify(c);
            }

            // Ensure population is string
            if (comm.population && typeof comm.population !== 'string') {
                comm.population = String(comm.population);
            }

            // Ensure description is string
            if (comm.description && typeof comm.description !== 'string') {
                const d = comm.description as any;
                comm.description = typeof d === 'object' ? JSON.stringify(d) : String(d);
            }

            // Ensure tags is string array
            if (comm.tags && Array.isArray(comm.tags)) {
                comm.tags = comm.tags.map(t => {
                    if (typeof t === 'string') return t;
                    const o = t as any;
                    return o.name || o.id || o.title || JSON.stringify(o);
                });
            }

            // AUTO-GENERATE MOCK CONTENT REMOVED to ensure only real data is shown
            // if (comm.travelSpots.length === 0) { ... }

            // AUTO-GENERATE MOCK CONTENT REMOVED to ensure only real data is shown
            // if (comm.events.length === 0) { ... }
            // if (!comm.careActions || comm.careActions.length === 0) { ... }

            return comm;
        });

        // 4. Enrich with Real-Time Data (Transport, Sustainability)
        enrichCommunityData(communities);

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

// --- LAZY LOADING ---
import { getVillagesByDistrict } from './firestoreService';
// calculatePolygonCentroid is already imported at the top

export const fetchTownshipData = async (townshipName: string): Promise<Record<string, any>> => {
    // console.log(`[DataAdaptor] Lazy loading data for township: ${townshipName}`);
    try {
        const data = await getVillagesByDistrict(townshipName);
        // console.log(`[DataAdaptor] Loaded ${Object.keys(data).length} villages for ${townshipName}`);
        return data;
    } catch (e) {
        console.error("Failed to load township data:", e);
        return {};
    }
};

const mergeUnique = <T extends { id: string }>(base: T[] = [], override: T[] = []): T[] => {
    const baseMap = new Map(base.map(item => [item.id, item]));
    const overrideMap = new Map(override.map(item => [item.id, item]));

    // Start with base items
    const merged = new Map(baseMap);

    // Apply overrides (this adds new items and updates existing ones)
    override.forEach(item => {
        merged.set(item.id, item);
    });

    return Array.from(merged.values());
};

export const mergeCommunityData = (original: PublicCommunity, firestoreData: any): PublicCommunity => {
    if (!firestoreData) return original;

    // Deep clone to avoid mutation issues
    const comm = { ...original };
    const persisted = firestoreData;

    // MERGE content arrays using ID to prevent overwriting generated system data (like culture assets)
    // while still allowing user edits (persisted data) to update or add items.
    if (persisted.careActions) comm.careActions = mergeUnique(comm.careActions, persisted.careActions);
    if (persisted.travelSpots) comm.travelSpots = mergeUnique(comm.travelSpots, persisted.travelSpots);
    if (persisted.communityBuildings) comm.communityBuildings = mergeUnique(comm.communityBuildings, persisted.communityBuildings);
    if (persisted.cultureHeritages) comm.cultureHeritages = mergeUnique(comm.cultureHeritages, persisted.cultureHeritages);

    // Arrays handled below with sanitization - also apply mergeUnique after sanitization
    // ...

    // Override metadata if persisted
    if (persisted.description) comm.description = typeof persisted.description === 'string' ? persisted.description : JSON.stringify(persisted.description);

    // Sanitize tags: Ensure string[]
    if (persisted.tags && Array.isArray(persisted.tags)) {
        const persistedTags = persisted.tags.map((t: any) => {
            if (typeof t === 'string') return t;
            if (typeof t === 'object' && t !== null) {
                return t.name || t.id || t.title || JSON.stringify(t);
            }
            return String(t);
        });
        // Merge tags: simple set union
        comm.tags = Array.from(new Set([...(comm.tags || []), ...persistedTags]));
    }

    // Sanitize People: Ensure name/role are strings
    if (persisted.people && Array.isArray(persisted.people)) {
        const persistedPeople = persisted.people.map((p: any) => ({
            ...p,
            name: typeof p.name === 'string' ? p.name : (p.name?.name || "未知"),
            role: typeof p.role === 'string' ? p.role : (p.role?.name || "成員"),
            title: typeof p.title === 'string' ? p.title : ""
        })).filter((p: any) => p.name && typeof p.name === 'string');
        // Simple assignment for people as IDs might not be reliable for merging
        comm.people = persistedPeople;
    }

    // Sanitize Projects: Ensure title/status are valid
    if (persisted.projects && Array.isArray(persisted.projects)) {
        const persistedProjects = persisted.projects.map((p: any) => ({
            ...p,
            title: typeof p.title === 'string' ? p.title : "未命名專案",
            description: typeof p.description === 'string' ? p.description : "",
            status: typeof p.status === 'string' ? p.status : "planning"
        }));
        comm.projects = mergeUnique(comm.projects, persistedProjects);
    }

    // Sanitize Events: Ensure valid strings
    if (persisted.events && Array.isArray(persisted.events)) {
        const persistedEvents = persisted.events.map((e: any) => ({
            ...e,
            title: typeof e.title === 'string' ? e.title : "未命名活動",
            location: typeof e.location === 'string' ? e.location : "未定",
            date: typeof e.date === 'string' ? e.date : new Date().toISOString().split('T')[0]
        }));
        comm.events = mergeUnique(comm.events, persistedEvents);
    }

    // Sanitize chief (ensure string)
    if (persisted.chief) {
        comm.chief = typeof persisted.chief === 'object' && persisted.chief.name
            ? persisted.chief.name
            : typeof persisted.chief === 'string' ? persisted.chief : JSON.stringify(persisted.chief);
    }

    // Sanitize population (ensure string)
    if (persisted.population) {
        comm.population = typeof persisted.population === 'string'
            ? persisted.population
            : String(persisted.population);
    }

    // Merge wiki data
    if (persisted.wiki) {
        comm.wiki = {
            ...comm.wiki,
            ...persisted.wiki,
            _source: 'firestore'
        };
    } else if (persisted.introduction || persisted.facilities) {
        comm.wiki = {
            ...comm.wiki,
            ...persisted,
            _source: 'firestore_legacy'
        };
    }

    return comm;
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
