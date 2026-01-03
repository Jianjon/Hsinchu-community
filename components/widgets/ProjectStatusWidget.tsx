
import React from 'react';
import { Briefcase, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { PublicCommunity } from '../data/mock_public';

interface ProjectStatusWidgetProps {
    community?: PublicCommunity;
}

const ProjectStatusWidget: React.FC<ProjectStatusWidgetProps> = ({ community }) => {
    // Mock projects if none provided
    const projects = community?.projects?.length ? community.projects : [
        { name: "社區公園設施更新", status: "進行中", progress: 65, icon: <PlayCircle className="w-4 h-4 text-blue-400" /> },
        { name: "路面平整計畫 (第一期)", status: "已完成", progress: 100, icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
        { name: "智慧路燈汰換專案", status: "規劃中", progress: 15, icon: <Clock className="w-4 h-4 text-orange-400" /> }
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-indigo-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white tracking-wide">提案進度</h3>
            </div>

            <div className="flex-1 space-y-4">
                {projects.map((p, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-white/90">
                                {p.icon}
                                {p.name}
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${p.status === '已完成' ? 'text-green-400' :
                                    p.status === '進行中' ? 'text-blue-400' : 'text-orange-400'
                                }`}>
                                {p.status}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${p.status === '已完成' ? 'bg-green-500' :
                                        p.status === '進行中' ? 'bg-blue-500' : 'bg-orange-500'
                                    }`}
                                style={{ width: `${p.progress}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/30 italic">
                共有 {projects.length} 個進行中的地方提案
            </div>
        </div>
    );
};

export default ProjectStatusWidget;
