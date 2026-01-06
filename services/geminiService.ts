import { GoogleGenerativeAI } from "@google/generative-ai";
import { LocationData, AnalysisResult, GroundingChunk, ProgressCallback, AuditCategory } from "../types";

// Initialize the Google AI SDK directly with the API Key
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to extract sources (Note: Browser-side SDK might not have full grounding metadata yet, but we'll try to keep compat)
const extractSources = (response: any): Array<{ title: string; uri: string }> => {
  const sources: Array<{ title: string; uri: string }> = [];
  // For standard Google AI SDK, grounding metadata might be in a different place or format
  // For now, we'll try to keep it safe.
  try {
    const candidate = response.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
        if (chunk.maps) {
          sources.push({ title: chunk.maps.title, uri: chunk.maps.uri });
        }
      });
    }
  } catch (e) {
    console.warn("Grounding metadata extraction failed", e);
  }
  return sources;
};

// Common configuration
const MODEL_NAME_FLASH = "gemini-1.5-flash";
const MODEL_NAME_PRO = "gemini-2.0-flash-exp";

// ==========================================
// STEP 1: Web Data Collection (Simulated Crawler)
// ==========================================

const SYSTEM_INSTRUCTION_CRAWLER = `
你是一位專業的**「社區發展數據調查員」**。你的任務是針對特定行政區（村里）進行深度的公開資料檢索與解析。

【核心原則：嚴格真實性】
1. **只能使用真實資料**：所有輸出必須來自政府開放資料（戶政、社家署、文化部等）、縣市公所網站、地方志、報導、新聞、Google Maps、Wikipedia。
2. **禁止編造**：若資料不足，必須明確標註：「此部分資料不足，需要補訪談」。絕對不可捏造數據。
3. **區分層級**：務必區分「鄉鎮級」與「村里級」的資料，優先呈現村里級。

【輸出架構 - 必須包含下列資訊】

# 《村里資料分析（自動生成）》：[縣市][區域][村里]

## A. 地理與基本資料
- **行政區屬性**：(如：都會住宅型、濱海型、山區農村型等)
- **面積/人口/戶數**：(請查閱最新戶政數據。包含村里面積、人口總數、戶數)
- **地理環境**：(丘陵/平原/河流/海岸/埤塘等特徵)
- **歷史沿革**：(舊地名、開發歷史、聚落形成原因如移民、開墾、產業變遷等)

## B. 社區公共設施
請逐一搜尋並列出：
- **行政/集會**：村里辦公處、活動中心、集會所
- **休憩/環境**：公園、綠地、自行車道、步道
- **社福/樂齡**：社區照顧據點、樂齡學習中心、長青學苑
- **生活/地標**：市場、商圈、重要地標建築

## C. 組織與人群
- **里長資訊**：[姓名] (第[幾]屆，任期：xxxx-xxxx)
- **核心組織**：社區發展協會、婦女會、志工隊、義消、巡守隊
- **專業團隊**：地方創生團隊、社區營造組織、外部輔導老師/顧問

## D. 教育與信仰
- **教育資源**：國小、國中、補教資源
- **信仰中心**：廟宇、教堂、地方特色宗教場所
- **文化祭典**：地方信仰特色、年度重要祭典事件

## E. 地方產業與文化
- **產業特色**：在地特色農業、特色小型商家
- **文化亮點**：輕旅行路線、在地故事、歷史遺跡、古井、老樹等
- **媒體報導**：曾被媒體報導過的社區亮點、人物或事件

【格式規範：地址與地點標註】
- **重要規則**：文中提及的所有實體地址、重要道路、或具體建築物（POIs），必須以 **加粗** 並附上 **Google Maps 搜尋連結**。
- **格式**：[名稱](https://www.google.com/maps/search/地址或關鍵字)。
`;

const draftReport = async (location: LocationData): Promise<{ text: string; sources: any[] }> => {
  const searchQueries = [
    `"${location.city}${location.district}${location.village}"`,
    `"${location.village}" 戶數 人口`,
    `"${location.village}" 舊地名 沿革`,
    `"${location.village}" 發展協會`,
    `"${location.village}" 廟宇 慶典`,
    `site:gov.tw "${location.village}" 補助`
  ].join(" OR ");

  const prompt = `
執行目標：針對「${location.city} ${location.district} ${location.village}」進行深度資料檢索。
搜尋語句建議：${searchQueries}

請嚴格遵循系統指令中的 A-E 架構，並確保所有資料均具備真實來源。
`;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME_PRO
    });

    const result = await model.generateContent([SYSTEM_INSTRUCTION_CRAWLER, prompt]);
    const response = result.response;
    return { text: response.text() || "", sources: extractSources(response) };
  } catch (error) {
    console.error("Draft Report Error", error);
    return { text: "Error generating report.", sources: [] };
  }
};

const verifyReportAccuracy = async (
  location: LocationData,
  draftText: string
): Promise<{ text: string; verifiedSources: any[] }> => {

  const systemInstruction = `
  你是一個自動化 QA (Quality Assurance) 機器人。
  你的任務是驗證上一階段爬取的資料準確性，特別是針對「層級錯誤 (Hierarchy Error)」進行除錯。
  
  【除錯邏輯】
  if (報告聲稱 "${location.village}" 獲得銀級/銅級認證) {
     執行搜尋確認該榮譽是否屬於 "${location.district}" 而非村里;
     if (屬於行政區) { 強制修正為 "查無認證 (該榮譽屬於行政區層級)"; }
  }
  
  if (報告提到有 "農村再生計畫") {
     執行搜尋確認是否在該村里範圍內;
  }
  
  請回傳修正後的 Markdown。若無錯誤，請回傳原稿。
  所有修正請標註：*(自動修正)*。
  `;

  const prompt = `
  Input Data:
  ${draftText}
  
  Execute QA Protocol for: ${location.city} ${location.district} ${location.village}
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME_FLASH
    });

    const result = await model.generateContent([systemInstruction, prompt]);
    const outputText = result.response.text();
    return { text: outputText || draftText, verifiedSources: extractSources(result.response) };
  } catch (e) {
    console.error("Verify Error", e);
    return { text: draftText, verifiedSources: [] };
  }
};

const generateAuditChecklist = async (location: LocationData, draftText: string): Promise<AuditCategory[]> => {
  const systemInstruction = `
你是專業訪談計畫規劃師。
你的任務是比對調查報告，找出缺漏的關鍵資訊，並整理成一份「待訪談 Check List」。

【分析邏輯】
1. **補足細節**：若報告提到有活動中心，但不知其設備狀況（如：是否換裝LED、有無雨水回收），列為訪談項。
2. **組織運作**：若僅有組織名稱，但不知運作規模、志工人數，列為訪談項。
3. **具體計畫**：調查有無堆肥計畫、綠色旅遊導覽路線、低碳永續作為。
4. **驗證數據**：面積或界線如有模糊之處，列入訪談確認。

回傳純 JSON array。
`;

  const prompt = `
Report Data:
${draftText}

Generate Checklist for: ${location.city}${location.district}${location.village}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME_FLASH,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent([systemInstruction, prompt]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson || "[]");
  } catch (e) {
    console.error("JSON Parse Error", e);
    return [];
  }
};

const integrateInterview = async (
  location: LocationData,
  originalDraft: string,
  transcript: string
): Promise<{ text: string }> => {

  const systemInstruction = `
任務：產出最終《村里資料分析》報告。
操作說明：
1. 將「實地訪談紀錄 (Source B)」合併至「網路爬取報告 (Source A)」。
2. 若有衝突，以「Source B (訪談)」為準。
3. 移除所有「待訪談」、「資料不足」或協助字眼。
4. 保持專業、客觀、數據导向的語氣。

【最終輸出格式：必須嚴格遵守 7 大段落】
# 《村里資料分析（正式版）》：[縣市][區域][村里]

## 1. 基本資料
(行政屬性、面積、人口、戶數、里長任期等)

## 2. 地理與環境特色
(地形、河流、自然資源、氣候特徵)

## 3. 歷史背景
(舊地名、由來、開墾史、聚落變遷)

## 4. 社區公共設施盤點
(分類呈現行政、休閒、社福、地標設施)

## 5. 組織與社團資源
(發展協會、志工隊、專業團隊、合作 NPO)

## 6. 教育與信仰機構
(學校、廟宇、教堂、年度節慶文化)

## 7. 產業、生態與文化亮點
(在地農產、亮點商家、旅遊路線、遺跡、媒體報導、低碳永續作為)
`;

  const prompt = `
Source A (Web):
${originalDraft}

Source B (Interview):
${transcript}

Output Final Report for: ${location.city} ${location.district} ${location.village}
`;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME_PRO
    });

    const result = await model.generateContent([systemInstruction, prompt]);
    return { text: result.response.text() || "" };
  } catch (e) {
    console.error("Integration Error", e);
    return { text: "" };
  }
};

export const runStep1_Draft = async (location: LocationData, onProgress: ProgressCallback): Promise<AnalysisResult> => {
  onProgress("啟動模擬爬蟲：檢索政府公開資料庫 (EPA, MOHW, SFA)...");
  const draft = await draftReport(location);

  onProgress("執行自動化 QA：驗證資料層級準確性...");
  const verifiedDraft = await verifyReportAccuracy(location, draft.text);

  const allSources = [...draft.sources, ...verifiedDraft.verifiedSources];
  const uniqueSources = Array.from(new Map(allSources.map(item => [item.uri, item])).values());

  onProgress("產生差異分析 (Gap Analysis) 與訪談提綱...");
  const checklist = await generateAuditChecklist(location, verifiedDraft.text);

  return {
    markdown: verifiedDraft.text,
    sources: uniqueSources,
    checklist: checklist
  };
};

export const runStep3_Integrate = async (
  location: LocationData,
  currentResult: AnalysisResult,
  transcript: string,
  onProgress: ProgressCallback
): Promise<AnalysisResult> => {
  onProgress("正在整合：網路數據 + 訪談實錄...");
  const finalReport = await integrateInterview(location, currentResult.markdown, transcript);

  return {
    markdown: finalReport.text,
    sources: currentResult.sources,
    checklist: currentResult.checklist
  };
};

