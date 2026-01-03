import React, { useState, useEffect } from 'react';
import { X, Star, StarOff, MessageSquare, MapPin, Calendar, Hammer, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { PublicCommunity } from '../data/mock_public';
import PostFeed from './PostFeed';
import GlobalSocialFeed from './GlobalSocialFeed';

export type DrawerTab = 'feed' | 'info' | 'events' | 'projects';

interface CommunityDrawerProps {
    open: boolean;
    mode: 'home' | 'community';
    community: PublicCommunity | null;
    onClose: () => void;
    onNavigateToCommunity?: (id: string) => void;
}

const CommunityDrawer: React.FC<CommunityDrawerProps> = ({
    open,
    mode,
    community,
    onClose,
    onNavigateToCommunity
}) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const [activeTab, setActiveTab] = useState<DrawerTab>('feed');
    const [isExpanded, setIsExpanded] = useState(true);

    // Reset tab when community changes
    useEffect(() => {
        setActiveTab('feed');
    }, [community?.id, mode]);

    const toggleFavorite = () => {
        if (!community) return;
        if (isFavorite(community.id)) {
            removeFavorite(community.id);
        } else {
            addFavorite(community.id);
        }
    };

    if (!open) return null;

    const tabs: { id: DrawerTab; label: string; icon: React.ReactNode }[] = [
        { id: 'feed', label: '動態', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'info', label: '資訊', icon: <Info className="w-4 h-4" /> },
        { id: 'events', label: '活動', icon: <Calendar className="w-4 h-4" /> },
        { id: 'projects', label: '專案', icon: <Hammer className="w-4 h-4" /> },
    ];

    const renderContent = () => {
        // Home Mode: Global Feed
        if (mode === 'home') {
            return (
                <div className="p-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">🌐 所有社區動態</h3>
                    <GlobalSocialFeed compact onNavigate={onNavigateToCommunity} />
                </div>
            );
        }

        // Community Mode
        if (!community) return <div className="p-4 text-slate-500">請選擇社區</div>;

        switch (activeTab) {
            case 'feed':
                return (
                    <div className="p-4">
                        <PostFeed villageId={community.id} villageName={community.name} channelId="general" />
                    </div>
                );
            case 'info':
                return (
                    <div className="p-4 space-y-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-500" /> 基本資訊
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-slate-500">縣市：</span>{community.city}</div>
                                <div><span className="text-slate-500">鄉鎮市區：</span>{community.district}</div>
                                {community.chief && <div><span className="text-slate-500">村里長：</span>{community.chief}</div>}
                                {community.population && <div><span className="text-slate-500">人口：</span>{community.population}</div>}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="font-bold text-slate-700 mb-2">📝 簡介</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">{community.description}</p>
                        </div>
                        {community.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {community.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'events':
                return (
                    <div className="p-4 space-y-3">
                        {community.events && community.events.length > 0 ? community.events.map(event => (
                            <div key={event.id} className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-xs text-purple-600 font-bold mb-1">
                                    <Calendar className="w-3 h-3" />
                                    {event.date} • {event.type}
                                </div>
                                <h4 className="font-bold text-slate-800">{event.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400">目前沒有活動</div>
                        )}
                    </div>
                );
            case 'projects':
                return (
                    <div className="p-4 space-y-3">
                        {community.projects && community.projects.length > 0 ? community.projects.map(project => (
                            <div key={project.id} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <div className="text-xs text-emerald-600 font-bold mb-1">專案</div>
                                <h4 className="font-bold text-slate-800">{project.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                                <div className="mt-2 text-xs text-slate-500">進度：{project.status}</div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-400">目前沒有專案</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className={`absolute bottom-0 left-[72px] right-0 z-[1002] bg-white shadow-2xl border-t border-slate-200 transition-all duration-300 ${isExpanded ? 'h-[50vh]' : 'h-14'}`}
        >
            {/* Header */}
            <div className="h-14 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>

                    {mode === 'home' ? (
                        <h2 className="font-bold text-slate-800 text-lg">🏠 主頻</h2>
                    ) : community ? (
                        <>
                            <h2 className="font-bold text-slate-800 text-lg">
                                {community.district} {community.name}
                            </h2>
                            <button
                                onClick={toggleFavorite}
                                className={`p-2 rounded-full transition-colors ${isFavorite(community.id) ? 'bg-yellow-100 text-yellow-600' : 'hover:bg-slate-100 text-slate-400'}`}
                                title={isFavorite(community.id) ? '取消收藏' : '加入收藏'}
                            >
                                {isFavorite(community.id) ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                            </button>
                        </>
                    ) : (
                        <h2 className="font-bold text-slate-500">請選擇社區</h2>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Tabs (only for community mode) */}
                    {mode === 'community' && isExpanded && (
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mr-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                        ${activeTab === tab.id ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="h-[calc(50vh-56px)] overflow-y-auto scrollbar-thin">
                    {renderContent()}
                </div>
            )}
        </div>
    );
};

export default CommunityDrawer;
