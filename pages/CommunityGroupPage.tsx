import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractionLayout from '../components/Interaction/InteractionLayout';
import { getPublicCommunity } from '../services/publicDataAdaptor';
import { ArrowLeft, Loader } from 'lucide-react';

const CommunityGroupPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [villageName, setVillageName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || id === 'home') {
            setVillageName('我的首頁');
            setLoading(false);
            return;
        }

        if (id) {
            getPublicCommunity(id).then(community => {
                if (community) {
                    setVillageName(community.name);
                } else {
                    // Fallback parse from ID if data not found
                    const parts = id.split('_');
                    if (parts.length >= 3) {
                        setVillageName(parts[2]);
                    }
                }
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 gap-2">
                <Loader className="w-6 h-6 animate-spin" />
                載入社群平台...
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Minimal Header */}
            <div className="bg-white border-b border-slate-200 h-14 flex items-center px-4 justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-slate-400 hover:text-emerald-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-bold text-slate-700 flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">社群平台</span>
                        {id?.replace(/_/g, ' ')}
                    </h1>
                </div>
                <div className="text-xs text-slate-400">
                    已登入為: <span className="text-slate-600 font-bold">訪客 (Guest)</span>
                </div>
            </div>

            {/* Main Layout - Full Height */}
            <div className="flex-1 overflow-hidden p-2">
                <InteractionLayout
                    villageId={id || 'home'}
                    villageName={villageName || 'Community'}
                />
            </div>
        </div>
    );
};

export default CommunityGroupPage;
