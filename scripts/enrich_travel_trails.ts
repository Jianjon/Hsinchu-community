
import fs from 'fs';
import path from 'path';

// Define the trails data with target locations and aesthetic image URLs
const TRAILS = [
    {
        name: '十八尖山',
        description: '新竹市區的「綠色之肺」，步道平緩舒適，適合全齡健行。春天賞花，平日則是市民晨起運動的熱門地點。沿途植物生態豐富，有「北台灣第二陽明山」之美譽。',
        city: '新竹市', district: '東區', village: '仙宮里',
        tags: ['健行', '親子', '賞花'],
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '香山濕地賞蟹步道',
        description: '位於新竹市香山區，擁有豐富的潮間帶生態。心型石滬造型的賞蟹步道最為著名，夕陽西下時分景色絕美，能近距離觀察招潮蟹與彈塗魚。',
        city: '新竹市', district: '香山區', village: '美山里',
        tags: ['生態', '海景', '夕陽'],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '青青草原',
        description: '擁有北台灣最長的磨石子溜滑梯與廣闊的草原腹地。環狀步道穿梭於樹林與草原間，適合野餐、放風箏與親子同樂。',
        city: '新竹市', district: '香山區', village: '大湖里',
        tags: ['親子', '草原', '溜滑梯'],
        imageUrl: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '觀霧榛山步道',
        description: '位於觀霧國家森林遊樂區，步道平緩易行，天氣好時可眺望雪霸聖稜線。春夏之際可欣賞瀕臨絕種的「觀霧山椒魚」與豐富的霧林帶生態。',
        city: '新竹縣', district: '五峰鄉', village: '桃山村',
        tags: ['國家公園', '雲霧', '聖稜線'],
        imageUrl: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '北得拉曼巨木步道',
        description: '台灣海拔最低的紅檜巨木群，也是泰雅族人的聖域。「迴音谷」峭壁地形壯觀，可俯瞰大新竹地區。步道兼具攀岩與森林浴樂趣。',
        city: '新竹縣', district: '尖石鄉', village: '新樂村',
        tags: ['神木', '攀岩', '展望'],
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '司馬庫斯巨木群步道',
        description: '通往「上帝的部落」司馬庫斯，沿途盡是原始森林與竹林。巨木群中最大的「大老爺」神木壯麗無比，此地亦是體驗泰雅文化的核心。',
        city: '新竹縣', district: '尖石鄉', village: '玉峰村',
        tags: ['上帝的部落', '巨木', '原民文化'],
        imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '寶山水庫環湖步道',
        description: '步道穿越兩座美麗的吊橋（寶湖吊橋、碧湖吊橋），湖水碧綠清幽。此處亦是賞桐花的秘境，四五月雪白桐花飄落湖面十分浪漫。',
        city: '新竹縣', district: '寶山鄉', village: '山湖村',
        tags: ['水庫', '吊橋', '桐花'],
        imageUrl: 'https://images.unsplash.com/photo-1433086566085-75239a239af5?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '獅頭山風景區步道',
        description: '橫跨新竹與苗栗，步道群包含水濂洞、六寮古道等。沿途寺廟林立，環境清幽古樸，深具禪意與文史氣息。',
        city: '新竹縣', district: '峨眉鄉', village: '七星村',
        tags: ['宗教', '古道', '禪意'],
        imageUrl: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '飛鳳山步道',
        description: '新竹縣著名的健行勝地，觀日坪视野極佳，天氣晴朗時甚至可遠眺台北101。夕陽落日景觀亦是當地一絕。',
        city: '新竹縣', district: '芎林鄉', village: '新鳳村',
        tags: ['展望', '夕陽', '台北101'],
        imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '秀巒軍艦岩步道',
        description: '位於大新竹後山，控溪吊橋跨越塔克金溪。此處以秋季楓紅聞名，軍艦岩矗立溪中氣勢磅礴，野溪溫泉亦是遊客的最愛。',
        city: '新竹縣', district: '尖石鄉', village: '秀巒村',
        tags: ['楓葉', '溪谷', '溫泉'],
        imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '馬胎古道',
        description: '早期義興村與內灣的交通要道，步道林蔭茂密，沿途有百年茄苳樹與單索吊橋。終點可抵達義興教會，適合懷古踏青。',
        city: '新竹縣', district: '尖石鄉', village: '義興村',
        tags: ['古道', '懷古', '森林'],
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '老鷹溪步道',
        description: '原始自然的山徑，沿途可見清澈見底的溪流與瀑布。步道終點的「裡埔瀑布」飛瀑輕揚，充滿负離子，沁涼舒爽。',
        city: '新竹縣', district: '尖石鄉', village: '玉峰村',
        tags: ['溪流', '瀑布', '芬多精'],
        imageUrl: 'https://images.unsplash.com/photo-1433086566085-75239a239af5?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '鳳崎落日步道',
        description: '跨越新豐與竹北，地勢平緩。此處以「鳳崎晚霞」聞名，可遠眺新竹空軍基地與南寮漁港，落日之美曾名列全台八景。',
        city: '新竹縣', district: '新豐鄉', village: '福興村',
        tags: ['晚霞', '展望', '親子'],
        imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '石牛山步道',
        description: '位於關西鎮錦山里，名列台灣小百岳。山頂有塊巨石酷似坐臥的石牛，登頂後展望絕佳，大壩尖山與石門水庫美景盡收眼底。',
        city: '新竹縣', district: '關西鎮', village: '錦山里',
        tags: ['小百岳', '展望', '攀爬'],
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop'
    },
    {
        name: '內灣南坪古道',
        description: '遊覽完內灣老街後的最佳去處。由此步道上山可居高臨下俯瞰內灣全景，沿途林相豐富，且與「大崎棟古道」相連。',
        city: '新竹縣', district: '橫山鄉', village: '內灣村',
        tags: ['老街', '人文', '慢跑'],
        imageUrl: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?q=80&w=800&auto=format&fit=crop'
    }
];

const LOCAL_DB_PATH = path.resolve('data/local_db');

async function run() {
    console.log('🚀 Starting Hiking Trails Enrichment (with aesthetics)...');

    let successCount = 0;

    for (const trail of TRAILS) {
        const villageDir = path.join(LOCAL_DB_PATH, trail.city, trail.district, trail.village);
        const travelPath = path.join(villageDir, 'travel.json');
        const wikiPath = path.join(villageDir, 'wiki.json');

        if (!fs.existsSync(wikiPath)) {
            console.warn(`⚠️ Target village not found: ${trail.city}/${trail.district}/${trail.village} for trail ${trail.name}`);
            continue;
        }

        try {
            let travelData = [];
            // Load existing travel.json if it exists
            if (fs.existsSync(travelPath)) {
                try {
                    const fileContent = fs.readFileSync(travelPath, 'utf8');
                    const parsed = JSON.parse(fileContent);
                    if (Array.isArray(parsed)) {
                        travelData = parsed;
                    }
                } catch (e) {
                    console.log(`ℹ️ Invalid/Empty travel.json for ${trail.village}, recreating.`);
                }
            }

            // Check if already exists to avoid dupes, but allow UPDATE if names match exactly
            const existingIdx = travelData.findIndex((t: any) => t.name === trail.name);

            const newSpot = {
                id: existingIdx >= 0 ? travelData[existingIdx].id : `trail-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: trail.name,
                description: trail.description,
                tags: [...trail.tags, '輕旅行', '步道'],
                type: 'nature',
                imageUrl: trail.imageUrl,
            };

            if (existingIdx >= 0) {
                travelData[existingIdx] = newSpot;
                console.log(`🔄 Updated existing trail: ${trail.name}`);
            } else {
                travelData.push(newSpot);
                console.log(`✅ Injected new trail: ${trail.name}`);
            }

            // Write back to travel.json
            fs.writeFileSync(travelPath, JSON.stringify(travelData, null, 2), 'utf8');
            successCount++;

        } catch (e) {
            console.error(`❌ Error processing ${trail.name}:`, e);
        }
    }

    console.log(`🎉 Finished. Enriched ${successCount} trails.`);
}

run();
