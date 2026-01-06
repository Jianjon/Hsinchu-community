import React from 'react';
import { MapPin, Calendar, Clock, User, Star, Hammer, Tag, Trash2, Edit3, MoreHorizontal } from 'lucide-react';

export interface CommunityItemCardProps {
    data: any;
    type: 'event' | 'travel' | 'project' | 'culture' | 'care_action' | 'facility';
    isEditMode: boolean;
    onClick: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const CommunityItemCard: React.FC<CommunityItemCardProps> = ({
    data,
    type,
    isEditMode,
    onClick,
    onDelete
}) => {
    // 1. Determine Cover Image
    const coverImage = data.coverImage || data.imageUrl || data.beforeImage || data.photos?.[0];

    // 2. Determine Title & Subtitle
    const title = data.title || data.name || 'Untitled';
    const description = data.description || '';

    // 3. Render Badges / Metadata based on Type
    const renderBadges = () => {
        switch (type) {
            case 'event':
                if (data.date) {
                    const [y, m, d] = data.date.split('-');
                    return (
                        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur rounded-lg px-2.5 py-1 text-center shadow-sm border border-slate-100/50">
                            <div className="text-[10px] font-bold text-red-500 uppercase leading-none mb-0.5">{m}月</div>
                            <div className="text-lg font-black text-slate-800 leading-none">{d}</div>
                        </div>
                    );
                }
                return null;
            case 'travel':
                if (data.rating) {
                    return (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" /> {data.rating}
                        </div>
                    );
                }
                return null;
            case 'project':
            case 'care_action':
                if (data.status && data.status !== 'ongoing') {
                    const colorClass = data.status === 'completed' || data.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500';
                    return (
                        <div className="absolute top-2 right-2">
                            <span className={`text-white font-bold text-[10px] px-2 py-1 rounded-full shadow-sm ${colorClass}`}>
                                {data.status}
                            </span>
                        </div>
                    );
                }
                return null;
            case 'culture':
                if (data.era) {
                    return (
                        <div className="absolute top-2 left-2 bg-amber-100/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm border border-amber-200">
                            <div className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                <Hammer className="w-3 h-3" /> {data.era}
                            </div>
                        </div>
                    );
                }
                return null;
            default:
                return null;
        }
    };

    const renderFooterMeta = () => {
        switch (type) {
            case 'event':
                return (
                    <div className="flex items-center gap-3 text-slate-500 text-xs mt-auto pt-3 border-t border-slate-50">
                        {data.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {data.time}</span>}
                        {data.location && <span className="flex items-center gap-1 max-w-[50%] truncate"><MapPin className="w-3 h-3" /> {data.location}</span>}
                    </div>
                );
            case 'travel':
                // Tags
                if (data.tags && data.tags.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-slate-50">
                            {data.tags.slice(0, 3).map((t: string) => (
                                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">#{t}</span>
                            ))}
                        </div>
                    );
                }
                return null;
            case 'project':
                if (typeof data.progress === 'number') {
                    return (
                        <div className="w-full mt-auto pt-3 border-t border-slate-50">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                <span>進度</span>
                                <span>{data.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.progress}%` }} />
                            </div>
                        </div>
                    );
                }
                return null;
            case 'care_action':
                // Owner / Date
                return (
                    <div className="flex items-center justify-between text-slate-400 text-xs mt-auto pt-3 border-t border-slate-50">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {data.owner || '志工'}</span>
                        {data.date && <span>{data.date}</span>}
                    </div>
                );
            case 'culture':
                // Maybe some extra meta? Location?
                return (
                    <div className="flex items-center gap-3 text-slate-500 text-xs mt-auto pt-3 border-t border-slate-50">
                        {data.location && <span className="flex items-center gap-1 max-w-[80%] truncate"><MapPin className="w-3 h-3" /> {data.location || '社區內'}</span>}
                    </div>
                );
            case 'facility':
                return data.openingHours ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded self-start mt-2">
                        <Clock className="w-3 h-3" /> {data.openingHours}
                    </div>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <div
            className="group bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full relative"
            onClick={onClick}
        >
            {/* Cover Image Section */}
            <div className={`relative bg-slate-100 overflow-hidden shrink-0 aspect-video`}>
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        {/* Fallback Icon based on type? */}
                        <div className="text-4xl opacity-20">
                            {type === 'event' ? '🗓️' : type === 'travel' ? '🗺️' : type === 'culture' ? '🏛️' : '📦'}
                        </div>
                    </div>
                )}

                {/* Overlays */}
                {renderBadges()}

                {/* Edit Actions Overlay (Top Right) */}
                {isEditMode && onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-400 hover:text-red-500 rounded-lg shadow-sm backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className={`p-4 flex flex-col flex-1`}>
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-2 min-h-[2.5em]">
                    {description || '尚無描述...'}
                </p>

                {/* Footer Metadata */}
                {renderFooterMeta()}
            </div>
        </div>
    );
};

export default CommunityItemCard;
