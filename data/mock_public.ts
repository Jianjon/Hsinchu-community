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

    // Phase 28: Safety Guard
    safety?: SafetyInfo;

    // Phase 32: Real-time Widget Data
    transportation?: TransportInfo;
    sustainabilityStats?: SustainabilityStats;
}

export interface TransportInfo {
    bus: {
        stationName: string;
        destination: string;
        estimateTime: number; // minutes
        status: 'normal' | 'delay' | 'arriving';
    }[];
    ubike: {
        stationName: string;
        availableBikes: number;
        totalSpaces: number;
        status: 'normal' | 'empty' | 'full';
    }[];
}

export interface SustainabilityStats {
    carbonReduction: {
        current: number; // kg
        target: number; // kg
        trend: 'up' | 'down' | 'stable';
    };
    recycling: {
        total: number; // kg
        unit: string;
    };
    powerSaving: {
        efficiency: number; // percentage
        trend: 'up' | 'down';
    };
    streakMonths: number;
}

export interface SafetyInfo {
    alerts: {
        id: string;
        type: 'typhoon' | 'earthquake' | 'wind' | 'rain' | 'general';
        level: 'low' | 'medium' | 'high'; // Green, Yellow, Red
        title: string;
        description: string;
        date: string;
    }[];
    patrolStatus: {
        status: 'active' | 'inactive' | 'reinforced';
        lastPatrolTime?: string;
        description: string;
    };
    contacts: {
        name: string;
        title: string;
        phone: string;
    }[];
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
    location?: [number, number];
    address?: string;
    // Engagement
    likes?: number; // Phase 31: Real engagement
    comments?: number;
    shares?: number;
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
    coordinates?: [number, number];
    // Engagement
    likes?: number;
    comments?: number;
    shares?: number;
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
    type: string; // 'care_action' | 'other' etc.
    area: string; // e.g. "1維護區", "Zone A"
    status: 'ongoing' | 'completed' | 'planned';
    description: string;
    date?: string; // Phase 26: Made optional for generic format
    endDate?: string; // Optional for range
    link?: string; // Phase 26: Added for external resource links
    creatorId?: string; // The reporter
    beneficiaries?: string;
    tags?: string[];
    location?: [number, number]; // Phase 26: Added for precise map pins
    phone?: string; // Phase 26: Added for care point contact
    time?: string; // Phase 26: Added for care point service/meal hours
    address?: string; // Phase 26: Explicit address field
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
    // Meta Views (Icons)
    { id: 'view_wiki', name: '社區維基百科', type: 'view_wiki', description: '人口與設施基本介紹' },
    { id: 'view_projects', name: '正在進行專案', type: 'view_projects', description: '社區行動實時進度' },
    { id: 'view_map', name: '圖解社區位置', type: 'view_map', description: '呈現社區空間地理資訊' },

    // Discussion Channels - Main List
    { id: 'general', name: '一般討論', type: 'chat', description: '日常交流與分享' },
    { id: 'announcements', name: '重要公告', type: 'announcement', description: '重要消息發布' },
    { id: 'green_base', name: '社區綠基', type: 'chat', description: '綠色基盤與生態' },
    { id: 'activities', name: '在地活動', type: 'chat', description: '社區活動資訊' },
    { id: 'travel', name: '輕旅行', type: 'chat', description: '在地旅遊推薦' },
    { id: 'placemaking', name: '地方創生', type: 'chat', description: '產業與創業交流' },
    { id: 'culture', name: '文化資產', type: 'chat', description: '歷史與文化保存' },
    { id: 'sustainability', name: '永續共好', type: 'chat', description: 'SDGs 與永續發展' }
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
import { enrichCommunityData } from '../services/dataEnrichment';

export const MOCK_COMMUNITIES: PublicCommunity[] = GENERATED_COMMUNITIES as any;

// Inject mock data and real-world care resources using the centralized service
enrichCommunityData(MOCK_COMMUNITIES);


export const MOCK_FOLLOWED_COMMUNITIES = [
    { id: '新竹縣_竹北市_中興里', name: '中興里', avatar: '🏡' },
    { id: '新竹縣_竹北市_東平里', name: '東平里', avatar: '🌳' },
    { id: '新竹縣_竹北市_鹿場里', name: '鹿場里', avatar: '🦌' },
    { id: '新竹縣_竹東鎮_二重里', name: '二重里', avatar: '🛤️' },
];
// Force Update 2026年 1月 5日 週一 09時30分00秒 CST
