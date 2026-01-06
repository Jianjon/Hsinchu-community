
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- Types ---

interface GeoPoint {
    lat: number;
    lng: number;
}

interface VillageFeature {
    type: "Feature";
    properties: {
        COUNTYNAME: string;
        TOWNNAME: string;
        VILLNAME: string;
        VILLCODE: string;
        NOTE: string;
    };
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: any[]; // nested arrays
    };
}

interface GeoJSON {
    type: "FeatureCollection";
    features: VillageFeature[];
}

interface CacheEntry {
    lat: number;
    lng: number;
    timestamp: number;
}

const CACHE_FILE = path.join(PROJECT_ROOT, 'data', 'geocode_cache.json');
const GEOJSON_FILE = path.join(PROJECT_ROOT, 'data', 'public_hsinchu_villages.json');

// --- Geocoding Service ---

class GeocodingService {
    private cache: Record<string, CacheEntry> = {};
    private lastRequestTime = 0;
    private readonly RATE_LIMIT_MS = 1200; // Nominatim requires 1s absolute minimum.

    constructor() {
        this.loadCache();
    }

    private loadCache() {
        if (fs.existsSync(CACHE_FILE)) {
            try {
                this.cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            } catch (e) {
                console.warn("Failed to load geocode cache:", e);
                this.cache = {};
            }
        }
    }

    private saveCache() {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
        } catch (e) {
            console.error("Failed to save geocode cache:", e);
        }
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private cleanAddress(address: string): string {
        let cleaned = address;
        // Remove Floor info (e.g. 4樓, 2F, B1)
        cleaned = cleaned.replace(/\s*\d+\s*[樓Ff]/g, '');
        cleaned = cleaned.replace(/\s*[一二三四五六七八九十]+\s*樓/g, '');

        // Remove Neighborhood info (e.g. 8鄰)
        cleaned = cleaned.replace(/\s*\d+\s*鄰/g, '');

        // Remove text in parentheses (e.g. (xxxx))
        cleaned = cleaned.replace(/\(.*\)/g, '');
        cleaned = cleaned.replace(/（.*）/g, ''); // Fullwidth parentheses

        // Remove "Room" or specific descriptors often not in map
        cleaned = cleaned.replace(/室$/g, '');

        return cleaned.trim();
    }

    public async getCoordinates(address: string): Promise<GeoPoint | null> {
        const trimmedAddress = address.trim();
        if (!trimmedAddress) return null;

        // Check cache for original address first
        if (this.cache[trimmedAddress]) {
            return this.cache[trimmedAddress];
        }

        const cleaned = this.cleanAddress(trimmedAddress);

        const candidates = [
            trimmedAddress,
            cleaned,
            cleaned.replace(/^新竹[縣市]/, ''), // Remove City/County prefix
            cleaned.replace(/\d+號/g, ''), // Remove House Number (Street level)
            cleaned.replace(/^新竹[縣市]/, '').replace(/\d+號/g, '') // Remove prefix AND House Number
        ];

        // Basic dedupe
        const uniqueCandidates = [...new Set(candidates)];

        for (const query of uniqueCandidates) {
            if (!query) continue;

            // Check cache for this candidate
            if (this.cache[query]) return this.cache[query];

            // Rate Limit
            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;
            if (timeSinceLast < this.RATE_LIMIT_MS) {
                await this.sleep(this.RATE_LIMIT_MS - timeSinceLast);
            }

            this.lastRequestTime = Date.now();

            try {
                const encodedAddr = encodeURIComponent(query);
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&viewbox=119.0,26.0,123.0,21.0&bounded=1&limit=1`;

                const headers = {
                    'User-Agent': 'TaiwanVillageAnalyst/1.0 (internal tool)',
                    'Accept-Language': 'zh-TW'
                };

                const response = await fetch(url, { headers });

                if (!response.ok) {
                    console.error(`Geocoding HTTP error: ${response.status} ${response.statusText}`);
                    continue;
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    const result = {
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon)
                    };

                    // Cache the ORIGINAL address to avoid re-cleaning
                    this.cache[trimmedAddress] = { ...result, timestamp: Date.now() };
                    // Also cache the query if different? Maybe not needed.
                    this.saveCache();

                    return result;
                } else {
                    console.log(`[No Match] ${query}`);
                }

            } catch (error) {
                console.error(`Geocoding Exception for ${query}:`, error);
            }
        }
        return null;
    }
}

// --- Geometry Utils (Point in Polygon) ---

class GeoMatcher {
    private villages: VillageFeature[] = [];

    constructor() {
        this.loadVillages();
    }

    private loadVillages() {
        if (!fs.existsSync(GEOJSON_FILE)) {
            console.error(`GeoJSON file not found: ${GEOJSON_FILE}`);
            return;
        }
        try {
            const data: GeoJSON = JSON.parse(fs.readFileSync(GEOJSON_FILE, 'utf-8'));
            this.villages = data.features;
            console.log(`Loaded ${this.villages.length} village boundaries.`);
        } catch (e) {
            console.error("Failed to parse GeoJSON:", e);
        }
    }

    /**
     * Ray Casting algorithm to check if point is in polygon.
     */
    private isPointInPolygon(point: GeoPoint, vs: number[][]): boolean {
        // Ray-casting algorithm based on https://github.com/substack/point-in-polygon
        const x = point.lng, y = point.lat;
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

    public findVillage(point: GeoPoint): { county: string, town: string, village: string } | null {
        for (const feature of this.villages) {
            const props = feature.properties;
            const geom = feature.geometry;

            if (geom.type === 'Polygon') {
                // Polygon coordinates are array of rings. The first ring is the outer boundary.
                // We usually just check the first ring [0].
                if (this.isPointInPolygon(point, geom.coordinates[0])) {
                    return {
                        county: props.COUNTYNAME,
                        town: props.TOWNNAME,
                        village: props.VILLNAME
                    };
                }
            } else if (geom.type === 'MultiPolygon') {
                // MultiPolygon is array of Polygons.
                for (const polygonCoords of geom.coordinates) {
                    if (this.isPointInPolygon(point, polygonCoords[0])) {
                        return {
                            county: props.COUNTYNAME,
                            town: props.TOWNNAME,
                            village: props.VILLNAME
                        };
                    }
                }
            }
        }
        return null;
    }
}

// --- Singleton / Export ---

export const geocodingService = new GeocodingService();
export const geoMatcher = new GeoMatcher();

// Helper function to resolve address
export async function resolveAddressToVillage(address: string): Promise<{ county: string, town: string, village: string, lat: number, lon: number } | null> {
    const coords = await geocodingService.getCoordinates(address);
    if (!coords) return null;

    const villageInfo = geoMatcher.findVillage(coords);
    if (!villageInfo) return null;

    return {
        ...villageInfo,
        lat: coords.lat,
        lon: coords.lng
    };
}
