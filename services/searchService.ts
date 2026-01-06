import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MOCK_COMMUNITIES } from '../data/mock_public';
import { getVillagePosts } from './interactionService';
import { generateSearchAnswer } from './genAIService';

export interface SearchResultItem {
    id: string;
    title: string;
    snippet: string;
    source: 'wiki' | 'post' | 'gov' | 'report';
    url?: string;
    date?: string;
    author?: string;
    relevance: number;
}

export interface SearchResponse {
    summary: string;
    relatedQuestions: string[];
    results: SearchResultItem[];
}

// Hardcoded Government Resources for fallback/enhancement
// Pruned to only essential high-level portals
const GOV_RESOURCES: Record<string, { title: string, url: string, keywords: string[], external: boolean }> = {
    'waste': {
        title: '新竹縣政府環境保護局 (外部連結)',
        url: 'https://www.hcepb.gov.tw/',
        keywords: ['垃圾', '回收', '巨大', '廢棄物', '家具'],
        external: true
    },
    'parking': {
        title: '新竹縣路邊停車費查詢 (外部連結)',
        url: 'https://park.hsinchu.gov.tw/',
        keywords: ['停車', '繳費', '車位'],
        external: true
    },
    'petition': {
        title: '新竹縣民意信箱 (1999專線)',
        url: 'https://chiefmail.hsinchu.gov.tw/',
        keywords: ['申訴', '陳情', '檢舉', '1999', '建議'],
        external: true
    }
};

export const searchCommunity = async (query: string, communityName: string, userInfo?: any): Promise<SearchResponse> => {
    const results: SearchResultItem[] = [];
    const normalizedQuery = query.toLowerCase();

    // 1. Search Wiki Data (Official)
    // Intelligent Match: Only fallback to "中興里" if the query doesn't specify another known location
    let community = MOCK_COMMUNITIES.find(c => communityName.includes(c.name) || c.name.includes(communityName));

    // If no direct match, only use default if the query is very generic
    if (!community && query.length < 4) {
        community = MOCK_COMMUNITIES.find(c => c.name === '中興里');
    }

    if (community) {
        // [NEW] 1.5 Fetch Analyst Report from Firestore
        if (db) {
            try {
                const docId = `${community.city || '新竹縣'}_${community.district || '竹北市'}_${community.name}`;
                const docRef = doc(db, "village_reports", docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const reportText = data.markdown || '';
                    if (reportText.includes(query) || query.length < 2) {
                        results.push({
                            id: `report-${docId}`,
                            title: `📄 ${community.name} 發展分析報告`,
                            snippet: reportText.substring(0, 150) + '...',
                            source: 'report',
                            date: data.lastUpdated?.toDate().toLocaleDateString(),
                            relevance: 18 // High priority for analyst reports
                        });
                    }
                }
            } catch (error) {
                console.warn("Firestore Report Fetch Error:", error);
            }
        }

        // [ENHANCED] Deep Grounding: Wiki Content
        if (community.wiki) {
            const wiki = community.wiki;

            // Introduction & Characteristics
            if (wiki.introduction) {
                results.push({
                    id: 'wiki-intro',
                    title: `📖 ${community.name} 社區百科`,
                    snippet: wiki.introduction,
                    source: 'wiki',
                    relevance: 15 // Base priority for Wiki
                });
            }

            // History
            if (wiki.intro_history) {
                results.push({
                    id: 'wiki-history',
                    title: `📜 ${community.name} 歷史發展`,
                    snippet: wiki.intro_history,
                    source: 'wiki',
                    relevance: 14
                });
            }

            // Geography
            if (wiki.intro_geo) {
                results.push({
                    id: 'wiki-geo',
                    title: `🗾 ${community.name} 地理特色`,
                    snippet: wiki.intro_geo,
                    source: 'wiki',
                    relevance: 13
                });
            }
        }

        // [ENHANCED] Deep Grounding: Safety Data
        if (community.safety) {
            const safety = community.safety;

            // Patrol Status
            results.push({
                id: 'safety-patrol',
                title: `🛡️ ${community.name} 巡守狀態`,
                snippet: `${safety.patrolStatus.status === 'active' ? '巡邏中' : safety.patrolStatus.status === 'reinforced' ? '加強巡邏中' : '休息中'}。${safety.patrolStatus.description}`,
                source: 'report', // Using report source for safety/status
                relevance: 16 // High relevance for safety status
            });

            // Active Alerts
            safety.alerts.forEach(alert => {
                results.push({
                    id: `safety-alert-${alert.id}`,
                    title: `⚠️ ${alert.title}`,
                    snippet: `【${alert.level.toUpperCase()}級警戒】${alert.description}`,
                    source: 'report',
                    relevance: 25 // Top priority for security alerts
                });
            });
        }

        // Search Facilities
        community.wiki?.facilities?.forEach(fac => {
            if (fac.name.includes(query) || fac.description?.includes(query)) {
                results.push({
                    id: `fac-${fac.name}`,
                    title: fac.name,
                    snippet: fac.description || `位於${community.district}的公共設施`,
                    source: 'wiki',
                    relevance: 12
                });
            }
        });

        // Search Care Actions
        community.wiki?.careActions?.forEach(action => {
            if (action.title.includes(query) || action.description.includes(query)) {
                results.push({
                    id: `act-${action.id}`,
                    title: action.title,
                    snippet: action.description,
                    source: 'wiki',
                    relevance: 11
                });
            }
        });
    }

    // 2. Search Posts
    const targetId = community?.id || 'Global';
    try {
        const posts = await getVillagePosts(targetId);
        posts.forEach(post => {
            if (post.content.includes(query) || post.tags?.some(t => t.includes(query))) {
                results.push({
                    id: post.id,
                    title: post.content.substring(0, 20) + '...',
                    snippet: post.content.substring(0, 60),
                    source: 'post',
                    date: post.createdAt.toLocaleDateString(),
                    author: post.authorName,
                    relevance: post.authorRole === 'admin' || post.authorRole === 'gov' ? 7 : 4
                });
            }
        });
    } catch (e) {
        console.warn('Failed to search posts', e);
    }

    // 3. Append Gov Resources
    Object.values(GOV_RESOURCES).forEach(res => {
        if (res.keywords.some(k => normalizedQuery.includes(k))) {
            results.push({
                id: `gov-${res.title}`,
                title: res.title,
                snippet: '官方政府網站查詢詳細資訊',
                source: 'gov',
                url: res.url,
                relevance: 12 // Increased priority for official gov links
            });
        }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Filter out duplicates based on ID
    const uniqueResults = results.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    // 4. Generate AI Summary using GenAI Service
    const contextMatches = results.slice(0, 5).map(r => `[${r.source.toUpperCase()}] ${r.title}: ${r.snippet}`); // Increased context to 5
    let summary = '正在為您生成智能分析...';
    let relatedQuestions: string[] = [];

    try {
        // Call the real GenAI service with User Info!
        const aiResponse = await generateSearchAnswer(query, contextMatches, userInfo);
        summary = aiResponse.answer;
        relatedQuestions = aiResponse.relatedQuestions || [];
    } catch (err) {
        console.warn('AI Summary Gen Failed, using template fallback', err);
        // Fallback Template logic
        if (results.length > 0) {
            const topResult = results[0];
            if (topResult.source === 'wiki') {
                summary = `根據社區資料庫：${topResult.snippet}`;
            } else if (topResult.source === 'gov') {
                summary = `本地資料較少，建議參考${topResult.title}。`;
            } else {
                summary = `社區相關討論提到：${topResult.snippet}`;
            }
        } else {
            summary = `很抱歉，目前在資料庫中找不到精確匹配，建議您嘗試更換關鍵字或直接詢問里長。`;
        }
    }

    return {
        summary,
        relatedQuestions,
        results: results.slice(0, 5)
    };
};
