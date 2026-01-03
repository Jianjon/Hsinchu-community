
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const urls = [
    "https://odws.hccg.gov.tw/001/Upload/25/opendata/9059/1495/d684e6e5-3b46-45a0-a242-a424cd859f9b.json?1141104105417",
    "https://odws.hccg.gov.tw/001/Upload/25/opendata/9059/1494/fd03b1f0-1f63-4d79-936b-10ca5d3928f4.json?1141104105330",
    "https://odws.hccg.gov.tw/001/Upload/25/opendata/9059/1493/c30df74a-5b3b-4b82-b3f4-4db9e62bc437.json?1141104105245",
    "https://odws.hccg.gov.tw/001/Upload/25/opendata/9059/93/8b2a33c0-9602-47bc-ab2a-3cb5c51c06a9.json?1141104105136"
];

async function main() {
    for (let i = 0; i < urls.length; i++) {
        console.log(`Fetching URL ${i + 1}...`);
        try {
            const res = await fetch(urls[i]);
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            console.log(`URL ${i + 1} Count: ${data.length}`);
            if (data.length > 0) {
                console.log(`Sample ${i + 1}:`, JSON.stringify(data[0], null, 2));
                // Try to infer content type
                const keys = Object.keys(data[0]).join(",");
                console.log(`Keys: ${keys}`);
            }
            console.log("------------------------------------------------");
        } catch (e) {
            console.error(`Error URL ${i + 1}:`, e.message);
        }
    }
}

main();
