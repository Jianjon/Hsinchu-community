
/**
 * Service for Geocoding Addresses to Coordinates
 * Uses OpenStreetMap Nominatim API (Free, Rate Limited)
 */

interface GeocodeResult {
    lat: number;
    lng: number;
    name: string;
    display_name: string;
}

export const searchAddress = async (query: string): Promise<GeocodeResult[]> => {
    if (!query || query.length < 2) return [];

    try {
        // limit=3, bounded to Taiwan rough box
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=119.0,26.0,122.5,21.5&bounded=1&limit=3`;

        const response = await fetch(url, {
            headers: {
                'Accept-Language': 'zh-TW' // Prefer Traditional Chinese
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        return data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.name || item.display_name.split(',')[0],
            display_name: item.display_name
        }));

    } catch (error) {
        console.error("Geocoding Error:", error);
        return [];
    }
};

/**
 * Helper to parse "lat, lng" string
 */
export const parseCoordinates = (input: string): [number, number] | null => {
    const latLngRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = input.match(latLngRegex);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[3])];
    }
    return null;
};
