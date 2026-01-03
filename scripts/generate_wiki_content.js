/**
 * Wiki Content Generator Script
 * 
 * 使用方式：
 * 1. 設定 GOOGLE_AI_API_KEY 環境變數
 * 2. 執行 `node scripts/generate_wiki_content.js`
 * 3. 輸出至 data/generated_wiki_content.json
 */

const fs = require('fs');
const path = require('path');

// 讀取現有 Wiki 資料
const WIKI_PATH = path.join(__dirname, '../data/community_wiki.json');
const OUTPUT_PATH = path.join(__dirname, '../data/generated_wiki_content.json');

// AI Prompt 模板
const PROMPT_TEMPLATE = `你是一位熟悉台灣新竹縣地方事務的社區調查員。請為以下村里生成 Wiki 內容。

【村里基本資訊】
- 村里名稱：{{villageName}}
- 行政區：{{district}}
- 村里長：{{chiefName}}
- 辦公處地址：{{officeAddress}}

【請輸出以下 JSON 格式】
{
  "introduction": "約 80-150 字的社區簡介，描述地理位置、社區特色、居民特性等",
  "features": ["3-5 個特色標籤，如：傳統聚落、科技新市鎮、農村社區、明星學區等"],
  "type": "社區類型：urban (都市型) / rural (農村型) / mixed (混合型) / indigenous (原住民部落)",
  "estimatedPopulation": "估計人口數 (數字)",
  "estimatedArea": "估計面積 (如 0.5 平方公里)",
  "keyFacilities": [
    {"name": "設施名稱", "type": "activity_center/park/temple/school", "description": "簡短描述"}
  ]
}

【注意事項】
1. 請根據地名、地址等線索推斷社區特性
2. 新竹縣竹北市多為科技新市鎮
3. 尖石鄉、五峰鄉多為原住民部落
4. 其他鄉鎮多為農村或混合型
5. 僅輸出 JSON，不要有其他文字`;

/**
 * 為單一村里生成 Wiki 內容
 */
async function generateWikiForVillage(village, apiKey) {
    const prompt = PROMPT_TEMPLATE
        .replace('{{villageName}}', village.villageName || '')
        .replace('{{district}}', village.adminRegion || '')
        .replace('{{chiefName}}', village.basicInfo?.villageChief || '未知')
        .replace('{{officeAddress}}', village.basicInfo?.officeAddress || '未知');

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // 提取 JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error(`生成失敗: ${village.villageName}`, error.message);
        return null;
    }
}

/**
 * 批量生成指定鄉鎮的 Wiki 內容
 */
async function batchGenerate(targetDistrict = null) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('錯誤：請設定 GOOGLE_AI_API_KEY 環境變數');
        process.exit(1);
    }

    const wikiData = JSON.parse(fs.readFileSync(WIKI_PATH, 'utf-8'));

    // 篩選目標村里
    let targetVillages = wikiData;
    if (targetDistrict) {
        targetVillages = wikiData.filter(v => v.adminRegion?.includes(targetDistrict));
    }

    console.log(`開始生成 ${targetVillages.length} 個村里的 Wiki 內容...`);

    const results = [];
    for (let i = 0; i < targetVillages.length; i++) {
        const village = targetVillages[i];
        console.log(`[${i + 1}/${targetVillages.length}] 處理中: ${village.villageName}`);

        const generated = await generateWikiForVillage(village, apiKey);

        results.push({
            communityName: village.communityName,
            villageName: village.villageName,
            adminRegion: village.adminRegion,
            generated: generated
        });

        // Rate limiting: 等待 1 秒
        await new Promise(r => setTimeout(r, 1000));
    }

    // 儲存結果
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`完成！結果已儲存至 ${OUTPUT_PATH}`);

    return results;
}

// 執行
const district = process.argv[2] || '竹北市'; // 預設先處理竹北市
batchGenerate(district);
