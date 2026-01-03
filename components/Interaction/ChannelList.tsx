import React from 'react';
import { PublicChannel, MOCK_CHANNELS } from '../../data/mock_public';
import { Volume2, MessageCircle, Leaf, Lightbulb, Hash } from 'lucide-react';

interface ChannelListProps {
    activeChannelId: string;
    onSelectChannel: (channelId: string) => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    'announcement': <Volume2 className="w-5 h-5" />,
    'chat': <MessageCircle className="w-5 h-5" />,
    'report': <Leaf className="w-5 h-5" />,
    'proposal': <Lightbulb className="w-5 h-5" />,
    'view_map': <span className="text-lg">🗺️</span>,
    'view_wiki': <span className="text-lg">ℹ️</span>,
    'view_projects': <span className="text-lg">🏗️</span>
};

const ChannelList: React.FC<ChannelListProps> = ({ activeChannelId, onSelectChannel }) => {
    // Phase 10: Split channels
    const systemChannels = MOCK_CHANNELS.filter(c => c.type.startsWith('view_'));
    const textChannels = MOCK_CHANNELS.filter(c => !c.type.startsWith('view_'));

    return (
        <div className="bg-slate-50 h-full p-3 border-r border-slate-200 w-64 flex-shrink-0 flex flex-col">

            {/* System Views */}
            <div className="mb-4 space-y-1">
                {systemChannels.map(channel => {
                    const isActive = activeChannelId === channel.id;
                    return (
                        <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors font-bold text-left
                                ${isActive ? 'bg-indigo-100 text-indigo-900 shadow-sm' : 'text-slate-700 hover:bg-slate-200'}`}
                        >
                            {CHANNEL_ICONS[channel.type]}
                            {channel.name.replace(/^[^\s]+ /, '')} {/* Remove emoji from name if present */}
                        </button>
                    );
                })}
            </div>

            <div className="w-full h-px bg-slate-200 mb-4"></div>

            {/* Text Channels */}
            <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">討論頻道</h3>
            <div className="space-y-1 flex-1 overflow-y-auto">
                {textChannels.map(channel => {
                    const isActive = activeChannelId === channel.id;
                    return (
                        <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors font-medium
                                ${isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <span className="text-slate-400">
                                {CHANNEL_ICONS[channel.type] || <Hash className="w-5 h-5" />}
                            </span>
                            {channel.name}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">語音頻道</h3>
                <div className="opacity-50 text-sm px-2 text-slate-400 italic">
                    (暫未開放)
                </div>
            </div>
        </div>
    );
};

export default ChannelList;
