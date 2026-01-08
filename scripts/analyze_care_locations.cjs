
const fs = require('fs');
const path = require('path');

// Read generated communities (using regex because it's a TS file with export)
const content = fs.readFileSync(path.join(__dirname, '../data/generated_communities.ts'), 'utf8');

// Extract the array part roughly
const jsonStr = content.replace(/export const GENERATED_COMMUNITIES = /, '').replace(/;$/, '');

// We can't strict JSON parse because it might have some loose syntax if not careful, 
// but usually the sync script writes valid JSON-like structure. 
// However, the sync script uses `JSON.stringify(communities, null, 2)`, so it should be valid JSON.
// Let's try parsing.
let communities = [];
try {
    communities = JSON.parse(jsonStr);
} catch (e) {
    console.error("Failed to simple parse, trying eval (safe-ish in local dev)");
    // it matches `export const GENERATED_COMMUNITIES = [...]`
    // We can just eval the list part.
    try {
        // Only eval the array part
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']');
        const arrayStr = content.substring(start, end + 1);
        communities = eval(arrayStr); // Dangerous in prod, ok for local debug script
    } catch (e2) {
        console.error("Eval failed:", e2);
        process.exit(1);
    }
}

let totalCare = 0;
let defaultLocInfo = 0;
let weirdLocs = [];

communities.forEach(c => {
    if (c.careActions) {
        c.careActions.forEach(a => {
            totalCare++;
            const loc = a.location;
            if (!loc) {
                weirdLocs.push({ name: a.title, loc: 'MISSING', comm: c.name });
            } else {
                const [lat, lng] = loc;
                // Check for default
                // sync_to_frontend uses [24.8 + jitter, 121.0 + jitter]
                // 24.8 +/- 0.002
                if (Math.abs(lat - 24.8) < 0.005 && Math.abs(lng - 121.0) < 0.005) {
                    defaultLocInfo++;
                    weirdLocs.push({ name: a.title, loc: [lat, lng], comm: c.name, issue: 'DEFAULT_CLUSTER' });
                }

                // Check for 0,0
                if (Math.abs(lat) < 1 && Math.abs(lng) < 1) {
                    weirdLocs.push({ name: a.title, loc: [lat, lng], comm: c.name, issue: 'ZERO' });
                }
            }
        });
    }
});

console.log(`Total Care Actions: ${totalCare}`);
console.log(`At/Near Default [24.8, 121.0]: ${defaultLocInfo}`);
if (weirdLocs.length > 0) {
    console.log("Top 10 Weird Locations:");
    console.log(JSON.stringify(weirdLocs.slice(0, 10), null, 2));
}
