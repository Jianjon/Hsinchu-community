
const fs = require('fs');

try {
    const data = fs.readFileSync('data/generated_communities.ts', 'utf8');
    // Extract the JSON array part
    const jsonStart = data.indexOf('[');
    const jsonEnd = data.lastIndexOf(']');
    const jsonStr = data.substring(jsonStart, jsonEnd + 1);

    // Evaluate it safely or parse if it's pure JSON (it might not be if it has comments, but generated file is usually clean)
    // Actually the file is `export const GENERATED_COMMUNITIES = [...]`, so we can just grab the array.
    const communities = JSON.parse(jsonStr);

    console.log(`Analyzing ${communities.length} communities...`);

    let seasideAssets = 0;
    let totalAssets = 0;

    communities.forEach(c => {
        if (c.cultureHeritages) {
            c.cultureHeritages.forEach(h => {
                totalAssets++;
                if (h.location) {
                    const [lat, lng] = h.location;
                    // Check if coastal/sea (West of 120.93 approx)
                    // Hsinchu City center is 120.96. Nanliao is 120.92.
                    // Anything < 120.92 is likely sea or immediate coast.
                    if (lng < 120.92) {
                        console.log(`🌊 SEA/COAST ASSET: [${h.name}] in [${c.name}] (${c.id}) at [${lat}, ${lng}]`);
                        seasideAssets++;
                    }
                } else {
                    console.log(`❓ NULL LOCATION: [${h.name}] in [${c.name}]`);
                }
            });
        }
    });

    console.log(`\nFound ${seasideAssets} assets potentially at seaside out of ${totalAssets}.`);

} catch (e) {
    console.error("Error:", e);
}
