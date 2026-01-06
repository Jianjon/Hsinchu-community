import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicCommunities, getPublicTownships, PublicTownship } from '../services/publicDataAdaptor';
import { PublicCommunity } from '../data/mock_public';
import { Search, ChevronRight, MapPin } from 'lucide-react';

const VillageDirectoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState<PublicCommunity[]>([]);
    const [townships, setTownships] = useState<PublicTownship[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCity, setExpandedCity] = useState<'新竹縣' | '新竹市'>('新竹縣');
    const [selectedTownship, setSelectedTownship] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            getPublicCommunities(),
            getPublicTownships()
        ]).then(([comms, towns]) => {
            setCommunities(comms);
            setTownships(towns);
        });
    }, []);

    // Filter Logic
    const filteredCommunities = communities.filter(c => {
        const matchesSearch = c.name.includes(searchTerm) || c.district.includes(searchTerm);
        const matchesTownship = selectedTownship ? c.district === selectedTownship : true;
        const matchesCity = expandedCity ? c.city === expandedCity : true;
        return matchesSearch && matchesTownship && matchesCity;
    });

    const activeTownships = townships.filter(t => t.city === expandedCity);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-20">
                <h1 className="text-xl font-black text-slate-800 font-serif-tc mb-3">
                    村里名錄
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜尋里名、關鍵字..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="p-4">
                {/* City Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['新竹縣', '新竹市'] as const).map(city => (
                        <button
                            key={city}
                            onClick={() => { setExpandedCity(city); setSelectedTownship(null); }}
                            className={`flex-1 py-3 rounded-xl font-black transition-all
                                ${expandedCity === city
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                    : 'bg-white text-slate-400 border border-slate-200'
                                }
                            `}
                        >
                            {city}
                        </button>
                    ))}
                </div>

                {/* Township Chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedTownship(null)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border
                            ${selectedTownship === null
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }
                        `}
                    >
                        全部
                    </button>
                    {activeTownships.map(t => (
                        <button
                            key={t.name}
                            onClick={() => setSelectedTownship(t.name === selectedTownship ? null : t.name)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border
                                ${selectedTownship === t.name
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                                }
                            `}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3">
                    {filteredCommunities.map(c => (
                        <Link
                            key={c.id}
                            to={`/community/${c.id}`}
                            className="block bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-1">{c.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{c.district}</span>
                                        {c.tags && c.tags.slice(0, 2).map((tag, i) => (
                                            <span key={i} className="text-emerald-600">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 w-5 h-5" />
                            </div>
                        </Link>
                    ))}
                    {filteredCommunities.length === 0 && (
                        <div className="text-center py-12 text-slate-400 font-bold">
                            找不到相關村里
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VillageDirectoryPage;
