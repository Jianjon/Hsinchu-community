import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Map, Megaphone, LayoutGrid, Info, Palette } from 'lucide-react';
import BottomNav from './BottomNav';
import AboutOverlay from '../AboutOverlay';
import { useUser } from '../../hooks/useUser';

const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:block">
            {/* Main Content Area */}
            <div className="flex-1 w-full pb-20 md:pb-0 relative min-w-0">
                <Outlet />
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
};

export default MainLayout;
