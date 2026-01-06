import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Compass } from 'lucide-react';
import { getPublicCommunities } from '../services/publicDataAdaptor';
import { getVillagePosts } from '../services/interactionService';
import { DataMigrationTools } from '../components/DataMigrationTools';
import { useUser } from '../hooks/useUser';
import { useFavorites } from '../contexts/FavoritesContext';
import { PublicCommunity } from '../data/mock_public';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom warm-style map icon
const createCulturalIcon = (emoji: string) => L.divIcon({
    html: `<div class="text-3xl drop-shadow-lg hover:scale-110 transition-transform cursor-pointer">${emoji}</div>`,
    className: 'cultural-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

// Helper to disable ALL map interactions
// Helper to disable ALL map interactions
const MapInteractionDisabler: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if ((map as any).tap) (map as any).tap.disable();
    }, [map]);
    return null;
};

// Helper: Fix Leaflet Resize Issue
const MapInvalidator: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500); // Double check
    }, [map]);
    return null;
};

// Cultural landmarks with emoji icons
const CULTURAL_LANDMARKS = [
    { position: [24.8069, 121.0126] as [number, number], emoji: '🌳', name: '新埔老樟樹', story: '百年老樟樹見證了新埔的歷史變遷。' },
    { position: [24.8234, 121.0789] as [number, number], emoji: '🍊', name: '柿餅之鄉', story: '每年秋天，柿餅香飄滿山頭。' },
    { position: [24.8367, 121.1678] as [number, number], emoji: '🏛️', name: '六家古厝群', story: '林家祠堂見證了六家地區的開墾歷史。' },
    { position: [24.7539, 121.0205] as [number, number], emoji: '🌾', name: '頭前溪畔', story: '稻田與水圳交織的田園風光。' },
];

const PublicHome: React.FC = () => {
    const navigate = useNavigate();

    // Items from real data
    const [activityItems, setActivityItems] = useState<{ title: string; image: string; district: string; village: string; communityId: string }[]>([]);
    const [actionItems, setActionItems] = useState<{ title: string; icon: string; district: string; village: string; communityId: string; desc?: string }[]>([]);

    const { user } = useUser();
    const { favorites } = useFavorites();

    useEffect(() => {
        const load = async () => {
            const comms = await getPublicCommunities();

            // 1. Resolve User's Home Community ID
            let homeCommunityId: string | undefined;
            if (user?.township && user?.village) {
                const found = comms.find(c => c.district === user.township && c.name === user.village);
                if (found) homeCommunityId = found.id;
            }

            // 2. Collect target village IDs (Home + Favorites)
            const targetVillageIds = new Set<string>();
            if (homeCommunityId) targetVillageIds.add(homeCommunityId);
            favorites.forEach(id => targetVillageIds.add(id));

            const hasPersonalData = targetVillageIds.size > 0;

            // 3. Fetch Discussion Posts from these villages
            let discussionItems: typeof activityItems = [];

            if (hasPersonalData) {
                for (const vid of Array.from(targetVillageIds)) {
                    try {
                        // Fetch posts for the village
                        const posts = await getVillagePosts(vid);

                        // Filter for 'general', 'discussion', or 'public_discussion' channels (or untagged)
                        // This logic aligns with the user's request for "一般討論"
                        const relevantPosts = posts.filter(p =>
                            !p.channelId ||
                            p.channelId === 'general' ||
                            p.channelId === 'discussion' ||
                            p.channelId === 'public_discussion' ||
                            p.tags?.includes('discussion')
                        );

                        const community = comms.find(c => c.id === vid);
                        const villageName = community?.name || vid;
                        const district = community?.district || '';

                        relevantPosts.forEach(p => {
                            discussionItems.push({
                                title: p.content.length > 25 ? p.content.substring(0, 25) + '...' : p.content,
                                image: '💬', // Icon for discussions
                                district: district,
                                village: villageName,
                                communityId: vid
                            });
                        });
                    } catch (e) {
                        console.error(`Failed to load posts for ${vid}`, e);
                    }
                }
            }

            // 4. Build standard activity items (events + travel spots)
            const activities: typeof activityItems = [];

            // Filter source communities if we have personal data? 
            // The prompt implies content comes exclusively (or prioritized) from home/favorites
            // "內容來自 個人資料裡的村里，來自用戶收藏的村里"
            // Let's fallback to all if no personal data found, to avoid empty state.
            const sourceComms = hasPersonalData
                ? comms.filter(c => targetVillageIds.has(c.id))
                : comms;

            // If strict filtering results in empty, maybe fallback? 
            // For now, respect the personalized filter if IDs exist.

            sourceComms.forEach(c => {
                c.events?.forEach(e => {
                    activities.push({ title: e.title, image: '📅', district: c.district, village: c.name, communityId: c.id });
                });
                c.travelSpots?.forEach(t => {
                    activities.push({ title: t.name, image: '🗺️', district: c.district, village: c.name, communityId: c.id });
                });
            });

            // Combine: Discussions first, then Activities
            // Sort by "freshness" if possible? we lack unified timestamps here easily. 
            // Just putting discussions on top as they are likely more "dynamic".
            const combined = [...discussionItems, ...activities];
            setActivityItems(combined.slice(0, 20));

            // 5. Build action items (Right Column)
            // Use same source filter for consistency
            const actions: typeof actionItems = [];
            sourceComms.forEach(c => {
                c.communityBuildings?.forEach(b => {
                    actions.push({ title: b.name, icon: '🏗️', district: c.district, village: c.name, communityId: c.id, desc: b.description });
                });
                c.careActions?.forEach(a => {
                    actions.push({ title: a.title, icon: '💝', district: c.district, village: c.name, communityId: c.id, desc: a.description });
                });
            });
            setActionItems(actions.slice(0, 20));
        };
        load();
    }, [user, favorites]);

    const handleItemClick = (communityId: string) => {
        navigate(`/community/${communityId}`);
    };

    const handleMapClick = () => {
        navigate('/map');
    };

    return (
        <div className="h-screen font-sans relative overflow-hidden flex flex-col" style={{ backgroundColor: '#FDFBF7' }}>

            {/* CSS Variables & Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
                
                .font-serif-tc { font-family: 'Noto Serif TC', serif; }
                .font-sans-tc { font-family: 'Noto Sans TC', sans-serif; }
                
                .paper-texture {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
                }
                
                .cultural-marker {
                    background: transparent !important;
                    border: none !important;
                }
                
                .leaflet-popup-content-wrapper {
                    background: #FDFBF7 !important;
                    border-radius: 16px !important;
                    box-shadow: 0 4px 20px rgba(74, 74, 74, 0.15) !important;
                }
                
                .leaflet-popup-tip {
                    background: #FDFBF7 !important;
                }
            `}</style>

            {/* FULL-SCREEN MAP (Clickable to navigate) */}
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={handleMapClick}>
                <MapContainer
                    center={[24.78, 121.05]}
                    zoom={11}
                    zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <MapInteractionDisabler />
                    <MapInvalidator />

                    {/* Cultural Landmarks */}
                    {CULTURAL_LANDMARKS.map((landmark, idx) => (
                        <Marker
                            key={idx}
                            position={landmark.position}
                            icon={createCulturalIcon(landmark.emoji)}
                        >
                            <Popup>
                                <div className="font-sans-tc p-2">
                                    <h3 className="font-serif-tc text-lg font-bold mb-2" style={{ color: '#4A4A4A' }}>
                                        {landmark.emoji} {landmark.name}
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
                                        {landmark.story}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Soft gradient overlay */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, rgba(253,251,247,0.3) 0%, transparent 30%, transparent 60%, rgba(253,251,247,0.9) 100%)' }}
                />
            </div>

            {/* HEADER / NAV */}
            <nav className="relative z-20 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: '#8DAA91' }}>
                        🌿
                    </div>
                    <span className="font-serif-tc font-bold text-xl" style={{ color: '#4A4A4A' }}>新竹社區共好</span>
                </div>
                <div className="flex gap-6 items-center text-sm font-bold font-sans-tc">
                    <Link to="/about" className="transition-colors hover:opacity-70" style={{ color: '#6B6B6B' }}>關於我們</Link>
                    <Link
                        to="/map"
                        className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:opacity-90"
                        style={{ backgroundColor: '#8DAA91', color: 'white' }}
                    >
                        <Compass className="w-4 h-4" />
                        散步新竹
                    </Link>
                </div>
            </nav>

            {/* GREETING CARD (Top Left) */}
            <div className="absolute top-24 left-6 z-20 max-w-sm">
                <div
                    className="paper-texture p-6 rounded-2xl shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(253,251,247,0.92)', border: '1px solid rgba(141,170,145,0.3)' }}
                >
                    <p className="font-serif-tc text-xl leading-relaxed mb-4" style={{ color: '#4A4A4A' }}>
                        在新竹的風裡，<br />找尋家的溫度。
                    </p>
                    <p className="font-sans-tc text-sm mb-6" style={{ color: '#8B8B8B' }}>
                        點擊地圖上任一角落，開始探索 🌿
                    </p>

                    <button
                        onClick={handleMapClick}
                        className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ backgroundColor: '#8DAA91' }}
                    >
                        <Compass className="w-5 h-5" />
                        進入地圖
                    </button>
                </div>
            </div>

            {/* BOTTOM SECTION - Fixed, takes 2/5 of screen */}
            <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: '40vh' }}>
                <div
                    className="paper-texture rounded-t-3xl shadow-2xl h-full flex flex-col"
                    style={{ backgroundColor: '#FDFBF7' }}
                >
                    {/* Fixed Headers Row */}
                    <div className="px-6 pt-6 pb-3 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto w-full shrink-0">
                        <h3 className="font-serif-tc text-lg font-bold flex items-center gap-2" style={{ color: '#4A4A4A' }}>
                            📸 最近村里動態
                        </h3>
                        <h3 className="font-serif-tc text-lg font-bold flex items-center gap-2 hidden md:flex" style={{ color: '#4A4A4A' }}>
                            🌱 做伙來行動
                        </h3>
                    </div>

                    {/* Scrollable Content Area */}
                    {/* Scrollable Content Area - FIXED to allow independent scrolling */}
                    <div className="flex-1 min-h-0 px-6 pb-6">
                        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

                            {/* Left: Activity Items (Scrollable) */}
                            <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                                {activityItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleItemClick(item.communityId)}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
                                        style={{ backgroundColor: 'rgba(141,170,145,0.1)', border: '1px solid rgba(141,170,145,0.2)' }}
                                    >
                                        <div className="text-2xl">{item.image}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-sans-tc text-xs mb-0.5" style={{ color: '#8DAA91' }}>
                                                {item.district} {item.village}
                                            </p>
                                            <p className="font-sans-tc text-sm font-bold truncate" style={{ color: '#4A4A4A' }}>
                                                {item.title}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#8DAA91' }} />
                                    </div>
                                ))}
                            </div>

                            {/* Right: Action Items (Scrollable) */}
                            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                                {/* Mobile header */}
                                <h3 className="font-serif-tc text-lg font-bold flex items-center gap-2 mb-3 md:hidden" style={{ color: '#4A4A4A' }}>
                                    🌱 做伙來行動
                                </h3>
                                <div className="space-y-2">
                                    {actionItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleItemClick(item.communityId)}
                                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
                                            style={{ backgroundColor: 'rgba(200,138,117,0.1)', border: '1px solid rgba(200,138,117,0.2)' }}
                                        >
                                            <div className="text-2xl">{item.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-sans-tc text-xs mb-0.5" style={{ color: '#C88A75' }}>
                                                    {item.district} {item.village}
                                                </p>
                                                <p className="font-sans-tc text-sm font-bold truncate" style={{ color: '#4A4A4A' }}>
                                                    {item.title}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#C88A75' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Migration Tool - Remove after use */}
            {/* <DataMigrationTools /> */}
        </div>
    );
};

export default PublicHome;
