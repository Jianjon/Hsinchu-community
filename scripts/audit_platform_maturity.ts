
import { GENERATED_COMMUNITIES } from '../data/generated_communities';

interface AuditStats {
    totalCommunities: number;
    withEvents: number;
    withTravel: number;
    withProjects: number;
    withCare: number;
    withCulture: number;
    withWiki: number;
    invalidLocations: number; // lat/lng outside Taiwan or null
}

const TAIWAN_BOUNDS = {
    minLat: 21.0, maxLat: 26.0,
    minLng: 119.0, maxLng: 123.0
};

function isLocationValid(loc: [number, number] | undefined): boolean {
    if (!loc) return false;
    const [lat, lng] = loc;
    return lat >= TAIWAN_BOUNDS.minLat && lat <= TAIWAN_BOUNDS.maxLat &&
        lng >= TAIWAN_BOUNDS.minLng && lng <= TAIWAN_BOUNDS.maxLng;
}

async function audit() {
    console.log("🔍 Starting Platform Maturity & Data Integrity Audit...");

    const communities = GENERATED_COMMUNITIES as any[];
    const stats: AuditStats = {
        totalCommunities: communities.length,
        withEvents: 0,
        withTravel: 0,
        withProjects: 0,
        withCare: 0,
        withCulture: 0,
        withWiki: 0,
        invalidLocations: 0
    };

    let sampleErrors: string[] = [];

    communities.forEach(c => {
        // 1. Check Module Coverage
        if (c.events && c.events.length > 0) stats.withEvents++;
        if (c.travelSpots && c.travelSpots.length > 0) stats.withTravel++;
        if (c.projects && c.projects.length > 0) stats.withProjects++;
        if (c.careActions && c.careActions.length > 0) stats.withCare++;
        if (c.cultureHeritages && c.cultureHeritages.length > 0) stats.withCulture++;
        if (c.description && c.description.length > 10 && c.description !== "暫無介紹") stats.withWiki++;

        // 2. Check Community Location Integrity
        if (!isLocationValid(c.location)) {
            stats.invalidLocations++;
            sampleErrors.push(`[${c.district}${c.name}] Invalid Base Location: ${JSON.stringify(c.location)}`);
        }

        // 3. Check Sub-Database Location Integrity
        c.events?.forEach((e: any) => {
            if (!isLocationValid(e.coordinates)) sampleErrors.push(`[${c.name} Event] ${e.title}: Invalid coord ${e.coordinates}`);
        });
        c.travelSpots?.forEach((t: any) => {
            if (!isLocationValid(t.location)) sampleErrors.push(`[${c.name} Travel] ${t.name}: Invalid loc ${t.location}`);
        });
        c.careActions?.forEach((ca: any) => {
            if (!isLocationValid(ca.location)) sampleErrors.push(`[${c.name} Care] ${ca.title}: Invalid loc ${ca.location}`);
        });
    });

    console.log("\n📊 Audit Results 📊");
    console.log("=====================");
    console.log(`Total Communities: ${stats.totalCommunities}`);
    console.log(`\nCoverage (Maturity):`);
    console.log(`- Wiki/Description: ${stats.withWiki} (${((stats.withWiki / stats.totalCommunities) * 100).toFixed(1)}%)`);
    console.log(`- Events:           ${stats.withEvents} (${((stats.withEvents / stats.totalCommunities) * 100).toFixed(1)}%)`);
    console.log(`- Travel Spots:     ${stats.withTravel} (${((stats.withTravel / stats.totalCommunities) * 100).toFixed(1)}%)`);
    console.log(`- Projects:         ${stats.withProjects} (${((stats.withProjects / stats.totalCommunities) * 100).toFixed(1)}%)`);
    console.log(`- Care Actions:     ${stats.withCare} (${((stats.withCare / stats.totalCommunities) * 100).toFixed(1)}%)`);
    console.log(`- Culture Heritage: ${stats.withCulture} (${((stats.withCulture / stats.totalCommunities) * 100).toFixed(1)}%)`);

    console.log(`\nIntegrity (Data Connections):`);
    console.log(`- Invalid Community Locations: ${stats.invalidLocations}`);

    if (sampleErrors.length > 0) {
        console.log(`\n⚠️ Found ${sampleErrors.length} data loc errors. First 5:`);
        sampleErrors.slice(0, 5).forEach(e => console.log(e));
    } else {
        console.log("\n✅ All sub-database items have valid coordinates connecting to map!");
    }

    // Maturity Score Calculation
    const coverageScore = (stats.withWiki + stats.withEvents + stats.withTravel + stats.withProjects + stats.withCare) / (stats.totalCommunities * 5) * 100;
    console.log(`\n🏆 Platform Maturity Score: ${coverageScore.toFixed(1)} / 100`);
}

audit().catch(console.error);
