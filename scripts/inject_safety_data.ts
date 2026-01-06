
import fs from 'fs';
import path from 'path';

// --- Types (Mirrors mock_public.ts) ---
interface SafetyInfo {
    alerts: {
        id: string;
        type: 'typhoon' | 'earthquake' | 'wind' | 'rain' | 'general';
        level: 'low' | 'medium' | 'high';
        title: string;
        description: string;
        date: string;
    }[];
    patrolStatus: {
        status: 'active' | 'inactive' | 'reinforced';
        lastPatrolTime?: string;
        description: string;
    };
    contacts: {
        name: string;
        title: string;
        phone: string;
    }[];
}

interface VillageWiki {
    safety?: SafetyInfo;
    [key: string]: any;
}

const LOCAL_DB_PATH = path.resolve(process.cwd(), 'data/local_db');

// --- Geography / Safety Rules ---
const COASTAL_TOWNS = ['竹北市', '新豐鄉'];
const MOUNTAIN_TOWNS = ['尖石鄉', '五峰鄉', '橫山鄉', '關西鎮'];
const CITY_TOWNS = ['竹北市', '新竹市', '竹東鎮']; // Overlap intended

const MOCK_CONTACTS = [
    { name: '林志強', title: '里長', phone: '0912-345-678' },
    { name: '陳建宏', title: '巡守隊長', phone: '0922-888-999' },
    { name: '王淑芬', title: '鄰長', phone: '0933-444-555' }
];

function generateSafetyInfo(town: string, village: string): SafetyInfo {
    const alerts: SafetyInfo['alerts'] = [];
    const contacts = [...MOCK_CONTACTS].sort(() => Math.random() - 0.5).slice(0, 2);

    // 1. Geography Based Alerts
    if (MOUNTAIN_TOWNS.includes(town)) {
        alerts.push({
            id: `alert_${Date.now()}_1`,
            type: 'rain',
            level: 'medium',
            title: '山區豪雨特報',
            description: '午後易有雷陣雨，山區道路請小心落石，非必要請勿前往溪邊戲水。',
            date: new Date().toLocaleDateString('zh-TW')
        });
        if (town === '尖石鄉') {
            alerts.push({
                id: `alert_${Date.now()}_2`,
                type: 'general',
                level: 'high',
                title: '道路維修通知',
                description: '竹60線部分路段邊坡維護工程，請依現場交管行駛。',
                date: new Date().toLocaleDateString('zh-TW')
            });
        }
    } else if (COASTAL_TOWNS.includes(town)) {
        alerts.push({
            id: `alert_${Date.now()}_3`,
            type: 'wind',
            level: 'medium',
            title: '強風特報',
            description: '沿海地區風力增強，易有長浪發生，請避免前往海邊活動。',
            date: new Date().toLocaleDateString('zh-TW')
        });
    }

    // 2. City Based Alerts (Dengue, Patrol)
    if (CITY_TOWNS.includes(town)) {
        alerts.push({
            id: `alert_${Date.now()}_4`,
            type: 'general',
            level: 'low',
            title: '登革熱防治',
            description: '請落實「巡、倒、清、刷」，清除積水容器，守護家園。',
            date: new Date().toLocaleDateString('zh-TW')
        });
    }

    // 3. Patrol Status (Randomized but logical)
    const isNight = new Date().getHours() >= 18;
    const patrolInfo: SafetyInfo['patrolStatus'] = {
        status: isNight ? 'active' : 'inactive',
        lastPatrolTime: isNight ? '20:00' : '昨晚 22:30',
        description: isNight ? '夜間巡守進行中，重點巡視公園與死角。' : '日間巡邏已完成，狀況良好。'
    };

    // Special case for reinforced
    if (Math.random() > 0.8) {
        patrolInfo.status = 'reinforced';
        patrolInfo.description = '加強節日巡守，增派人力維護治安。';
    }

    return {
        alerts,
        patrolStatus: patrolInfo,
        contacts
    };
}

// --- Main Walker ---
function walkAndInject(dir: string, segments: string[]) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            walkAndInject(path.join(dir, item.name), [...segments, item.name]);
        } else if (item.name === 'wiki.json') {
            if (segments.length >= 3) {
                const town = segments[1];
                const village = segments[2];
                const filePath = path.join(dir, item.name);

                try {
                    const wiki: VillageWiki = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    const newSafety = generateSafetyInfo(town, village);

                    // Inject Safety Data
                    wiki.safety = newSafety;

                    fs.writeFileSync(filePath, JSON.stringify(wiki, null, 2));
                    //  console.log(`✅ Injected Safety into ${town}_${village}`);
                } catch (e) {
                    console.error(`Error processing ${filePath}:`, e);
                }
            }
        }
    }
}

console.log("🚀 Injecting Safety Data...");
walkAndInject(LOCAL_DB_PATH, []);
console.log("✨ Done!");
