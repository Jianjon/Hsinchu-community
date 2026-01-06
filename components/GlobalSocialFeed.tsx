import React, { useState, useEffect, useRef } from 'react';
import { CommunityPost, CommunityComment } from '../services/localDatabase';
import { getAllPosts, getVillagePosts, createPost, reactToPost, addComment, likeComment, deletePost } from '../services/interactionService';
import { User, MessageSquare, ThumbsUp, Send, Image as ImageIcon, Video, Share2, X, PlusCircle, Hash, Link as LinkIcon, Check, Copy, Trash2, MapPin, ChevronRight, Navigation } from 'lucide-react';
import { MOCK_ROLES } from '../data/mock_public';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

interface GlobalSocialFeedProps {
    compact?: boolean;
    onNavigate?: (villageId: string) => void;
    filterTag?: string;
    refreshTrigger?: number;
    villageId?: string; // Optional: if provided, fetches specific village posts. If not, fetches Global.
}

const REACTIONS = [
    { id: 'like', icon: '👍', label: '讚', color: 'text-blue-500' },
    { id: 'love', icon: '❤️', label: '大心', color: 'text-red-500' },
    { id: 'haha', icon: '😂', label: '哈', color: 'text-yellow-500' },
    { id: 'wow', icon: '😮', label: '哇', color: 'text-orange-500' },
    { id: 'sad', icon: '😢', label: '嗚', color: 'text-yellow-500' },
    { id: 'angry', icon: '😡', label: '怒', color: 'text-orange-600' },
];

const GlobalSocialFeed: React.FC<GlobalSocialFeedProps> = ({ compact = false, onNavigate, filterTag, refreshTrigger = 0, villageId }) => {
    const { user, isLoggedIn, setLoginOverlay } = useUser();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPosts();
    }, [refreshTrigger, villageId]);

    const loadPosts = async () => {
        try {
            // If villageId is explicitly provided (e.g. 'Global' or a specific village), use getVillagePosts
            // Otherwise default to getAllPosts (which we modified to return 'Global' anyway, but explicit is better)
            const data = villageId
                ? await getVillagePosts(villageId, (filterTag && filterTag !== 'all') ? filterTag : undefined)
                : await getAllPosts();
            setPosts(data);
        } catch (error) {
            console.error("Failed to load global posts", error);
        } finally {
            setLoading(false);
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
        } catch (error) {
            console.error("React failed", error);
            await loadPosts(); // Revert on failure
        }
    };

    const displayedPosts = filterTag && filterTag !== 'all'
        ? posts.filter(p => !p.channelId || p.channelId === filterTag || p.tags?.includes(filterTag))
        : (compact ? posts.slice(0, 5) : posts);

    if (loading && posts.length === 0) return <div className="text-slate-500 animate-pulse">載入中...</div>;

    return (
        <div className={`h-full flex flex-col ${compact ? '' : 'create-post-container'}`}>

            {/* Scrollable Feed List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 md:px-8 md:pb-8 space-y-6 custom-scrollbar">
                {/* Section Header (Inline) */}
                {!compact && (
                    <div className="flex items-center justify-between py-2 pt-6">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                            {(!filterTag || filterTag === 'all') ? '最新動態' :
                                filterTag === 'community_planner' ? '社區規劃師專區' :
                                    filterTag === 'rural_rejuvenation' ? '農村再造交流' :
                                        filterTag === 'recruitment' ? '志工與活動招募' :
                                            filterTag === 'discussion' ? '一般討論' : filterTag}
                        </h3>
                    </div>
                )}

                {displayedPosts.length > 0 ? displayedPosts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onReact={(type) => handleReact(post.id, type)}
                        onCommentSuccess={loadPosts}
                        onPostDeleted={loadPosts}
                        onNavigate={onNavigate}
                        compact={compact}
                    />
                )) : (
                    <div className={`text-center py-12 rounded-3xl border border-dashed text-slate-400 bg-slate-50 border-slate-200`}>
                        <p className="italic">等待第一個社區行動被分享...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PostCard: React.FC<{
    post: CommunityPost,
    onReact: (type: string) => void,
    onCommentSuccess: () => void,
    onPostDeleted: () => void,
    onNavigate?: (villageId: string) => void,
    compact?: boolean
}> = ({ post, onReact, onCommentSuccess, onPostDeleted, onNavigate, compact }) => {
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
        const text = encodeURIComponent(`${post.villageId} 社區動態\n${post.content.slice(0, 50)}...\n`);
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
        <div className={`rounded-2xl border transition-all group relative bg-white border-slate-200 shadow-sm ${compact ? 'hover:shadow-md' : 'hover:shadow-xl'}`}>

            {/* Header */}
            <div className="p-4 md:p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-slate-100 border-slate-200 shadow-sm overflow-hidden`}>
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} className="w-full h-full object-cover" alt={post.authorName} />
                        ) : (
                            <User className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">{post.authorName}</span>
                            {role && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-bold uppercase flex items-center gap-1 shadow-sm"
                                    style={{
                                        backgroundColor: `${role.color}15`,
                                        color: role.color,
                                        borderColor: `${role.color}40`
                                    }}
                                >
                                    {role.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span className="truncate">{post.villageId.replace(/_/g, ' ')}</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Post Options (Delete) */}
                {(user?.name === post.authorName || user?.role === 'admin') && !compact && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="px-4 md:px-5 pb-4 space-y-3">
                <p className={`text-slate-800 leading-relaxed whitespace-pre-wrap font-medium text-sm md:text-[15px] ${compact ? 'line-clamp-3' : ''}`}>
                    {post.content}
                </p>

                {/* Tags Display */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {post.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[12px] font-bold flex items-center gap-0.5">
                                <Hash className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Media */}
                {!compact && (
                    <>
                        {post.videoUrl ? (
                            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm relative aspect-video bg-black flex items-center justify-center">
                                <video src={post.videoUrl} className="max-w-full max-h-full" controls playsInline />
                            </div>
                        ) : (post.imageUrls || post.imageUrl) && (
                            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                {(!post.imageUrls || post.imageUrls.length <= 1) ? (
                                    <div className="relative w-full overflow-hidden" style={{ maxHeight: '60vh' }}>
                                        <img src={post.imageUrls?.[0] || post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                                    </div>
                                ) : (
                                    <div className={`grid gap-1 bg-slate-50 ${post.imageUrls.length === 2 ? 'grid-cols-2 aspect-[16/9]' : 'grid-cols-2 aspect-square'}`}>
                                        {post.imageUrls.map((url, i) => (
                                            <div key={i} className="relative overflow-hidden">
                                                <img src={url} alt={`Post image ${i + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Stats */}
            <div className="px-5 py-3 flex justify-between items-center text-[12px] font-black tracking-tight text-slate-400 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    {post.likes > 0 && (
                        <div className="flex -space-x-1.5 mr-1">
                            {Object.entries(post.reactions || { like: post.likes })
                                .sort((a, b) => b[1] - a[1])
                                .filter(x => x[1] > 0)
                                .slice(0, 3)
                                .map(([type]) => {
                                    const reaction = REACTIONS.find(r => r.id === type);
                                    return reaction ? (
                                        <div key={type} className="w-4 h-4 rounded-full bg-white border border-white flex items-center justify-center shadow-sm relative z-10 text-[10px]">
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
                </div>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-3 gap-1 p-1.5 px-4 border-t border-slate-100">
                <div className="relative group/reaction">
                    {!compact && (
                        <div className="absolute bottom-full left-0 mb-2 p-1 bg-white rounded-full shadow-xl border border-slate-100 flex items-center gap-1 opacity-0 group-hover/reaction:opacity-100 pointer-events-none group-hover/reaction:pointer-events-auto transition-all duration-300 scale-90 group-hover/reaction:scale-100 origin-bottom-left z-30">
                            {REACTIONS.map(r => (
                                <button
                                    key={r.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReact(r.id);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform hover:bg-slate-50 rounded-full"
                                    title={r.label}
                                >
                                    {r.icon}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => onReact('like')}
                        className={`w-full flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg font-bold transition-all relative
                        ${post.userReaction
                                ? (REACTIONS.find(r => r.id === post.userReaction)?.color || 'text-blue-600')
                                : 'text-slate-500'}`}
                    >
                        {post.userReaction ? (
                            <span className="text-lg">{REACTIONS.find(r => r.id === post.userReaction)?.icon}</span>
                        ) : (
                            <ThumbsUp className="w-4 h-4" />
                        )}
                        <span className="text-xs md:text-sm">{post.userReaction ? REACTIONS.find(r => r.id === post.userReaction)?.label : '讚'}</span>
                    </button>
                </div>

                <button
                    onClick={() => {
                        setShowComments(true);
                        setIsCommenting(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-500 font-bold transition-all"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs md:text-sm">留言</span>
                </button>

                <div className="relative">
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-500 font-bold transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs md:text-sm">分享</span>
                    </button>

                    {showShareMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-10 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <button onClick={handleLineShare} className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 text-slate-700 font-bold flex items-center gap-2 text-xs">
                                <div className="w-4 h-4 bg-[#00B900] rounded text-white flex items-center justify-center text-[8px] font-black">L</div>
                                LINE
                            </button>
                            <button onClick={handleFacebookShare} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 font-bold flex items-center gap-2 text-xs">
                                <div className="w-4 h-4 bg-[#1877F2] rounded text-white flex items-center justify-center text-[8px] font-black">f</div>
                                Facebook
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={handleCopyLink} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-2 text-xs">
                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <LinkIcon className="w-3 h-3 text-slate-400" />}
                                {copied ? '已複製' : '複製連結'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-slate-50 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-slate-100">
                    <div className="space-y-4">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-2 group">
                                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-1 overflow-hidden">
                                    {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} className="w-full h-full object-cover" alt={comment.authorName} />
                                    ) : (
                                        <span className="font-black text-slate-400 text-[10px]">{comment.authorName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                        <div className="font-extrabold text-xs text-slate-800">{comment.authorName}</div>
                                        <p className="text-slate-700 text-sm leading-snug">{comment.content}</p>
                                    </div>
                                    <div className="flex gap-3 text-[10px] font-bold text-slate-400 pl-2 items-center">
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

                    {(isCommenting || post.comments.length === 0) && (
                        <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-inner overflow-hidden">
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
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner"
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                                    onClick={() => !isLoggedIn && setLoginOverlay(true)}
                                    readOnly={!isLoggedIn}
                                />
                                <button
                                    onClick={handleComment}
                                    disabled={!isLoggedIn || !commentContent.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 disabled:opacity-30 transition-all shadow-md active:scale-95"
                                >
                                    <Send className="w-3 h-3" />
                                    <span>發佈</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Navigation (Compact Mode) */}
            {compact && !showComments && (
                <div className="px-4 pb-3 pt-0 mt-1 flex justify-end">
                    {onNavigate ? (
                        <button
                            onClick={() => onNavigate && onNavigate(post.villageId)}
                            className={`flex items-center gap-1 text-[10px] font-black uppercase transition-colors text-emerald-600 hover:text-emerald-500`}
                        >
                            <Navigation className="w-3 h-3" /> 前往地圖 <ChevronRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <Link
                            to={`/community/${post.villageId}`}
                            className={`flex items-center gap-1 text-[10px] font-black uppercase transition-colors text-emerald-600 hover:text-emerald-500`}
                        >
                            前往討論 <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSocialFeed;
