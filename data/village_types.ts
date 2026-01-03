/**
 * 新竹縣市村里文化類型分類系統
 * Cultural Village Type Taxonomy for Hsinchu Region
 */

export interface VillageSubtype {
    id: string;
    name: string;
    emoji: string;
    description: string;
    keywords: string[];
}

export interface VillageCategory {
    id: string;
    name: string;
    emoji: string;
    color: string;
    description: string;
    subtypes: VillageSubtype[];
}

// 主分類與子類型
export const VILLAGE_CATEGORIES: VillageCategory[] = [
    {
        id: 'tech_urban',
        name: '科技與核心城區',
        emoji: '🏙️',
        color: '#4A90D9',
        description: '現代/高度都市化',
        subtypes: [
            { id: 'silicon_valley', name: '科技矽谷區', emoji: '💻', description: '竹科、關新里、龍山', keywords: ['竹科', '關新', '龍山', '科學園區'] },
            { id: 'hsr_zone', name: '高鐵特區', emoji: '🚄', description: '竹北六家、東側重劃區', keywords: ['六家', '高鐵', '重劃區'] },
            { id: 'county_core', name: '縣治核心區', emoji: '🏛️', description: '竹北行政中心、光明商圈', keywords: ['竹北市', '光明', '行政'] },
            { id: 'industrial_corridor', name: '香山工業走廊', emoji: '🏭', description: '機械、傳統製造、移工集散', keywords: ['香山', '工業', '移工'] }
        ]
    },
    {
        id: 'heritage_commercial',
        name: '人文舊城與商業',
        emoji: '🏯',
        color: '#C88A75',
        description: '文史/閩客混合',
        subtypes: [
            { id: 'old_city', name: '城隍廟舊城', emoji: '🏮', description: '竹市核心、老字號小吃', keywords: ['城隍廟', '北門', '長和', '老城'] },
            { id: 'zhudong_market', name: '竹東大市', emoji: '🛒', description: '客家第一大鎮、傳統早市核心', keywords: ['竹東', '下公館', '中央市場'] },
            { id: 'military_village', name: '眷村記憶區', emoji: '🎖️', description: '黑蝙蝠中隊、眷村博物館周邊', keywords: ['眷村', '黑蝙蝠', '東大路'] },
            { id: 'harbor_life', name: '港埠生活圈', emoji: '⚓', description: '南寮、漁港文化', keywords: ['南寮', '漁港', '海濱'] }
        ]
    },
    {
        id: 'hakka_classic',
        name: '客家經典聚落',
        emoji: '🏡',
        color: '#8DAA91',
        description: '純客家/丘陵/人文',
        subtypes: [
            { id: 'route3_hakka', name: '台三線客庄', emoji: '🛤️', description: '新埔、關西、北埔', keywords: ['新埔', '關西', '北埔', '台三線'] },
            { id: 'ancestral_hall', name: '夥房聚落', emoji: '🏠', description: '以宗祠為中心的傳統客家生活圈', keywords: ['宗祠', '祠堂', '夥房'] },
            { id: 'persimmon_lane', name: '柿餅長廊', emoji: '🍊', description: '新埔旱坑一帶', keywords: ['旱坑', '柿餅', '曬柿'] },
            { id: 'tea_mountain', name: '茶山地帶', emoji: '🍵', description: '峨眉、北埔的東方美人茶區', keywords: ['峨眉', '茶園', '東方美人', '膨風茶'] },
            { id: 'herb_village', name: '仙草之鄉', emoji: '🌿', description: '關西鎮核心', keywords: ['關西', '仙草', '仙草巷'] }
        ]
    },
    {
        id: 'indigenous_mountain',
        name: '原民原鄉與山域',
        emoji: '⛰️',
        color: '#9B7EBD',
        description: '部落/生態',
        subtypes: [
            { id: 'front_mountain', name: '前山部落', emoji: '🏕️', description: '尖石那羅、煤源、五峰大隘', keywords: ['那羅', '煤源', '大隘', '前山'] },
            { id: 'back_mountain', name: '後山秘境', emoji: '🌲', description: '司馬庫斯、鎮西堡、新光部落', keywords: ['司馬庫斯', '鎮西堡', '新光', '玉峰'] },
            { id: 'saisiat_ritual', name: '賽夏祭儀區', emoji: '🎭', description: '五峰大隘，偏向賽夏族文化', keywords: ['賽夏', '矮靈祭', 'paSta\'ay'] },
            { id: 'atayal_hunting', name: '泰雅獵場', emoji: '🏹', description: '尖石深山區域', keywords: ['泰雅', '獵場', '深山'] }
        ]
    },
    {
        id: 'coastal_farming',
        name: '濱海與農漁',
        emoji: '🌊',
        color: '#5DADE2',
        description: '風土/自然',
        subtypes: [
            { id: 'wind_coast', name: '風城海岸線', emoji: '🌬️', description: '十七公里海岸、濕地', keywords: ['十七公里', '海岸', '濕地', '港南'] },
            { id: 'fishing_village', name: '坡頭漁家', emoji: '🎣', description: '新豐海岸、漁港文化', keywords: ['新豐', '坡頭', '鳳坑', '漁港'] },
            { id: 'watermelon_plain', name: '西瓜平原', emoji: '🍉', description: '新豐、湖口靠近出海口的農業區', keywords: ['西瓜', '農田', '平原'] }
        ]
    },
    {
        id: 'satellite_transitional',
        name: '衛星與邊際',
        emoji: '🔀',
        color: '#95A5A6',
        description: '過渡/混合',
        subtypes: [
            { id: 'hukou_old_street', name: '湖口老街區', emoji: '🧱', description: '紅磚建築、鐵道文化', keywords: ['湖口', '老街', '鐵道'] },
            { id: 'xinfeng_edu', name: '新豐文教區', emoji: '📚', description: '學區、工業區交界', keywords: ['新豐', '明新', '學區'] },
            { id: 'baoshan_reservoir', name: '寶山水庫區', emoji: '💧', description: '鄰近科學園區的隱密豪宅與農村混合帶', keywords: ['寶山', '水庫', '二期'] }
        ]
    }
];

// 快速查找 - 村里名稱對應類型
export const VILLAGE_TYPE_MAPPING: Record<string, string> = {
    // 科技矽谷區
    '關新里': 'silicon_valley',
    '龍山里': 'silicon_valley',
    '金山里': 'silicon_valley',
    '科園里': 'silicon_valley',

    // 高鐵特區
    '六家里': 'hsr_zone',
    '東興里': 'hsr_zone',
    '隘口里': 'hsr_zone',

    // 縣治核心區
    '光明里': 'county_core',
    '北崙里': 'county_core',
    '中興里': 'county_core',

    // 香山工業走廊
    '虎林里': 'industrial_corridor',
    '浸水里': 'industrial_corridor',
    '朝山里': 'industrial_corridor',

    // 城隍廟舊城
    '長和里': 'old_city',
    '北門里': 'old_city',
    '西門里': 'old_city',
    '中山里': 'old_city',

    // 竹東大市
    '下公館里': 'zhudong_market',
    '榮華里': 'zhudong_market',
    '中正里': 'zhudong_market',

    // 眷村記憶區
    '光復里': 'military_village',
    '忠貞里': 'military_village',

    // 港埠生活圈
    '南寮里': 'harbor_life',
    '舊港里': 'harbor_life',

    // 台三線客庄
    '旱坑里': 'route3_hakka',
    '南園里': 'route3_hakka',
    '北埔里': 'route3_hakka',

    // 夥房聚落
    '義民里': 'ancestral_hall',
    '新埔里': 'ancestral_hall',

    // 柿餅長廊
    '巨埔里': 'persimmon_lane',

    // 茶山地帶
    '峨眉里': 'tea_mountain',
    '湖光里': 'tea_mountain',
    '南埔里': 'tea_mountain',

    // 仙草之鄉
    '東光里': 'herb_village',
    '南山里': 'herb_village',
    '石光里': 'herb_village',

    // 前山部落
    '那羅里': 'front_mountain',
    '煤源里': 'front_mountain',
    '大隘里': 'front_mountain',
    '義興里': 'front_mountain',

    // 後山秘境
    '玉峰里': 'back_mountain',
    '秀巒里': 'back_mountain',
    '新樂里': 'back_mountain',

    // 賽夏祭儀區
    '花園里': 'saisiat_ritual',
    '桃山里': 'saisiat_ritual',

    // 泰雅獵場
    '嘉樂里': 'atayal_hunting',
    '梅花里': 'atayal_hunting',

    // 風城海岸線
    '港南里': 'wind_coast',
    '金城里': 'wind_coast',
    '香村里': 'wind_coast',

    // 坡頭漁家
    '坡頭里': 'fishing_village',
    '鳳坑里': 'fishing_village',

    // 西瓜平原
    '後湖里': 'watermelon_plain',
    '大湖里': 'watermelon_plain',

    // 湖口老街區
    '湖口里': 'hukou_old_street',
    '湖鏡里': 'hukou_old_street',

    // 新豐文教區
    '新豐里': 'xinfeng_edu',
    '明新里': 'xinfeng_edu',

    // 寶山水庫區
    '寶山里': 'baoshan_reservoir',
    '雙溪里': 'baoshan_reservoir',
    '油田里': 'baoshan_reservoir',
    '大崎里': 'baoshan_reservoir',
};

// Helper functions
export const getVillageSubtype = (subtypeId: string): VillageSubtype | null => {
    for (const category of VILLAGE_CATEGORIES) {
        const subtype = category.subtypes.find(s => s.id === subtypeId);
        if (subtype) return subtype;
    }
    return null;
};

export const getVillageCategory = (subtypeId: string): VillageCategory | null => {
    for (const category of VILLAGE_CATEGORIES) {
        if (category.subtypes.some(s => s.id === subtypeId)) {
            return category;
        }
    }
    return null;
};

export const getVillageTypeByName = (villageName: string): { category: VillageCategory; subtype: VillageSubtype } | null => {
    const subtypeId = VILLAGE_TYPE_MAPPING[villageName];
    if (!subtypeId) return null;

    const subtype = getVillageSubtype(subtypeId);
    const category = getVillageCategory(subtypeId);

    if (subtype && category) {
        return { category, subtype };
    }
    return null;
};

// Get display info for a village
export const getVillageTypeDisplay = (villageName: string): {
    categoryName: string;
    subtypeName: string;
    emoji: string;
    color: string;
    description: string;
} => {
    const typeInfo = getVillageTypeByName(villageName);

    if (typeInfo) {
        return {
            categoryName: typeInfo.category.name,
            subtypeName: typeInfo.subtype.name,
            emoji: typeInfo.subtype.emoji,
            color: typeInfo.category.color,
            description: typeInfo.subtype.description
        };
    }

    // Default fallback
    return {
        categoryName: '一般社區',
        subtypeName: '城鄉混合區',
        emoji: '🏘️',
        color: '#95A5A6',
        description: '兼具城市與鄉村特色的社區'
    };
};
