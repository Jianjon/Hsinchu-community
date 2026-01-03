import React, { useState, useEffect } from 'react';
import { CommunityPost, CommunityComment } from '../services/localDatabase';
import { getVillagePosts, createPost, likePost, reactToPost, addComment, likeComment, deletePost } from '../services/interactionService';
import { User, MessageSquare, ThumbsUp, Send, Image as ImageIcon, Video, Share2, X, PlusCircle, Hash, Link as LinkIcon, Check, Copy, Trash2 } from 'lucide-react';
import { MOCK_ROLES } from '../data/mock_public';

import { useUser } from '../contexts/UserContext';

interface PostFeedProps {
    villageId: string;
    villageName: string;
    channelId: string;
    isExternalExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
}

const AVAILABLE_TAGS = ['閒聊', '問題', '情報', '二手', '緊急', '好康'];

const REACTIONS = [
    { id: 'like', icon: '👍', label: '讚', color: 'text-blue-500' },
    { id: 'love', icon: '❤️', label: '大心', color: 'text-red-500' },
    { id: 'haha', icon: '😂', label: '哈', color: 'text-yellow-500' },
    { id: 'wow', icon: '😮', label: '哇', color: 'text-orange-500' },
    { id: 'sad', icon: '😢', label: '嗚', color: 'text-yellow-500' },
    { id: 'angry', icon: '😡', label: '怒', color: 'text-orange-600' },
];

const PostFeed: React.FC<PostFeedProps> = ({ villageId, villageName, channelId, isExternalExpanded, onExpandedChange }) => {
    const { user, isLoggedIn, setLoginOverlay } = useUser();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalIsExpanded, setInternalIsExpanded] = useState(false);
    const [postImages, setPostImages] = useState<string[]>([]);
    const [postVideo, setPostVideo] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const videoInputRef = React.useRef<HTMLInputElement>(null);

    const isExpanded = isExternalExpanded !== undefined ? isExternalExpanded : internalIsExpanded;
    const setIsExpanded = (val: boolean) => {
        if (!isLoggedIn && val) {
            setLoginOverlay(true);
            return;
        }
        if (onExpandedChange) onExpandedChange(val);
        else setInternalIsExpanded(val);
    };

    useEffect(() => {
        loadPosts();
        if (isExternalExpanded === undefined) setInternalIsExpanded(false);
    }, [villageId, channelId]);

    const loadPosts = async () => {
        try {
            const data = await getVillagePosts(villageId, channelId);
            setPosts(data);
        } catch (error) {
            console.error("Failed to load posts", error);
        }
    };

    const handleCreatePost = async () => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        if (!newPostContent.trim()) return;
        setIsSubmitting(true);
        try {
            await createPost(villageId, channelId, newPostContent, user?.name || '神秘居民', user?.role || 'guest', postImages.length > 0 ? postImages : undefined, postVideo || undefined, selectedTags, undefined, user?.avatar);
            setNewPostContent('');
            setPostImages([]);
            setPostVideo(null);
            setSelectedTags([]);
            setCustomTagInput('');
            setIsExpanded(false);
            await loadPosts();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReact = async (postId: string, type: string) => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                // Determine new state logic (simplified for optimistic UI)
                // Real DB update happens async
                const isToggleOff = p.userReaction === type;
                const newCount = (p.likes || 0) + (isToggleOff ? -1 : (p.userReaction ? 0 : 1));
                const newReactions = { ...(p.reactions || {}) };
                if (p.userReaction) newReactions[p.userReaction] = Math.max(0, (newReactions[p.userReaction] || 0) - 1);
                if (!isToggleOff) newReactions[type] = (newReactions[type] || 0) + 1;

                return {
                    ...p,
                    likes: Math.max(0, newCount),
                    userReaction: isToggleOff ? undefined : type,
                    reactions: newReactions
                };
            }
            return p;
        }));

        try {
            await reactToPost(postId, type);
            // Optionally reload to ensure consistency
            // await loadPosts(); 
        } catch (error) {
            console.error("React failed", error);
            await loadPosts(); // Revert on failure
        }
    };
    return (
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {/* Facebook-like Expandable Composer */}
            {isExpanded && (
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 transition-all duration-300 overflow-hidden ring-4 ring-emerald-500/5 animate-in fade-in slide-in-from-top-4">
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-emerald-500" />
                                建立新主題
                            </h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold flex-shrink-0 border border-slate-200 shadow-inner overflow-hidden">
                                {isLoggedIn && user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                                ) : (
                                    <User className="w-6 h-6" />
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    autoFocus
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder={`分享在 ${villageName} 的想法、觀察或照片...`}
                                    className="w-full bg-transparent border-0 rounded-none p-0 focus:ring-0 resize-none h-32 text-lg text-slate-800 placeholder:text-slate-400"
                                />
                                {postImages.length > 0 && (
                                    <div className={`grid gap-2 ${postImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                        {postImages.map((img, idx) => (
                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video">
                                                <img src={img} alt="Post preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-slate-900/60 text-white p-1 rounded-full hover:bg-slate-900 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {postVideo && (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black flex items-center justify-center">
                                        <video src={postVideo} className="max-w-full max-h-full" />
                                        <button
                                            onClick={() => setPostVideo(null)}
                                            className="absolute top-1 right-1 bg-slate-900/60 text-white p-1 rounded-full hover:bg-slate-900 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Topic Selector - Horizontal Scroll for Mobile */}
                        <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
                            {AVAILABLE_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        if (selectedTags.includes(tag)) {
                                            setSelectedTags(selectedTags.filter(t => t !== tag));
                                        } else {
                                            setSelectedTags([...selectedTags, tag]);
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap
                                        ${selectedTags.includes(tag)
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    #{tag}
                                </button>
                            ))}

                            {/* Selected Custom Tags */}
                            {selectedTags.filter(t => !AVAILABLE_TAGS.includes(t)).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                    className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm whitespace-nowrap flex items-center gap-1 group"
                                >
                                    #{tag}
                                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </button>
                            ))}

                            {/* Custom Tag Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-2 text-slate-400 text-xs">#</span>
                                <input
                                    type="text"
                                    value={customTagInput}
                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = customTagInput.trim();
                                            if (val && !selectedTags.includes(val)) {
                                                setSelectedTags([...selectedTags, val]);
                                                setCustomTagInput('');
                                            }
                                        }
                                    }}
                                    placeholder="自訂標籤"
                                    className="pl-5 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-24 transition-all focus:w-32"
                                />
                                {customTagInput && (
                                    <button
                                        onClick={() => {
                                            const val = customTagInput.trim();
                                            if (val && !selectedTags.includes(val)) {
                                                setSelectedTags([...selectedTags, val]);
                                                setCustomTagInput('');
                                            }
                                        }}
                                        className="ml-1 text-emerald-600 hover:bg-emerald-50 p-1 rounded-full"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-2 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                            <div className="flex gap-2 text-slate-400">
                                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border hover:bg-slate-50 border-slate-100 ${postImages.length >= 4 || postVideo ? 'opacity-50 pointer-events-none' : 'text-slate-600'}`}>
                                    <ImageIcon className={`w-5 h-5 ${postImages.length > 0 ? 'text-emerald-500' : 'text-green-500'}`} />
                                    <span className="text-sm font-bold">
                                        相片 ({postImages.length}/4)
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple // Enable multiple files
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            const remainingSlots = 4 - postImages.length;
                                            files.slice(0, remainingSlots).forEach(file => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setPostImages(prev => [...prev.slice(0, 3), ev.target?.result as string].slice(0, 4));
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                </label>

                                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border hover:bg-slate-50 border-slate-100 ${postImages.length > 0 || postVideo ? 'opacity-50 pointer-events-none' : 'text-slate-600'}`}>
                                    <Video className={`w-5 h-5 ${postVideo ? 'text-emerald-500' : 'text-blue-500'}`} />
                                    <span className="text-sm font-bold">影片</span>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    alert("影片大小不能超過 10MB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setPostVideo(ev.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || !newPostContent.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20"
                            >
                                <Send className="w-4 h-4" />
                                發佈
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Internal Trigger - Only if not externally expanded */}
            {!isExpanded && isExternalExpanded === undefined && (
                <div
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 cursor-pointer p-4 flex items-center gap-4 group transition-all"
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-inner overflow-hidden">
                        {isLoggedIn && user?.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                        ) : (
                            <User className="w-6 h-6" />
                        )}
                    </div>
                    <div className="flex-1 bg-slate-100 group-hover:bg-slate-200 rounded-full px-5 py-2.5 text-slate-500 font-bold transition-colors">
                        在 {villageName} 建立主題...
                    </div>
                    <div className="pr-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                            <ImageIcon className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors" />
                        </div>
                    </div>
                </div>
            )}

            {/* Posts List */}
            <div className="space-y-5 pb-10">
                {posts.length > 0 ? posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        villageName={villageName}
                        onReact={(type) => handleReact(post.id, type)}
                        onCommentSuccess={loadPosts}
                        onPostDeleted={loadPosts}
                    />
                )) : (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <MessageSquare className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-slate-400 font-bold italic">目前還沒有動態</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PostCard: React.FC<{ post: CommunityPost, villageName: string, onReact: (type: string) => void, onCommentSuccess: () => void, onPostDeleted: () => void }> = ({ post, villageName, onReact, onCommentSuccess, onPostDeleted }) => {
    const { isLoggedIn, user, setLoginOverlay } = useUser();
    const [showComments, setShowComments] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!isLoggedIn) return;
        if (window.confirm('確定要刪除這則貼文嗎？此動作無法復原。')) {
            setIsDeleting(true);
            try {
                await deletePost(post.id);
                onPostDeleted();
            } catch (err) {
                console.error("Failed to delete post:", err);
                alert("刪除失敗，請稍後再試。");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleComment = async () => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        if (!commentContent.trim()) return;
        await addComment(post.id, commentContent, user?.name || "熱心居民", user?.avatar, user?.role);
        setCommentContent('');
        setIsCommenting(false);
        onCommentSuccess();
    };

    const handleShare = async () => {
        // Force custom menu for simplicity (LINE, FB, Copy Link only)
        setShowShareMenu(!showShareMenu);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setShowShareMenu(false);
    };

    const handleLineShare = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`${villageName} 社區動態\n${post.content.slice(0, 50)}...\n`);
        window.open(`https://line.me/R/msg/text/?${text}${url}`, '_blank');
        setShowShareMenu(false);
    };

    const handleFacebookShare = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        setShowShareMenu(false);
    };

    const handleLikeComment = async (commentId: string) => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        await likeComment(post.id, commentId);
        onCommentSuccess();
    };

    const handleReplyTo = (author: string) => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        setShowComments(true);
        setIsCommenting(true);
        setCommentContent(`@${author} `);
    };

    const role = MOCK_ROLES[post.authorRole || 'guest'] || MOCK_ROLES['guest'];

    return (
        <div className={`rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-xl animate-fade-in-up group/card relative
            ${post.authorRole === 'admin'
                ? 'bg-gradient-to-br from-white to-emerald-50/10 border-emerald-400/30 ring-1 ring-emerald-500/5 shadow-emerald-500/5'
                : 'bg-white border-slate-200 shadow-sm'}`}
        >
            {/* VIP Glow for Admin */}
            {post.authorRole === 'admin' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[64px] -z-10 pointer-events-none" />
            )}

            {/* Header */}
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border overflow-hidden shadow-sm
                        ${post.authorRole === 'admin' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-100 border-slate-200'}`}>
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} className="w-full h-full object-cover" alt={post.authorName} />
                        ) : (
                            <User className={`w-6 h-6 ${post.authorRole === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2 leading-tight">
                            {post.authorName}
                            {post.authorRole === 'admin' && (
                                <div className="bg-emerald-500 text-white rounded-full p-0.5" title="官方認證社區管理者">
                                    <PlusCircle className="w-3 h-3 fill-current" />
                                </div>
                            )}
                            {role && (
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded-full border font-black uppercase flex items-center gap-1 shadow-sm"
                                    style={{
                                        backgroundColor: `${role.color}15`,
                                        color: role.color,
                                        borderColor: `${role.color}40`
                                    }}
                                >
                                    {role.icon} {role.name}
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{new Date(post.createdAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {post.authorRole === 'admin' && <span className="text-emerald-500 font-black">• 官方發佈</span>}
                        </div>
                    </div>
                </div>

                {/* Post Options (Delete) */}
                {(user?.name === post.authorName || user?.role === 'admin') && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/card:opacity-100 disabled:opacity-30"
                        title="刪除貼文"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 md:px-5 pb-4 space-y-3">
                <p className={`text-slate-800 leading-relaxed whitespace-pre-wrap font-medium 
                    ${post.authorRole === 'admin' ? 'text-lg md:text-xl text-slate-900 drop-shadow-sm' : 'text-base md:text-[17px]'}`}>{post.content}</p>

                {/* Tags Display */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {post.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[13px] font-bold flex items-center gap-0.5">
                                <Hash className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Multi-Image or Video Display logic */}
                {post.videoUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm relative aspect-video bg-black flex items-center justify-center">
                        <video
                            src={post.videoUrl}
                            className="max-w-full max-h-full"
                            controls
                            playsInline
                        />
                    </div>
                ) : (post.imageUrls || post.imageUrl) && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm relative group/image bg-slate-200/20">
                        {(!post.imageUrls || post.imageUrls.length <= 1) ? (
                            // SINGLE IMAGE WITH BLUR BACKDROP
                            <div className="relative w-full overflow-hidden" style={{ maxHeight: '75vh' }}>
                                {/* Blur Background */}
                                <div
                                    className="absolute inset-0 z-0 blur-xl opacity-40 scale-110"
                                    style={{
                                        backgroundImage: `url(${post.imageUrls?.[0] || post.imageUrl})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'cover'
                                    }}
                                />
                                {/* Main Image */}
                                <img
                                    src={post.imageUrls?.[0] || post.imageUrl}
                                    alt="Post content"
                                    className="relative z-10 w-full h-auto max-h-[75vh] object-contain mx-auto transition-transform duration-700 group-hover/image:scale-[1.02]"
                                />
                            </div>
                        ) : (
                            // MULTI-IMAGE GRID
                            <div className={`grid gap-1.5 bg-slate-100 ${post.imageUrls.length === 2 ? 'grid-cols-2 aspect-[16/9]' :
                                post.imageUrls.length === 3 ? 'grid-cols-2 grid-rows-2 aspect-square' :
                                    'grid-cols-2 aspect-square'
                                }`}>
                                {post.imageUrls.map((url, i) => (
                                    <div
                                        key={i}
                                        className={`relative overflow-hidden ${post.imageUrls!.length === 3 && i === 0 ? 'row-span-2' : ''
                                            }`}
                                    >
                                        <img src={url} alt={`Post image ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="px-5 py-3 flex justify-between items-center text-[12px] font-black tracking-tight text-slate-400 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    {post.likes > 0 && (
                        <div className="flex -space-x-1.5 mr-1">
                            {/* Display top 3 reactions */}
                            {Object.entries(post.reactions || { like: post.likes })
                                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                .filter(x => x[1] > 0)
                                .slice(0, 3)
                                .map(([type]) => {
                                    const reaction = REACTIONS.find(r => r.id === type);
                                    return reaction ? (
                                        <div key={type} className="w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm relative z-10 text-[10px]">
                                            {reaction.icon}
                                        </div>
                                    ) : null;
                                })}
                        </div>
                    )}
                    <span className="hover:underline cursor-pointer decoration-2 underline-offset-4">{post.likes} 個響應</span>
                </div>
                <div className="flex gap-4">
                    <span className="hover:underline cursor-pointer" onClick={() => setShowComments(!showComments)}>
                        {post.comments.length} 則留言
                    </span>
                    <span className="hover:underline cursor-pointer">0 次分享</span>
                </div>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-3 gap-1 p-1.5 px-4 border-t border-slate-100">
                <div className="relative group/reaction">
                    {/* Reaction Picker Popover (Hover) */}
                    <div className="absolute bottom-full left-0 mb-2 p-1 bg-white rounded-full shadow-xl border border-slate-100 flex items-center gap-1 opacity-0 group-hover/reaction:opacity-100 pointer-events-none group-hover/reaction:pointer-events-auto transition-all duration-300 scale-90 group-hover/reaction:scale-100 origin-bottom-left z-30 after:content-[''] after:absolute after:-bottom-4 after:left-0 after:w-full after:h-4">
                        {REACTIONS.map(r => (
                            <button
                                key={r.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReact(r.id);
                                }}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:scale-125 transition-transform hover:bg-slate-50 rounded-full"
                                title={r.label}
                            >
                                {r.icon}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onReact('like')}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 hover:bg-slate-50 rounded-xl font-bold transition-all relative
                        ${post.userReaction
                                ? (REACTIONS.find(r => r.id === post.userReaction)?.color || 'text-blue-600') + ' scale-105'
                                : 'text-slate-500 active:scale-95'}`}
                    >
                        {post.userReaction ? (
                            <span className="text-xl">{REACTIONS.find(r => r.id === post.userReaction)?.icon}</span>
                        ) : (
                            <ThumbsUp className="w-5 h-5" />
                        )}
                        <span>{post.userReaction ? REACTIONS.find(r => r.id === post.userReaction)?.label : '讚'}</span>
                    </button>
                </div>

                <button
                    onClick={() => {
                        setShowComments(true);
                        setIsCommenting(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 hover:bg-slate-50 rounded-xl text-slate-500 font-bold transition-all active:scale-95"
                >
                    <MessageSquare className="w-5 h-5" />
                    留言
                </button>
                <div className="relative">
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-2.5 hover:bg-slate-50 rounded-xl text-slate-500 font-bold transition-all active:scale-95"
                    >
                        <Share2 className="w-5 h-5" />
                        分享
                    </button>

                    {/* Share Menu Fallback (for Desktop) */}
                    {showShareMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-10 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-1">分享至</div>
                            <button onClick={handleLineShare} className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-slate-700 font-bold flex items-center gap-2 transition-colors">
                                <div className="w-5 h-5 bg-[#00B900] rounded text-white flex items-center justify-center text-[10px] font-black">L</div>
                                LINE
                            </button>
                            <button onClick={handleFacebookShare} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 font-bold flex items-center gap-2 transition-colors">
                                <div className="w-5 h-5 bg-[#1877F2] rounded text-white flex items-center justify-center text-[10px] font-black">f</div>
                                Facebook
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={handleCopyLink} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-2 transition-colors">
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-slate-400" />}
                                {copied ? '已複製連結' : '複製連結'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-slate-50 p-5 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-5">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1 overflow-hidden">
                                    {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} className="w-full h-full object-cover" alt={comment.authorName} />
                                    ) : (
                                        <span className="font-black text-slate-400 text-xs">{comment.authorName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                        <div className="font-extrabold text-[13px] text-slate-800">{comment.authorName}</div>
                                        <p className="text-slate-700 text-[14px] leading-snug">{comment.content}</p>
                                    </div>
                                    <div className="flex gap-4 text-[11px] font-black text-slate-400 pl-2 items-center">
                                        <button
                                            onClick={() => handleLikeComment(comment.id)}
                                            className={`hover:underline transition-colors ${comment.likes > 0 ? 'text-blue-500' : 'hover:text-blue-600'}`}
                                        >
                                            讚 {comment.likes > 0 && `(${comment.likes})`}
                                        </button>
                                        <button
                                            onClick={() => handleReplyTo(comment.authorName)}
                                            className="hover:underline hover:text-emerald-600"
                                        >
                                            回覆
                                        </button>
                                        <span className="font-medium opacity-60">
                                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contextual Reply Input */}
                    {(isCommenting || post.comments.length === 0) && (
                        <div className="flex gap-3 pt-4 border-t border-slate-200/50">
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-inner overflow-hidden">
                                {isLoggedIn && user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                                ) : (
                                    <User className="w-4 h-4 text-slate-500" />
                                )}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder={isLoggedIn ? "寫下留言..." : "請先登入後留言"}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-[14px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner"
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                    onClick={() => !isLoggedIn && setLoginOverlay(true)}
                                    readOnly={!isLoggedIn}
                                />
                                <button
                                    onClick={handleComment}
                                    disabled={!isLoggedIn || !commentContent.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-black flex items-center gap-1.5 disabled:opacity-30 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>發佈</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostFeed;

