import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    Timestamp,
    increment,
    updateDoc,
    getDoc,
    setDoc,
    getCountFromServer,
    Firestore
} from "firebase/firestore";
import { app } from "./firebase";
import { CommunityPost, CommunityComment, ChannelId, CommunityWikiData, PublicProject } from "../types";

// ==========================================
// Firestore Service for Community Platform
// ==========================================

// Lazy Firestore initialization to avoid "null container" error
let _db: Firestore | null = null;
const getDb = (): Firestore => {
    if (!_db) {
        _db = getFirestore(app);
    }
    return _db;
};
// Getter for backwards compatibility
const db = null as any; // Will throw if accessed directly - use getDb() instead

// Collection Names
const COLL_VILLAGES = "villages";
const COLL_POSTS = "posts";
const SUB_COMMENTS = "comments";
const COLL_PROJECTS = "projects";

// Converter to handle Timestamp -> Date
const postConverter = {
    toFirestore: (post: any) => {
        const { id, createdAt, updatedAt, comments, ...rest } = post;
        return {
            ...rest,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Ensure coordinates are saved for map sync
            location: post.location || null
        };
    },
    fromFirestore: (snapshot: any, options: any) => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            // Ensure compatibility fields are present
            images: data.images || [],
            stats: data.stats || { likes: 0, comments: 0, views: 0 }
        } as CommunityPost;
    }
};

const projectConverter = {
    toFirestore: (proj: any) => {
        const { id, ...rest } = proj;
        return { ...rest };
    },
    fromFirestore: (snapshot: any, options: any) => {
        const data = snapshot.data(options);
        return { id: snapshot.id, ...data } as PublicProject;
    }
};

/**
 * Get Posts for a specific Village and Channel
 * @param villageId 
 * @param channelId 
 * @param limitCount 
 * @param lastDoc 
 */
export const getPosts = async (
    villageId: string,
    channelId?: string,
    limitCount: number = 20,
    lastDoc: any = null
): Promise<{ posts: CommunityPost[], lastVisible: any }> => {

    // Base Query: VillageId is partition key
    let constraints: any[] = [
        where("villageId", "==", villageId),
        where("valid", "==", true)
    ];

    if (channelId) {
        constraints.push(where("channelId", "==", channelId));
    }

    // Sort by Date Descending
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(limitCount));

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(getDb(), COLL_POSTS).withConverter(postConverter), ...constraints);

    // TODO: Need composite index for this query in Firestore Console
    // villageId + channelId + createdAt

    try {
        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(d => d.data());
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];

        return { posts, lastVisible };
    } catch (e) {
        console.error("Error fetching posts:", e);
        return { posts: [], lastVisible: null };
    }
};

/**
 * Get "Map Feed" - All posts with location in a village
 */
export const getMapPins = async (villageId: string): Promise<CommunityPost[]> => {
    // Note: Firestore doesn't support "where location != null" directly efficiently with other filters
    // We assume all valid posts with 'location' field defined are pins.
    // Ideally, we add a boolean field 'hasLocation: true' to index on.
    // For now, let's just query filtered by village and do client side filtering or assumes 'location.lat' exists.

    // Optimization: Create a specific 'hasLocation' field in triggers if volume is high.
    // Current approach: Query all posts for village (might be heavy) OR relies on specific index.

    // Better Approach for Prototype: Query recent 50 posts with valid location?
    // Let's rely on orderBy "location" if possible? No.
    // Let's filter client side for now or query a separate "pins" collection if user wants pins separate.
    // BUT user agreed to "Everything is Updated Post".

    // Workaround: We will just fetch recent posts and filter. 
    // Real Prod Solution: GeoHash or 'hasLocation'==true.

    const q = query(
        collection(getDb(), COLL_POSTS),
        where("villageId", "==", villageId),
        where("valid", "==", true),
        orderBy("createdAt", "desc"),
        limit(100)
    );

    const snapshot = await getDocs(q);
    const allRecent = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

    // Filter for those with location
    return allRecent.filter(p => p.location && p.location.lat && p.location.lng) as CommunityPost[];
};

/**
 * Create a new Post
 */
export const createPost = async (postData: Partial<CommunityPost>): Promise<string> => {
    // Defaults
    const payload = {
        villageId: postData.villageId,
        channelId: postData.channelId || 'general',
        author: postData.author,
        content: postData.content || '',
        title: postData.title || '',
        images: postData.images || [],
        location: postData.location || null, // Coordinates {lat, lng}
        address: postData.address || '',     // Searchable address string
        metadata: {
            ...postData.metadata,
            syncStatus: 'synced',
            platform: 'web'
        },
        tags: postData.tags || [],
        valid: true,
        stats: { likes: 0, comments: 0, views: 0 },
    };

    const ref = await addDoc(collection(getDb(), COLL_POSTS).withConverter(postConverter), payload);
    return ref.id;
};

/**
 * Add Comment
 */
export const addComment = async (postId: string, author: any, content: string): Promise<CommunityComment> => {
    const commentPayload = {
        postId,
        author,
        content,
        createdAt: serverTimestamp(),
        likes: 0
    };

    const commentsRef = collection(getDb(), COLL_POSTS, postId, SUB_COMMENTS);
    const docRef = await addDoc(commentsRef, commentPayload);

    // Update Post Stats
    const postRef = doc(getDb(), COLL_POSTS, postId);
    updateDoc(postRef, {
        "stats.comments": increment(1)
    });

    return {
        id: docRef.id,
        postId,
        author,
        content,
        createdAt: new Date(),
        likes: 0
    };
};

/**
 * Get Comments for a Post
 */
export const getComments = async (postId: string): Promise<CommunityComment[]> => {
    const commentsRef = collection(getDb(), COLL_POSTS, postId, SUB_COMMENTS);
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
        } as CommunityComment;
    });
};

/**
 * Like a Post
 */
export const likePost = async (postId: string): Promise<void> => {
    const postRef = doc(getDb(), COLL_POSTS, postId);
    await updateDoc(postRef, {
        "stats.likes": increment(1)
    });
};

// ==========================================
// Knowledge Page (Wiki) Support
// ==========================================

export const getVillageWiki = async (villageId: string): Promise<CommunityWikiData | null> => {
    try {
        const docRef = doc(getDb(), COLL_VILLAGES, villageId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data() as CommunityWikiData;
        }
        return null;
    } catch (e) {
        console.error("Error fetching village wiki:", e);
        return null;
    }
};

export const updateVillageWiki = async (villageId: string, data: Partial<CommunityWikiData>): Promise<void> => {
    const docRef = doc(getDb(), COLL_VILLAGES, villageId);
    // Use setDoc with merge to support both creating new docs and updating existing ones
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    console.log('[Firestore] Village wiki saved:', villageId);
};

export const getVillagesByDistrict = async (townshipName: string): Promise<Record<string, CommunityWikiData>> => {
    try {
        // Query villages where "district" == townshipName
        // Note: Make sure "district" field is indexed or small enough
        const q = query(
            collection(getDb(), COLL_VILLAGES),
            where("district", "==", townshipName)
        );
        const snapshot = await getDocs(q);
        const results: Record<string, CommunityWikiData> = {};
        snapshot.forEach(doc => {
            results[doc.id] = doc.data() as CommunityWikiData;
        });
        return results;
    } catch (e) {
        console.error(`Error fetching villages for district ${townshipName}:`, e);
        return {};
    }
};

// ==========================================
// PO Space (Projects) Support
// ==========================================

export const getProjects = async (villageId: string): Promise<PublicProject[]> => {
    const q = query(
        collection(getDb(), COLL_PROJECTS).withConverter(projectConverter),
        where("owner", "==", villageId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data());
};

export const createProject = async (villageId: string, project: PublicProject): Promise<string> => {
    const payload = {
        ...project,
        owner: villageId,
        createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(getDb(), COLL_PROJECTS).withConverter(projectConverter), payload);
    return ref.id;
};

export const updateProject = async (projectId: string, data: Partial<PublicProject>): Promise<void> => {
    const ref = doc(getDb(), COLL_PROJECTS, projectId);
    await updateDoc(ref, data);
};

/**
 * Get Total User Count from Firestore
 */
export const getTotalUserCount = async (): Promise<number> => {
    try {
        const coll = collection(getDb(), "users");
        const snapshot = await getCountFromServer(coll);
        return snapshot.data().count;
    } catch (e) {
        console.error("Error fetching user count:", e);
        return 0;
    }
};
