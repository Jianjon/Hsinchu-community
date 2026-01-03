import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { MOCK_COMMUNITIES } from '../data/mock_public';

const EventDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Helper to find event by ID across all communities
    // In a real app, this would be an API call
    const event = React.useMemo(() => {
        for (const community of MOCK_COMMUNITIES) {
            const found = community.events.find(e => e.id === id);
            if (found) return { ...found, communityName: community.name };
        }
        return null;
    }, [id]);

    if (!event) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">找不到活動</h2>
                    <p className="text-slate-600 mb-6">您查看的活動可能已被移除或不存在。</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        返回上一頁
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Nav */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-4 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-lg font-bold text-slate-800 truncate">活動詳情</h1>
            </div>

            <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
                {/* Cover Image */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-slate-100 relative">
                    {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200">
                            <Calendar className="w-20 h-20" />
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 lg:hidden bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                        <span className="text-white bg-blue-600/90 px-2 py-0.5 rounded text-xs font-bold shadow-sm backdrop-blur-sm">
                            {event.communityName}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="hidden lg:inline-block text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold mb-2">
                                {event.communityName}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                {event.title}
                            </h1>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-slate-100">
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">日期</p>
                                <p className="font-medium">{event.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">時間</p>
                                <p className="font-medium">{event.time}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 md:col-span-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">地點</p>
                                <p className="font-medium">{event.location}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-lg font-bold text-slate-800">活動介紹</h3>
                        <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                            {event.description || "暫無詳細說明"}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EventDetailPage;
