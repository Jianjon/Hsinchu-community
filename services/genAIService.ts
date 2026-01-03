// import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import { app } from "./firebase"; // We need to export 'app' from firebase.ts (checking this)

// Fallback to 1.5-flash if 2.0-flash-exp is not available or desired.
const MODEL_NAME = 'gemini-2.0-flash-exp';

interface AIResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export const generateCommunityContent = async (
    userPrompt: string,
    currentContext: string = '',
    options: { villageName?: string, itemType?: string } = {}
): Promise<string> => {

    // Map types to user-friendly terms
    const typeMap: Record<string, string> = {
        event: '在地活動',
        travel: '輕旅行景點',
        project: '地方創生計畫',
        culture: '文化資產',
        facility: '公共設施',
        wiki: '社區百科'
    };

    const typeName = options.itemType ? (typeMap[options.itemType] || options.itemType) : '社區項目';
    const locationStr = options.villageName ? `位於「${options.villageName}」` : '台灣在地社區';

    const systemInstruction = `
你是一位專業的「台灣社區發展分析師」與在地文史工作者。
你的任務是協助社區居民將簡單的關鍵字，擴寫成一篇結構完整、有溫度且專業的介紹文。

**【寫作情境】**
- **地點**：${locationStr}
- **主題類型**：${typeName}
- **核心風格**：溫暖、在地、富有洞察力（Analyst Insight）、強調人與土地的連結。

**【內容要求】**
1. **結合在地語境**：請務必將內容與「${options.villageName || '社區'}」的場景做連結，想像你正站在當地導覽。
2. **結構化輸出**：
   - 請使用 **HTML 標籤** 進行排版（例如 '<h2>' 代表標題, '<b>' 代表粗體, '<ul><li>' 代表清單）。
   - **【特色亮點】**：用一句充滿畫面感的話作為開頭。
   - **【Analyst 觀點】**：(選填) 從分析師角度，點評此項目對社區的價值（例如：凝聚力、傳承意義、經濟價值）。
   - **【深度介紹】**：詳細描述。
   - **【推薦重點】**：條列式列出細節。
3. **語氣調整**：
   - 若是「活動」，強調參與感與熱鬧氛圍。
   - 若是「文化」，強調歷史深度與保存價值。
   - 若是「旅行」，強調私房體驗與放鬆心情。

用戶目前的關鍵字或提示：${userPrompt}
(若有) 現有內容參考：${currentContext}
    `;

    try {
        // const vertexAI = getVertexAI(app);
        // const model = getGenerativeModel(vertexAI, { model: MODEL_NAME });

        // const result = await model.generateContent(systemInstruction);
        // const response = result.response;
        // const text = response.text();

        // return text || '抱歉，AI 暫時無法生成內容，請稍後再試。';
        return "AI 生成服務暫需更新 API 連線。 (Deployment Mode)";
    } catch (error) {
        console.error('AI Generation failed:', error);
        return '生成失敗，請檢查網路連線或 API Key 額度。';
    }
};
