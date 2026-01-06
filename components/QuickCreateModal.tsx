import React, { useState, useCallback, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, MapPin, Link as LinkIcon, Tag, Loader2, CheckCircle2, Camera, User, DollarSign, Wallet, Sun, AlertCircle, ArrowRight } from 'lucide-react';
import ImageUploader from './ImageUploader';
import MultiImageUploader from './MultiImageUploader';
import { parseCoordinates, searchAddress } from '../services/geocodingService';

declare global {
    interface Window {
        google: any;
    }
}
declare var google: any;

interface QuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: CreateItemData) => void;
    channelType: 'events' | 'travel' | 'projects' | 'culture' | 'care' | 'resource' | 'facility';
    initialData?: Partial<CreateItemData & { metadata?: any }>;
    onOpenSmartImport?: () => void;
    community?: any; // PublicCommunity (Use any to avoid circular dependency for now, or import if possible)
}

export interface CreateItemData {
    title: string;
    description: string;
    coverImage?: string;
    imageUrls?: string[];
    // Extended fields
    date?: string;
    time?: string;
    location?: string;
    coordinates?: [number, number]; // Added
    link?: string;
    tags?: string[];
    metadata?: any;
}

// ... (CHANNEL_CONFIG remains same)
const CHANNEL_CONFIG: Record<string, {
    emoji: string;
    label: string;
    titlePlaceholder: string;
    descPlaceholder: string;
    hasDate?: boolean;
    hasTime?: boolean;
    hasLocation?: boolean;
    hasLink?: boolean;
    hasTags?: boolean;
    hasOrganizer?: boolean;
    hasCost?: boolean;
    hasFunding?: boolean;
    hasSeason?: boolean;
    hasStatus?: boolean;
    hasProgress?: boolean;
}> = {
    events: {
        emoji: '🕰️', label: '在地活動',
        titlePlaceholder: '賦予這場聚會一個名字...', descPlaceholder: '描述集會的氛圍與細節...',
        hasDate: true, hasTime: true, hasLocation: true, hasLink: true,
        hasOrganizer: true, hasCost: true
    },
    travel: {
        emoji: '📸', label: '輕旅行',
        titlePlaceholder: '紀錄一個值得駐足的角落...', descPlaceholder: '分享這裡的故事與值得一訪的理由...',
        hasLocation: true, hasTags: true,
        hasSeason: true
    },
    projects: {
        emoji: '🛠️', label: '地方創生',
        titlePlaceholder: '發起一個改變社區的提案...', descPlaceholder: '說明計畫的初衷與願景...',
        hasStatus: true, hasProgress: true, hasFunding: true,
        hasLocation: true // Enabled for projects
    },
    culture: {
        emoji: '🏮', label: '文化資產',
        titlePlaceholder: '保存一段珍貴的歷史記憶...', descPlaceholder: '紀錄這份資產的源流與價值...',
        hasLocation: true
    },
    care: {
        emoji: '🌿', label: '永續共好',
        titlePlaceholder: '紀錄一場共好的暖心行動...', descPlaceholder: '描述行動的過程與帶來的溫柔影響...',
        hasLocation: true, hasLink: true, hasTags: true
    },
    facility: {
        emoji: '📜', label: '社區維基',
        titlePlaceholder: '新增一個公設或景點資訊...', descPlaceholder: '補充這項設施的使用資訊與故事...',
        hasLocation: true, hasLink: true
    },
    resource: {
        emoji: '🎐', label: '微風廣播',
        titlePlaceholder: '分享一些地方瑣事與小道消息...', descPlaceholder: '內容不拘，可以是好物推薦或日常感想...',
        hasLocation: true, hasTags: true, hasLink: true
    }
};

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    channelType,
    initialData,
    onOpenSmartImport,
    community
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    // Dynamic Fields State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [link, setLink] = useState('');
    const [tags, setTags] = useState('');
    const [status, setStatus] = useState<'planning' | 'active' | 'completed'>('planning');
    const [progress, setProgress] = useState(0);

    // New Fields State
    const [organizer, setOrganizer] = useState('');
    const [cost, setCost] = useState('');
    const [fundingSource, setFundingSource] = useState('');
    const [seasonality, setSeasonality] = useState('');

    // Geocoding State
    const [coordinates, setCoordinates] = useState<[number, number] | undefined>(undefined);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeStatus, setGeocodeStatus] = useState<'none' | 'success' | 'fail'>('none');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                if (initialData.title) setTitle(initialData.title);
                if (initialData.description) setDescription(initialData.description);
                if (initialData.date) setDate(initialData.date);
                if (initialData.time) setTime(initialData.time);
                if (initialData.location) setLocation(initialData.location);
                if (initialData.link) setLink(initialData.link);
                if (initialData.tags) setTags(initialData.tags.join(', '));
                if (initialData.metadata) {
                    if (initialData.metadata.organizer) setOrganizer(initialData.metadata.organizer);
                    if (initialData.metadata.cost) setCost(initialData.metadata.cost);
                    if (initialData.metadata.fundingSource) setFundingSource(initialData.metadata.fundingSource);
                    if (initialData.metadata.seasonality) setSeasonality(initialData.metadata.seasonality);
                    if (initialData.metadata.status) setStatus(initialData.metadata.status);
                    if (initialData.metadata.progress) setProgress(initialData.metadata.progress);
                }
            } else {
                // Explicit reset when opening empty
                setTitle('');
                setDescription('');
                setImageUrls([]);
                setDate('');
                setTime('');
                setLocation('');
                setCoordinates(undefined);
                setGeocodeStatus('none');
                setLink('');
                setTags('');
                setOrganizer('');
                setCost('');
                setFundingSource('');
                setSeasonality('');
                setStatus('planning');
                setProgress(0);
            }
        }
    }, [isOpen, initialData]);

    const config = CHANNEL_CONFIG[channelType] || CHANNEL_CONFIG.events;

    const handleClose = useCallback(() => {
        setTitle('');
        setDescription('');
        setImageUrls([]);
        setDate('');
        setTime('');
        setLocation('');
        setCoordinates(undefined);
        setGeocodeStatus('none');
        setLink('');
        setTags('');
        setOrganizer('');
        setCost('');
        setFundingSource('');
        setSeasonality('');
        setStatus('planning');
        setProgress(0);
        onClose();
    }, [onClose]);

    // Handle Location Blur -> Trigger Geocoding
    // Google Maps Autocomplete Ref
    const inputRef = React.useRef<HTMLInputElement>(null);
    const autocompleteRef = React.useRef<any | null>(null);

    // Initialize Autocomplete
    useEffect(() => {
        if (config.hasLocation && inputRef.current && window.google?.maps?.places) {
            // const bounds = community?.boundary ? ... : undefined; // Could bias to community bounds
            // For now, bias to Taiwan or Community Location
            let bounds: any | undefined;
            if (community?.location) {
                const [lat, lng] = community.location;
                bounds = new window.google.maps.LatLngBounds(
                    new window.google.maps.LatLng(lat - 0.05, lng - 0.05),
                    new window.google.maps.LatLng(lat + 0.05, lng + 0.05)
                );
            }

            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'tw' },
                fields: ['geometry', 'formatted_address', 'name'],
                bounds: bounds,
                strictBounds: false
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place?.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    // Boundary Validation
                    let inBounds = true;
                    if (community?.boundary && window.google?.maps?.geometry?.poly) {
                        const polygon = new google.maps.Polygon({
                            paths: community.boundary.map((p: any) => ({ lat: p[0], lng: p[1] }))
                        });
                        inBounds = google.maps.geometry.poly.containsLocation(place.geometry.location, polygon);
                    }

                    if (!inBounds) {
                        alert(`提醒：此地點似乎位於 ${community.name} 範圍之外，請確認是否正確。`);
                        // Optional: Don't block, just warn. Or block if strict.
                    }

                    setCoordinates([lat, lng]);
                    setLocation(place.formatted_address || place.name || '');
                    setGeocodeStatus('success');
                } else {
                    setGeocodeStatus('fail');
                }
            });
        }
    }, [config.hasLocation, community]);

    const handleLocationBlur = async () => {
        // Fallback for manual coordinate entry if not picked from autocomplete
        if (!location.trim()) {
            setCoordinates(undefined);
            setGeocodeStatus('none');
            return;
        }

        // 1. Manual Coordinate Parse (lat, lng)
        const latLngRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
        const match = location.match(latLngRegex);
        if (match) {
            setCoordinates([parseFloat(match[1]), parseFloat(match[3])]);
            setGeocodeStatus('success');
            return;
        }

        // 2. Fallback: If valid coordinates aren't set (e.g. didn't click Autocomplete), try OpenStreetMap
        // Only run if we don't have coordinates OR if the location text likely changed
        if (!coordinates && location.length > 2) {
            setIsGeocoding(true);
            try {
                // Determine bounds if possible (optional optimization)
                const results = await searchAddress(location);
                if (results && results.length > 0) {
                    const best = results[0];
                    setCoordinates([best.lat, best.lng]);
                    setGeocodeStatus('success');
                    console.log(`[QuickCreate] Fallback geocoding success: ${best.lat}, ${best.lng}`);
                } else {
                    setGeocodeStatus('fail');
                }
            } catch (err) {
                console.error("Geocode fallback failed", err);
                setGeocodeStatus('fail');
            } finally {
                setIsGeocoding(false);
            }
        }
    };

    const handleCreate = useCallback(() => {
        if (!title.trim()) return;

        onCreate({
            title: title.trim(),
            description: description.trim(),
            coverImage: imageUrls[0] || undefined,
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
            date: date || undefined,
            time: time || undefined,
            location: location || undefined,
            coordinates: coordinates, // Passed to backend/handler
            link: link || undefined,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
            metadata: {
                organizer: organizer || undefined,
                cost: cost || undefined,
                fundingSource: fundingSource || undefined,
                seasonality: seasonality || undefined,
                status: config.hasStatus ? status : undefined,
                progress: config.hasProgress ? progress : undefined
            }
        });

        handleClose();
    }, [title, description, imageUrls, date, time, location, coordinates, link, tags, onCreate, handleClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 backdrop-blur-md animate-in fade-in duration-200"
                style={{ backgroundColor: 'rgba(74, 74, 74, 0.6)' }}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans-tc flex flex-col max-h-[90vh]"
                style={{ backgroundColor: '#FDFBF7' }}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ borderBottom: '1px solid rgba(141,170,145,0.2)' }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.emoji}</span>
                        <h2 className="text-lg font-black font-serif-tc" style={{ color: '#4A4A4A' }}>
                            新增{config.label}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: '#8B8B8B' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* AI Import Entry Point - Hidden for Facility */}
                    {onOpenSmartImport && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-emerald-900 leading-tight">使用 AI 智能解析</div>
                                    <div className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">Facebook / LINE 內容轉入</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onClose(); // Close creation modal first
                                    onOpenSmartImport(); // Open AI modal
                                }}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                立即體驗 <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Title Input */}
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#8B8B8B' }}>
                            標題 <span style={{ color: '#C88A75' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={config.titlePlaceholder}
                            className="w-full px-4 py-3 rounded-xl text-lg font-bold outline-none transition-all placeholder:text-slate-300"
                            style={{
                                backgroundColor: 'rgba(141,170,145,0.05)',
                                border: '2px solid rgba(141,170,145,0.2)',
                                color: '#4A4A4A'
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Dynamic Fields Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {config.hasDate && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Calendar className="w-3 h-3" /> 日期
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                        {config.hasTime && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Clock className="w-3 h-3" /> 時間
                                </label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Status & Progress Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {config.hasStatus && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <AlertCircle className="w-3 h-3" /> 狀態
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                >
                                    <option value="planning">規劃中 (Planning)</option>
                                    <option value="active">進行中 (Active)</option>
                                    <option value="completed">已完成 (Completed)</option>
                                </select>
                            </div>
                        )}
                        {config.hasProgress && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Clock className="w-3 h-3" /> 進度 ({progress}%)
                                </label>
                                <div className="pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={(e) => setProgress(parseInt(e.target.value))}
                                        className="w-full accent-[#8DAA91] h-2 bg-slate-200 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Specialized Fields Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {config.hasOrganizer && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <User className="w-3 h-3" /> 主辦單位
                                </label>
                                <input
                                    type="text"
                                    value={organizer}
                                    onChange={(e) => setOrganizer(e.target.value)}
                                    placeholder="例：社區發展協會"
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                        {config.hasCost && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <DollarSign className="w-3 h-3" /> 費用
                                </label>
                                <input
                                    type="text"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    placeholder="例：免費 / 100元"
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                        {config.hasFunding && (
                            <div className="col-span-2">
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Wallet className="w-3 h-3" /> 經費來源
                                </label>
                                <input
                                    type="text"
                                    value={fundingSource}
                                    onChange={(e) => setFundingSource(e.target.value)}
                                    placeholder="例：文化部補助、自籌..."
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                        {config.hasSeason && (
                            <div className="col-span-2">
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Sun className="w-3 h-3" /> 適合季節 / 最佳遊玩時間
                                </label>
                                <input
                                    type="text"
                                    value={seasonality}
                                    onChange={(e) => setSeasonality(e.target.value)}
                                    placeholder="例：春季賞花、全年皆宜..."
                                    className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Location & Link - Full Width */}
                    <div className="space-y-4">
                        {config.hasLocation && (
                            <div>
                                <div className="flex justify-between">
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                        <MapPin className="w-3 h-3" /> 地點 / 地址
                                    </label>
                                    {!isGeocoding && geocodeStatus === 'success' && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 已定位 ({coordinates?.[0].toFixed(3)}, {coordinates?.[1].toFixed(3)})</span>}
                                    {!isGeocoding && geocodeStatus === 'fail' && <span className="text-xs text-red-500">無法定位，請嘗試更詳細的地址</span>}
                                </div>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        onBlur={handleLocationBlur} // Trigger Geocoding on Blur
                                        placeholder="輸入地址或景點名稱 (Google 搜尋)"
                                        className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 pr-10"
                                        style={{
                                            backgroundColor: 'rgba(141,170,145,0.05)',
                                            border: geocodeStatus === 'fail' ? '1px solid #fee2e2' : '1px solid rgba(141,170,145,0.2)',
                                            color: '#4A4A4A'
                                        }}
                                    />
                                    <MapPin className={`absolute right-3 top-2.5 w-4 h-4 ${geocodeStatus === 'success' ? 'text-green-500' : 'text-gray-400'}`} />
                                </div>
                            </div>
                        )}

                        {config.hasLink && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <LinkIcon className="w-3 h-3" /> 相關連結
                                </label>
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="例如：報名網址、官方網站..."
                                    className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}

                        {config.hasTags && (
                            <div>
                                <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1" style={{ color: '#8B8B8B' }}>
                                    <Tag className="w-3 h-3" /> 標籤 (以逗號分隔)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="例如：親子, 戶外, 免費"
                                    className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                                    style={{
                                        backgroundColor: 'rgba(141,170,145,0.05)',
                                        border: '1px solid rgba(141,170,145,0.2)',
                                        color: '#4A4A4A'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#8B8B8B' }}>
                            詳細內容
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={config.descPlaceholder}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none placeholder:text-slate-300"
                            style={{
                                backgroundColor: 'rgba(141,170,145,0.05)',
                                border: '2px solid rgba(141,170,145,0.2)',
                                color: '#4A4A4A'
                            }}
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#8B8B8B' }}>
                            <Camera className="w-3.5 h-3.5" />
                            相關照片 (最多 4 張)
                        </label>
                        <MultiImageUploader
                            values={imageUrls}
                            onChange={setImageUrls}
                            maxImages={4}
                            height="h-32"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex items-center justify-end gap-3 shrink-0"
                    style={{ borderTop: '1px solid rgba(141,170,145,0.2)', backgroundColor: 'rgba(141,170,145,0.03)' }}
                >
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{ color: '#8B8B8B' }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim()}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2
                            ${!title.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        style={{
                            backgroundColor: title.trim() ? '#8DAA91' : '#CCCCCC',
                            boxShadow: title.trim() ? '0 4px 12px rgba(141,170,145,0.3)' : 'none'
                        }}
                    >
                        <Sparkles className="w-4 h-4" />
                        確認發布
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickCreateModal;
