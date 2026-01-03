
import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/local_db');

interface AuditResult {
    city: string;
    district: string;
    village: string;
    missingFields: string[];
}

function auditData() {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
        console.error("Local DB not found");
        return;
    }

    const results: AuditResult[] = [];
    const cities = fs.readdirSync(LOCAL_DB_PATH).filter(f => !f.startsWith('.'));

    for (const city of cities) {
        const cityPath = path.join(LOCAL_DB_PATH, city);
        const districts = fs.readdirSync(cityPath).filter(f => !f.startsWith('.'));

        for (const district of districts) {
            const districtPath = path.join(cityPath, district);
            const villages = fs.readdirSync(districtPath).filter(f => !f.startsWith('.'));

            for (const village of villages) {
                const wikiPath = path.join(districtPath, village, 'wiki.json');
                if (!fs.existsSync(wikiPath)) continue;

                try {
                    const data = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
                    const missing: string[] = [];

                    // Check for placeholders or empty values
                    if (!data.population || data.population === 0 || data.population === "待更新") {
                        missing.push(`population (${data.population})`);
                    }

                    if (!data.chief?.name || data.chief.name.includes("待填寫") || data.chief.name.includes("里長") || data.chief.name.includes("村長")) {
                        // Note: "XX里長" is currently a fallback I used, so I mark it as "Quasi-missing" if it looks generic like "新豐村村長"
                        // Actually, my fallback was `${village}${suffix}`.
                        if (data.chief?.name === `${village}里長` || data.chief?.name === `${village}村長`) {
                            missing.push(`chief (${data.chief.name})`);
                        }
                        if (data.chief?.name === "待填寫") {
                            missing.push(`chief (待填寫)`);
                        }
                    }

                    if (!data.introduction || data.introduction.includes("待填寫") || data.introduction.startsWith("本里位於...")) {
                        // Optional: strict check for introduction quality
                        // For now, focus on hard data (Pop/Chief)
                    }

                    if (missing.length > 0) {
                        results.push({
                            city,
                            district,
                            village,
                            missingFields: missing
                        });
                    }
                } catch (e) {
                    console.error(`Error reading ${wikiPath}`, e);
                }
            }
        }
    }

    // Report
    console.log(`=== Data Audit Report ===`);
    console.log(`Found ${results.length} villages with potentially incomplete data.\n`);

    // Group by District
    const byDistrict: Record<string, AuditResult[]> = {};
    results.forEach(r => {
        const key = `${r.city}/${r.district}`;
        if (!byDistrict[key]) byDistrict[key] = [];
        byDistrict[key].push(r);
    });

    for (const [key, items] of Object.entries(byDistrict)) {
        console.log(`\n📂 ${key} (${items.length} incompletes):`);
        items.slice(0, 10).forEach(item => {
            console.log(`  - ${item.village}: ${item.missingFields.join(', ')}`);
        });
        if (items.length > 10) console.log(`  ... and ${items.length - 10} more.`);
    }
}

auditData();
