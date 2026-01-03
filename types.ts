
export interface LocationData {
  city: string;
  district: string;
  village: string;
}

export interface AnalysisResult {
  markdown: string;
  sources: Array<{ title: string; uri: string }>;
  checklist?: AuditCategory[]; // Structured data for Step 2
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  }
}

export enum AppStatus {
  IDLE,
  ANALYZING,
  COMPLETED,
  ERROR
}

export enum AppStep {
  STEP_1_DRAFT = 1,      // Web Data Collection
  STEP_2_INTERVIEW = 2,  // Field Interview & Checklist
  STEP_3_FINAL = 3       // AI Integration
}

export type AuditStatus = 'missing' | 'resolved';

export interface AuditItem {
  id: string;
  category: string;
  actionItem: string;     // e.g., "推動綠屋頂"
  description: string;    // AI's findings from web
  status: AuditStatus;
  // interviewNotes removed in favor of global transcript
}

export interface AuditCategory {
  name: string;           // e.g., "生態綠化"
  items: AuditItem[];
}

export type ProgressCallback = (message: string) => void;

// Stage 1: Web Research Data
export interface Stage1Data {
  location: LocationData;
  markdown: string;
  sources: Array<{ title: string; uri: string }>;
  createdAt: string;
}

// Stage 2: Questionnaire Data
export interface Stage2Data {
  location: LocationData;
  checklist: AuditCategory[];
  createdAt: string;
}

// Stage 3: Final Integrated Report
export interface Stage3Data {
  location: LocationData;
  markdown: string;
  sources: Array<{ title: string; uri: string }>;
  checklist: AuditCategory[];
  transcript?: string;
  createdAt: string;
  updatedAt: string;
}

// Community Wiki Data (New in v4)
export interface CommunityWikiData {
  communityName: string;
  adminRegion: string;
  villageName: string;

  basicInfo: {
    population: number;
    householdCount: number;
    villageChief: string;
    officeAddress: string;
    officePhone?: string;
  };

  location: {
    name: string;
    lat: number;
    lng: number;
    address: string;
  };

  geography: {
    boundaries?: string;
    rivers?: string;
    transportation?: string;
  };
  history: {
    origins?: string;
    events?: string;
    nameOrigin?: string;
  };
  facilities: {
    activityCenter?: string;
    parks?: string[];
    schools?: string[];
  };
}

// Local Database Record
export interface VillageRecord {
  id: string;                    // Format: "city_district_village"
  location: LocationData;        // { city, district, village }
  result: AnalysisResult;        // Current active result for UI

  wikiData?: CommunityWikiData;  // Enhanced community data

  // Specific Stage Data (for file export)
  stage1?: Stage1Data;
  stage2?: Stage2Data;
  stage3?: Stage3Data;

  createdAt: Date;               // First creation time
  updatedAt: Date;               // Last update time
  step: AppStep;                 // Which step was completed
  tags?: string[];               // Optional tags for categorization
}

// ==========================================
// Community Interactions (Unified Types)
// ==========================================

export interface PostAuthor {
  id: string; // userId
  name: string;
  avatar?: string;
  role: 'admin' | 'resident' | 'volunteer' | 'official' | 'guest';
}

export type ChannelId = 'general' | 'public' | 'events' | 'travel' | 'projects' | 'culture' | 'care' | 'resource';

export interface PostMetadata {
  // Event
  eventDate?: string;
  eventTime?: string;
  registrationLink?: string;
  capacity?: number;
  targetAudience?: string;
  cost?: string;
  organizer?: string;

  // Project (Revitalization)
  projectStatus?: 'planning' | 'active' | 'completed';
  progress?: number;
  beforeImage?: string;
  afterImage?: string;
  milestones?: string;       // JSON string for goals/achievements
  fundingSource?: string;
  impactKPIs?: string;

  // Travel/Resource
  address?: string;
  openHours?: string;
  duration?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  seasonality?: string;

  // Culture
  historyEra?: string;
  preservationStatus?: string;
  restorationLog?: string;

  // Care (Sustainability)
  beneficiaries?: string;
  sdgs?: number[];           // Array of SDG numbers (1-17)
  volunteerPoints?: number;
}

export interface CommunityPost {
  id: string;
  villageId: string;
  channelId: ChannelId | string; // Allow string for flexibility

  author: PostAuthor;

  title?: string;
  content: string;
  address?: string; // Searchable address string

  // Media & Location
  images: string[]; // Multiple images support
  videoUrl?: string; // Short video support
  location?: {
    lat: number;
    lng: number;
    address?: string;
    name?: string;
  };

  // Metadata for Specific Channels
  metadata?: PostMetadata;

  tags: string[];

  // Stats & Interaction
  valid: boolean; // Soft delete
  createdAt: Date; // In Firestore this will be Timestamp, converted to Date in client
  updatedAt: Date;

  stats: {
    likes: number;
    comments: number;
    views: number;
  };

  // Loaded dynamically
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: Date;
  likes: number;
  replyToId?: string; // For nested threads
}
