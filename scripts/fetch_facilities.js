
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '../data/fetched_facilities.json');

// Overpass API Query
// Bounding Box for Hsinchu (approximate): 24.5, 120.8, 25.0, 121.4
const QUERY = `
[out:json][timeout:60];
(
  // Schools
  node["amenity"="school"](24.5, 120.8, 25.0, 121.4);
  way["amenity"="school"](24.5, 120.8, 25.0, 121.4);
  
  // Police
  node["amenity"="police"](24.5, 120.8, 25.0, 121.4);
  way["amenity"="police"](24.5, 120.8, 25.0, 121.4);

  // Fire Station
  node["amenity"="fire_station"](24.5, 120.8, 25.0, 121.4);
  way["amenity"="fire_station"](24.5, 120.8, 25.0, 121.4);

  // Parks
  node["leisure"="park"](24.5, 120.8, 25.0, 121.4);
  way["leisure"="park"](24.5, 120.8, 25.0, 121.4);
  
  // Government
  node["amenity"="townhall"](24.5, 120.8, 25.0, 121.4);
  way["amenity"="townhall"](24.5, 120.8, 25.0, 121.4);
);
out center;
`;

const fetchFacilities = () => {
    const options = {
        hostname: 'overpass-api.de',
        path: '/api/interpreter',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TaiwanVillageAnalyst/1.0'
        }
    };

    console.log("Fetching facilities from Overpass API...");

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
                console.error(data);
                return;
            }

            try {
                const result = JSON.parse(data);
                console.log(`Fetched ${result.elements.length} items.`);

                const facilities = result.elements.map(el => {
                    const tags = el.tags || {};
                    let type = 'other';
                    if (tags.amenity === 'school') type = 'school';
                    else if (tags.amenity === 'police') type = 'police';
                    else if (tags.amenity === 'fire_station') type = 'gov'; // Map fire station to gov/institution
                    else if (tags.leisure === 'park') type = 'park';
                    else if (tags.amenity === 'townhall') type = 'gov';

                    // Get lat/lon (center for ways)
                    const lat = el.lat || el.center?.lat;
                    const lon = el.lon || el.center?.lon;

                    return {
                        id: `osm_${el.type}_${el.id}`,
                        name: tags.name || tags['name:zh'] || tags['name:en'] || 'Unknown Facility',
                        type: type,
                        location: [lat, lon],
                        address: tags['addr:full'] || tags['addr:street'] || ''
                    };
                }).filter(f => f.name !== 'Unknown Facility' && f.location[0]);

                fs.writeFileSync(OUTPUT_PATH, JSON.stringify(facilities, null, 2));
                console.log(`Saved ${facilities.length} facilities to ${OUTPUT_PATH}`);

            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        });
    });

    req.on('error', (e) => {
        console.error("Request error:", e);
    });

    req.write(`data=${encodeURIComponent(QUERY)}`);
    req.end();
};

fetchFacilities();
