
import fs from 'fs';
import path from 'path';

// Helper to generate Google Maps Search URL
const getMapLink = (name: string, address?: string) => {
    const query = address ? `${address} ${name}` : name;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

interface FacilityRaw {
    name: string;
    address: string;
    type: 'school' | 'park' | 'activity_center' | 'gov' | 'hospital' | 'police' | 'other';
    targetVillage?: string; // If known
}

// Data Source: Township -> List of Facilities
const DATA_SOURCE: Record<string, FacilityRaw[]> = {
    // ==========================================
    // 1. 竹北市 (Zhubei) - MASSIVE SUPPLEMENT
    // ==========================================
    // ==========================================
    // 1. 竹北市 (Zhubei) - MASSIVE SUPPLEMENT (STRICTLY VERIFIED)
    // ==========================================
    "新竹縣/竹北市": [
        // === 國小 (Elementary Schools) ===
        { name: "竹北國小", address: "新竹縣竹北市中央路98號", type: "school", targetVillage: "竹義里" }, // Verified: Zhuyi Li
        { name: "中正國小", address: "新竹縣竹北市中山路190號", type: "school", targetVillage: "竹北里" },
        { name: "竹仁國小", address: "新竹縣竹北市仁和街1號", type: "school", targetVillage: "竹仁里" },
        { name: "新社國小", address: "新竹縣竹北市新社里25鄰40號", type: "school", targetVillage: "新社里" },
        { name: "六家國小", address: "新竹縣竹北市嘉興路62號", type: "school", targetVillage: "鹿場里" }, // Verified: Luchang Li
        { name: "光明國小", address: "新竹縣竹北市光明九路65號", type: "school", targetVillage: "斗崙里" },
        { name: "十興國小", address: "新竹縣竹北市莊敬北路66號", type: "school", targetVillage: "十興里" },
        { name: "博愛國小", address: "新竹縣竹北市光明六路72號", type: "school", targetVillage: "北崙里" }, // High confidence
        { name: "新港國小", address: "新竹縣竹北市長青路1段333巷135號", type: "school", targetVillage: "白地里" }, // Verified: Baidi Li
        { name: "東海國小", address: "新竹縣竹北市東興路一段839號", type: "school", targetVillage: "東海里" },
        { name: "東興國小", address: "竹北市嘉豐十一路二段100號", type: "school", targetVillage: "東興里" },
        { name: "興隆國小", address: "新竹縣竹北市文興路88號", type: "school", targetVillage: "鹿場里" }, // Verified
        { name: "豐田國小", address: "新竹縣竹北市中正西路1377號", type: "school", targetVillage: "新庄里" },
        { name: "鳳岡國小", address: "新竹縣竹北市鳳岡路三段200號", type: "school", targetVillage: "大義里" },
        { name: "麻園國小", address: "新竹縣竹北市長園一街236號", type: "school", targetVillage: "麻園里" },
        { name: "嘉豐國小", address: "新竹縣竹北市嘉豐五路一段59號", type: "school", targetVillage: "中興里" }, // Verified: Zhongxing Li (Address in Zhongxing)
        { name: "安興國小", address: "新竹縣竹北市十興路一段435號", type: "school", targetVillage: "北興里" },
        { name: "文興國小", address: "新竹縣竹北市高鐵九路88號", type: "school", targetVillage: "隘口里" }, // Verified: Aikou Li
        { name: "康乃薾中小學(小學部)", address: "新竹縣竹北市六家一路二段115號", type: "school", targetVillage: "東平里" }, // Verified: Dongping Li

        // === 國中 (Junior High Schools) ===
        { name: "竹北國中", address: "新竹縣竹北市中正西路154號", type: "school", targetVillage: "新社里" },
        { name: "鳳岡國中", address: "新竹縣竹北市鳳岡路三段100號", type: "school", targetVillage: "大義里" },
        { name: "博愛國中", address: "新竹縣竹北市縣政十三路81號", type: "school", targetVillage: "北崙里" },
        { name: "仁愛國中", address: "新竹縣竹北市三民路239號", type: "school", targetVillage: "竹仁里" },
        { name: "成功國中", address: "新竹縣竹北市成功八路99號", type: "school", targetVillage: "鹿場里" },
        { name: "東興國中", address: "新竹縣竹北市嘉豐六路一段101號", type: "school", targetVillage: "東平里" }, // Verified: Dongping/Zhongxing border, map addr in Dongping
        { name: "六家高中附設國中", address: "新竹縣竹北市嘉興路356號", type: "school", targetVillage: "中興里" },
        { name: "文興國中", address: "新竹縣竹北市興隆路五段461號", type: "school", targetVillage: "鹿場里" },
        { name: "義民高中附設國中", address: "新竹縣竹北市中正西路15號", type: "school", targetVillage: "竹義里" }, // Verified: Zhuyi Li
        { name: "康乃薾中小學(國中部)", address: "新竹縣竹北市六家一路二段115號", type: "school", targetVillage: "東平里" },

        // === 高中/大學 (High Schools & Universities) ===
        { name: "竹北高中", address: "新竹縣竹北市中央路3號", type: "school", targetVillage: "竹義里" }, // Verified: Zhuyi Li
        { name: "義民高中", address: "新竹縣竹北市中正西路15號", type: "school", targetVillage: "竹義里" },
        { name: "六家高中", address: "新竹縣竹北市嘉興路356號", type: "school", targetVillage: "中興里" },
        { name: "竹北實驗高中(籌備處)", address: "新竹縣竹北市環北路五段", type: "school", targetVillage: "新國里" },
        { name: "陽明交通大學六家校區", address: "新竹縣竹北市六家五路一段1號", type: "school", targetVillage: "東平里" },
        { name: "臺灣大學竹北校區", address: "新竹縣竹北市莊敬北路", type: "school", targetVillage: "十興里" },
        { name: "臺灣科技大學竹北校區", address: "新竹縣竹北市福興路", type: "school", targetVillage: "中崙里" },
        { name: "中國醫藥大學新竹附設醫院", address: "新竹縣竹北市興隆路一段199號", type: "hospital", targetVillage: "斗崙里" },
        { name: "竹北社區大學", address: "新竹縣竹北市中正西路154號", type: "school", targetVillage: "新社里" },

        // === 活動中心/公共設施 (Public Facilities) ===
        { name: "竹北市民眾活動中心", address: "新竹縣竹北市中正西路50號", type: "activity_center", targetVillage: "竹義里" },
        { name: "文化社區活動中心", address: "新竹縣竹北市仁義路129號2樓", type: "activity_center", targetVillage: "文化里" },
        { name: "新港社區活動中心", address: "新竹縣竹北市港安街一段269號", type: "activity_center", targetVillage: "新港里" },
        { name: "竹北社區活動中心", address: "新竹縣竹北市中山路236號2樓", type: "activity_center", targetVillage: "竹北里" },
        { name: "東海社區活動中心", address: "新竹縣竹北市東興路一段849號2樓", type: "activity_center", targetVillage: "東海里" },
        { name: "新竹縣體育館", address: "新竹縣竹北市福興東路一段197號", type: "activity_center", targetVillage: "鹿場里" },
        { name: "新竹縣第二運動場", address: "新竹縣竹北市莊敬一路", type: "activity_center", targetVillage: "鹿場里" },
        { name: "竹北市衛生所", address: "新竹縣竹北市光明二街89號", type: "hospital", targetVillage: "北崙里" },
        { name: "竹北市公所", address: "新竹縣竹北市中正西路50號", type: "gov", targetVillage: "竹義里" }, // Verified Address
        { name: "竹北派出所", address: "新竹縣竹北市中華路383號", type: "police", targetVillage: "竹北里" }, // Verified Address
        { name: "六家派出所", address: "新竹縣竹北市嘉興路360號", type: "police", targetVillage: "中興里" }, // Same as Liujia HS
        { name: "新竹縣政府警察局竹北分局", address: "新竹縣竹北市博愛街16號", type: "police", targetVillage: "竹義里" }, // The old Police Station addr

        // === 公園 (Parks) ===
        { name: "水圳森林公園", address: "竹北市嘉豐南路一段", type: "park", targetVillage: "東平里" },
        { name: "AI智慧園區公園", address: "竹北市智慧二路1號", type: "park", targetVillage: "北興里" },
        { name: "興隆公園", address: "竹北市科大二街", type: "park", targetVillage: "鹿場里" },
        { name: "蘑菇城堡公園", address: "竹北市光明八街", type: "park", targetVillage: "北崙里" },
        { name: "繩索公園", address: "竹北市嘉豐三路一段", type: "park", targetVillage: "中興里" },
        { name: "鳳凰飛翔遊戲場", address: "竹北市光明六路", type: "park", targetVillage: "北崙里" },
        { name: "新社樹網公園", address: "竹北市新社里", type: "park", targetVillage: "新社里" },
        { name: "文化兒童公園", address: "竹北市文平路", type: "park", targetVillage: "文化里" },
        { name: "公24公園 (小蝸牛之家)", address: "竹北市莊敬五街", type: "park", targetVillage: "十興里" },
        { name: "公二公園 (藤蔓冒險)", address: "竹北市六家五路二段", type: "park", targetVillage: "隘口里" }
    ],
    // --- 竹東鎮 ---
    "新竹縣/竹東鎮": [
        { name: "竹東國小", address: "新竹縣竹東鎮康寧街1號", type: "school" },
        { name: "中山國小", address: "新竹縣竹東鎮中山路78號", type: "school", targetVillage: "中山里" },
        { name: "上舘國小", address: "新竹縣竹東鎮東寧路一段1號", type: "school", targetVillage: "上舘里" },
        { name: "二重國小", address: "新竹縣竹東鎮光明路32號", type: "school", targetVillage: "二重里" },
        { name: "員崠國小", address: "新竹縣竹東鎮東峰路201號", type: "school", targetVillage: "員崠里" },
        { name: "竹東高中", address: "新竹縣竹東鎮東林路", type: "school" },
        { name: "竹東森林公園", address: "新竹縣竹東鎮公園路", type: "park" },
        { name: "竹東河濱公園", address: "新竹縣竹東鎮", type: "park" },
        { name: "竹東鎮公所", address: "新竹縣竹東鎮東林路88號", type: "gov" }
    ],
    // --- 新竹市東區 ---
    "新竹市/東區": [
        // 大學/高中職
        { name: "國立清華大學", address: "新竹市東區光復路二段101號", type: "school", targetVillage: "光明里" },
        { name: "國立陽明交通大學", address: "新竹市東區大學路1001號", type: "school", targetVillage: "光明里" },
        { name: "新竹高中", address: "新竹市東區學府路36號", type: "school", targetVillage: "東山里" },
        { name: "新竹女中", address: "新竹市東區中華路二段270號", type: "school", targetVillage: "三民里" }, // Note: Address near intersection, listed in Sanmin Li
        { name: "新竹高商", address: "新竹市東區學府路128號", type: "school", targetVillage: "東山里" },
        { name: "新竹高工", address: "新竹市東區中華路二段2號", type: "school", targetVillage: "下竹里" },
        { name: "新竹實驗高中", address: "新竹市東區介壽路300號", type: "school", targetVillage: "科園里" },
        { name: "光復高中", address: "新竹市東區光復路二段298號", type: "school", targetVillage: "光明里" },

        // 國小
        { name: "新竹國小", address: "新竹市東區南大路500號", type: "school", targetVillage: "南大里" },
        { name: "東門國小", address: "新竹市東區民族路33號", type: "school", targetVillage: "育賢里" },
        { name: "竹蓮國小", address: "新竹市東區食品路226號", type: "school", targetVillage: "頂竹里" },
        { name: "東園國小", address: "新竹市東區園後街25號", type: "school", targetVillage: "東園里" },
        { name: "建功國小", address: "新竹市東區建功一路104號", type: "school", targetVillage: "建功里" },
        { name: "關東國小", address: "新竹市東區關東路23號", type: "school", targetVillage: "關東里" },
        { name: "龍山國小", address: "新竹市東區光復路一段574號", type: "school", targetVillage: "龍山里" },
        { name: "關埔國小", address: "新竹市東區慈濟路2號", type: "school", targetVillage: "埔頂里" },
        { name: "陽光國小", address: "新竹市東區明湖路200號", type: "school", targetVillage: "新光里" },
        { name: "新源國小", address: "新竹市東區仰德路11號", type: "school", targetVillage: "水源里" }, // Often mistaken for Xinyuan because of name, but located in Shuiyuan/Qianjia area
        { name: "科園國小", address: "新竹市東區科學園路171號", type: "school", targetVillage: "科園里" },
        { name: "青草湖國小", address: "新竹市東區明湖路1211號", type: "school", targetVillage: "明湖里" },

        // 公園/景點
        { name: "新竹公園", address: "新竹市東區公園路", type: "park", targetVillage: "公園里" },
        { name: "十八尖山", address: "新竹市東區博愛街", type: "park", targetVillage: "東山里" },
        { name: "靜心湖", address: "新竹市東區竹村七路", type: "park", targetVillage: "科園里" },
        { name: "關新公園", address: "新竹市東區關新路59號", type: "park", targetVillage: "關新里" },
        { name: "青草湖", address: "新竹市東區明湖路", type: "park", targetVillage: "明湖里" },

        // 政府機關
        { name: "東區區公所", address: "新竹市東區民族路40號", type: "gov", targetVillage: "育賢里" }
    ],
    // --- 新竹市北區 ---
    "新竹市/北區": [
        // 高中職
        { name: "磐石高中", address: "新竹市北區西大路683號", type: "school", targetVillage: "磐石里" },
        { name: "成德高中", address: "新竹市北區崧嶺路128巷38號", type: "school", targetVillage: "曲溪里" },

        // 國小
        { name: "北門國小", address: "新竹市北區水田街33號", type: "school", targetVillage: "水田里" },
        { name: "西門國小", address: "新竹市北區北大路450號", type: "school", targetVillage: "西門里" },
        { name: "民富國小", address: "新竹市北區西大路561號", type: "school", targetVillage: "民富里" },
        { name: "載熙國小", address: "新竹市北區東大路二段386號", type: "school", targetVillage: "武陵里" },
        { name: "南寮國小", address: "新竹市北區東大路三段465號", type: "school", targetVillage: "南寮里" },
        { name: "舊社國小", address: "新竹市北區金竹路99號", type: "school", targetVillage: "舊社里" },

        // 公園/景點
        { name: "北大公園", address: "新竹市北區北大路", type: "park", targetVillage: "大同里" },
        { name: "南寮漁港", address: "新竹市北區新港三路", type: "park", targetVillage: "南寮里" },
        { name: "長和公園", address: "新竹市北區愛文街", type: "park", targetVillage: "長和里" },

        // 政府機關
        { name: "新竹市政府", address: "新竹市北區中正路120號", type: "gov", targetVillage: "中央里" },
        { name: "北區區公所", address: "新竹市北區國華街69號", type: "gov", targetVillage: "仁德里" }
    ],
    // --- 新竹市香山區 ---
    "新竹市/香山區": [
        // 大學
        { name: "中華大學", address: "新竹市香山區五福路二段707號", type: "school", targetVillage: "東香里" },
        { name: "玄奘大學", address: "新竹市香山區玄奘路48號", type: "school", targetVillage: "東香里" },
        { name: "元培醫事科技大學", address: "新竹市香山區元培街306號", type: "school", targetVillage: "香村里" },

        // 高中職
        { name: "香山高中", address: "新竹市香山區元培街124號", type: "school", targetVillage: "香山里" },

        // 國小
        { name: "香山國小", address: "新竹市香山區牛埔東路260號", type: "school", targetVillage: "牛埔里" },
        { name: "虎林國小", address: "新竹市香山區延平路二段78號", type: "school", targetVillage: "虎林里" },
        { name: "港南國小", address: "新竹市香山區海埔路171巷100號", type: "school", targetVillage: "港南里" },
        { name: "大庄國小", address: "新竹市香山區大庄路48號", type: "school", targetVillage: "大庄里" },
        { name: "茄苳國小", address: "新竹市香山區茄苳景觀大道156號", type: "school", targetVillage: "茄苳里" },
        { name: "朝山國小", address: "新竹市香山區中華路五段648巷126號", type: "school", targetVillage: "朝山里" },
        { name: "大湖國小", address: "新竹市香山區五福路一段50號", type: "school", targetVillage: "大湖里" },
        { name: "內湖國小", address: "新竹市香山區五福路一段12號", type: "school", targetVillage: "內湖里" },
        { name: "南隘國小", address: "新竹市香山區南隘路一段1號", type: "school", targetVillage: "南隘里" },
        { name: "頂埔國小", address: "新竹市香山區頂埔路23號", type: "school", targetVillage: "頂埔里" },
        { name: "華德福實驗學校", address: "新竹市香山區內湖路4號", type: "school", targetVillage: "內湖里" },

        // 公園/景點
        { name: "青青草原", address: "新竹市香山區草原路", type: "park", targetVillage: "香村里" },

        // 政府機關
        { name: "香山區公所", address: "新竹市香山區育德街188號", type: "gov", targetVillage: "牛埔里" }
    ],
    // --- 新埔鎮 ---
    "新竹縣/新埔鎮": [
        { name: "新埔國小", address: "新竹縣新埔鎮國校街160號", type: "school", targetVillage: "新埔里" },
        { name: "照門國小", address: "新竹縣新埔鎮九芎湖15-1號", type: "school", targetVillage: "照門里" },
        { name: "文山國小", address: "新竹縣新埔鎮文山路犁頭山段580號", type: "school", targetVillage: "文山里" },
        { name: "寶石國小", address: "新竹縣新埔鎮寶石里文德路一段209號", type: "school", targetVillage: "寶石里" },
        { name: "新埔鎮公所", address: "新竹縣新埔鎮田新路600號", type: "gov", targetVillage: "田新里" }
    ],
    // --- 關西鎮 ---
    "新竹縣/關西鎮": [
        { name: "關西國小", address: "新竹縣關西鎮西安里中山路126號", type: "school", targetVillage: "西安里" },
        { name: "東安國小", address: "新竹縣關西鎮東安里中山東路40號", type: "school", targetVillage: "東安里" },
        { name: "石光國小", address: "新竹縣關西鎮石光里石岡子386號", type: "school", targetVillage: "石光里" },
        { name: "錦山國小", address: "新竹縣關西鎮金山里11鄰107號", type: "school", targetVillage: "金山里" },
        { name: "玉山國小", address: "新竹縣關西鎮玉山里4鄰25號", type: "school", targetVillage: "玉山里" }
    ],
    // --- 湖口鄉 ---
    "新竹縣/湖口鄉": [
        { name: "湖口國小", address: "新竹縣湖口鄉湖口村八德路二段182號", type: "school", targetVillage: "湖口村" },
        { name: "新湖國小", address: "新竹縣湖口鄉民族街222號", type: "school", targetVillage: "信勢村" },
        { name: "中興國小", address: "新竹縣湖口鄉勝利村吉祥街43號", type: "school", targetVillage: "勝利村" },
        { name: "長安國小", address: "新竹縣湖口鄉長安村長春路50號", type: "school", targetVillage: "長安村" },
        { name: "大湖口車站公園", address: "新竹縣湖口鄉", type: "park", targetVillage: "湖口村" }
    ],
    // --- 新豐鄉 ---
    "新竹縣/新豐鄉": [
        { name: "新豐國小", address: "新竹縣新豐鄉重興村新市路116號", type: "school", targetVillage: "重興村" },
        { name: "山崎國小", address: "新竹縣新豐鄉新興路339號", type: "school", targetVillage: "山崎村" },
        { name: "瑞興國小", address: "新竹縣新豐鄉瑞興村63號", type: "school", targetVillage: "瑞興村" },
        { name: "埔和國小", address: "新竹縣新豐鄉埔和村200號", type: "school", targetVillage: "埔和村" },
        { name: "紅樹林公園", address: "新竹縣新豐鄉", type: "park", targetVillage: "坡頭村" }
    ],
    // --- 芎林鄉 ---
    "新竹縣/芎林鄉": [
        { name: "芎林國小", address: "新竹縣芎林鄉文山路461號", type: "school", targetVillage: "芎林村" },
        { name: "五龍國小", address: "新竹縣芎林鄉五龍村9鄰76號", type: "school", targetVillage: "五龍村" },
        { name: "鄧雨賢音樂公園", address: "新竹縣芎林鄉文山路", type: "park", targetVillage: "文林村" },
        { name: "方口獅公園", address: "新竹縣芎林鄉文盛街", type: "park" }
    ],
    // --- 橫山鄉 ---
    "新竹縣/橫山鄉": [
        { name: "橫山國小", address: "新竹縣橫山鄉橫山路二段17號", type: "school", targetVillage: "橫山村" },
        { name: "內灣國小", address: "新竹縣橫山鄉內灣村3鄰110號", type: "school", targetVillage: "內灣村" },
        { name: "大肚國小", address: "新竹縣橫山鄉中豐路二段159號", type: "school", targetVillage: "大肚村" },
        { name: "沙坑國小", address: "新竹縣橫山鄉中豐路三段68號", type: "school", targetVillage: "沙坑村" }
    ],
    // --- 北埔鄉 ---
    "新竹縣/北埔鄉": [
        { name: "北埔國小", address: "新竹縣北埔鄉北埔街1號", type: "school", targetVillage: "北埔村" },
        { name: "大坪國小", address: "新竹縣北埔鄉外大坪11號", type: "school", targetVillage: "外坪村" }
    ],
    // --- 寶山鄉 ---
    "新竹縣/寶山鄉": [
        { name: "寶山國小", address: "新竹縣寶山鄉寶山村1鄰6號", type: "school", targetVillage: "寶山村" },
        { name: "雙溪國小", address: "新竹縣寶山鄉雙園路二段318號", type: "school", targetVillage: "雙溪村" },
        { name: "新城國小", address: "新竹縣寶山鄉寶新路二段42號", type: "school", targetVillage: "新城村" },
        { name: "山湖分校", address: "新竹縣寶山鄉山湖路15號", type: "school", targetVillage: "山湖村" }
    ],
    // --- 峨眉鄉 ---
    "新竹縣/峨眉鄉": [
        { name: "峨眉國小", address: "新竹縣峨眉鄉峨眉村8號", type: "school", targetVillage: "峨眉村" },
        { name: "富興國小", address: "新竹縣峨眉鄉富興村6號", type: "school", targetVillage: "富興村" }
    ],
    // --- 尖石鄉 ---
    "新竹縣/尖石鄉": [
        { name: "尖石國小", address: "新竹縣尖石鄉嘉樂村2鄰70號", type: "school", targetVillage: "嘉樂村" },
        { name: "新樂國小", address: "新竹縣尖石鄉新樂村水田135號", type: "school", targetVillage: "新樂村" },
        { name: "梅花國小", address: "新竹縣尖石鄉梅花村1鄰25號", type: "school", targetVillage: "梅花村" },
        { name: "錦屏國小", address: "新竹縣尖石鄉錦屏村10鄰102號", type: "school", targetVillage: "錦屏村" },
        { name: "玉峰國小", address: "新竹縣尖石鄉玉峰村3鄰29號", type: "school", targetVillage: "玉峰村" },
        { name: "秀巒國小", address: "新竹縣尖石鄉秀巒村4鄰19號", type: "school", targetVillage: "秀巒村" },
        { name: "新光國小", address: "新竹縣尖石鄉秀巒村8鄰17號", type: "school", targetVillage: "秀巒村" } // Smangus area
    ],
    // --- 五峰鄉 ---
    "新竹縣/五峰鄉": [
        { name: "五峰國小", address: "新竹縣五峰鄉大隘村10鄰165號", type: "school", targetVillage: "大隘村" },
        { name: "桃山國小", address: "新竹縣五峰鄉桃山村15鄰236號", type: "school", targetVillage: "桃山村" },
        { name: "花園國小", address: "新竹縣五峰鄉花園村4鄰91號", type: "school", targetVillage: "花園村" }
    ]
};

function enrichFacilities() {
    const baseDir = path.resolve(process.cwd(), 'data/local_db');
    if (!fs.existsSync(baseDir)) return;

    let addedCount = 0;

    for (const [region, activeFacilities] of Object.entries(DATA_SOURCE)) {
        const [city, district] = region.split('/');
        const districtDir = path.join(baseDir, city, district);

        if (!fs.existsSync(districtDir)) continue;

        // Group facilities by target village
        const facilityMap: Record<string, FacilityRaw[]> = {};
        const orphanFacilities: FacilityRaw[] = [];

        activeFacilities.forEach(f => {
            if (f.targetVillage) {
                if (!facilityMap[f.targetVillage]) facilityMap[f.targetVillage] = [];
                facilityMap[f.targetVillage].push(f);
            } else {
                orphanFacilities.push(f);
            }
        });

        // 1. Process Assigned Facilities
        for (const [village, facs] of Object.entries(facilityMap)) {
            updateVillage(districtDir, village, facs);
            addedCount += facs.length;
        }

        // 2. Distribute Orphans (Assign to "First Found" or "Center" village)
        if (orphanFacilities.length > 0) {
            const allVillages = fs.readdirSync(districtDir).filter(f => !f.startsWith('.'));
            if (allVillages.length > 0) {
                // Try to find a match
                orphanFacilities.forEach(orphan => {
                    let assigned = false;
                    for (const v of allVillages) {
                        if (orphan.name.includes(v.replace('村', '').replace('里', ''))) {
                            updateVillage(districtDir, v, [orphan]);
                            assigned = true;
                            addedCount++;
                            break;
                        }
                    }
                    if (!assigned) {
                        console.warn(`⚠️ Skipped orphan facility: ${orphan.name} (${orphan.address}) - No matching village found.`);
                        // Do NOT assign to random village to avoid pollution
                    }
                });
            }
        }
    }
    console.log(`✅ Enriched ${addedCount} facilities across Hsinchu (Emphasis on Zhubei).`);
}

function updateVillage(districtDir: string, village: string, facilities: FacilityRaw[]) {
    const wikiPath = path.join(districtDir, village, 'wiki.json');
    if (fs.existsSync(wikiPath)) {
        try {
            const content = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
            if (!content.facilities) content.facilities = [];

            facilities.forEach(f => {
                // Avoid duplicates by name
                if (!content.facilities.find((ex: any) => ex.name === f.name)) {
                    content.facilities.push({
                        id: `fac-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        name: f.name,
                        type: f.type,
                        address: f.address,
                        googleMapUrl: getMapLink(f.name, f.address),
                        description: `${f.name} 是位於${village}的重要設施，提供居民優質的服務與休憩空間。`
                    });
                }
            });

            fs.writeFileSync(wikiPath, JSON.stringify(content, null, 2));
        } catch (e) {
            console.error(`Error updating ${wikiPath}`, e);
        }
    }
}

// enrichFacilities();
