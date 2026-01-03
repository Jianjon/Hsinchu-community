import { LocationData, AnalysisResult, VillageRecord, AppStep, CommunityWikiData } from "../types";
import { createStage1Data, createStage2Data, createStage3Data } from "./fileExport";

// ==========================================
// IndexedDB Local Database Service
// ==========================================

const DB_NAME = "TaiwanVillageAnalystDB";
const DB_VERSION = 4; // Upgrade for Phase 9: Channels
const STORE_NAME = "village_records";
const POSTS_STORE_NAME = "village_posts";

export interface CommunityPost {
    id: string; // timestamp_random
    villageId: string;
    channelId: string; // Phase 9: Discord channel ID
    authorName: string;
    authorAvatar?: string;
    authorRole?: string; // 'admin' | 'resident'
    userRole?: string; // Phase 10: Added specifically for feed display (e.g., '里長', '志工')
    content: string;
    type?: 'text' | 'image' | 'video' | 'event'; // Added type
    imageUrl?: string;
    imageUrls?: string[]; // Added for multi-image support
    videoUrl?: string;  // Added for short video support
    coordinates?: [number, number]; // Added for map pinning
    likes: number;
    comments: CommunityComment[];
    tags?: string[];
    reactions?: Record<string, number>;
    userReaction?: string;
    createdAt: Date;
}

export interface CommunityComment {
    id: string;
    authorName: string;
    authorAvatar?: string;
    authorRole?: string;
    content: string;
    likes: number; // Added for comment likes
    createdAt: Date;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export const initLocalDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB open error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log("IndexedDB initialized successfully");
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // 1. Village Records Store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("city", "location.city", { unique: false });
                store.createIndex("district", "location.district", { unique: false });
                store.createIndex("village", "location.village", { unique: false });
                store.createIndex("updatedAt", "updatedAt", { unique: false });
                store.createIndex("step", "step", { unique: false });
                console.log("Village store created");
            }

            // 2. Village Posts Store (New in v3)
            if (!db.objectStoreNames.contains(POSTS_STORE_NAME)) {
                const postStore = db.createObjectStore(POSTS_STORE_NAME, { keyPath: "id" });
                postStore.createIndex("villageId", "villageId", { unique: false });
                postStore.createIndex("createdAt", "createdAt", { unique: false });
                console.log("Posts store created");
            }

            // 3. Update V4: Add channelId index if it doesn't exist (or for existing store)
            const tx = (event.target as IDBOpenDBRequest).transaction;
            if (tx) {
                const postStore = tx.objectStore(POSTS_STORE_NAME);
                if (!postStore.indexNames.contains("channelId")) {
                    postStore.createIndex("channelId", "channelId", { unique: false });
                    console.log("Added channelId index to posts store");
                }
            }
        };
    });
};

/**
 * Generate unique ID from location data
 */
export const generateRecordId = (location: LocationData): string => {
    return `${location.city}_${location.district}_${location.village}`;
};

/**
 * Save or update a village record with intelligent stage data generation
 */
export const saveVillageRecord = async (
    location: LocationData,
    result: AnalysisResult,
    step: AppStep,
    tags?: string[],
    wikiData?: CommunityWikiData // Added argument
): Promise<void> => {
    const db = await initLocalDB();
    const id = generateRecordId(location);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        // First, try to get existing record
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const existingRecord = getRequest.result as VillageRecord | undefined;
            const now = new Date();

            const record: VillageRecord = {
                id,
                location,
                result, // Always update current UI result
                createdAt: existingRecord?.createdAt || now,
                updatedAt: now,
                step,
                tags: tags || existingRecord?.tags || [],

                // Update wiki data if provided, otherwise preserve existing
                wikiData: wikiData || existingRecord?.wikiData,

                // Preserve existing stages
                stage1: existingRecord?.stage1,
                stage2: existingRecord?.stage2,
                stage3: existingRecord?.stage3
            };

            // Update specific stage data based on current step
            if (step === AppStep.STEP_1_DRAFT) {
                record.stage1 = createStage1Data(location, result);
            } else if (step === AppStep.STEP_2_INTERVIEW) {
                // Step 2 is reached when Step 1 is done, OR when checklist is generated
                // Usually Step 1 results in Step 2 being the NEXT step.
                // If we are calling save with STEP_2_INTERVIEW, it likely means we just finished Step 1 and are ready for Step 2.
                // However, if we modified the checklist, we might want to save Stage 2.
                // For safety, if we have a checklist, let's update stage 2.
                if (result.checklist && result.checklist.length > 0) {
                    record.stage2 = createStage2Data(location, result.checklist);
                }
                // Also ensure stage 1 is there if missing
                if (!record.stage1) {
                    record.stage1 = createStage1Data(location, result);
                }
            } else if (step === AppStep.STEP_3_FINAL) {
                record.stage3 = createStage3Data(location, result);

                // Ensure stage 2/1 exist if possible
                if (!record.stage2 && result.checklist) {
                    record.stage2 = createStage2Data(location, result.checklist);
                }
            }

            const putRequest = store.put(record);

            putRequest.onsuccess = () => {
                console.log(`Record saved: ${id}`);
                resolve();
            };

            putRequest.onerror = () => {
                console.error("Error saving record:", putRequest.error);
                reject(putRequest.error);
            };
        };

        getRequest.onerror = () => {
            reject(getRequest.error);
        };
    });
};

/**
 * Get a single village record by ID
 */
export const getVillageRecord = async (id: string): Promise<VillageRecord | null> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            const record = request.result as VillageRecord | undefined;
            if (record) {
                // Convert date strings back to Date objects
                record.createdAt = new Date(record.createdAt);
                record.updatedAt = new Date(record.updatedAt);
            }
            resolve(record || null);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Get all village records, sorted by updatedAt descending
 */
export const getAllVillageRecords = async (): Promise<VillageRecord[]> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const records = request.result as VillageRecord[];

            // Convert date strings and sort by updatedAt descending
            records.forEach(record => {
                record.createdAt = new Date(record.createdAt);
                record.updatedAt = new Date(record.updatedAt);
            });

            records.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            resolve(records);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Delete a village record by ID
 */
export const deleteVillageRecord = async (id: string): Promise<void> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`Record deleted: ${id}`);
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Search records by city or district
 */
export const searchRecordsByLocation = async (
    searchCity?: string,
    searchDistrict?: string
): Promise<VillageRecord[]> => {
    const allRecords = await getAllVillageRecords();

    return allRecords.filter(record => {
        const matchCity = !searchCity || record.location.city.includes(searchCity);
        const matchDistrict = !searchDistrict || record.location.district.includes(searchDistrict);
        return matchCity && matchDistrict;
    });
};

/**
 * Get record count
 */
export const getRecordCount = async (): Promise<number> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Clear all records (use with caution!)
 */
export const clearAllRecords = async (): Promise<void> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            console.log("All records cleared");
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Export all records as JSON string
 */
export const exportAllRecordsAsJSON = async (): Promise<string> => {
    const records = await getAllVillageRecords();
    return JSON.stringify(records, null, 2);
};
