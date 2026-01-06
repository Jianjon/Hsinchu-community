// import { getVertexAI, getGenerativeModel } from "firebase/vertexai"; // Removed Firebase dependency
// import { app } from "./firebase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use standard Gemini model
// Use specific model version to avoid 404 on v1beta
const MODEL_NAME = 'gemini-2.0-flash-exp';

// Initialize the Google AI SDK directly with the API Key
// This is more robust than Firebase Vertex AI for simple key-based usage
// UPDATED: Use specific Google AI Key, separate from Firebase Auth Key
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });


// Define simple user info type for AI context
export interface AIUserInfo {
    location?: string;
    identity?: string; // e.g., "Parent", "Elder"
    role?: string;
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

**【核心規範】**
- **語言限制**：**必須完全使用「繁體中文 (台灣)」**。絕對禁止混入印地語 (Hindi)、泰文或其他無關語言。
- **身分定位**：在地人、溫暖、專業。

**【寫作情境】**
- **地點**：${locationStr}
- **主題類型**：${typeName}
- **核心風格**：溫暖、在地、富有洞察力（Analyst Insight）、強調人與土地的連結。

**【內容要求】**
1. **結合在地語境**：請務必將內容與「${options.villageName || '社區'}」的場景做連結。
2. **結構化輸出**：使用 HTML 標籤排版 (<h2>, <b>, <ul><li>)。
3. **語氣調整**：根據不同類型調整語氣（熱鬧、深沉、放鬆）。

用戶關鍵字：${userPrompt}
現有參考：${currentContext}
    `;

    try {
        console.log('Generating content with Google AI SDK...');
        const result = await model.generateContent(systemInstruction);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Google AI Content Gen Failed:', error);
        return '抱歉，AI 暫時無法生成內容（連線異常）。請檢查您的 API Key 是否正確。';
    }
};

// NEW: Function specifically for the AI Search Widget
export const generateSearchAnswer = async (query: string, contextMatches: string[], userInfo?: AIUserInfo): Promise<{ answer: string, relatedQuestions: string[] }> => {
    // 1. Try Real API (Google AI SDK)
    try {
        // Construct User Context String
        const userContextStr = userInfo ? `
**【用戶背景 (請依此調整回答語氣與重點)】**
- **所在位置**：${userInfo.location || '未知'}
- **身分角色**：${userInfo.role === 'admin' ? '社區管理員' : '一般居民'}
- **背景標籤**：${userInfo.identity || '一般大眾'}
(例如：若是「長者」，請多關心健康與便利性；若是「親子」，請多注意安全與教育資源)
` : '';

        const prompt = `
你是一位專注於「台灣社區事務」的專業「社區資訊分析師」。
您的任務是根據「官方與政府機關資料」為核心，回答與社區、村里及平台功能相關的問題。

${userContextStr}

**核心原則 ( grounding_priority & scope_control )：**
1. ⚖️ **資料來源優先級 (極重要)**：
   - **第一優先 (官方/政府資訊)**：絕對優先引用標籤為 [WIKI]、[GOV]、[REPORT]、[SAFETY] 的資訊。這些是您的回答基礎。
   - **第二優先 (社區居民討論)**：標籤為 [POST] 的資訊僅作為補充參考，代表居民的觀點或觀察，不應視為官方事實。
   - **衝突處理**：若社區討論與官方資料有衝突，請以官方資料為準，並可適度提及「居民有相關討論但官方紀錄為...」。
2. 🛡️ **對話範圍限制**：
   - 您的職責僅限於「社區相關」事務。
   - 若問題無關（如：閒聊、程式碼、一般百科），請禮貌拒絕並引導回社區話題。
3. 📝 **回答結構**：
   - **【官方資料摘要】**：整合 Wiki, Gov, Report 等官方數據。
   - **【社區討論與建議】**：整合 Post 內容並提供 AI 專業建議。
4. 🇹🇼 **繁體中文規範**：全程使用「繁體中文 (台灣)」。
5. 🔗 **連結引用**：資料片段中若有連結（http...），請務必附上。

**資料片段 (在地資料來源)：**
${contextMatches.join('\n')}

**用戶問題：** ${query}

**輸出格式要求 (JSON)：**
{
    "answer": "【官方資料摘要】\n(優先使用 [WIKI],[GOV],[REPORT]...)\n\n【社區討論與建議】\n(整合 [POST] 與專業建議...)",
    "relatedQuestions": ["社區延伸問題1", "社區延伸問題2", "社區延伸問題3"]
}
`;
        console.log('Calling Google AI for Search...', userInfo);

        // Ensure the model returns JSON
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        // ... rest remains same


        console.log('Google AI Response received.');
        const text = result.response.text();
        return JSON.parse(text);

    } catch (error) {
        console.warn('Google AI Failed, switching to Mock AI:', error);
    }

    // 2. Fallback to "Mock/Rule-based AI"
    return mockLocalAI(query, contextMatches);
};

// A smart local generator that mimics AI behavior using templates
const mockLocalAI = (query: string, contextMatches: string[]): { answer: string, relatedQuestions: string[] } => {
    let answer = '目前資料庫中暫無直接相關紀錄。建議您參考下方提供的官方政府連結，或直接向里長辦公室諮詢以獲得最準確的協助。';
    let relatedQuestions = ['如何聯繫里長？', '最近的活動中心在哪？', '垃圾車幾點來？'];

    if (contextMatches.length > 0) {
        const topMatch = contextMatches[0];
        const content = topMatch.split(': ')[1] || topMatch;
        const title = topMatch.split('] ')[1]?.split(':')[0] || '相關資料';

        // Additional check: Does the match even relate to the query?
        if (content.includes(query) || query.length < 2) {
            if (topMatch.includes('[WIKI]')) {
                answer = `為您找到「${title}」：${content.substring(0, 50)}... 詳細資訊請查看下方卡片。`;
            } else if (topMatch.includes('[GOV]')) {
                answer = `本地資料較少，但系統為您找到了官方資源「${title}」，這可能對您有幫助。`;
            } else {
                answer = `社區討論中有提到關於「${query}」的資訊：${content.substring(0, 40)}...`;
            }
        } else {
            answer = `在資料庫中找不到與「${query}」直接相關的紀錄。建議您嘗試調整關鍵字，或參考下方的一般性政府資訊。`;
        }
    } else {
        if (query.includes('垃圾')) {
            answer = '關於垃圾清運，一般建議做好分類。若為大型家具，需聯繫清潔隊或查詢社區是否有專門堆置區。建議您直接聯繫里長辦公室確認最近的清運時間。';
            relatedQuestions = ['大型家具怎麼丟？', '資源回收時間？', '清潔隊電話'];
        }
        else if (query.includes('停車')) {
            answer = '關於停車問題，建議您尋找附近的公有停車場或路邊停車格。若為長期需求，可詢問里辦公室是否有里民優惠或專屬車位申請。';
            relatedQuestions = ['哪裡有停車場？', '月租車位申請', '違規停車檢舉'];
        }
        else if (query.includes('老人') || query.includes('長者')) {
            answer = '關於長輩福利，新竹縣政府社會處有多項服務，包含共餐、長照等。建議您參考下方「官方資訊」連結，或至里活動中心詢問據點服務。';
            relatedQuestions = ['老人共餐地點', '長照服務申請', '敬老愛心卡'];
        }
        else if (query.includes('申訴') || query.includes('建議')) {
            answer = '遇到社區問題，建議您優先向里長反映。若需公權力介入（如噪音、違停），可直接撥打 1999 縣民專線。';
            relatedQuestions = ['1999專線是什麼？', '里長聯絡方式', '線上陳情網址'];
        }
    }

    return { answer, relatedQuestions };
};

export const generateVillagePulse = async (posts: any[], interests?: string[]): Promise<{ time: string, content: string }> => {
    try {
        const postSnippets = posts.slice(0, 10).map(p => p.content).join('\n');
        const interestStr = (interests && interests.length > 0) ? `用戶當前感興趣的主題有：${interests.join('、')}。請特別留意與這些主題相關的動態，並在生成短語時適度偏重這些方向。` : '';

        const systemInstruction = `
你是一位充滿溫度的「社區觀察員」。你的任務是觀察社區最近的動態，並寫出一句簡短、溫馨、有質感的「社區脈動」短語。

**【寫作規範】**
1. **純繁體中文**：必須使用繁體中文 (台灣)，不可混入其他語言。
2. **短短一句**：約 50-80 字，適合在小卡片中滾動播放。
2. **溫馨正向**：強調鄰里連結、溫暖時刻、或是美好的小發現。
3. **具體感**：如果資料中有提到活動或事件，請用優美的修飾詞融入。
4. **輸出格式**：一句話即可，不需要標題。

${interestStr}
`;

        const prompt = postSnippets
            ? `根據以下最近的社區動態，寫出一句溫暖的社區脈動短語：\n\n${postSnippets}`
            : `目前暫無最新動態，請寫出一句關於社區美好早晨或溫馨連結的通用短語。`;

        const result = await model.generateContent([systemInstruction, prompt]);
        const text = result.response.text();

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return { time: timeStr, content: text };
    } catch (error) {
        console.error('Pulse Generation Failed:', error);
        return {
            time: '08:00 AM',
            content: '社區的早晨陽光和煦，鄰里間的點點滴滴交織成最溫暖的風景。'
        };
    }
};

// Function for social post icebreakers
export const generateIcebreaker = async (topic: string = '社區生活'): Promise<string> => {
    try {
        const prompt = `請針對「${topic}」這個主題，生成一句溫暖且具有互動性的社交媒體開場白（Icebreaker），鼓勵居民留言分享。字數在 30 字以內。`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Icebreaker Generation Failed:', error);
        return `大家對今天的 ${topic} 有什麼想法嗎？歡迎分享！`;
    }
};

