import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicCommunity, PublicProject } from '../data/mock_public';
import { getPublicCommunities } from '../services/publicDataAdaptor';
import { ArrowLeft, User, HelpCircle, Hammer, MapPin, Activity } from 'lucide-react';

const ProjectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [projectData, setProjectData] = useState<{ project: PublicProject, community: PublicCommunity } | null | undefined>(undefined);

    useEffect(() => {
        const load = async () => {
            const communities = await getPublicCommunities();
            let foundProject = null;
            let foundCommunity = null;

            for (const community of communities) {
                const p = community.projects.find(proj => proj.id === id);
                if (p) {
                    foundProject = p;
                    foundCommunity = community;
                    break;
                }
            }

            if (foundProject && foundCommunity) {
                setProjectData({ project: foundProject, community: foundCommunity });
            } else {
                setProjectData(null);
            }
        };
        load();
    }, [id]);

    if (projectData === undefined) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">載入中...</div>;
    }

    if (!projectData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">找不到此專案資料</h1>
                <Link to="/map" className="text-emerald-600 hover:underline">返回地圖</Link>
            </div>
        );
    }

    const { project: foundProject, community: foundCommunity } = projectData;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to={`/community/${foundCommunity.id}`} className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-bold">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">返回社區</span>
                    </Link>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight text-center truncate px-2">
                        {foundProject.title}
                    </h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-800 p-8 text-white text-center">
                        <span className="inline-block bg-emerald-500 text-xs px-3 py-1 rounded-full font-bold mb-4">
                            {foundProject.status === 'active' ? '進行中' : foundProject.status === 'planning' ? '規劃中' : '已完成'}
                        </span>
                        <h2 className="text-3xl font-bold mb-2">{foundProject.title}</h2>
                        <p className="text-slate-300">
                            {foundCommunity.city}{foundCommunity.district}{foundCommunity.name}
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* 1. 在做什麼 (What) */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-blue-100 rounded-full h-fit">
                                <Hammer className="w-6 h-6 text-blue-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-500 text-sm uppercase mb-1">在做什麼</h3>
                                <p className="text-xl text-slate-800 font-medium leading-relaxed">
                                    {foundProject.what}
                                </p>
                            </div>
                        </div>

                        {/* 2. 為什麼要做 (Why) */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-amber-100 rounded-full h-fit">
                                <HelpCircle className="w-6 h-6 text-amber-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-500 text-sm uppercase mb-1">為什麼要做</h3>
                                <p className="text-lg text-slate-700 leading-relaxed">
                                    {foundProject.description}
                                </p>
                            </div>
                        </div>

                        {/* 3. 在哪個社區 (Where) */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-red-100 rounded-full h-fit">
                                <MapPin className="w-6 h-6 text-red-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-500 text-sm uppercase mb-1">在哪個社區</h3>
                                <p className="text-lg text-slate-700">
                                    {foundCommunity.city} {foundCommunity.district} <Link to={`/community/${foundCommunity.id}`} className="text-emerald-600 underline font-bold">{foundCommunity.name}</Link>
                                </p>
                            </div>
                        </div>

                        {/* 4. 誰在做 (Who) */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-purple-100 rounded-full h-fit">
                                <User className="w-6 h-6 text-purple-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-500 text-sm uppercase mb-1">誰在做</h3>
                                <p className="text-lg text-slate-700">
                                    {foundProject.owner || "社群志工團隊"}
                                </p>
                            </div>
                        </div>

                        {/* 5. 目前進度 (Progress) */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-emerald-100 rounded-full h-fit">
                                <Activity className="w-6 h-6 text-emerald-700" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-500 text-sm uppercase mb-1">目前進度</h3>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 w-full">
                                    <p className="text-slate-700 font-medium">
                                        {foundProject.progress}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectPage;
