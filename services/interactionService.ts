import { initLocalDB, CommunityPost, CommunityComment } from './localDatabase';

const POSTS_STORE_NAME = "village_posts";

/**
 * Get all posts for a specific village, optionally filtered by channel
 */
export const getVillagePosts = async (villageId: string, channelId?: string): Promise<CommunityPost[]> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readonly");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const index = store.index("villageId");
        const request = index.getAll(villageId);

        request.onsuccess = async () => {
            let posts = request.result as CommunityPost[];

            // IF EMPTY, do not seed. Return empty.
            if (posts.length === 0) {
                // posts = []; // Already empty
            }

            // Filter by channel if provided
            if (channelId) {
                posts = posts.filter(p => p.channelId === channelId);
            }

            // Sort in memory 
            posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            resolve(posts);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Get all posts across all villages for the global feed
 */
export const getAllPosts = async (): Promise<CommunityPost[]> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readonly");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const index = store.index("villageId");
        const request = index.getAll("Global");

        request.onsuccess = async () => {
            let posts = request.result as CommunityPost[];

            if (posts.length === 0) {
                // Seed Initial Data for Demo
                const seedPosts = [
                    {
                        villageId: 'Global',
                        channelId: '一般討論',
                        content: '歡迎使用新竹社區平台！在這裡，您可以與其他社區的夥伴交流心得。',
                        authorName: '系統管理員',
                        role: 'admin',
                        tags: ['discussion'],
                        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
                    },
                    {
                        villageId: 'Global',
                        channelId: '社區規劃師',
                        content: '【徵件公告】113年度社區規劃師駐地輔導計畫開始徵件囉！歡迎各社區踴躍提案，共同打造美好家園。詳情請見縣府網站。',
                        authorName: '都發處小幫手',
                        role: 'gov',
                        tags: ['community_planner'],
                        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Planner'
                    },
                    {
                        villageId: 'Global',
                        channelId: '農村再造',
                        content: '我們社區最近在推動有機耕作，想請問有沒有其他社區有類似經驗可以分享？特別是關於產銷班的運作模式。',
                        authorName: '快樂農夫',
                        role: 'resident',
                        tags: ['rural_rejuvenation'],
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Farmer'
                    },
                    {
                        villageId: 'Global',
                        channelId: '活動招募',
                        content: '下週六早上九點，需要在活動中心舉辦淨溪活動，誠徵 20 位志工夥伴！備有午餐喔！',
                        authorName: '熱血志工長',
                        role: 'volunteer',
                        tags: ['recruitment'],
                        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Volunteer'
                    }
                ];

                for (const post of seedPosts) {
                    await createPost(post.villageId, post.channelId, post.content, post.authorName, post.role, undefined, undefined, post.tags, undefined, post.avatar);
                }

                posts = await getAllPosts(); // Recurse once to get seeded
                resolve(posts);
                return;
            }

            // Sort by date descending
            posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            resolve(posts);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Create a new post
 */
export const createPost = async (villageId: string, channelId: string, content: string, authorName: string, role: string = 'guest', imageUrls?: string[], videoUrl?: string, tags: string[] = [], coordinates?: [number, number], authorAvatar?: string): Promise<CommunityPost> => {
    const db = await initLocalDB();

    const newPost: CommunityPost = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        villageId,
        channelId, // Phase 9: Channel Support
        authorName,
        authorAvatar,
        authorRole: role, // Snapshot role
        content,
        imageUrl: imageUrls?.[0], // Keep legacy support
        imageUrls, // Multi-image support
        videoUrl,  // Added for short video support
        coordinates, // Added
        type: videoUrl ? 'video' : (imageUrls && imageUrls.length > 0) ? 'image' : 'text',
        likes: 0,
        comments: [],
        tags,
        reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
        userReaction: undefined,
        createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const request = store.add(newPost);

        request.onsuccess = () => {
            resolve(newPost);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * React to a post (Like, Love, Haha, etc.)
 */
export const reactToPost = async (postId: string, type: string): Promise<void> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const getDisplay = store.get(postId);

        getDisplay.onsuccess = () => {
            const post = getDisplay.result as CommunityPost;
            if (post) {
                // Init
                if (!post.reactions) post.reactions = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
                // Ensure all keys exist
                const types = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
                types.forEach(t => { if (post.reactions![t] === undefined) post.reactions![t] = 0; });

                const oldType = post.userReaction;

                if (oldType === type) {
                } else {
                    // Switch or Add
                    if (oldType) {
                        // Switch: Decrement old
                        post.reactions[oldType] = Math.max(0, (post.reactions[oldType] || 0) - 1);
                    }
                    // Increment new
                    post.reactions[type] = (post.reactions[type] || 0) + 1;
                    post.userReaction = type;
                }

                // Force sync likes count (Self-healing)
                post.likes = Object.values(post.reactions).reduce((a, b) => a + b, 0);

                store.put(post);
                resolve();
            } else {
                reject("Post not found");
            }
        };

        getDisplay.onerror = () => reject(getDisplay.error);
    });
};

/**
 * Legacy support for simple like
 */
export const likePost = async (postId: string): Promise<void> => {
    return reactToPost(postId, 'like');
};

/**
 * Add a comment to a post
 */
export const addComment = async (postId: string, content: string, authorName: string, authorAvatar?: string, authorRole?: string): Promise<CommunityComment> => {
    const db = await initLocalDB();

    const newComment: CommunityComment = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorName,
        authorAvatar,
        authorRole,
        content,
        likes: 0,
        createdAt: new Date()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const getDisplay = store.get(postId);

        getDisplay.onsuccess = () => {
            const post = getDisplay.result as CommunityPost;
            if (post) {
                post.comments.push(newComment);
                store.put(post);
                resolve(newComment);
            } else {
                reject("Post not found");
            }
        };

        getDisplay.onerror = () => reject(getDisplay.error);
    });
};

/**
 * Like a specific comment on a post
 */
export const likeComment = async (postId: string, commentId: string): Promise<void> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const getRequest = store.get(postId);

        getRequest.onsuccess = () => {
            const post = getRequest.result as CommunityPost;
            if (post) {
                const comment = post.comments.find(c => c.id === commentId);
                if (comment) {
                    comment.likes = (comment.likes || 0) + 1;
                    store.put(post);
                    resolve();
                } else {
                    reject("Comment not found");
                }
            } else {
                reject("Post not found");
            }
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
};

/**
 * Delete a post by ID
 */
export const deletePost = async (postId: string): Promise<void> => {
    const db = await initLocalDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([POSTS_STORE_NAME], "readwrite");
        const store = transaction.objectStore(POSTS_STORE_NAME);
        const request = store.delete(postId);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};
