import React, { useEffect, useState } from 'react';
import { getAllPosts } from '../../services/interactionService';
import { CommunityPost } from '../../services/localDatabase';
import { MOCK_FOLLOWED_COMMUNITIES } from '../../data/mock_public';
import { MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupHomeFeed: React.FC = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);

    useEffect(() => {
        getAllPosts().then(allPosts => {
            // Filter posts that belong to "Followed Communities"
            // For prototype, we just show all posts, or you could filter:
            // const followedIds = MOCK_FOLLOWED_COMMUNITIES.map(c => c.id);
            // const relevantPosts = allPosts.filter(p => followedIds.includes(p.villageId));
            setPosts(allPosts);
        });
    }, []);

    const getCommunityName = (id: string) => {
        const village = MOCK_FOLLOWED_COMMUNITIES.find(c => c.id === id);
        return village ? village.name : id.split('_').pop();
    };

    return (
        <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
            <div className="p-6 pb-0 max-w-3xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">我的社群動態</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-0">
                <div className="max-w-3xl mx-auto space-y-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                            <p>目前尚無動態追蹤</p>
                            <p className="text-sm mt-2">嘗試加入更多社區來豐富您的首頁！</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                                        👤
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800">{post.authorName}</span>
                                            <Link to={`/group/${post.villageId}`} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                                                @{getCommunityName(post.villageId)}
                                            </Link>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {post.userRole} · {new Date(post.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4 font-medium">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-4 text-slate-400 text-sm border-t border-slate-100 pt-3">
                                    <button className="flex items-center gap-1 hover:text-emerald-500 transition-colors">
                                        <Heart className="w-4 h-4" /> {post.likes}
                                    </button>
                                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                        <MessageCircle className="w-4 h-4" /> {post.comments.length} 則留言
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupHomeFeed;
