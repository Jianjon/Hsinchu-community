
const fs = require('fs');
const path = require('path');

const GOOGLE_API_KEY = "AIzaSyBjT6OCa222_-Eh6kUFM0ljNmazGHXjNQg";
const LOCAL_DB_BASE = path.resolve('data/local_db');

const PROMPT_TEMPLATE = (city, district, village, wiki) => `
你是一位專業的地方文史調查員。請為「${city}${district}${village}」撰寫一段深度介紹。
內容必須拆分為「地理環境」與「歷史人文」兩個章節，每個章節約 150 中文字。

【地理錨點】：
- 里長辦事處地址：${wiki.chief?.officeAddress || '未知'}
- 社區發展協會地址：${wiki.association?.address || '未知'}

【寫作要求】：
1. **章節一：地理與環境**
   - 描述該里的微型生活圈、主要街道（如：${wiki.features?.join('、') || '附近的街道'}）、鄰近公園、或自然邊界。
   - 強調其地理位置的優勢（如：通勤便利、景觀環境、商圈核心、工業聚落或農業特色）。
   - **字數要求：約 150 中文字（130-170字之間）。**

2. **章節二：歷史與人文**
   - 描述社區的演變（從早期聚落到現代社會的轉變，如何發展至現況）。
   - 提到具體的居民特質、特有的傳統活動、宗教信仰（如地方廟宇）、或是當地的老地名起源與意涵。
   - 強調該里的「社區氛圍」與凝聚力。
   - **字數要求：約 150 中文字（130-170字之間）。**

【絕對禁令】：
- 嚴格禁止使用「座落於...」、「融合了...」、「展現了...風貌」等罐頭開頭。
- 嚴格禁止內容空泛重複。必須確保這段話換到隔壁村里就不適用。

格式要求（僅輸出 JSON）：
{
  "intro_geo": "地理環境章節內容...",
  "intro_history": "歷史人文章節內容...",
  "features": ["標籤1", "標籤2", ...]
}
`;

async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 1.0,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errBody}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
    }
    return JSON.parse(jsonMatch[0]);
}

async function main() {
    const cities = fs.readdirSync(LOCAL_DB_BASE).filter(c => !c.startsWith('.'));
    console.log(`🚀 Starting multi-city diversification for: ${cities.join(', ')}...`);

    for (const city of cities) {
        const cityPath = path.join(LOCAL_DB_BASE, city);
        const districts = fs.readdirSync(cityPath).filter(d => !d.startsWith('.'));

        console.log(`\n🌆 City: [${city}] (${districts.length} districts)`);

        for (const district of districts) {
            const districtPath = path.join(cityPath, district);
            const villages = fs.readdirSync(districtPath).filter(v => !v.startsWith('.'));

            console.log(`\n📂 District: [${district}] (${villages.length} villages)`);

            for (const village of villages) {
                const wikiPath = path.join(districtPath, village, 'wiki.json');
                if (!fs.existsSync(wikiPath)) continue;

                let wikiData;
                try {
                    wikiData = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
                } catch (e) {
                    console.error(`❌ Failed to read [${village}]:`, e.message);
                    continue;
                }

                // Check if already processed (has both fields and they aren't empty)
                if (wikiData.intro_geo && wikiData.intro_history && wikiData.intro_geo.length > 50) {
                    continue;
                }

                console.log(`📝 [${city}][${district}][${village}] generating content...`);

                try {
                    const prompt = PROMPT_TEMPLATE(city, district, village, wikiData);
                    const aiResult = await callGemini(prompt);

                    wikiData.intro_geo = aiResult.intro_geo;
                    wikiData.intro_history = aiResult.intro_history;
                    if (aiResult.features) {
                        wikiData.features = aiResult.features;
                    }
                    wikiData.introduction = aiResult.intro_geo; // Maintain compatibility

                    fs.writeFileSync(wikiPath, JSON.stringify(wikiData, null, 2));
                    console.log(`✅ [${village}] updated.`);

                    await new Promise(r => setTimeout(r, 1000));
                } catch (e) {
                    console.error(`❌ Failed [${village}]:`, e.message);
                    if (e.message.includes('429')) {
                        console.log("⏸️  Rate limited. Waiting 10s...");
                        await new Promise(r => setTimeout(r, 10000));
                    }
                }
            }
        }
    }

    console.log("\n🎉 All cities diversification complete.");
}

main().catch(console.error);
