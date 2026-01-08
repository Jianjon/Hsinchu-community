import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { PublicCommunity } from '../data/mock_public';
import { getPublicCommunities, getPublicTownships, PublicTownship, fetchTownshipData, mergeCommunityData } from '../services/publicDataAdaptor'; import L from 'leaflet';
import CHIEF_LOCATIONS from '../data/chief_office_locations.json';
import { Map as MapIcon, Sparkles, Camera, TreePine, BookOpen, ChevronRight, Menu, MessageSquare, Wind, User, Library, ChevronDown, MapPin, Heart, Info } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { useUser } from '../hooks/useUser';
import FavoritesRail from '../components/FavoritesRail';
import CommunityPopOut from '../components/CommunityPopOut';
import ItemDetailOverlay from '../components/ItemDetailOverlay';
import CalendarSidebar from '../components/CalendarSidebar';
import LandingOverlay from '../components/LandingOverlay';
import BulletinOverlay from '../components/BulletinOverlay';
import { MapSearchControl } from '../components/MapSearchControl';
import DataValidator from '../components/DataValidator';
// Fallback to community object's chief data since CHIEFS_DATA is deprecated

// ... (Keep existing custom icons and helper components: createCustomIcon, WikiIcon, etc., MapController, MapInvalidator)
// --- CUSTOM ICONS ---
// Helper to sanitize data for Firestore (remove undefined, convert to null if needed)
const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (typeof obj === 'object') {
        const newObj: any = {};
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            if (val !== undefined) {
                newObj[key] = sanitizeForFirestore(val);
            }
        });
        return newObj;
    }
    return obj;
};

const createCustomIcon = (icon: React.ReactNode, colorClass: string) => {
    const iconHtml = renderToString(
        <div className={`w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform`}>
            {icon}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
        </div>
    );
    return L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36]
    });
};

// ------------------------------
// MOCK DATA & CONSTANTS
// ------------------------------

// Manual Geocoding for specific demo villages
const MOCK_GEOCODED_OFFICES: Record<string, [number, number]> = {
    "三重里": [24.7290, 121.0830], // Approximate location for San-Chung Li Office
    // Add more if needed for demo
};

const WikiIcon = createCustomIcon(<BookOpen size={16} />, "bg-[#8DAA91]"); // Sage
const TravelIcon = createCustomIcon(<Camera size={16} />, "bg-[#C88A75]"); // Terracotta
const EventIcon = createCustomIcon(<Sparkles size={16} />, "bg-[#7A9BBF]"); // Dusk Blue
const ProjectIcon = createCustomIcon(<TreePine size={16} />, "bg-[#6B8E6B]"); // Forest
const CultureIcon = createCustomIcon(<Library size={16} />, "bg-[#A68B6A]"); // Parchment/Gold
const CareIcon = createCustomIcon(<Heart size={16} />, "bg-[#D9A7A7]"); // Rose

// --- HELPER COMPONENT: MAP CONTROLLER ---
const MapController: React.FC<{
    center?: [number, number],
    zoom?: number,
    bounds?: L.LatLngBoundsExpression,
    mode?: 'flyTo' | 'fitBounds'
}> = ({ center, zoom, bounds, mode = 'flyTo' }) => {
    const map = useMap();
    useEffect(() => {
        if (mode === 'fitBounds' && bounds) {
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15,
                duration: 1.5
            });
        } else if (mode === 'flyTo' && center && zoom && !isNaN(center[0]) && !isNaN(center[1])) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, bounds, mode, map]);
    return null;
};

// --- HELPER: Handle Background Clicks for Navigation ---
const MapClickHandler: React.FC<{
    selectedTownshipId: string | null,
    selectedVillageId: string | null,
    onBackToCounty: (center?: [number, number]) => void,
    onBackToTownship: (center?: [number, number]) => void,
    onMoveMap: (center: [number, number]) => void
}> = ({ selectedTownshipId, selectedVillageId, onBackToCounty, onBackToTownship, onMoveMap }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const handleClick = (e: L.LeafletMouseEvent) => {
            if (e.originalEvent && (e.originalEvent as any)._stopped) {
                return;
            }

            const clickPos: [number, number] = [e.latlng.lat, e.latlng.lng];

            // If at Village level: Click background -> Back to Township level at click position
            // If at Township level: Click background -> Back to County level at click position
            // Otherwise: Just move map center to click position
            if (selectedVillageId) {
                onBackToTownship(clickPos);
            } else if (selectedTownshipId) {
                onBackToCounty(clickPos);
            } else {
                onMoveMap(clickPos);
            }
        };

        map.on('click', handleClick);
        return () => { map.off('click', handleClick); };
    }, [map, selectedTownshipId, selectedVillageId, onBackToCounty, onBackToTownship, onMoveMap]);

    return null;
};

// --- HELPER: Fix Leaflet Resize Issue ---
const MapInvalidator: React.FC<{ isSidebarOpen: boolean }> = ({ isSidebarOpen }) => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 300); // Wait for transition
    }, [isSidebarOpen, map]);
    return null;
};

// --- MAIN COMPONENT ---
interface PublicMapProps {
    onOpenProfile?: () => void;
}

const PublicMap: React.FC<PublicMapProps> = ({ onOpenProfile }) => {
    const [communities, setCommunities] = useState<PublicCommunity[]>([]);
    const [townships, setTownships] = useState<PublicTownship[]>([]);
    const [selectedTownshipId, setSelectedTownshipId] = useState<string | null>(null); // Uses Township Name as ID in current logic (e.g. "竹北市")
    const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null); // NEW: Explicit Village Selection
    const [hoveredVillageId, setHoveredVillageId] = useState<string | null>(null); // NEW: Interactive Boundary Highlighting
    const [selectedLayer, setSelectedLayer] = useState<'wiki' | 'travel' | 'events' | 'projects' | 'culture' | 'care_action' | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isCalendarView, setIsCalendarView] = useState(false);
    const [showLanding, setShowLanding] = useState(true);
    const [expandedCity, setExpandedCity] = useState<'新竹縣' | '新竹市' | null>('新竹縣');
    const [showBulletin, setShowBulletin] = useState(false);
    const { user, isLoggedIn } = useUser();

    // Lazy Loading State
    const [loadedTownships, setLoadedTownships] = useState<Set<string>>(new Set());
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Independent Page State
    const [viewingItem, setViewingItem] = useState<{
        type: 'event' | 'travel' | 'project' | 'culture' | 'wiki' | 'facility' | 'care_action';
        data: any;
        communityName: string;
        district?: string;
    } | null>(null);

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'home' | 'community' | 'bulletin'>('home');

    // View State: Support both flyTo (center/zoom) and fitBounds (boundary) modes
    const [viewState, setViewState] = useState<{
        center?: [number, number],
        zoom?: number,
        bounds?: L.LatLngBoundsExpression,
        mode: 'flyTo' | 'fitBounds'
    }>({
        center: [24.7039, 121.1005],
        zoom: 11,
        mode: 'flyTo'
    });

    useEffect(() => {
        const loadData = async () => {
            const [comms, towns] = await Promise.all([
                getPublicCommunities(),
                getPublicTownships()
            ]);
            setCommunities(comms);
            setTownships(towns);
        };
        loadData();
    }, []);

    // Lazy Load Data Effect
    useEffect(() => {
        const loadTownshipData = async () => {
            if (selectedTownshipId && !loadedTownships.has(selectedTownshipId)) {
                // console.log(`[PublicMap] 📥 Lazy loading data for ${selectedTownshipId}...`);
                setIsLoadingData(true);
                try {
                    const data = await fetchTownshipData(selectedTownshipId);

                    // Merge into communities
                    setCommunities(prev => prev.map(c => {
                        if (c.district === selectedTownshipId && data[c.id]) {
                            return mergeCommunityData(c, data[c.id]);
                        }
                        return c;
                    }));

                    setLoadedTownships(prev => new Set(prev).add(selectedTownshipId));
                    // console.log(`[PublicMap] ✅ Lazy load complete for ${selectedTownshipId}`);
                } catch (e) {
                    console.error("Failed to lazy load township:", e);
                } finally {
                    setIsLoadingData(false);
                }
            }
        };
        loadTownshipData();
    }, [selectedTownshipId, loadedTownships]);

    const handleTownshipSelect = (townName: string) => {
        if (selectedTownshipId === townName) {
            setSelectedTownshipId(null);
            setSelectedVillageId(null);
            setViewState({ center: [24.7039, 121.1005], zoom: 11, mode: 'flyTo' });
        } else {
            setSelectedTownshipId(townName);
            setSelectedVillageId(null); // Reset village when switching town
            const town = townships.find(t => t.name === townName);
            if (town) {
                setViewState({ center: town.location, zoom: 13, mode: 'flyTo' });
            }
        }
    };

    const handleVillageSelect = (villageId: string) => {
        setSelectedVillageId(villageId);
        // DO NOT auto-open pop-out anymore per feedback
        // Find the village to get its boundary
        const village = communities.find(c => c.id === villageId);
        if (village && village.boundary && village.boundary.length > 0) {
            // Use fitBounds to show the entire village contour
            setViewState({
                bounds: village.boundary as L.LatLngBoundsExpression,
                mode: 'fitBounds'
            });
            // Also set township if not already set
            if (!selectedTownshipId && village.district) {
                setSelectedTownshipId(village.district);
            }
        } else {
            // Fallback to center if no boundary
            setViewState({ center: village?.location || [24.7039, 121.1005], zoom: 15, mode: 'flyTo' });
        }
    };

    // Callbacks for MapClickHandler
    const handleBackToTownship = (newCenter?: [number, number]) => {
        if (selectedTownshipId) {
            setSelectedVillageId(null);
            const town = townships.find(t => t.name === selectedTownshipId);
            const targetPos = newCenter || town?.location || [24.7039, 121.1005];
            setViewState({ center: targetPos, zoom: 13, mode: 'flyTo' });
        }
    };

    const handleBackToCounty = (newCenter?: [number, number]) => {
        setSelectedTownshipId(null);
        setSelectedVillageId(null);
        const targetPos = newCenter || [24.7039, 121.1005];
        setViewState({ center: targetPos, zoom: 11, mode: 'flyTo' });
    };

    const handleMoveMap = (center: [number, number]) => {
        setViewState(prev => ({ ...prev, center, mode: 'flyTo' }));
    };

    // Filter Markers based on Layer & Township
    const displayMarkers = useMemo(() => {
        const isValid = (pos: [number, number]) => pos && !isNaN(pos[0]) && !isNaN(pos[1]);
        if (!selectedTownshipId || !selectedLayer) return [];

        const filteredComms = communities.filter(c => c.district === selectedTownshipId);
        let items: any[] = [];

        if (selectedLayer === 'wiki') {
            // Show Community Markers (Villages)
            items = filteredComms
                .filter(c => isValid(c.location))
                .flatMap(c => {
                    // 1. Community Marker (Village Center / Office)
                    const chiefCoord = (CHIEF_LOCATIONS as unknown as Record<string, [number, number]>)[c.id];
                    const mockCoord = MOCK_GEOCODED_OFFICES[c.name];
                    const position = chiefCoord || mockCoord || c.location;
                    const chief: any = c.wiki?.chief || (c.chief ? { name: c.chief } : null);
                    const title = chief?.officeAddress ? `${c.name} (村里長辦公處)` : c.name;

                    const communityMarker = {
                        type: 'wiki',
                        id: c.id,
                        position: position,
                        boundary: c.boundary,
                        title: title,
                        desc: chief?.officeAddress ? `地址: ${chief.officeAddress} ` : c.description,
                        icon: WikiIcon,
                        link: `/community/${c.id}`
                    };

                    // 2. Facility Markers (from Wiki)
                    const facilityMarkers = (c.wiki?.facilities || [])
                        .filter(f => f.location && isValid(f.location))
                        .map(f => ({
                            type: 'facility',
                            id: f.id,
                            position: f.location!,
                            boundary: undefined,
                            title: f.name,
                            desc: f.description || f.type,
                            icon: WikiIcon, // Consider a different icon or reuse
                            link: '#'
                        }));

                    return [communityMarker, ...facilityMarkers];
                });
        }
        else if (selectedLayer === 'travel') {
            items = filteredComms.flatMap(c =>
                (c.travelSpots || [])
                    .filter(t => isValid(t.location))
                    .map(t => ({
                        type: 'travel',
                        id: t.id,
                        position: t.location,
                        boundary: undefined,
                        title: t.name,
                        desc: t.description,
                        icon: TravelIcon,
                        link: '#'
                    }))
            );
        }
        else if (selectedLayer === 'events') {
            items = filteredComms.flatMap(c =>
                (c.events || [])
                    .map((e, idx) => ({
                        type: 'event',
                        id: e.id,
                        position: e.coordinates || [c.location[0] - 0.001 * (idx + 1), c.location[1]] as [number, number],
                        boundary: undefined,
                        title: e.title,
                        desc: e.description,
                        icon: EventIcon,
                        link: '#'
                    }))
            );
        }
        else if (selectedLayer === 'projects') {
            items = filteredComms.flatMap(c => {
                const buildings = (c.communityBuildings || [])
                    .filter(b => isValid(b.location))
                    .map(b => ({
                        type: 'projects',
                        id: b.id,
                        position: b.location,
                        boundary: undefined,
                        title: b.name,
                        desc: b.description,
                        icon: ProjectIcon,
                        link: '#'
                    }));

                const projects = (c.projects || [])
                    .map((p, idx) => {
                        // Fallback mechanism: If no location, use community center + distinct offset
                        const baseLocation = (CHIEF_LOCATIONS as unknown as Record<string, [number, number]>)[c.id] || MOCK_GEOCODED_OFFICES[c.name] || c.location;
                        const fallbackPos: [number, number] = [baseLocation[0] + 0.001 * (idx + 1), baseLocation[1] + 0.001];
                        const validPos = (p.location && isValid(p.location)) ? p.location : fallbackPos;

                        return {
                            type: 'projects',
                            id: p.id,
                            position: validPos!,
                            boundary: undefined,
                            title: p.title,
                            desc: p.description,
                            icon: ProjectIcon,
                            link: '#'
                        };
                    });

                return [...buildings, ...projects];
            });
        }
        else if (selectedLayer === 'culture') {
            items = filteredComms.flatMap(c =>
                (c.cultureHeritages || [])
                    .filter(h => isValid(h.location))
                    .map(h => ({
                        type: 'culture',
                        id: h.id,
                        position: h.location,
                        boundary: undefined,
                        title: h.name,
                        desc: h.description,
                        icon: CultureIcon,
                        link: '#'
                    }))
            );
        }
        else if (selectedLayer === 'care_action') {
            items = filteredComms.flatMap(c =>
                (c.careActions || [])
                    .filter(a => {
                        const title = a.title || '';
                        return title.includes('關懷據點') || title.includes('食物銀行');
                    })
                    .map((a, idx) => ({
                        type: 'care_action',
                        id: a.id,
                        position: a.location || [c.location[0] + 0.001 * (idx + 1), c.location[1]] as [number, number],
                        boundary: undefined,
                        title: a.title,
                        desc: a.description,
                        icon: CareIcon,
                        link: '#'
                    }))
            );
        }

        return items;

    }, [communities, selectedTownshipId, selectedLayer]);

    // SEPARATE: Village Boundaries (Polygon Layers)
    // We render these independently of markers so they are always there for interaction
    const villagePolygons = useMemo(() => {
        if (!selectedTownshipId) return [];
        return communities.filter(c => c.district === selectedTownshipId && c.boundary);
    }, [communities, selectedTownshipId]);


    // Get selected community for drawer
    const selectedCommunity = useMemo(() => {
        if (!selectedVillageId) return null;
        return communities.find(c => c.id === selectedVillageId) || null;
    }, [communities, selectedVillageId]);

    // Handler for navigating from global feed to a specific village
    const handleNavigateToVillage = (villageId: string) => {
        const village = communities.find(c => c.id === villageId);
        if (village) {
            if (village.district) {
                setSelectedTownshipId(village.district);
            }
            handleVillageSelect(villageId);
            // Auto-open community drawer when navigating via sidebar/link
            setDrawerMode('community');
            setDrawerOpen(true);
        }
    };

    const handleUpdateCommunity = async (id: string, updated: any) => {
        // Update local state immediately for responsive UI
        setCommunities(prev => prev.map(c => c.id === id ? updated : c));

        // Persist to Firestore
        try {
            // Dynamically import to avoid bundle issues
            const { updateVillageWiki } = await import('../services/firestoreService');

            // Save ALL community data types to Firestore for full persistence
            const dataToSave = {
                // Wiki structured data
                ...(updated.wiki || {}),

                // Community metadata
                name: updated.name,
                district: updated.district,
                city: updated.city,
                description: updated.description,
                tags: updated.tags || [],

                // All content arrays - FULLY PERSISTED
                careActions: updated.careActions || [],
                travelSpots: updated.travelSpots || [],
                communityBuildings: updated.communityBuildings || [],
                cultureHeritages: updated.cultureHeritages || [],
                events: updated.events || [],
                people: updated.people || [],
                projects: updated.projects || [],

                // Administrative data
                chief: updated.chief,
                population: updated.population,
            };

            // Sanitize data to remove undefined values which Firestore rejects
            const safeData = sanitizeForFirestore(dataToSave);

            console.log('[PublicMap] 📤 Saving to Firestore:', id);
            console.log('[PublicMap] 📤 careActions being saved:', safeData.careActions?.length, 'items:', JSON.stringify(safeData.careActions?.map((c: any) => c.title)));

            await updateVillageWiki(id, safeData);
            console.log('[PublicMap] ✅ Community fully saved to Firestore:', id);
        } catch (error) {
            console.error('[PublicMap] Failed to save community to Firestore:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`儲存失敗: ${errorMessage}`);
        }
    };

    return (
        <FavoritesProvider>
            <div className="h-screen w-full relative flex overflow-hidden bg-slate-100">

                {/* Data Validator (Headless) */}
                <DataValidator communities={communities} />

                {/* --- MAP CONTAINER --- */}
                <FavoritesRail
                    activeVillageId={selectedVillageId}
                    drawerMode={drawerMode}
                    onSelectHome={() => {
                        setDrawerMode('home');
                        setDrawerOpen(true);
                    }}
                    onSelectBulletin={() => {
                        setDrawerMode('bulletin');
                        setDrawerOpen(true);
                    }}
                    onSelectCommunity={handleNavigateToVillage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onOpenProfile={() => onOpenProfile?.()}
                    onOpenAssociationInfo={() => setShowBulletin(true)}
                    communities={communities.map(c => ({ id: c.id, name: c.name, district: c.district }))}
                />

                {/* SIDEBAR */}
                <div className={`absolute left-[72px] top-0 bottom-0 z-[1000] shadow-2xl transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'}`} style={{ backgroundColor: '#FDFBF7' }}>
                    {/* Sidebar Header */}
                    <div className="p-4 text-white flex justify-between items-center shadow-md z-10 flex-shrink-0" style={{ backgroundColor: '#8DAA91' }}>
                        <div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-white/80 text-xs hover:text-white uppercase font-bold tracking-wider mb-1 block font-sans-tc text-left"
                            >
                                &larr; 縮放到側邊欄
                            </button>
                            <h2 className="text-xl font-bold flex items-center gap-2 font-serif-tc">
                                <MapIcon className="w-5 h-5" /> 新竹社區共好
                            </h2>
                        </div>
                    </div>
                    <div className="flex-1 p-0 flex flex-col min-h-0" style={{ backgroundColor: '#FDFBF7' }}>
                        {isCalendarView ? (
                            <CalendarSidebar
                                communities={communities}
                                onBack={() => setIsCalendarView(false)}
                                onNavigateToVillage={handleNavigateToVillage}
                            />
                        ) : !selectedTownshipId ? (
                            // MODE A: Township Selection (List)
                            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                                <div className="p-4 space-y-3">
                                    {/* CALENDAR ENTRY POINT */}
                                    <button
                                        onClick={() => setIsCalendarView(true)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl transition-all shadow-lg hover:opacity-90 group mb-4"
                                        style={{ backgroundColor: '#8DAA91', boxShadow: '0 10px 15px -3px rgba(141,170,145,0.3)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-white" />
                                            <div className="text-left">
                                                <div className="text-white font-black text-base font-sans-tc">活動行事曆</div>
                                                <div className="text-white/80 text-[10px] font-medium">查看全縣即時活動</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                    </button>

                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        探索社區地圖
                                    </h3>

                                    {/* City Group: Hsinchu County */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setExpandedCity(expandedCity === '新竹縣' ? null : '新竹縣')}
                                            className="w-full flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">縣</div>
                                                <span className="font-black text-slate-700 font-sans-tc">新竹縣 (竹縣)</span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${expandedCity === '新竹縣' ? 'rotate-180' : ''}`} />
                                        </button>

                                        {expandedCity === '新竹縣' && (
                                            <div className="flex flex-col gap-2 p-1 animate-in slide-in-from-top-2 duration-300">
                                                {townships.filter(t => t.city === '新竹縣').map(townData => (
                                                    <button
                                                        key={townData.name}
                                                        onClick={() => handleTownshipSelect(townData.name)}
                                                        className="w-full flex items-center justify-center p-4 border rounded-xl text-base font-black font-sans-tc transition-all active:scale-95 bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-sm shadow-sm"
                                                    >
                                                        {townData.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* City Group: Hsinchu City */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setExpandedCity(expandedCity === '新竹市' ? null : '新竹市')}
                                            className="w-full flex items-center justify-between p-4 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-sm">市</div>
                                                <span className="font-black text-slate-700 font-sans-tc">新竹市 (竹市)</span>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-orange-500 transition-transform duration-300 ${expandedCity === '新竹市' ? 'rotate-180' : ''}`} />
                                        </button>

                                        {expandedCity === '新竹市' && (
                                            <div className="flex flex-col gap-2 p-1 animate-in slide-in-from-top-2 duration-300">
                                                {townships.filter(t => t.city === '新竹市').map(townData => (
                                                    <button
                                                        key={townData.name}
                                                        onClick={() => handleTownshipSelect(townData.name)}
                                                        className="w-full flex items-center justify-center p-4 border rounded-xl text-base font-black font-sans-tc transition-all active:scale-95 bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:shadow-sm shadow-sm"
                                                    >
                                                        {townData.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // MODE B: Village Selection (List + Back)
                            <div className="flex-1 flex flex-col min-h-0">
                                <button
                                    onClick={() => { setSelectedTownshipId(null); setSelectedVillageId(null); setViewState({ center: [24.7039, 121.1005], zoom: 11, mode: 'flyTo' }); }}
                                    className="w-full py-3 mb-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shrink-0"
                                >
                                    &larr; 返回全縣地圖
                                </button>

                                <h3 className="text-lg font-bold text-slate-800 mb-2 px-1 shrink-0">
                                    {selectedTownshipId}
                                    {isLoadingData && <span className="text-xs text-emerald-600 ml-2 animate-pulse">載入中...</span>}
                                </h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pb-4">
                                    {communities.filter(c => c.district === selectedTownshipId).map(village => (
                                        <button
                                            key={village.id}
                                            onClick={() => handleVillageSelect(village.id)}
                                            className={`w-full py-3 px-4 rounded-lg font-bold text-base text-left transition-all border
                                            ${selectedVillageId === village.id
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                                                }`}
                                        >
                                            {village.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Footer with Branding */}
                    <div className="p-4 border-t border-slate-100 bg-white/50 flex flex-col items-center gap-1 shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans-tc">
                            維護單位
                        </div>
                        <div className="text-sm font-bold text-[#8DAA91] font-serif-tc">
                            社團法人台灣願景發展協會
                        </div>
                    </div>
                </div>

                {/* TOGGLE BUTTONS REMOVED - now in Rail */}

                {/* MAP AREA - adjusted for FavoritesRail */}
                <div className={`flex-1 relative h-full transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
                    {/* Paper texture overlay */}
                    <div className="map-paper-overlay" />
                    {/* Vignette effect */}
                    <div className="map-vignette" />

                    <MapContainer
                        center={viewState.center}
                        zoom={viewState.zoom}
                        scrollWheelZoom={true}
                        dragging={true}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        <MapInvalidator isSidebarOpen={isSidebarOpen} />
                        <MapController
                            center={viewState.center}
                            zoom={viewState.zoom}
                            bounds={viewState.bounds}
                            mode={viewState.mode}
                        />
                        <MapClickHandler
                            selectedTownshipId={selectedTownshipId}
                            selectedVillageId={selectedVillageId}
                            onBackToCounty={handleBackToCounty}
                            onBackToTownship={handleBackToTownship}
                            onMoveMap={handleMoveMap}
                        />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* GLOBAL MASK: Dims everything outside Hsinchu */}
                        {useMemo(() => {
                            if (townships.length === 0) return null;
                            const worldBoundary: [number, number][] = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
                            const holes = townships.map(t => t.boundary);
                            const maskCoords = [worldBoundary, ...holes];

                            return (
                                <Polygon
                                    positions={maskCoords as any}
                                    pathOptions={{
                                        fillColor: '#FFFFFF',
                                        fillOpacity: 0.5, // 50% Faded/Foggy look for outside
                                        color: 'transparent',
                                        stroke: false,
                                        interactive: false
                                    }}
                                />
                            );
                        }, [townships])}


                        {/* LEVEL 0: TOWNSHIP OVERVIEW (Always visible but dimmed if one is selected) */}
                        {townships.map(t => {
                            const isSelected = selectedTownshipId === t.name;
                            const isAnySelected = selectedTownshipId !== null;

                            return (
                                <Polygon
                                    key={`town-hull-${t.id}`}
                                    positions={t.boundary}
                                    eventHandlers={{
                                        click: (e) => {
                                            if (e.originalEvent) {
                                                L.DomEvent.stopPropagation(e.originalEvent);
                                                (e.originalEvent as any)._stopped = true;
                                            }
                                            handleTownshipSelect(t.name);
                                        },
                                        mouseover: (e) => {
                                            if (selectedTownshipId && t.name !== selectedTownshipId) {
                                                const layer = e.target;
                                                if (layer && typeof layer.setStyle === 'function') {
                                                    layer.setStyle({ fillOpacity: 0.2, weight: 2.5 });
                                                }
                                            }
                                        },
                                        mouseout: (e) => {
                                            if (selectedTownshipId && t.name !== selectedTownshipId) {
                                                const layer = e.target;
                                                if (layer && typeof layer.setStyle === 'function') {
                                                    layer.setStyle({ fillOpacity: 0.05, weight: 1.5 });
                                                }
                                            }
                                        }
                                    }}
                                    pathOptions={{
                                        // Focus: Vibrant Emerald, Strong Shadows
                                        // Balanced Fog: 35% white-out, faint neighbor outlines
                                        color: isSelected ? '#10b981' : (isAnySelected ? '#94A3B8' : '#059669'),
                                        weight: isSelected ? 5 : (isAnySelected ? 0.5 : 1.5),
                                        opacity: isSelected ? 1 : (isAnySelected ? 0.05 : 0.8),
                                        fillOpacity: isSelected ? 0 : (isAnySelected ? 0.35 : 0.2), // 35% FOG
                                        fillColor: isAnySelected && !isSelected ? '#FFFFFF' : '#10b981',
                                        dashArray: isSelected ? undefined : (isAnySelected ? '3, 3' : undefined),
                                        className: `town-boundary transition-all duration-700 ${isSelected ? 'selected-township-focus' : ''}`
                                    }}
                                >
                                    {/* Tooltips for all townships except the currently selected one to keep the center clear for villages */}
                                    {!isSelected && (
                                        <Tooltip direction="center" className={`font-bold transition-all ${isAnySelected ? 'text-sm opacity-50' : 'text-lg opacity-90'}`}>
                                            {t.name}
                                        </Tooltip>
                                    )}
                                </Polygon>
                            );
                        })}

                        {/* DISTINCT VILLAGE LAYER (Always visible when in Township) */}
                        {selectedTownshipId && villagePolygons.map(v => {
                            const isSelected = selectedVillageId === v.id;
                            const isHovered = hoveredVillageId === v.id;

                            return (
                                <Polygon
                                    key={`village-poly-${v.id}`}
                                    positions={v.boundary!}
                                    eventHandlers={{
                                        click: (e) => {
                                            if (e.originalEvent) {
                                                L.DomEvent.stopPropagation(e.originalEvent);
                                                L.DomEvent.preventDefault(e.originalEvent);
                                                (e.originalEvent as any)._stopped = true;
                                            }
                                            handleVillageSelect(v.id);
                                        },
                                        mouseover: (e) => {
                                            setHoveredVillageId(v.id);
                                        },
                                        mouseout: () => {
                                            setHoveredVillageId(null);
                                        }
                                    }}
                                    pathOptions={{
                                        color: isSelected ? '#10b981' : (isHovered ? '#10b981' : (selectedVillageId ? 'transparent' : '#059669')),
                                        weight: isSelected ? 5 : (isHovered ? 3 : (selectedVillageId ? 0 : 1.5)),
                                        // Subtle Fog for Villages
                                        opacity: isSelected ? 1 : (isHovered ? 0.8 : (selectedVillageId ? 0.05 : 0.6)),
                                        fillOpacity: isSelected ? 0.02 : (isHovered ? 0.15 : (selectedVillageId ? 0.35 : 0.08)),
                                        fillColor: selectedVillageId && !isSelected && !isHovered ? '#FFFFFF' : (isHovered ? '#10b981' : '#FDFBF7'),
                                        dashArray: (isSelected || isHovered) ? undefined : '5, 5',
                                        className: `village-boundary transition-all duration-300 ${isSelected ? 'selected-village-outline' : ''}`
                                    }}
                                >
                                    <Tooltip
                                        direction="top"
                                        className="custom-village-tooltip"
                                        opacity={1}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className={isSelected ? "text-sm" : "text-xs"}>{v.name}</span>
                                            {isSelected && <span className="text-[10px] opacity-80 font-normal">已選定</span>}
                                        </div>
                                    </Tooltip>
                                </Polygon>
                            );
                        })}

                        {/* MARKERS LAYER (On top of polygons) */}
                        {selectedTownshipId && displayMarkers.map((item, idx) => {
                            // Safety Check for LatLng to prevent Leaflet Crash
                            if (!item.position || !Array.isArray(item.position) || item.position.length !== 2
                                || typeof item.position[0] !== 'number' || typeof item.position[1] !== 'number') {
                                return null;
                            }
                            const lat = item.position[0];
                            const lng = item.position[1];
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker
                                    key={`marker-${item.type}-${item.id}-${idx}`}
                                    position={[lat, lng]}
                                    icon={item.icon || WikiIcon}
                                    eventHandlers={{
                                        click: (e) => {
                                            if (e.originalEvent) {
                                                L.DomEvent.stopPropagation(e.originalEvent);
                                            }
                                            if (item.type === 'wiki') {
                                                handleVillageSelect(item.id);
                                            } else if (item.type === 'facility') {
                                                const village = communities.find(c => c.district === selectedTownshipId && c.wiki?.facilities?.some((f: any) => f.id === item.id));
                                                setViewingItem({
                                                    type: 'facility',
                                                    data: { ...item, name: item.title, description: item.desc }, // Reconstruct minimal data or find full object
                                                    communityName: village?.name || '',
                                                    district: selectedTownshipId || ''
                                                });
                                                setViewState({ center: item.position, zoom: 16, mode: 'flyTo' });
                                            } else {
                                                setViewState({ center: item.position, zoom: 15, mode: 'flyTo' });
                                            }
                                        }
                                    }}
                                >
                                    <Popup className="custom-popup" closeButton={false}>
                                        <div
                                            className="p-0 min-w-[240px] overflow-hidden rounded-lg"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className={`p-3 text-white
                                        ${item.type === 'wiki' ? 'bg-blue-500' :
                                                    item.type === 'travel' ? 'bg-orange-500' :
                                                        item.type === 'event' ? 'bg-purple-500' :
                                                            item.type === 'care_action' ? 'bg-rose-500' :
                                                                item.type === 'culture' ? 'bg-amber-600' : 'bg-emerald-500'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.type === 'wiki' && <BookOpen size={16} />}
                                                    {item.type === 'travel' && <Camera size={16} />}
                                                    {item.type === 'event' && <Sparkles size={16} />}
                                                    {item.type === 'projects' && <TreePine size={16} />}
                                                    {item.type === 'culture' && <Library size={16} />}
                                                    {item.type === 'care_action' && <Heart size={16} />}
                                                    <span className="text-xs font-bold uppercase tracking-wider">
                                                        {item.type === 'wiki' ? '社區維基' :
                                                            item.type === 'travel' ? '輕旅行' :
                                                                item.type === 'event' ? '在地活動' :
                                                                    item.type === 'care_action' ? '永續共好' :
                                                                        item.type === 'culture' ? '文化資產' : '地方創生'}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
                                            </div>

                                            <div className="p-3 bg-white">
                                                <p className="text-sm text-slate-600 mb-3 leading-relaxed whitespace-pre-wrap">
                                                    {item.desc}
                                                </p>

                                                {item.link ? (
                                                    <button
                                                        onClick={() => {
                                                            // Find the full data object
                                                            // Fallback search across all communities (since we might be in global view)
                                                            let foundData = null;
                                                            let foundCommName = '';

                                                            // Candidates: if township selected, limit search; otherwise search all.
                                                            const candidates = selectedTownshipId
                                                                ? communities.filter(c => c.district === selectedTownshipId)
                                                                : communities;
                                                            for (const c of candidates) {
                                                                if (item.type === 'event') {
                                                                    foundData = c.events?.find(e => e.id === item.id);
                                                                } else if (item.type === 'travel') {
                                                                    foundData = c.travelSpots?.find(t => t.id === item.id);
                                                                } else if (item.type === 'projects') {
                                                                    foundData = c.communityBuildings?.find(p => p.id === item.id);
                                                                } else if (item.type === 'culture') {
                                                                    foundData = c.cultureHeritages?.find(h => h.id === item.id);
                                                                } else if (item.type === 'care_action') {
                                                                    foundData = c.careActions?.find(a => a.id === item.id);
                                                                }
                                                                if (foundData) {
                                                                    foundCommName = c.name;
                                                                    break;
                                                                }
                                                            }

                                                            if (foundData) {
                                                                setViewingItem({
                                                                    type: item.type === 'projects' ? 'project' : item.type as any,
                                                                    data: foundData,
                                                                    communityName: foundCommName
                                                                });
                                                            } else if (item.type === 'wiki') {
                                                                // For Wiki, item.id is community id. We find the wiki data.
                                                                const comm = communities.find(c => c.id === item.id);
                                                                if (comm) {
                                                                    setViewingItem({
                                                                        type: 'wiki',
                                                                        data: comm.wiki || {
                                                                            introduction: "", population: 0, area: "0", type: 'mixed',
                                                                            chief: {}, association: {}, facilities: [], awards: [], features: []
                                                                        },
                                                                        communityName: comm.name,
                                                                        district: comm.district
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded transition"
                                                    >
                                                        查看詳細內容
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        })}
                    </MapContainer>

                    {/* LAYER CONTROLS (Floating Block) - Rendered OUTSIDE MapContainer to prevent click-through */}
                    <div
                        className="absolute top-4 right-4 z-[1001] flex flex-col gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="backdrop-blur shadow-lg rounded-xl p-2 flex flex-col gap-2 border" style={{ backgroundColor: 'rgba(253,251,247,0.95)', borderColor: 'rgba(141,170,145,0.3)' }}>
                            {/* 1. Community Button (Top Priority) */}
                            <button
                                onClick={() => {
                                    setDrawerMode('community');
                                    setDrawerOpen(true);
                                }}
                                disabled={!selectedVillageId}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold font-sans-tc transition-all border-2
                                ${drawerOpen && drawerMode === 'community'
                                        ? 'text-white border-transparent shadow-md'
                                        : 'border-transparent hover:bg-white/50'
                                    } ${!selectedVillageId ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                style={drawerOpen && drawerMode === 'community'
                                    ? { backgroundColor: '#8DAA91' }
                                    : { color: '#4A4A4A' }}
                            >
                                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                                <div className="flex-1 text-left flex flex-col leading-tight">
                                    {selectedVillageId ? (
                                        <>
                                            <span className="text-base font-bold leading-tight">{communities.find(c => c.id === selectedVillageId)?.name}</span>
                                            <span className="text-xs opacity-90 font-normal">社群專區</span>
                                        </>
                                    ) : (
                                        <span className="font-bold">社區社群</span>
                                    )}
                                </div>
                                {selectedVillageId && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />}
                            </button>

                            {/* Separator / Header */}
                            <div className="border-t border-slate-100 pt-1 mt-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
                                    互動探索
                                </span>

                                {/* 2. Other Layers */}
                                <div className="flex flex-col gap-1.5 relative group">
                                    {/* Overlay for disabled state tooltip */}
                                    {!selectedTownshipId && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl cursor-not-allowed">
                                            <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                請先點選鄉鎮市
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'wiki' ? null : 'wiki')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'wiki'
                                            ? { backgroundColor: '#8DAA91', color: 'white', boxShadow: '0 4px 12px rgba(141,170,145,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <BookOpen className="w-4 h-4" /> 社區維基
                                    </button>

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'events' ? null : 'events')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'events'
                                            ? { backgroundColor: '#7A9BBF', color: 'white', boxShadow: '0 4px 12px rgba(122,155,191,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <Sparkles className="w-4 h-4" /> 在地活動
                                    </button>

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'travel' ? null : 'travel')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'travel'
                                            ? { backgroundColor: '#C88A75', color: 'white', boxShadow: '0 4px 12px rgba(200,138,117,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <Camera className="w-4 h-4" /> 輕旅行
                                    </button>

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'projects' ? null : 'projects')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'projects'
                                            ? { backgroundColor: '#6B8E6B', color: 'white', boxShadow: '0 4px 12px rgba(107,142,107,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <TreePine className="w-4 h-4" /> 地方創生
                                    </button>

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'culture' ? null : 'culture')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'culture'
                                            ? { backgroundColor: '#A68B6A', color: 'white', boxShadow: '0 4px 12px rgba(166,139,106,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <Library className="w-4 h-4" /> 文化資產
                                    </button>

                                    <button
                                        onClick={() => selectedTownshipId && setSelectedLayer(selectedLayer === 'care_action' ? null : 'care_action')}
                                        disabled={!selectedTownshipId}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all font-sans-tc
                                        ${!selectedTownshipId ? 'opacity-40' : ''}`}
                                        style={selectedLayer === 'care_action'
                                            ? { backgroundColor: '#D9A7A7', color: 'white', boxShadow: '0 4px 12px rgba(217,167,167,0.3)' }
                                            : { color: '#4A4A4A' }}
                                    >
                                        <Heart className="w-4 h-4" /> 永續共好
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LANDING OVERLAY */}
                {showLanding && (
                    <LandingOverlay onEnter={() => setShowLanding(false)} />
                )}

                {/* BULLETIN OVERLAY */}
                {showBulletin && (
                    <BulletinOverlay onClose={() => setShowBulletin(false)} />
                )}

                {/* BOTTOM QUICK SHORTCUT - Phase 3 Proposal */}
                {selectedVillageId && (
                    <div
                        className={`fixed bottom-8 z-[1000] transition-all duration-500 animate-in slide-in-from-bottom-8 ${isSidebarOpen ? 'left-[calc(50%+176px)]' : 'left-1/2'} -translate-x-1/2`}
                    >
                        <button
                            onClick={() => {
                                setDrawerMode('community');
                                setDrawerOpen(true);
                            }}
                            className="flex items-center gap-3 px-6 py-3.5 backdrop-blur-xl text-white rounded-full shadow-lg border border-white/20 transition-all hover:scale-105 active:scale-95 group"
                            style={{
                                backgroundColor: 'rgba(141,170,145,0.95)',
                                boxShadow: '0 20px 50px rgba(141,170,145,0.4)'
                            }}
                        >
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start pr-2">
                                <span className="text-[10px] uppercase tracking-widest font-black opacity-80 leading-none mb-0.5 font-sans-tc">快速進入</span>
                                <span className="text-base font-bold leading-tight flex items-center gap-1.5 font-serif-tc">
                                    🏡 {communities.find(c => c.id === selectedVillageId)?.name} 社區社群
                                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </button>
                    </div>
                )}

                {/* BRANDING BUTTON (Bottom Right - Below Accessibility Widget) */}
                <div className="fixed bottom-6 right-6 z-[9999]">
                    <button
                        onClick={() => setShowBulletin(true)}
                        className="w-14 h-14 bg-[#8DAA91] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 group ring-4 ring-white/50"
                        title="關於 台灣願景發展協會"
                    >
                        <Heart className="w-7 h-7 fill-white/20" />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </button>
                </div>

                {/* COMMUNITY POP-OUT */}
                <CommunityPopOut
                    open={drawerOpen}
                    mode={drawerMode}
                    community={selectedCommunity}
                    onClose={() => setDrawerOpen(false)}
                    onNavigateToCommunity={handleNavigateToVillage}
                    onOpenProfile={onOpenProfile}
                    onLocate={(pos) => {
                        setViewState({ center: pos, zoom: 16, mode: 'flyTo' });
                        // Optionally close drawer on mobile?
                    }}
                    onUpdate={handleUpdateCommunity}
                />

                {/* INDEPENDENT PAGE OVERLAY (For Map Pins) */}
                <ItemDetailOverlay
                    item={viewingItem}
                    onClose={() => setViewingItem(null)}
                    onNavigate={(type, id) => {
                        // Handle internal navigation from Overlay (e.g., Wiki -> Facility)
                        // This logic needs to find the facility data from the current viewingItem context or global
                        if (type === 'facility') {
                            const wiki = viewingItem?.data; // Assuming current view is wiki
                            const facility = wiki?.facilities?.find((f: any) => f.id === id);
                            if (facility) {
                                setViewingItem({
                                    type: 'facility',
                                    data: facility,
                                    communityName: viewingItem?.communityName || ''
                                });
                            }
                        } else if (type === 'wiki') {
                            // Back to wiki
                            const comm = communities.find(c => c.name === viewingItem?.communityName);
                            if (comm) {
                                setViewingItem({
                                    type: 'wiki',
                                    data: comm.wiki || {
                                        introduction: "", population: 0, area: "0", type: 'mixed',
                                        chief: {}, association: {}, facilities: [], awards: [], features: []
                                    },
                                    communityName: comm.name,
                                    district: comm.district
                                });
                            }
                        }
                    }}
                />

            </div>

            {/* Custom Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(141, 170, 145, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(141, 170, 145, 0.4);
                }

                .selected-township-focus {
                    filter: drop-shadow(0 0 20px rgba(16, 185, 129, 1));
                    stroke-linejoin: round;
                    stroke-linecap: round;
                    z-index: 1000 !important;
                }

                .selected-village-outline {
                    filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.9));
                    z-index: 1000 !important;
                }

                .town-boundary, .village-boundary {
                    pointer-events: auto !important;
                }
            `}</style>
        </FavoritesProvider >
    );
};

export default PublicMap;

