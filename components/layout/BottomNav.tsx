import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Map, Megaphone, LayoutGrid } from 'lucide-react';
import { useUser } from '../../hooks/useUser';

const BottomNav: React.FC = () => {
    const location = useLocation();
    const { visualMode } = useUser();
    const navigate = useNavigate();

    const isSenior = visualMode === 'senior';

    const tabs = [
        {
            id: 'home',
            path: '/home',
            label: '我的鄰里',
            icon: Home
        },
        {
            id: 'buzz',
            path: '/buzz',
            label: '佈告欄',
            icon: Megaphone
        },
        {
            id: 'map',
            path: '/map',
            label: '地圖',
            icon: Map
        },
        {
            id: 'directory',
            path: '/directory',
            label: '村里名錄',
            icon: LayoutGrid
        }
    ];

    // Hide on login page
    if (location.pathname === '/') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-[9999] shadow-lg md:hidden">
            <div className={`flex items-center justify-around ${isSenior ? 'h-20' : 'h-16'}`}>
                {tabs.map(tab => {
                    const isActive = location.pathname.startsWith(tab.path);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.id}
                            to={tab.path}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors
                                ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            <Icon
                                className={`
                                    transition-all duration-300
                                    ${isSenior ? 'w-8 h-8 mb-1' : 'w-6 h-6 mb-0.5'}
                                    ${isActive ? 'scale-110 stroke-[2.5px]' : 'scale-100 stroke-2'}
                                `}
                            />
                            <span className={`
                                font-bold font-sans-tc transition-all duration-300
                                ${isSenior ? 'text-sm' : 'text-[10px]'}
                                ${isActive ? 'opacity-100' : 'opacity-70'}
                            `}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
