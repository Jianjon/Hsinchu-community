import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../data/generated_communities.json');

function analyze() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("Data file not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    const zhubei = data.filter(c => c.district === '竹北市');

    console.log(`Total Zhubei Villages: ${zhubei.length}`);

    let hasAssoc = 0;
    let templateIntro = 0;
    let defaultPopulation = 0;

    zhubei.forEach(c => {
        if (c.wiki && c.wiki.association) hasAssoc++;
        if (c.wiki && c.wiki.introduction && c.wiki.introduction.includes("是一個優美的社區")) templateIntro++;
        // Check for generated population (1000 + random * 5000) - hard to detect exactly, but check if round numbers or suspiciously distributed? 
        // Actually, let's just show a few examples.
    });

    console.log(`With Association Info: ${hasAssoc} / ${zhubei.length}`);
    console.log(`Using Template Introduction: ${templateIntro} / ${zhubei.length}`);

    console.log("\n--- Sample Entries ---");
    zhubei.slice(0, 3).forEach(c => {
        console.log(`[${c.name}]`);
        console.log(`  Intro: ${c.wiki?.introduction?.substring(0, 50)}...`);
        console.log(`  Assoc: ${c.wiki?.association?.address || 'None'}`);
        console.log(`  Pop: ${c.wiki?.population}`);
        console.log(`  Facs: ${c.wiki?.facilities?.length || 0}`);
    });
}

analyze();
