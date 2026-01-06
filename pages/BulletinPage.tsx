import React from 'react';
import { useMixboardData } from '../hooks/useMixboardData';
import VillageFeedsWidget from '../components/widgets/VillageFeedsWidget';

const BulletinPage: React.FC = () => {
    // Re-use mixboard data hook which already aggregates feeds from favorites/home
    const { feeds, loadMoreFeeds, loading } = useMixboardData();

    return (
        <div className="min-h-screen bg-[#F0F2F5] pb-20">
            {/* Simple Header */}
            <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-black text-slate-800 font-serif-tc">
                    鄰里佈告欄
                </h1>
                <button className="text-emerald-600 font-bold text-sm">全部已讀</button>
            </div>

            <div className="max-w-2xl mx-auto pt-2">
                <VillageFeedsWidget
                    title="" // Hide title inside widget since we have page header
                    feeds={feeds}
                    onLoadMore={loadMoreFeeds}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default BulletinPage;
