import { Newspaper, MapPin, Info, MessageCircle, Heart, Share2, PlayCircle, MoreHorizontal } from 'lucide-react';
import { FeedItem } from '../../hooks/useMixboardData';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface VillageFeedsWidgetProps {
    title?: string;
    feeds?: FeedItem[];
    onLoadMore?: () => void;
    loading?: boolean;
    onNavigate?: (id: string) => void;
}

const FeedCard: React.FC<{ item: FeedItem; onNavigate?: (id: string) => void }> = ({ item, onNavigate }) => {
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    return (
        <div className="bg-white p-4 pb-2 mb-2 shadow-sm last:mb-0">
            {/* Feed Header */}
            <div className="flex items-start justify-between mb-3">
                <div
                    className="flex gap-3 cursor-pointer group"
                    onClick={() => {
                        if (onNavigate) {
                            onNavigate(item.communityId);
                        } else {
                            navigate(`/group/${item.communityId}`);
                        }
                    }}
                >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden shadow-inner border border-gray-100 group-hover:ring-2 ring-blue-100 transition-all">
                        {item.avatar || '🏠'}
                    </div>
                    <div>
                        <h4 className="font-bold text-[#050505] text-[15px] leading-tight flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                            {item.communityName}
                            {item.isPriority && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-normal">置頂</span>}
                        </h4>
                        <div className="flex items-center gap-1 text-[12px] text-[#65676B]">
                            <span>{item.type === 'event' ? '新增了活動' : item.type === 'news' ? '發佈了公告' : '分享了貼文'}</span>
                            <span>·</span>
                            <span>{item.time}</span>
                            <span>·</span>
                            <MapPin className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                <button className="text-[#65676B] hover:bg-gray-100 p-2 rounded-full">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Content Body */}
            <div className="mb-3">
                {item.title && <h5 className="font-bold text-base mb-1 text-[#050505]">{item.title}</h5>}
                <p className="text-[15px] leading-relaxed text-[#050505] whitespace-pre-wrap">
                    {item.content}
                </p>
            </div>

            {/* Media Attachment */}
            {(item.images && item.images.length > 0) && (
                <div className={`rounded-lg overflow-hidden border border-[#E5E7EB] mb-3 ${item.images.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
                    {item.images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className={`relative aspect-square ${item.images!.length === 1 ? 'aspect-video' : ''}`}>
                            <img src={img} alt="content" className="w-full h-full object-cover" />
                            {item.images!.length > 4 && idx === 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                                    +{item.images!.length - 4}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Fake Video Placeholder */}
            {item.videoUrl && (
                <div className="rounded-lg overflow-hidden relative mb-3 aspect-video group cursor-pointer">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors z-10"></div>
                    <img src={item.videoUrl} className="w-full h-full object-cover" alt="video thumbnail" />
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="w-14 h-14 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 group-hover:scale-110 transition-transform">
                            <PlayCircle className="w-8 h-8 text-white ml-1" />
                        </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium z-20">02:14</span>
                </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center justify-between py-2 border-b border-[#E5E7EB] text-[13px] text-[#65676B]">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-[#1877F2] rounded-full flex items-center justify-center border md:border-2 border-white">
                            <div className="text-[10px] text-white">👍</div>
                        </div>
                        {item.type === 'event' && <div className="w-5 h-5 bg-[#F02849] rounded-full flex items-center justify-center border md:border-2 border-white">
                            <div className="text-[10px] text-white">❤️</div>
                        </div>}
                    </div>
                    <span>{likeCount}</span>
                </div>
                <div className="flex gap-3">
                    <span>{item.comments} 則留言</span>
                    <span>{item.shares || 0} 次分享</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1 mt-1">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition-colors font-semibold text-sm ${isLiked ? 'text-blue-600' : 'text-[#65676B]'}`}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-blue-600' : ''}`} />
                    </div>
                    讚
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition-colors text-[#65676B] font-semibold text-sm">
                    <MessageCircle className="w-5 h-5" />
                    留言
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition-colors text-[#65676B] font-semibold text-sm">
                    <Share2 className="w-5 h-5" />
                    分享
                </button>
            </div>
        </div>
    );
};

const VillageFeedsWidget: React.FC<VillageFeedsWidgetProps> = ({ title = "村里動態", feeds = [], onLoadMore, loading = false, onNavigate }) => {

    // Mock local state if no feeds provided (fallback)
    const displayFeeds = feeds.length > 0 ? feeds : [];

    return (

        <div className="flex flex-col bg-[#F0F2F5] p-0 w-full rounded-2xl overflow-hidden border border-[#E7E5E4]">
            {/* Header */}
            <div className="bg-white px-4 py-3 shadow-sm border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-[#1C1E21] text-lg">{title}</h3>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            {/* Feed Area - No internal scroll */}
            <div className="space-y-2 pb-4">
                {displayFeeds.map(item => (
                    <FeedCard key={item.id} item={item} onNavigate={onNavigate} />
                ))}

            </div>

            {/* Load More Button */}
            <div className="p-4 pt-0">
                <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full py-3 bg-white border border-[#E5E7EB] rounded-xl text-[#65676B] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-[#65676B] border-t-transparent rounded-full animate-spin"></div>
                            載入更多動態...
                        </>
                    ) : (
                        "載入更多"
                    )}
                </button>
            </div>
        </div>
    );
};

export default VillageFeedsWidget;


