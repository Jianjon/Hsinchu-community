
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../data/generated_communities.json');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const coverage = {};

data.forEach(c => {
    const dist = c.district;
    const pop = c.wiki.population;

    if (!coverage[dist]) {
        coverage[dist] = { total: 0, hasPop: 0, zeroPop: 0 };
    }

    coverage[dist].total++;
    if (pop > 0) coverage[dist].hasPop++;
    else coverage[dist].zeroPop++;
});

console.log("Population Coverage Report:");
console.table(coverage);
