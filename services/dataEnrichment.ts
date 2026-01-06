
import { PublicCommunity, CommunityAction, PublicEvent, PublicTravelSpot } from '../data/mock_public';

export const enrichCommunityData = (communities: PublicCommunity[]) => {
    // 1. Inject Dynamic Events and Travel Spots for specific communities
    const targetCommunity = communities.find(c => c.name === '中興里');
    if (targetCommunity) {
        // ... (Existing Events) ...
        if (!targetCommunity.events) targetCommunity.events = [];
        // Check for duplicates before pushing
        if (!targetCommunity.events.find(e => e.id === 'evt-sample-01')) {
            targetCommunity.events.push({
                id: 'evt-sample-01',
                title: '中興里週末市集',
                date: '2025-10-15',
                time: '14:00',
                location: '中興里集會所前广场',
                description: '本週末中興里舉辦社區交流市集，邀請在地小農與手作職人共襄盛舉。現場有音樂表演與親子DIY活動，歡迎大家一起來玩！\n\n活動流程：\n14:00 市集開始\n15:00 街頭藝人表演\n16:00 親子DIY\n18:00 市集結束',
                type: 'market',
                coverImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
                tags: ['市集', '親子', '音樂']
            });
        }

        // ... (Existing Travel Spots) ...
        if (!targetCommunity.travelSpots) targetCommunity.travelSpots = [];
        if (!targetCommunity.travelSpots.find(t => t.id === 'spot-sample-01')) {
            targetCommunity.travelSpots.push({
                id: 'spot-sample-01',
                name: '新瓦屋客家文化保存區',
                description: '新瓦屋客家文化保存區是全台第一個客家文化保存區。園區內保留了許多傳統客家建築，經過整修後，進駐了許多藝文團體與特色店家。適合週末全家大小一同來散步、野餐，感受濃厚的客家文化氛圍。',
                location: [24.814, 121.031],
                coverImage: 'https://images.unsplash.com/photo-1597818861217-1d377b5a5933?q=80&w=800&auto=format&fit=crop',
                tags: ['文化', '歷史', '親子'],
                imageUrls: ['https://images.unsplash.com/photo-1597818861217-1d377b5a5933?q=80&w=800&auto=format&fit=crop']
            });
        }
    }

    // 2. Inject Real Hsinchu Care Resources
    communities.forEach(community => {
        const localActions: CommunityAction[] = [];
        const regionalActions: CommunityAction[] = [];
        const globalActions: CommunityAction[] = [];

        // 1. COLLECT LOCAL (Specific to this village)
        if (community.name.includes('北崙') && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-beilun',
                title: '竹北市北崙社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市北崙里',
                address: '竹北市北崙里博愛街 27-16 號',
                location: [24.8142, 121.0085],
                phone: '0966-830668',
                time: '每週五次供餐',
                status: 'ongoing',
                description: '北崙里社區關懷據點，提供在地長者五天完整共餐與關懷服務。',
                beneficiaries: '65歲以上里民',
                sdgs: [3, 11]
            });
        }

        if (community.name === '竹仁里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-zhuren',
                title: '竹北市竹仁社區發展協會 (據點)',
                type: 'care_visit',
                area: '竹北市竹仁里',
                address: '竹北市文化街 148 巷 1 號',
                location: [24.8360, 121.0125],
                phone: '0920-111891',
                time: '每週三、五供餐',
                status: 'ongoing',
                description: '提供竹仁里長者共餐、健康促進活動及日常關懷。',
                beneficiaries: '65歲以上里民',
                tags: ['長者供餐', '在地老化'],
                sdgs: [3, 11]
            });
        }
        if (community.name === '斗崙里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-doulun-ilink',
                title: '社團法人新竹縣愛鄰社區關懷協會',
                type: 'care_visit',
                area: '竹北市斗崙里',
                address: '竹北市嘉勤南路 86 號',
                location: [24.821253, 121.0182],
                phone: '03-5588577#1214',
                time: '每週一至週五 08:30 - 16:30 (中午供餐)',
                status: 'ongoing',
                description: '提供週一至週五完整共餐服務、長者樂齡課程與電話問安。',
                beneficiaries: '65歲以上長者',
                tags: ['全週供餐', '深耕社區'],
                sdgs: [3, 11]
            });
        }
        if (community.name === '竹義里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-zhuyi',
                title: '竹北市竹義社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市竹義里',
                address: '竹北市福德街 67 號 4 樓',
                location: [24.8385, 121.0065],
                phone: '0936-267345',
                time: '每週四中午供餐 (11:30 - 12:30)',
                status: 'ongoing',
                description: '鄰里互助核心據點，提供長者關懷訪視、餐飲服務與健康促進。',
                beneficiaries: '65歲以上里民',
                tags: ['長者關懷', '在地老化'],
                sdgs: [3, 11]
            });
        }
        if (community.name === '聯興里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-lianxing',
                title: '竹北市聯興社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市聯興里',
                address: '竹北市新興路 175 號',
                location: [24.843644, 121.000631],
                phone: '0963-334373',
                time: '定期集中用餐 (詳洽公告)',
                status: 'ongoing',
                description: '位於聯興集會所，提供長者關懷訪視、健康促進活動及共餐服務。',
                beneficiaries: '65歲以上里民',
                tags: ['社區共好'],
                sdgs: [3, 11]
            });
        }
        if (community.name === '十興里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-shixing',
                title: '竹北市十興社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市十興里',
                address: '竹北市莊敬二街 9 號 (十興里集會所)',
                location: [24.8236, 121.0268],
                phone: '0931-203437',
                time: '每週一至週五供餐',
                status: 'ongoing',
                description: '提供長者日間關懷與共餐服務。',
                beneficiaries: '65歲以上長者',
                sdgs: [3, 11]
            });
        }
        if (community.name === '中興里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-zhongxing',
                title: '竹北市中興社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市中興里',
                address: '竹北市嘉豐南路 1 段 11 號',
                location: [24.8145, 121.0315],
                phone: '0939-250738',
                time: '每週五次共餐',
                status: 'ongoing',
                description: '提供里內便利的長者運動與營養共餐。',
                beneficiaries: '65歲以上長者',
                sdgs: [3, 11]
            });
        }
        if (community.name === '新國里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-xinguo',
                title: '竹北市新國社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市新國里',
                address: '竹北市華興一街 160 號 2 樓',
                location: [24.8275, 121.0015],
                phone: '0932-168899',
                time: '每週五次供餐',
                status: 'ongoing',
                description: '新國里長者共餐與健康促進活動。',
                sdgs: [3, 11]
            });
        }
        if (community.name === '鹿場里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-luchang',
                title: '竹北市鹿場社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市鹿場里',
                address: '竹北市福興東路一段 365 號',
                location: [24.8175, 121.0255],
                phone: '0953-503672',
                time: '每週五次供餐',
                status: 'ongoing',
                description: '鹿場里鄰里長者關懷與互助。',
                sdgs: [3, 11]
            });
        }
        if (community.name === '隘口里' && community.district === '竹北市') {
            localActions.push({
                id: 'care-point-aikou',
                title: '竹北市隘口社區發展協會 (據點)',
                type: 'care_action',
                area: '竹北市隘口里',
                address: '竹北市隘口七街 19 號 1 樓',
                location: [24.8095, 121.0385],
                phone: '0932-378053',
                time: '每週五次供餐',
                status: 'ongoing',
                description: '隘口里長者日間活動與餐飲服務。',
                sdgs: [3, 11]
            });
        }
        if (community.name === '中央里' && community.district === '北區') {
            localActions.push({
                id: 'care-point-central',
                title: '新竹市北區中央社區發展協會 (據點)',
                type: 'care_action',
                area: '新竹市中央里',
                address: '新竹市北區西安街 5 巷 12 號',
                location: [24.8055, 120.9648],
                phone: '03-5231670',
                time: '每週三、五 中午 11:30 - 13:00 (供餐)',
                status: 'ongoing',
                description: '提供中央里在地長者關懷訪視與營養共餐服務。',
                beneficiaries: '65歲以上長者',
                sdgs: [3, 11]
            });
        }
        if (community.name === '北門里' && community.district === '北區') {
            localActions.push({
                id: 'care-point-beimen',
                title: '新竹市北區北門社區發展協會 (據點)',
                type: 'care_action',
                area: '新竹市北門里',
                address: '新竹市北區北門街 209 號 2 樓',
                location: [24.8095, 120.9658],
                phone: '0939-686022',
                time: '每週五 中午 12:00 (供餐)',
                status: 'ongoing',
                description: '北門里在地長者關懷據點，提供共餐與健康課程，傳承老街社區活力。',
                beneficiaries: '65歲以上里民',
                sdgs: [3, 11]
            });
        }


        // 2. COLLECT REGIONAL (Food Banks)
        if (community.city === '新竹縣' && community.district === '竹北市') {
            regionalActions.push({
                id: 'care-foodbank-zhubei',
                title: '新竹縣幸福物資銀行 (竹北分行)',
                type: 'care_action',
                area: '新竹縣竹北市',
                address: '竹北市光明二街 91 號 4 樓',
                location: [24.8390, 121.0120], // 竹北社會福利館正確座標
                phone: '03-5586581',
                time: '物資受理：每月20日前',
                status: 'ongoing',
                description: '提供愛心物資箱與急難救助，協助竹北市內經濟弱勢家庭獲得生活支持。',
                beneficiaries: '低收入戶及急難家庭',
                tags: ['急難救助', '永續共好'],
                link: 'https://social.hsinchu.gov.tw/cp.aspx?n=116'
            });
        }
        if (community.city === '新竹市') {
            regionalActions.push({
                id: 'care-foodbank-hccg',
                title: '新竹市實物代用銀行 (總行)',
                type: 'care_action',
                area: '新竹市全區',
                address: '新竹市中央路 241 號 4 樓',
                location: [24.8080, 120.9712],
                phone: '03-5352386 分機 202',
                time: '週一至週五 08:00 - 17:00',
                status: 'ongoing',
                description: '新竹市政府設置之實物銀行，提供民生物資援助給設籍並實際居住於本市之弱勢家庭。',
                beneficiaries: '本市經濟弱勢家庭',
                tags: ['物資銀行', '公部門資源']
            });
        }

        // ASSEMBLE: Combine existing actions with new injected ones
        // Ensure we don't duplicate if already present (based on ID)
        const existingIds = new Set((community.careActions || []).map(a => a.id));

        const newActions = [...localActions, ...regionalActions, ...globalActions].filter(a => !existingIds.has(a.id));

        community.careActions = [...(community.careActions || []), ...newActions];
    });
};
