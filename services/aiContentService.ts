import { getAI, getGenerativeModel, SchemaType } from "firebase/ai";
import { app } from "./firebase";

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
    };
    confidence: number;
    reasoning: string;
}

const SYSTEM_INSTRUCTION = `
你是一位專業的「社區資訊分析官」。你的任務是將來自 Facebook 社團、LINE 群組或新聞的非結構化文字，轉換為「社區發展平台」所需的格式。

【頻道定義】
- events (在地活動): 具有具體日期、時間、地點的集會、講座、團拜等。
- travel (輕旅行): 景點推薦、步道紀錄、旅遊攻略。
- projects (地方創生): 提案、計畫回報、募資、社區建設進度。
- culture (文化資產): 歷史故事、古蹟介紹、傳統工藝紀錄。
- care (永續共好): 暖心行動、據點服務紀錄、共好活動。
- facility (社區維基): 公共設施資訊、營業時間、服務內容變更。
- resource (一般討論): 閒聊、小道消息、好物推薦。

【輸出規範】
1. 輸出必須為純 JSON。
2. 根據內容決定最適合的 channelType。
3. 盡可能提取時間 (YYYY-MM-DD)、地點、標題、詳細描述。
4. 若有主辦單位 (organizer) 或費用 (cost) 請一併提取。
5. 信心指數 (confidence) 介於 0-1。
`;

export const parseCommunityContent = async (text: string): Promise<ParsedCommunityContent | null> => {
    try {
        const vertexAI = getAI(app);
        const model = getGenerativeModel(vertexAI, {
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        channelType: {
                            type: SchemaType.STRING,
                            enum: ['events', 'travel', 'projects', 'culture', 'care', 'resource', 'facility']
                        },
                        data: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                date: { type: SchemaType.STRING },
                                time: { type: SchemaType.STRING },
                                location: { type: SchemaType.STRING },
                                link: { type: SchemaType.STRING },
                                tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                organizer: { type: SchemaType.STRING },
                                cost: { type: SchemaType.STRING },
                                status: { type: SchemaType.STRING },
                                progress: { type: SchemaType.STRING }
                            },
                            required: ["title", "description"]
                        },
                        confidence: { type: SchemaType.NUMBER },
                        reasoning: { type: SchemaType.STRING }
                    },
                    required: ["channelType", "data", "confidence", "reasoning"]
                }
            }
        });

        const result = await model.generateContent(`請解析以下內容：\n\n${text}`);
        const responseText = result.response.text();
        return JSON.parse(responseText || "null") as ParsedCommunityContent;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return null;
    }
};
