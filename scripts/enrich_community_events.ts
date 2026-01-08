
import fs from 'fs';
import path from 'path';

// Define recurring event patterns
const EVENT_PATTERNS = [
    {
        title: '社區環境清潔日',
        description: '維護家園整潔，從你我做起。歡迎各位鄰里攜手合作，共同清理公共區域，營造宜居環境。',
        time: '08:00 - 11:00',
        tags: ['環境服務', '志工回饋'],
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop',
        category: 'environment'
    },
    {
        title: '銀髮族健康促進講座',
        description: '邀請專業講師分享樂齡運動與營養知識，現場提供血壓測量與健康諮詢。',
        time: '14:00 - 16:00',
        tags: ['健康講座', '樂齡關懷'],
        image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop',
        category: 'health'
    },
    {
        title: '資源回收與物資再利用',
        description: '推廣零浪費生活，現場提供二手物交換平台與專業分類指導，參與者可獲得精美小禮。',
        time: '09:00 - 12:00',
        tags: ['環保議題', '永續發展'],
        image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop',
        category: 'eco'
    },
    {
        title: '社區幸福共餐日',
        description: '一人一菜或是由志工媽媽掌勺，大家齊聚一堂分享美食與日常，溫暖社區每個角落。',
        time: '11:30 - 13:30',
        tags: ['共餐活動', '鄰里連結'],
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800&auto=format&fit=crop',
        category: 'social'
    }
];

const LOCAL_DB_PATH = path.resolve('data/local_db');

function getFutureDate(daysFromNow: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
}

async function run() {
    console.log('🚀 Starting Community Events Enrichment...');

    let villageCount = 0;
    let eventCount = 0;

    const cities = fs.readdirSync(LOCAL_DB_PATH);

    for (const city of cities) {
        if (city.startsWith('.')) continue;
        const cityPath = path.join(LOCAL_DB_PATH, city);
        if (!fs.statSync(cityPath).isDirectory()) continue;

        const districts = fs.readdirSync(cityPath);
        for (const district of districts) {
            if (district.startsWith('.')) continue;
            const districtPath = path.join(cityPath, district);
            if (!fs.statSync(districtPath).isDirectory()) continue;

            const villages = fs.readdirSync(districtPath);
            for (const village of villages) {
                if (village.startsWith('.')) continue;
                const villagePath = path.join(districtPath, village);
                if (!fs.statSync(villagePath).isDirectory()) continue;

                const eventsPath = path.join(villagePath, 'events.json');
                const wikiPath = path.join(villagePath, 'wiki.json');

                // Only inject if wiki exists (valid community)
                if (!fs.existsSync(wikiPath)) continue;

                try {
                    // Always refresh or create 3 recurring events for consistency
                    const events = [];

                    // Pick 3 patterns randomly or sequentially
                    const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, 3);

                    indices.forEach((idx, i) => {
                        const pattern = EVENT_PATTERNS[idx];
                        // Distribute dates over the next 30 days
                        const daysOffset = (i + 1) * 7 + Math.floor(Math.random() * 5);

                        events.push({
                            id: `evt-${city}-${district}-${village}-${i}`,
                            title: pattern.title,
                            description: pattern.description,
                            date: getFutureDate(daysOffset),
                            time: pattern.time,
                            location: `${village}活動中心`,
                            tags: pattern.tags,
                            coverImage: pattern.image,
                            likes: Math.floor(Math.random() * 20),
                            comments: Math.floor(Math.random() * 5),
                            shares: Math.floor(Math.random() * 3)
                        });
                        eventCount++;
                    });

                    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
                    villageCount++;
                } catch (e) {
                    console.error(`❌ Error in ${village}:`, e);
                }
            }
        }
    }

    console.log(`🎉 Finished. Enriched ${villageCount} villages with ${eventCount} events.`);
}

run();
