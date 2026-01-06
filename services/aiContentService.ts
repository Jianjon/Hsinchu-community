import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedCommunityContent {
    channelType: 'events' | 'travel' | 'projects' | 'culture' | 'care' | 'resource' | 'facility';
    data: {
        title: string;
        description: string;
        date?: string;
        time?: string;
        location?: string;
        link?: string;
        tags?: string[];
        organizer?: string;
        cost?: string;
        status?: string;
        progress?: string;
        fundingSource?: string;
        seasonality?: string;
    };
    confidence: number;
    reasoning: string;
}

// Initialize the Google AI SDK directly with the API Key
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

export const parseCommunityContent = async (text: string, targetChannel?: string): Promise<ParsedCommunityContent | null> => {
    const systemInstruction = `
你是一位專業的「社區資訊分析官」。你的任務是將來自 Facebook 社團、LINE 群組或新聞的非結構化文字，轉換為「社區發展平台」表單所需的結構化資料。

【當前表單類型】
${targetChannel ? `用戶目前正在填寫「${targetChannel}」表單。請優先提取適用於此表單的欄位。` : '請判斷內容最適合哪種表單類型。'}

【頻道/表單定義】
- events (在地活動): 具有具體日期、時間、地點的集會、講座、團拜等。
- travel (輕旅行): 景點推薦、步道紀錄、旅遊攻略。
- projects (地方創生): 提案、計畫回報、募資、社區建設進度。
- culture (文化資產): 歷史故事、古蹟介紹、傳統工藝紀錄。
- care (永續共好): 暖心行動、據點服務紀錄、共好活動。
- facility (社區維基): 公共設施資訊、營業時間、服務內容變更。
- resource (一般討論): 閒聊、小道消息、好物推薦。

【輸出規範】
1. 輸出必須為純 JSON 格式。
2. 根據內容決定最適合的 channelType (若用戶已指定則盡量符合)。
3. 盡可能提取以下欄位：
   - title: 標題 (必填)
   - description: 詳細描述 (必填)
   - date: 日期 (格式: YYYY-MM-DD)
   - time: 時間 (格式: HH:mm)
   - location: 地點/地址
   - link: 網址
   - tags: 標籤陣列
   - organizer: 主辦單位
   - cost: 費用
   - status: 狀態 (events->none, projects->'planning'|'active'|'completed')
   - progress: 進度 (0-100)
   - fundingSource: 經費來源
   - seasonality: 適合季節
4. 信心指數 (confidence) 介於 0-1。
5. 思考邏輯 (reasoning): 簡短說明為何這樣解析。
6. **語言限制**：**所有文字描述欄位 (title, description, reasoning) 必須完全使用「繁體中文 (台灣)」**。嚴禁混入印地語 (Hindi) 或其他語言。
`;

    try {
        const prompt = `請解析以下文字內容，並按照 JSON 格式輸出：\n\n${text}`;
        const result = await model.generateContent([systemInstruction, prompt]);
        const responseText = result.response.text();

        // Remove markdown code blocks if present
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson) as ParsedCommunityContent;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return null;
    }
};

