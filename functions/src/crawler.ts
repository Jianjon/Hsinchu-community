import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Interface for feed items
interface FeedItem {
    villageId: string;
    content: string;
    type: 'announcement' | 'activity' | 'news';
    title?: string;
    sourceUrl?: string;
    createdAt: Date;
    channelId: string; // To match firestoreService.ts
    authorName: string;
    authorRole: 'admin' | 'bot';
    tags: string[];
}

/**
 * SIMULATED CRAWLER:
 * In a real scenario, this would fetch HTML/JSON from external URLs.
 * For now, it generates realistic "fresh" data to prove the pipeline works.
 */
export const runCrawlerLogic = async () => {
    const db = admin.firestore();
    const batch = db.batch();

    console.log("🕷️ Starting Crawler...");

    // 1. Simulating "Village News" (e.g. from District Office RSS)
    const newsItems: FeedItem[] = [
        {
            villageId: 'Hsinchu_North_Central', // Target the specific community we saw
            channelId: 'announce',
            type: 'announcement',
            title: '【公告】本週六社區大掃除通知',
            content: '親愛的里民大家好，本週六 (1/6) 上午 09:00 將舉行社區大掃除，請大家踴躍參與。集合地點：里民活動中心。',
            authorName: '里辦公處公告',
            authorRole: 'admin',
            tags: ['公告', '環境清潔'],
            createdAt: new Date()
        },
        {
            villageId: 'Hsinchu_North_Central',
            channelId: 'events',
            type: 'activity',
            title: '【活動】元宵節燈謎晚會',
            content: '下週五晚上將舉辦元宵節猜燈謎活動，備有精美小禮物，歡迎大小朋友一起來同樂！',
            authorName: '活動組',
            authorRole: 'admin',
            tags: ['活動', '節慶'],
            createdAt: new Date()
        }
    ];

    // Write Feeds to 'posts' collection
    for (const item of newsItems) {
        const ref = db.collection('posts').doc(); // Auto-ID
        batch.set(ref, {
            ...item,
            valid: true,
            stats: { likes: 0, comments: 0, views: 0 },
            createdAt: admin.firestore.Timestamp.fromDate(item.createdAt)
        });
    }

    // 2. Simulating "Sustainability Stats" Update
    // Writing to 'communities' document directly (Embedded)
    const communityRef = db.collection('communities').doc('Hsinchu_North_Central');
    batch.set(communityRef, {
        stats: {
            aqi: Math.floor(Math.random() * 50) + 10, // Random AQI 10-60 (Good)
            temperature: 24,
            carbonSaved: 1250 + Math.floor(Math.random() * 100),
            recyclingRate: 0.85,
            lastUpdated: admin.firestore.Timestamp.now()
        }
    }, { merge: true }); // Merge to avoid overwriting existing wiki/events

    // 3. Simulating "AI Pulse"
    const pulseRef = db.collection('mixboard_pulse').doc('daily_summary');
    batch.set(pulseRef, {
        date: new Date().toISOString().split('T')[0],
        content: `【AI 每日快報】今日新竹市北區天氣晴朗，適合戶外活動。社區活動中心今日有「長者健康檢測」服務。目前空氣品質良好 (AQI ${Math.floor(Math.random() * 30)})。`,
        tags: ['#健康', '#天氣', '#AI導讀'],
        updatedAt: admin.firestore.Timestamp.now()
    });

    await batch.commit();
    console.log("✅ Crawler finished. Data ingested.");
};
