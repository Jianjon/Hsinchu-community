export interface PublicCommunity {
    id: string;
    name: string;
    city: string;
    district: string;
    description: string;
    tags: string[];
    location: [number, number]; // [lat, lng]
    projects: PublicProject[];
    events: PublicEvent[];
    people: PublicPerson[];

    // Phase 19: Expanded Wiki Fields
    chief?: string;
    population?: string;
    introduction?: string;
    facilities?: string[];
    schools?: string[];
    ngos?: string[];
    faithCenters?: string[];
    resources?: string[];
    geography?: string;
    type?: string;

    wiki?: {
        introduction: string; // 200 words characteristic intro
        population: number;
        area: string; // e.g. "2.5 sq km"
        type: 'rural' | 'urban' | 'mixed';
        chief: {
            name: string;
            photo?: string;
            phone: string;
            officeAddress: string;
            officeHours: string;
        };
        association?: {
            chairman: string;
            contact: string;
            address: string;
        };
        facilities: PublicFacility[];
        awards: string[];
        features: string[];
        coverImage?: string;
        coverImagePosition?: { x: number; y: number };
        coverImageScale?: number;
        icon?: string;
        intro_geo?: string;
        intro_history?: string;
        careActions?: CommunityAction[];
    };

    travelSpots: PublicTravelSpot[];
    boundary?: [number, number][];
    communityBuildings: CommunityBuilding[]; // Placemaking
    cultureHeritages: CultureHeritage[];

    // Phase 23: Community Action (formerly Care)
    careActions?: CommunityAction[];
}

export interface PublicFacility {
    id?: string; // Added for deletion
    coverImage?: string;
    imageUrls?: string[]; // Added for multi-image support
    name: string;
    type: 'park' | 'library' | 'police' | 'school' | 'hospital' | 'activity_center' | 'gov' | 'culture_center' | 'other';
    icon?: string;
    location?: [number, number];
    creatorId?: string;
    // Phase 25: Extended Info
    address?: string;
    phone?: string;
    openingHours?: string;
    description?: string; // Short intro
    googleMapUrl?: string;
}

export interface ProjectUpdate {
    id: string;
    date: string;
    content: string;
    imageUrl?: string;
    stage?: 'before' | 'during' | 'after' | 'update';
}

export interface PublicProject {
    id: string;
    coverImage?: string;
    imageUrls?: string[]; // Added for multi-image support
    icon?: string;
    title: string;
    description: string;
    what: string;
    progress: number; // 0-100
    budget?: string; // e.g. "50萬"
    owner: string;
    imageUrl?: string;
    beforeImage?: string; // For Before/After comparison
    duringImage?: string; // Phase 27: Added for mid-point record
    afterImage?: string;
    status: 'planning' | 'active' | 'completed';
    startDate?: string;
    endDate?: string;
    tags?: string[];
    creatorId?: string;
    // Extended Fields
    fundingSource?: string;
    milestones?: string;
    impactKPIs?: string;
    updates?: ProjectUpdate[]; // Phase 28: Dynamic progress updates
}

export interface PublicEvent {
    id: string;
    coverImage?: string;
    imageUrls?: string[]; // Added for multi-image support
    icon?: string;
    title: string;
    date: string; // YYYY-MM-DD
    endDate?: string; // Optional for range
    time: string; // HH:mm
    location: string;
    description?: string;
    type: 'market' | 'tour' | 'travel' | 'workshop' | 'volunteer' | 'ceremony';
    registrationLink?: string;
    imageUrl?: string;
    tags?: string[];
    creatorId?: string;
    // Extended Fields
    organizer?: string;
    cost?: string;
    capacity?: number;
    targetAudience?: string;
}

export interface PublicTravelSpot {
    id: string;
    coverImage?: string;
    imageUrls?: string[]; // Added for multi-image support
    icon?: string;
    name: string;
    description: string;
    tags: string[];
    imageUrl?: string;
    photo?: string;
    location: [number, number];
    address?: string;
    googleMapLink?: string;
    blogLinks?: { title: string; url: string }[];
    creatorId?: string;
    // Extended Fields
    seasonality?: string;
    duration?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface CommunityBuilding {
    id: string;
    name: string;
    description: string;
    category: 'planner_project' | 'care_center' | 'community_garden' | 'volunteer_service' | 'award_project';
    location: [number, number];
    photos?: string[];
    contact?: string;
    openHours?: string;
    tags?: string[];
    progress?: number;
    creatorId?: string;
}

export interface CultureHeritage {
    id: string;
    coverImage?: string;
    icon?: string;
    name: string;
    description: string;
    history?: string; // Detailed historical background
    category: 'historic_building' | 'temple' | 'traditional_market' | 'cultural_asset' | 'historic_site' | 'traditional_craft';
    location: [number, number];
    address?: string;
    photos?: string[]; // Old photos
    era?: string;
    significance?: string;
    tags?: string[];
    creatorId?: string;
    // Extended Fields
    preservationStatus?: string;
    restorationLog?: string;
}

// Phase 23: Community Action (Report)
export interface CommunityAction {
    id: string;
    coverImage?: string;
    imageUrls?: string[]; // Added for multi-image support
    icon?: string;
    title: string; // Was name/content
    type: 'care_visit' | 'meal_delivery' | 'maintenance' | 'patrol' | 'event_support' | 'other';
    area: string; // e.g. "1維護區", "Zone A"
    status: 'ongoing' | 'completed' | 'planned';
    description: string;
    date?: string; // Phase 26: Made optional for generic format
    endDate?: string; // Optional for range
    link?: string; // Phase 26: Added for external resource links
    creatorId?: string; // The reporter
    beneficiaries?: string;
    tags?: string[];
    // Extended Fields
    sdgs?: number[];
    volunteerPoints?: number;
}

export interface PublicPerson {
    role: string;
    name: string;
    title: string;
}

export type ChannelType = 'announcement' | 'chat' | 'report' | 'proposal' | 'view_map' | 'view_wiki' | 'view_projects';

export interface PublicChannel {
    id: string;
    name: string;
    type: ChannelType;
    description?: string;
}

export type RoleType = 'admin' | 'ngo' | 'verified' | 'guest';

// ... (Keep existing Role/User definitions)
export interface UserRole {
    id: string;
    name: string;
    type: RoleType;
    color: string;
    icon?: string;
}

export interface UserIdentity {
    userId: string;
    displayName: string;
    roleId: string;
    selfTag?: string;
    avatar?: string; // Added avatar field
    role?: string; // Phase 2: Added role field for backward compatibility
}

export const MOCK_CHANNELS: PublicChannel[] = [
    { id: 'view_map', name: '圖解社區位置', type: 'view_map', description: '呈現社區空間地理資訊' },
    { id: 'view_wiki', name: '社區維基百科', type: 'view_wiki', description: '人口與設施基本介紹' },
    { id: 'view_projects', name: '正在進行專案', type: 'view_projects', description: '社區行動實時進度' },
    { id: 'announcements', name: '社區公告', type: 'announcement', description: '重要消息發布' },
    { id: 'general', name: '綜合討論', type: 'chat', description: '日常交流與分享' },
    { id: 'environmental', name: '環境永續', type: 'report', description: '低碳與環境議題' },
    { id: 'wishlist', name: '社區許願池', type: 'proposal', description: '對社區發展的建議' }
];

export const MOCK_ROLES: Record<string, UserRole> = {
    'chief': { id: 'chief', name: '里長/村長', type: 'admin', color: '#ef4444', icon: '👑' },
    'ngo': { id: 'ngo', name: '在地夥伴', type: 'ngo', color: '#8b5cf6', icon: '🤝' },
    'volunteer': { id: 'volunteer', name: '志工人組', type: 'verified', color: '#10b981', icon: '✨' },
    'guest': { id: 'guest', name: '訪客', type: 'guest', color: '#64748b', icon: '👤' }
};

export const MOCK_USERS: Record<string, UserIdentity> = {
    // Cleared as per user request to remove pre-set characters
    'current_user': { userId: 'current_user', displayName: '預覽用戶', roleId: 'guest', selfTag: '訪客' }
};

// Load generated data
import { GENERATED_COMMUNITIES } from './generated_communities';

export const MOCK_COMMUNITIES: PublicCommunity[] = GENERATED_COMMUNITIES as any;

// Inject some mock data for visualization if empty
// This ensures the widgets have content to link to
const targetCommunityId = '新竹縣_竹北市_中興里'; // Example community
const targetCommunity = MOCK_COMMUNITIES.find(c => c.name === '中興里');

if (targetCommunity) {
    if (!targetCommunity.events) targetCommunity.events = [];
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

    if (!targetCommunity.travelSpots) targetCommunity.travelSpots = [];
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


export const MOCK_FOLLOWED_COMMUNITIES = [
    { id: '新竹縣_竹北市_中興里', name: '中興里', avatar: '🏡' },
    { id: '新竹縣_竹北市_東平里', name: '東平里', avatar: '🌳' },
    { id: '新竹縣_竹北市_鹿場里', name: '鹿場里', avatar: '🦌' },
    { id: '新竹縣_竹東鎮_二重里', name: '二重里', avatar: '🛤️' },
];
// Force Update 2026年 1月 2日 週五 08時37分50秒 CST
