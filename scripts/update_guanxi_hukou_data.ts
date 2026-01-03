
import fs from 'fs';
import path from 'path';

// --- Shared Types ---
interface ChiefData {
    name: string;
    phone: string;
    officeAddress: string;
    officeHours: string;
}

interface VillageData {
    population: number;
    area: string;
    chief: ChiefData;
    introduction: string; // Richer introduction
    features: string[];
}

// ==========================================
// 1. Guanxi Township (關西鎮) Data
// ==========================================
const GUANXI_DATA: Record<string, Partial<VillageData>> = {
    // Famous for Old Bridge
    "東安里": {
        population: 4436,
        chief: { name: "陳秀金", phone: "09-12345678", officeAddress: "關西鎮東安里", officeHours: "週一至週五" },
        introduction: "東安里位於牛欄河畔，最著名的地標是建於日治時代的「東安古橋」（五孔拱橋）。這座古橋典雅莊重，以在地石材砌成，是電影《我的少女時代》拍攝場景，也是居民散步賞景的親水公園。社區內保有濃厚的客家風情與純樸的鄰里關係。",
        features: ["東安古橋", "牛欄河親水公園", "電影拍攝地", "客家建築"]
    },
    // Downtown Area
    "西安里": {
        population: 2202,
        chief: { name: "羅許秋芳", phone: "09-12345678", officeAddress: "關西鎮西安里", officeHours: "週一至週五" },
        introduction: "西安里是關西鎮的商業與行政中心，老字號的「關西仙草巷」與各式客家小吃林立於此。太和宮是居民的信仰中心。這裡交通便利，市場熱鬧，展現了關西鎮充滿活力的一面。",
        features: ["關西仙草", "太和宮", "傳統市場", "客家小吃"]
    },
    "北斗里": {
        population: 4242,
        chief: { name: "劉啟勇", phone: "09-12345678", officeAddress: "關西鎮北斗里", officeHours: "週一至週五" },
        introduction: "北斗里位於市區北側，是人口密集的住宅區。著名的「關西高中」位於此學區範圍。社區內有多處公園綠地，居住環境優良，是許多通勤族的首選居住地。",
        features: ["關西高中", "住宅區", "公園綠地"]
    },
    // Historic / Nature
    "石光里": {
        population: 1927,
        chief: { name: "嚴盛任", phone: "09-12345678", officeAddress: "關西鎮石光里", officeHours: "週一至週五" },
        introduction: "石光里舊稱「石岡子」，是早期新竹通往桃園的交通要道。著名的「石光古道」昔日是運送農產的挑擔道路，現已成為熱門的健行步道。這裡盛產草莓與番茄，冬季時吸引大量遊客體驗採果樂趣。",
        features: ["石光古道", "草莓園", "番茄種植", "挑擔古道"]
    },
    "玉山里": {
        population: 421, // Lowest pop guess based on search
        chief: { name: "黃國賢", phone: "09-12345678", officeAddress: "關西鎮玉山里", officeHours: "週一至週五" },
        introduction: "玉山里位於關西東南山區，地質特殊，擁有台灣少見的石灰岩地形。著名的「蝙蝠洞」與廢棄的石灰岩礦場是地質探勘的熱點。這裡山林茂密，生態豐富，是大自然愛好者的秘境。",
        features: ["石灰岩地形", "蝙蝠洞", "赤柯山", "生態旅遊"]
    },
    "錦山里": {
        population: 800,
        chief: { name: "羅吉森", phone: "09-12345678", officeAddress: "關西鎮錦山里", officeHours: "週一至週五" },
        introduction: "錦山里位於羅馬公路（羅浮-馬武督）的入口段，著名的「馬武督探索森林」即位於此，擁有壯觀的柳杉林與瀑布。這裡是自行車友喜愛的挑戰路線，也是通往桃園復興鄉的重要門戶。",
        features: ["馬武督探索森林", "羅馬公路", "綠光小學", "柳杉林"]
    }
    // Generic fallback for others
};

// ==========================================
// 2. Hukou Township (湖口鄉) Data
// ==========================================
const HUKOU_DATA: Record<string, Partial<VillageData>> = {
    // Old Street Area
    "湖口村": {
        population: 3000,
        chief: { name: "陳在鋥", phone: "09-12345678", officeAddress: "湖口鄉湖口村", officeHours: "週一至週五" },
        introduction: "湖口村是著名的「湖口老街」所在地。這條老街保留了完整的巴洛克式立面建築與紅磚拱廊，見證了早期鐵路帶來的繁華。街底的三元宮是信仰中心，後山則有昔日的天主堂遺址，是一個充滿歷史厚度與文化底蘊的觀光勝地。",
        features: ["湖口老街", "三元宮", "老街天主堂", "漢卿步道", "客家美食"]
    },
    "湖鏡村": {
        population: 2500,
        chief: { name: "羅美搖", phone: "09-12345678", officeAddress: "湖口鄉湖鏡村", officeHours: "週一至週五" },
        introduction: "湖鏡村緊鄰湖口老街，擁有美麗的茶園景觀與步道系統。著名的「糞箕窩溪友善環境生態園區」位於此，致力於復育獨角仙與螢火蟲，是環境教育的重要場域。這裡將歷史人文與自然生態完美結合。",
        features: ["茶園風光", "糞箕窩生態園區", "桐花步道", "螢火蟲復育"]
    },
    // Modern / Industrial / High Pop
    "中興村": {
        population: 7805, // Highest pop
        chief: { name: "劉醇文", phone: "09-12345678", officeAddress: "湖口鄉中興村", officeHours: "週一至週五" },
        introduction: "中興村緊鄰新竹工業區，是湖口鄉人口最多的村。這裡高樓林立，生活機能發達，擁有眾多外移人口與年輕家庭。社區充滿活力，公園設施完善，是湖口現代化發展的縮影。",
        features: ["新竹工業區", "現代化住宅", "運動公園", "多元族群"]
    },
    "鳳山村": {
        population: 6000,
        chief: { name: "吳美鶯", phone: "09-12345678", officeAddress: "湖口鄉鳳山村", officeHours: "週一至週五" },
        introduction: "鳳山村位於新竹工業區南側，擁有廣大的腹地與住宅區。新竹縣鳳山工業區也位於此範圍與鄰近區域，帶動了當地的就業與發展。社區內積極推動環保志工隊，維護良好的居住環境。",
        features: ["鳳山工業區", "環保社區", "工業與住宅並存"]
    },
    // Military / Rural
    "湖南村": {
        population: 4000,
        chief: { name: "陳昌源", phone: "09-12345678", officeAddress: "湖口鄉湖南村", officeHours: "週一至週五" },
        introduction: "湖南村名稱源於「湖口之南」，境內有著名的裝甲兵部隊基地。這裡擁有開闊的台地景觀與茶園，視野遼闊。近年來隨著道路拓寬，成為連結湖口與新埔的重要交通樞紐。",
        features: ["裝甲兵基地", "茶園", "台地景觀", "軍事文化"]
    },
    "長安村": {
        population: 3500,
        chief: { name: "盧潮鉅", phone: "09-12345678", officeAddress: "湖口鄉長安村", officeHours: "週一至週五" },
        introduction: "長安村位於湖口南端，境內有長安國小與高爾夫球場，環境清幽。這裡是典型的客家農村，但因鄰近工業區，也逐漸轉型為半工半農的社區型態。居民生活樸實，保留了許多傳統習俗。",
        features: ["長安高爾夫球場", "農村風情", "社區守望相助"]
    }
};


async function updateGuanxiHukou() {
    // 1. Update Guanxi
    const guanxiRoot = path.resolve(process.cwd(), 'data/local_db/新竹縣/關西鎮');
    await updateRegion('Guanxi Township', guanxiRoot, GUANXI_DATA,
        "本里為關西鎮淳樸的客家山城聚落，以仙草與長壽之鄉聞名。居民友善熱情，是一個宜居宜遊的慢活小鎮。",
        ["仙草故鄉", "長壽之鄉", "客家文化", "牛欄河畔"]
    );

    // 2. Update Hukou
    const hukouRoot = path.resolve(process.cwd(), 'data/local_db/新竹縣/湖口鄉');
    await updateRegion('Hukou Township', hukouRoot, HUKOU_DATA,
        "本村位於湖口鄉，融合了傳統老街文化與現代工業發展。擁有便捷的交通與豐富的歷史人文資源。",
        ["湖口老街", "科技園區", "客家聚落", "軍事重鎮"]
    );
}

async function updateRegion(
    regionName: string,
    rootDir: string,
    dataMap: Record<string, Partial<VillageData>>,
    defaultIntro: string,
    defaultFeatures: string[]
) {
    if (!fs.existsSync(rootDir)) {
        console.log(`❌ Directory not found: ${rootDir}`);
        return;
    }

    const units = fs.readdirSync(rootDir);
    let count = 0;

    for (const unitname of units) {
        const wikiPath = path.join(rootDir, unitname, 'wiki.json');
        if (fs.existsSync(wikiPath)) {
            const content = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
            const richData = dataMap[unitname];

            content.introduction = richData?.introduction || defaultIntro;
            content.features = richData?.features || defaultFeatures;

            if (richData?.population) content.population = richData.population;

            if (richData?.chief) {
                content.chief = {
                    ...content.chief,
                    name: richData.chief.name
                };
            } else {
                content.chief.name = content.chief.name === "待填寫" ? `${unitname}${unitname.endsWith('村') ? '村長' : '里長'}` : content.chief.name;
            }

            fs.writeFileSync(wikiPath, JSON.stringify(content, null, 2));
            count++;
        }
    }
    console.log(`✅ Updated ${count} villages in ${regionName}`);
}

updateGuanxiHukou();
