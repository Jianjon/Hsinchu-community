export interface Point {
    lat: number;
    lng: number;
}

/**
 * Generates a hexagonal polygon around a center point.
 * Used to mock village boundaries for visualization.
 * 
 * @param center The center point [lat, lng]
 * @param radiusRadius in degrees (approx). 0.01 is roughly 1km.
 * @returns Array of [lat, lng] points forming a hexagon
 */
export const generateHexagon = (center: [number, number], radius: number = 0.008): [number, number][] => {
    const [lat, lng] = center;
    const points: [number, number][] = [];

    // Add some randomness to radius to make it look more "organic" (but still a polygon)
    // Use a fixed seed-like effect based on lat/lng so it's consistent
    const seed = (lat + lng) * 10000;

    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i;
        const angle_rad = Math.PI / 180 * angle_deg;

        // Randomize radius slightly per vertex (0.8 ~ 1.2)
        const variance = 0.8 + (Math.sin(seed + i) + 1) / 5;
        const r = radius * variance;

        const pLat = lat + r * Math.cos(angle_rad);
        const pLng = lng + r * Math.sin(angle_rad);

        points.push([pLat, pLng]);
    }

    // Close the loop? Leaflet polygons auto-close, but good practice
    // points.push(points[0]); 

    return points;
};

/**
 * Calculates the Convex Hull of a set of points using the Monotone Chain algorithm.
 * Used to generate township boundaries from village locations.
 */
export const calculateConvexHull = (points: Point[]): [number, number][] => {
    if (points.length < 3) return points.map(p => [p.lat, p.lng]);

    // Sort points by X (lng), then Y (lat)
    const sorted = [...points].sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);

    // Cross product of vectors OA and OB
    const cross = (a: Point, b: Point, o: Point) => {
        return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
    };

    // Build lower hull
    const lower: Point[] = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 1], p, lower[lower.length - 2]) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    // Build upper hull
    const upper: Point[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && cross(upper[upper.length - 1], p, upper[upper.length - 2]) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    // Concatenate
    upper.pop();
    lower.pop();
    const hull = [...lower, ...upper];

    return hull.map(p => [p.lat, p.lng]);
};

/**
 * Calculates the centroid (average center) of a polygon.
 * @param coordinates Array of [lat, lng] points
 */
export const calculatePolygonCentroid = (coordinates: [number, number][]): [number, number] => {
    if (!coordinates || coordinates.length === 0) return [0, 0];

    let latSum = 0;
    let lngSum = 0;
    coordinates.forEach(p => {
        latSum += p[0];
        lngSum += p[1];
    });

    return [latSum / coordinates.length, lngSum / coordinates.length];
};
