import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicCommunity } from '../data/mock_public';
import { getPublicCommunity } from '../services/publicDataAdaptor';
import { MapPin, ArrowLeft, Users, Calendar, Hammer, Info, ExternalLink, ChevronRight, User } from 'lucide-react';

const CommunityPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [community, setCommunity] = useState<PublicCommunity | null | undefined>(undefined);

    useEffect(() => {
        if (id) {
            getPublicCommunity(id).then(setCommunity);
        }
    }, [id]);

    if (community === undefined) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">載入中...</div>;
    }

    if (!community) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">找不到此社區資料</h1>
                <Link to="/map" className="text-emerald-600 hover:underline">返回地圖</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/map" className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-bold">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">返回地圖</span>
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        {community.district} · {community.name}
                    </h1>
                    <div className="w-8"></div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-emerald-700 text-white py-12 px-4 shadow-inner">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {community.tags.map(tag => (
                            <span key={tag} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{community.name}</h1>
                    <div className="flex items-center gap-2 text-emerald-100 italic">
                        <MapPin className="w-5 h-5" />
                        <span>{community.city} {community.district}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-12">

                {/* 1. 這裡是誰 (Who we are) */}
                <section id="who" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">這裡是誰</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <p className="text-slate-700 leading-relaxed text-lg mb-6 whitespace-pre-wrap">
                                {community.description}
                            </p>
                            {community.introduction && (
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    {community.introduction}
                                </p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">現任村里長</span>
                                <p className="text-slate-800 font-bold text-xl">{community.chief || "資料更新中"}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">人口概況</span>
                                <p className="text-slate-800 font-bold">{community.population || "資料更新中"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. 正在做什麼 (Projects) */}
                <section id="projects">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Hammer className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">正在做什麼</h2>
                        </div>
                    </div>
                    {community.projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {community.projects.map(project => (
                                <Link
                                    key={project.id}
                                    to={`/project/${project.id}`}
                                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${project.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            project.status === 'planning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {project.status === 'active' ? '進行中' : project.status === 'planning' ? '規劃中' : '已完成'}
                                        </span>
                                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-emerald-600 transition-colors">{project.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400">目前尚無進行中的專案</p>
                        </div>
                    )}
                </section>

                {/* 3. 誰在參與 (People) */}
                <section id="people" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">誰在參與</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {community.people.length > 0 ? (
                            community.people.map((person, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-full border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700 leading-none">{person.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{person.role}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center py-4 bg-slate-50 rounded-2xl italic text-slate-400">
                                列舉村里長、志工團體與在地組織
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. 最近活動 (Activities) */}
                <section id="activities">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">最近活動</h2>
                        </div>
                        <Link to="/activities" className="text-sm font-bold text-emerald-600 hover:underline flex items-center gap-1">
                            全部活動 <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {community.events.length > 0 ? (
                        <div className="space-y-4">
                            {community.events.map(event => (
                                <div key={event.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl flex flex-col items-center justify-center min-w-[80px] border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DATE</span>
                                        <span className="text-lg font-black text-slate-800">{event.date.split('-').slice(1).join('/')}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                {event.type}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {event.location}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                            <p className="text-slate-400">暫無近期活動</p>
                        </div>
                    )}
                </section>

            </div>

            {/* Platform Banner */}
            <div className="max-w-4xl mx-auto px-4 mt-16 text-center border-t border-slate-200 pt-12 text-slate-400 text-sm">
                <p>本平台旨在促進社區參與，非評比或補助性質。</p>
            </div>
        </div>
    );
};

export default CommunityPage;
