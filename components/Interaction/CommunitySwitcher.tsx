import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_FOLLOWED_COMMUNITIES } from '../../data/mock_public';
import { Home } from 'lucide-react';

interface CommunitySwitcherProps {
    activeVillageId: string;
}

const CommunitySwitcher: React.FC<CommunitySwitcherProps> = ({ activeVillageId }) => {
    const navigate = useNavigate();

    return (
        <div className="w-[72px] bg-slate-900 flex flex-col items-center py-4 space-y-4 shrink-0 overflow-y-auto">
            {/* Home (Shared Feed) */}
            <button
                onClick={() => navigate('/group/home')}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all group
                    ${activeVillageId === 'home' ? 'bg-emerald-500 text-white rounded-[16px]' : 'bg-slate-700 text-slate-100 hover:bg-emerald-500'}`}
                title="首頁 (所有動態)"
            >
                <Home className="w-6 h-6" />
            </button>

            <div className="w-8 h-0.5 bg-slate-700 rounded-full" />

            {/* Followed Communities */}
            {MOCK_FOLLOWED_COMMUNITIES.map(community => (
                <button
                    key={community.id}
                    onClick={() => navigate(`/group/${community.id}`)}
                    className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all group relative
                        ${activeVillageId === community.id ? 'bg-emerald-600 text-white rounded-[16px]' : 'bg-slate-700 text-slate-100 hover:bg-emerald-600'}`}
                    title={community.name}
                >
                    <span className="text-xl">{community.avatar}</span>
                    {activeVillageId === community.id && (
                        <div className="absolute -left-4 w-1 h-8 bg-white rounded-r-full" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default CommunitySwitcher;
