
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../data/generated_communities.json');

const checkDistribution = () => {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

    const stats = {};
    let totalFacilities = 0;

    data.forEach(c => {
        const district = c.district;
        const count = c.wiki?.facilities?.generated?.length || 0;

        if (!stats[district]) stats[district] = 0;
        stats[district] += count;
        totalFacilities += count;
    });

    console.log(`Total Facilities Assigned: ${totalFacilities}`);
    console.log("Distribution by District:");
    Object.keys(stats).sort().forEach(d => {
        console.log(`  ${d}: ${stats[d]}`);
    });
};

checkDistribution();
