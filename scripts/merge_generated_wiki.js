/**
 * Merge Generated Wiki Content Script
 * 
 * 將 AI 生成的內容合併回主 Wiki 檔案
 * 
 * 使用方式：
 * node scripts/merge_generated_wiki.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_PATH = path.join(__dirname, '../data/community_wiki.json');
const GENERATED_PATH = path.join(__dirname, '../data/generated_wiki_content.json');
const OUTPUT_PATH = path.join(__dirname, '../data/community_wiki_enriched.json');

function mergeWikiContent() {
    // 讀取原始 Wiki 資料
    const wikiData = JSON.parse(fs.readFileSync(WIKI_PATH, 'utf-8'));

    // 讀取生成的內容
    if (!fs.existsSync(GENERATED_PATH)) {
        console.error('錯誤：找不到生成的內容檔案，請先執行 generate_wiki_content.js');
        process.exit(1);
    }
    const generatedData = JSON.parse(fs.readFileSync(GENERATED_PATH, 'utf-8'));

    // 建立查詢表
    const generatedMap = new Map();
    generatedData.forEach(item => {
        if (item.generated) {
            generatedMap.set(item.communityName, item.generated);
        }
    });

    console.log(`找到 ${generatedMap.size} 個已生成的 Wiki 內容`);

    // 合併內容
    let mergedCount = 0;
    const enrichedWiki = wikiData.map(village => {
        const generated = generatedMap.get(village.communityName);
        if (generated) {
            mergedCount++;
            return {
                ...village,
                // 補充生成的內容
                introduction: generated.introduction || village.introduction,
                features: generated.features || village.features,
                type: generated.type || village.type,
                // 更新基本資訊
                basicInfo: {
                    ...village.basicInfo,
                    population: generated.estimatedPopulation || village.basicInfo?.population || 0,
                },
                // 更新地理資訊
                geography: {
                    ...village.geography,
                    area: generated.estimatedArea || village.geography?.area,
                },
                // 合併設施
                facilities: {
                    ...village.facilities,
                    generated: generated.keyFacilities || []
                }
            };
        }
        return village;
    });

    // 儲存結果
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enrichedWiki, null, 2), 'utf-8');
    console.log(`完成！已合併 ${mergedCount} 個村里的內容`);
    console.log(`輸出至: ${OUTPUT_PATH}`);

    // 顯示統計
    console.log('\n--- 統計 ---');
    console.log(`原始村里數: ${wikiData.length}`);
    console.log(`已生成內容: ${generatedMap.size}`);
    console.log(`成功合併: ${mergedCount}`);
}

mergeWikiContent();
