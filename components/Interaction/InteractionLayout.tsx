import React, { useState } from 'react';
import ChannelList from './ChannelList';
import PostFeed from '../PostFeed'; // Reusing modified PostFeed
import CommunitySwitcher from './CommunitySwitcher';
import GroupHomeFeed from './GroupHomeFeed';
import { MOCK_CHANNELS } from '../../data/mock_public';

interface InteractionLayoutProps {
    villageId: string;
    villageName: string;
}

const InteractionLayout: React.FC<InteractionLayoutProps> = ({ villageId, villageName }) => {
    const [activeChannelId, setActiveChannelId] = useState<string>('view_map'); // Default to Map View

    const isHome = villageId === 'home';
    const activeChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId) || MOCK_CHANNELS[0];

    // --- PHASE 10: View Switching Logic ---
    const renderContent = () => {
        if (isHome) {
            return <GroupHomeFeed />;
        }

        if (activeChannel.type === 'view_map') {
            return (
                <div className="flex-1 flex items-center justify-center bg-slate-100 h-full">
                    <div className="text-center">
                        <span className="text-4xl block mb-2">🗺️</span>
                        <h3 className="text-xl font-bold text-slate-600">社區地圖視圖</h3>
                        <p className="text-slate-400">此處將整合地圖操作 (即將上線)</p>
                    </div>
                </div>
            );
        }
        if (activeChannel.type === 'view_wiki') {
            return (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 h-full">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">關於 {villageName}</h3>
                    <p className="text-slate-600">Wiki 資料將顯示於此 (整合中...)</p>
                </div>
            );
        }
        if (activeChannel.type === 'view_projects') {
            return (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 h-full">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">專案計畫</h3>
                    <p className="text-slate-600">專案列表將顯示於此</p>
                </div>
            );
        }

        // Default: Chat Feed for text channels
        return (
            <div className="flex-1 overflow-y-auto p-4 bg-white scrollbar-thin h-full">
                <PostFeed
                    villageId={villageId}
                    villageName={villageName}
                    channelId={activeChannelId}
                />
            </div>
        );
    };

    return (
        <div className="flex bg-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[600px] h-[calc(100vh-80px)]">
            {/* 1. Community Switcher (Discord-style Left Rail) */}
            <CommunitySwitcher activeVillageId={villageId} />

            {/* 2. Channel List (Only for specific communities, not Home) */}
            {!isHome && (
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full rounded-l-xl">
                    <div className="h-12 flex items-center px-4 border-b border-slate-200 font-bold text-slate-700 truncate shadow-sm">
                        {villageName}
                    </div>
                    <ChannelList
                        activeChannelId={activeChannelId}
                        onSelectChannel={setActiveChannelId}
                    />
                </div>
            )}

            {/* 3. Main Content Area */}
            <div className="flex-1 flex flex-col bg-white h-full relative">
                {/* Channel Header (Only show for text channels in specific communities) */}
                {!isHome && !activeChannel.type.startsWith('view_') && (
                    <div className="h-12 border-b border-slate-100 flex items-center px-4 shadow-sm bg-white z-10">
                        <span className="text-slate-400 mr-2 text-lg">#</span>
                        <h2 className="font-bold text-slate-700">{activeChannel.name}</h2>
                        <span className="mx-2 text-slate-300">|</span>
                        <p className="text-xs text-slate-500 truncate">{activeChannel.description}</p>
                    </div>
                )}

                {/* Render Dynamic Content */}
                {renderContent()}
            </div>
        </div>
    );
};

export default InteractionLayout;
