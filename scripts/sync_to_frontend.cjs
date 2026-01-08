
const fs = require('fs');
const path = require('path');

const LOCAL_DB_BASE = path.resolve('data/local_db');
const OUTPUT_FILE = path.resolve('data/generated_communities.ts');

async function main() {
    console.log("🚀 Syncing Local DB to Frontend...");

    const communities = [];
    let count = 0;

    if (!fs.existsSync(LOCAL_DB_BASE)) {
        console.error("❌ Local DB not found!");
        return;
    }

    const CHIEF_LOCATIONS_FILE = path.resolve('data/chief_office_locations.json');
    let chiefLocations = {};
    try {
        if (fs.existsSync(CHIEF_LOCATIONS_FILE)) {
            chiefLocations = JSON.parse(fs.readFileSync(CHIEF_LOCATIONS_FILE, 'utf8'));
            console.log(`📍 Loaded ${Object.keys(chiefLocations).length} chief office locations.`);
        }
    } catch (e) {
        console.error("⚠️ Failed to load chief locations:", e);
    }

    const ASSOCIATIONS_FILE = path.resolve('data/association_locations.json');
    let associationLocations = {};
    try {
        if (fs.existsSync(ASSOCIATIONS_FILE)) {
            associationLocations = JSON.parse(fs.readFileSync(ASSOCIATIONS_FILE, 'utf8'));
            console.log(`📍 Loaded ${Object.keys(associationLocations).length} association locations.`);
        }
    } catch (e) {
        console.log("ℹ️ No association locations file yet.");
    }

    const cities = fs.readdirSync(LOCAL_DB_BASE);
    for (const city of cities) {
        if (city.startsWith('.')) continue;
        const districts = fs.readdirSync(path.join(LOCAL_DB_BASE, city));

        for (const district of districts) {
            if (district.startsWith('.')) continue;
            const villages = fs.readdirSync(path.join(LOCAL_DB_BASE, city, district));

            for (const village of villages) {
                if (village.startsWith('.')) continue;

                const villagePath = path.join(LOCAL_DB_BASE, city, district, village);

                // Read 6 channel files
                let wiki = {};
                try { wiki = JSON.parse(fs.readFileSync(path.join(villagePath, 'wiki.json'), 'utf8')); } catch (e) { }

                let culture = [];
                try { culture = JSON.parse(fs.readFileSync(path.join(villagePath, 'culture.json'), 'utf8')); } catch (e) { }

                let travel = [];
                try { travel = JSON.parse(fs.readFileSync(path.join(villagePath, 'travel.json'), 'utf8')); } catch (e) { }

                let events = [];
                try { events = JSON.parse(fs.readFileSync(path.join(villagePath, 'events.json'), 'utf8')); } catch (e) { }

                let projects = [];
                try { projects = JSON.parse(fs.readFileSync(path.join(villagePath, 'projects.json'), 'utf8')); } catch (e) { }

                let care = [];
                try { care = JSON.parse(fs.readFileSync(path.join(villagePath, 'care.json'), 'utf8')); } catch (e) { }

                // Construct PublicCommunity Object
                const commId = `${city}_${district}_${village}`;

                // Use precise location if available, otherwise fallback to random
                const preciseLocation = chiefLocations[commId];
                const finalLocation = preciseLocation || [24.8 + (Math.random() * 0.1), 121.0 + (Math.random() * 0.1)];

                // Map 'wiki' population/features to top level if needed by some UI components, 
                // but mostly keep it in 'wiki' object as per new schema.

                const community = {
                    id: commId,
                    name: village,
                    city: city,
                    district: district,
                    description: wiki.introduction || "暫無介紹",
                    tags: wiki.features || [],
                    location: finalLocation,


                    // Embedded Channels - CARE ACTION FIX
                    wiki: wiki,
                    cultureHeritages: culture,
                    travelSpots: travel.map((t, idx) => ({
                        ...t,
                        location: t.location || [
                            finalLocation[0] + (Math.random() - 0.5) * 0.005, // Slightly larger spread for travel spots
                            finalLocation[1] + (Math.random() - 0.5) * 0.005
                        ],
                        id: t.id || `travel-${commId}-${idx}`
                    })),
                    events: events.map((e, idx) => ({
                        ...e,
                        // PublicMap expects 'coordinates' for events
                        coordinates: e.coordinates || [
                            finalLocation[0] + (Math.random() - 0.5) * 0.003,
                            finalLocation[1] + (Math.random() - 0.5) * 0.003
                        ],
                        id: e.id || `evt-${commId}-${idx}`
                    })),
                    projects: (projects.length > 0 ? projects : [
                        {
                            id: `proj-${commId}-vision`,
                            title: '【社區未來願景】永續發展計畫',
                            description: `致力於提升${village}的居住品質，推廣共好意識，打造溫馨、安全、智慧的永續社區。`,
                            status: '進行中',
                            progress: 35,
                            coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop'
                        }
                    ]).map((p, idx) => ({
                        ...p,
                        // PublicMap expects 'location' for projects
                        location: p.location || [
                            finalLocation[0] + (Math.random() - 0.5) * 0.004,
                            finalLocation[1] + (Math.random() - 0.5) * 0.004
                        ],
                        id: p.id || `proj-${commId}-${idx}`
                    })),
                    careActions: care.map((c, idx) => {
                        // Priority: 1. Association Location, 2. Chief Location + Jitter
                        // If Association Location is available, use IT with tiny jitter (0.0001 ~ 10m)
                        // If Chief Location is fallback, use larger jitter (0.002 ~ 200m) 
                        const hasAssociation = !!associationLocations[commId];
                        const baseLocation = associationLocations[commId] || finalLocation;
                        const jitterAmt = hasAssociation ? 0.0001 : 0.002;

                        return {
                            ...c,
                            location: c.location || [
                                baseLocation[0] + (Math.random() - 0.5) * jitterAmt,
                                baseLocation[1] + (Math.random() - 0.5) * jitterAmt
                            ],
                            id: c.id || `care-${commId}-${idx}`
                        };
                    }),

                    // Legacy/Root Fields for compatibility
                    chief: wiki.chief?.name,
                    population: wiki.population?.toString(), // Ensure string if UI expects string
                    communityBuildings: [],
                    boundary: []
                };

                communities.push(community);
                count++;
            }
        }
    }

    const fileContent = `// Auto-generated by scripts/sync_to_frontend.ts
// Do not edit manually. Edit data/local_db JSONs instead.

export const GENERATED_COMMUNITIES = ${JSON.stringify(communities, null, 2)};
`;

    fs.writeFileSync(OUTPUT_FILE, fileContent);
    console.log(`✅ Synced ${count} communities to ${OUTPUT_FILE}`);
}

main().catch(console.error);
