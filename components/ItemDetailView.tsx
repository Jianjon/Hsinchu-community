import React, { useState } from 'react';
import { MapPin, Calendar, User, Users, Clock, Tag, ExternalLink, ArrowLeft, Image as ImageIcon, Smile, FileText, Link as LinkIcon, AlertCircle, Hammer, Phone, X, Sparkles, Loader2, ChevronLeft, ChevronRight, Layout, Flag, Star, Camera, Plus, Trash2 } from 'lucide-react';
import ImageUploader from './ImageUploader';
import MultiImageUploader from './MultiImageUploader';
import { PublicEvent, PublicTravelSpot, PublicProject, CultureHeritage } from '../data/mock_public';
import { generateCommunityContent } from '../services/genAIService';
import EditableText from './EditableText';
import RichTextEditor from './RichTextEditor';
import AuthorTag from './AuthorTag';
import { useUser } from '../hooks/useUser';

interface ItemDetailViewProps {
    data: any;
    type: string;
    villageName?: string; // New Prop
    communityLocation?: [number, number];
    onClose: () => void;
    onBack: () => void;
    onUpdate: (id: string, updates: any) => void;
    isEditMode: boolean;
}

const ICON_CATEGORIES = [
    { label: '活動與生活', icons: ['🗓️', '🎭', '🏀', '🍜', '🎨', '🎬', '🎤', '🎪', '🧘', '🚲', '👟', '🧭', '⛺', '🥘', '🍷', '🍲', '☕', '🍵', '🍦', '🍰', '⚽', '🏸', '🏊', '🧗', '🚵'] },
    { label: '景點與地理', icons: ['🗺️', '🌲', '🏛️', '🏘️', '🏞️', '⛪', '🏯', '🏟️', '🎠', '🌄', '🌳', '🌻', '🏔️', '🌉', '🎋', '⛩️', '🛤️', '🏫', '🏪', '🏭', '🚢', '🚂', '🚁', '🌋', '🏖️'] },
    { label: '社群與服務', icons: ['💝', '🏥', '🛠️', '🧹', '🤝', '👵', '👴', '🧒', '🏠', '🧩', '📣', '📮', '🧸', '🧺', '🎁', '🩺', '創造', '🚒', '🚓', '🚜', '🗳️', '📢', '💡', '🔋', '🩹'] },
    { label: '文化與藝術', icons: ['📜', '🏮', '🏯', '🥁', '🧧', '🐲', '🏺', '🗿', '🎐', '🧱', '🧶', '🖋️', '🖌️', '🎺', '🎻', '🎷', '🪕', '🪁', '♟️', '🀄', '🎴', '🎭', '🎬', '🎤', '🎧'] },
    { label: '自然與生態', icons: ['🌱', '🌿', '🍃', '♻️', '☀️', '💧', '🦜', '🦋', '🐝', '🍄', '🥚', '🥛', '🍎', '🍐', '🥕', '🌽', '🌾', '🪵', '🛖', '🐾', '🦢', '🦌', '🐇', '🐹', '🐿️'] }
];

const ItemDetailView: React.FC<ItemDetailViewProps> = ({
    data,
    type,
    villageName,
    communityLocation,
    onClose,
    onBack,
    onUpdate,
    isEditMode
}) => {
    const { isLoggedIn, setLoginOverlay, user } = useUser();
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    const handleFieldUpdate = (field: string, value: any) => {
        onUpdate(data.id, { [field]: value });
    };

    const handleIconSelect = (icon: string) => {
        handleFieldUpdate('icon', icon);
        setIsIconPickerOpen(false);
    };

    // --- Configuration for Properties based on Type ---
    const getPropertiesConfig = () => {
        switch (type) {
            case 'event':
                return [
                    { label: '日期', field: 'date', rangeField: 'endDate', icon: <Sparkles className="w-4 h-4" />, isDate: true, placeholder: 'YYYY-MM-DD' },
                    { label: '時間', field: 'time', icon: <Clock className="w-4 h-4" />, placeholder: 'HH:mm' },
                    { label: '地點', field: 'location', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '活動地點' },
                    { label: '名額', field: 'capacity', icon: <User className="w-4 h-4" />, placeholder: '例如：20' },
                    { label: '對象', field: 'targetAudience', icon: <Users className="w-4 h-4" />, placeholder: '例如：社區兒童' },
                    { label: '費用', field: 'cost', icon: <Tag className="w-4 h-4" />, placeholder: '例如：免費' },
                    { label: '主辦', field: 'organizer', icon: <Layout className="w-4 h-4" />, placeholder: '主辦單位' },
                    { label: '連結', field: 'registrationLink', icon: <ExternalLink className="w-4 h-4" />, placeholder: 'https://...' },
                ];
            case 'travel':
                return [
                    { label: '標籤', field: 'tags', icon: <Tag className="w-4 h-4" />, isTags: true },
                    { label: '地點', field: 'address', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '景點地址' },
                    { label: '時間', field: 'duration', icon: <Clock className="w-4 h-4" />, placeholder: '例如：2 小時' },
                    { label: '難度', field: 'difficulty', icon: <Hammer className="w-4 h-4" />, placeholder: 'easy/medium/hard' },
                    { label: '季節', field: 'seasonality', icon: <Sparkles className="w-4 h-4" />, placeholder: '例如：四季皆宜' },
                    { label: '連結', field: 'googleMapLink', icon: <ExternalLink className="w-4 h-4" />, isLink: true, placeholder: 'Google Maps URL' },
                ];
            case 'project':
                return [
                    { label: '時程', field: 'startDate', rangeField: 'endDate', icon: <Sparkles className="w-4 h-4" />, isDate: true },
                    { label: '狀態', field: 'status', icon: <AlertCircle className="w-4 h-4" />, placeholder: 'active/planning' },
                    { label: '人選', field: 'owner', icon: <User className="w-4 h-4" />, placeholder: '提案人' },
                    { label: '地點', field: 'address', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '專案位置' },
                    { label: '資源', field: 'budget', icon: <Tag className="w-4 h-4" />, placeholder: '專案預算' },
                    { label: '進度 %', field: 'progress', icon: <Clock className="w-4 h-4" />, placeholder: '0-100', isProgress: true },
                    { label: '來源', field: 'fundingSource', icon: <ExternalLink className="w-4 h-4" />, placeholder: '例如：公部門補助' },
                    { label: '影響指標', field: 'impactKPIs', icon: <Sparkles className="w-4 h-4" />, placeholder: '績效指標' },
                    { label: '里程碑', field: 'milestones', icon: <Flag className="w-4 h-4" />, placeholder: '分階段目標', isMultiline: true },
                ];
            case 'culture':
                return [
                    { label: '年代', field: 'era', icon: <Clock className="w-4 h-4" />, placeholder: '創建年代' },
                    { label: '類別', field: 'category', icon: <Tag className="w-4 h-4" />, placeholder: '資產類別' },
                    { label: '保存現況', field: 'preservationStatus', icon: <AlertCircle className="w-4 h-4" />, placeholder: '良好/尚可/損壞' },
                    { label: '位置', field: 'address', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '地點/地址' },
                    { label: '維修日誌', field: 'restorationLog', icon: <FileText className="w-4 h-4" />, placeholder: '歷史修繕紀錄', isMultiline: true },
                ];
            case 'care_action':
                return [
                    { label: '服務時間', field: 'time', icon: <Clock className="w-4 h-4" />, placeholder: '例如：每週四中餐' },
                    { label: '地址', field: 'address', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '詳細地址' },
                    { label: '電話', field: 'phone', icon: <Phone className="w-4 h-4" />, placeholder: '聯絡電話' },
                    { label: '狀態', field: 'status', icon: <AlertCircle className="w-4 h-4" />, placeholder: 'ongoing/completed' },
                    { label: '行動類型', field: 'type', icon: <Hammer className="w-4 h-4" />, placeholder: '例如：送餐、修繕' },
                    { label: '相關連結', field: 'link', icon: <LinkIcon className="w-4 h-4" />, isLink: true, placeholder: '資源連結' },
                    { label: '服務區域', field: 'area', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '例如：第一鄰' },
                    { label: '受益對象', field: 'beneficiaries', icon: <User className="w-4 h-4" />, placeholder: '例如：5位長者' },
                    { label: '標籤', field: 'tags', icon: <Tag className="w-4 h-4" />, isTags: true },
                    { label: 'SDGs', field: 'sdgs', icon: <Sparkles className="w-4 h-4" />, isSDGs: true },
                    { label: '志工積點', field: 'volunteerPoints', icon: <Star className="w-4 h-4" />, placeholder: '積點數' },
                ];
            case 'facility':
                return [
                    { label: '類型', field: 'type', icon: <Tag className="w-4 h-4" />, placeholder: '設施類型' },
                    { label: '地址', field: 'address', icon: <MapPin className="w-4 h-4" />, isAddress: true, placeholder: '地址' },
                    { label: '電話', field: 'phone', icon: <Phone className="w-4 h-4" />, placeholder: '聯絡電話' },
                    { label: '開放時間', field: 'openingHours', icon: <Clock className="w-4 h-4" />, placeholder: '09:00 - 17:00' },
                ];
            default:
                return [];
        }
    };

    const properties = getPropertiesConfig();
    const imageUrls = data.imageUrls || (data.coverImage ? [data.coverImage] : data.imageUrl ? [data.imageUrl] : data.photos ? data.photos : data.beforeImage ? [data.beforeImage] : []);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const coverImage = imageUrls[activeImageIdx] || "";
    // Construct title from 'title' or 'name' or 'content'
    const titleField = data.title !== undefined ? 'title' : (data.name !== undefined ? 'name' : 'content');
    const titleValue = data[titleField];


    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    const handleAIGenerate = async () => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            // Call real Gemini API
            const current = data.description || '';
            const aiContent = await generateCommunityContent(aiPrompt, current, {
                villageName: villageName,
                itemType: type
            });

            handleFieldUpdate('description', current + (current ? '\n\n' : '') + aiContent);
            setIsAIModalOpen(false);
            setAiPrompt('');
        } catch (error) {
            console.error('AI Error:', error);
            // Optionally show toast
        } finally {
            setIsGenerating(false);
        }
    };

    const renderProperties = () => (
        <div className="space-y-1">
            {/* Attribution Row */}
            {data.creatorId && (
                <div className="flex items-center text-sm group min-h-[32px]">
                    <div className="w-32 lg:w-28 flex items-center gap-2 text-slate-500 shrink-0">
                        <span className="text-slate-400"><User className="w-4 h-4" /></span>
                        <span className="text-xs font-bold uppercase tracking-tight">建立者</span>
                    </div>
                    <div className="flex-1">
                        <AuthorTag
                            userId={data.creatorId}
                            userName={data.creatorId}
                            size="sm"
                        />
                    </div>
                </div>
            )}

            {properties.map((prop) => {
                const value = data[prop.field];
                const hasValue = value !== undefined && value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true);

                if (!isEditMode && !hasValue) return null;

                return (
                    <div key={prop.field} className="flex items-start lg:items-center text-sm group min-h-[32px] py-1">
                        {/* Label Column */}
                        <div className="w-32 lg:w-28 flex items-center gap-2 text-slate-500 shrink-0">
                            <span className="text-slate-400">{prop.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-tight">{prop.label}</span>
                        </div>
                        {/* Value Column */}
                        <div className="flex-1 text-slate-800 font-medium flex items-center justify-between gap-2 overflow-hidden">
                            <div className="flex-1 min-w-0">
                                {prop.isTags ? (
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {(data[prop.field] || []).map((t: string) => (
                                            <span key={t} className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px] font-bold flex items-center gap-1">
                                                {t}
                                                {isEditMode && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const filtered = (data[prop.field] || []).filter((tag: string) => tag !== t);
                                                            handleFieldUpdate(prop.field, filtered);
                                                        }}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                        {isEditMode && (
                                            <input
                                                type="text"
                                                placeholder="+ 標籤"
                                                className="text-[10px] bg-transparent border-b border-slate-200 focus:border-emerald-500 outline-none w-16 px-1 py-0.5"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (val && !(data[prop.field] || []).includes(val)) {
                                                            handleFieldUpdate(prop.field, [...(data[prop.field] || []), val]);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : prop.isDate ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <EditableText
                                            value={data[prop.field]}
                                            onChange={(v) => handleFieldUpdate(prop.field, v)}
                                            isEditMode={isEditMode}
                                            placeholder="開始日期"
                                            className="flex-1 text-slate-800"
                                        />
                                        {prop.rangeField && (
                                            <>
                                                <span className="text-slate-300">→</span>
                                                <EditableText
                                                    value={data[prop.rangeField]}
                                                    onChange={(v) => handleFieldUpdate(prop.rangeField, v)}
                                                    isEditMode={isEditMode}
                                                    placeholder="結束日期"
                                                    className="flex-1 text-slate-800"
                                                />
                                            </>
                                        )}
                                    </div>
                                ) : prop.isLink ? (
                                    <EditableText
                                        value={data[prop.field]}
                                        onChange={(v) => handleFieldUpdate(prop.field, v)}
                                        isEditMode={isEditMode}
                                        placeholder={prop.placeholder || "Empty"}
                                        className="w-full text-blue-600 hover:underline truncate block"
                                        renderView={(val) => val ? <a href={val} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {val}</a> : <span className="text-slate-300">No link</span>}
                                    />
                                ) : prop.isAddress ? (
                                    <EditableText
                                        value={data[prop.field]}
                                        onChange={(v) => handleFieldUpdate(prop.field, v)}
                                        isEditMode={isEditMode}
                                        placeholder={prop.placeholder || "Empty"}
                                        className="w-full text-blue-600 hover:underline truncate block"
                                        renderView={(val) => {
                                            if (!val) return <span className="text-slate-300">No address</span>;
                                            const query = encodeURIComponent(val);
                                            return (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5"
                                                >
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{val}</span>
                                                </a>
                                            );
                                        }}
                                    />
                                ) : (
                                    <EditableText
                                        value={data[prop.field]}
                                        onChange={(v) => handleFieldUpdate(prop.field, v)}
                                        isEditMode={isEditMode}
                                        multiline={prop.isMultiline}
                                        placeholder={prop.placeholder || "Empty"}
                                        className="w-full text-slate-800"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderWidgets = () => (
        <div className="space-y-6 pt-4 border-t border-slate-100">
            {/* Progress Bar (Projects) */}
            {data.progress !== undefined && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">實施進度</span>
                        <span className="text-lg font-black text-emerald-600">{data.progress}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                            style={{ width: `${data.progress}%` }}
                        />
                    </div>
                    {isEditMode && (
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={data.progress}
                            onChange={(e) => handleFieldUpdate('progress', parseInt(e.target.value))}
                            className="w-full accent-emerald-600"
                        />
                    )}
                </div>
            )}

            {/* SDG Badges (Sustainability) */}
            {(type === 'care_action' || data.sdgs) && (
                <div className="space-y-3">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">永續目標 SDGs</span>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(num => {
                            const isActive = (data.sdgs || []).includes(num);
                            if (!isActive && !isEditMode) return null;
                            return (
                                <button
                                    key={num}
                                    onClick={() => {
                                        if (!isEditMode) return;
                                        const current = data.sdgs || [];
                                        const next = current.includes(num) ? current.filter((n: number) => n !== num) : [...current, num];
                                        handleFieldUpdate('sdgs', next);
                                    }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isActive
                                        ? 'bg-emerald-600 text-white shadow-lg'
                                        : 'bg-slate-50 text-slate-300 hover:bg-slate-100 border border-slate-200 border-dashed'
                                        }`}
                                    title={`SDG ${num}`}
                                >
                                    {num}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Project Updates Timeline (Journey) */}
            {type === 'project' && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">實施歷程 (Timeline)</span>
                        </div>
                        {isEditMode && (
                            <button
                                onClick={() => {
                                    const newUpdate = {
                                        id: Date.now().toString(),
                                        date: new Date().toISOString().split('T')[0],
                                        content: '',
                                        stage: 'update' as const
                                    };
                                    handleFieldUpdate('updates', [...(data.updates || []), newUpdate]);
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> 新增更新
                            </button>
                        )}
                    </div>

                    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        {/* Virtual updates from old fields for backward compatibility */}
                        {!(data.updates?.length) && (data.beforeImage || data.duringImage || data.afterImage) && (
                            <div className="pl-8 py-2 bg-amber-50 rounded-xl border border-amber-100 p-4 mb-4">
                                <p className="text-[10px] text-amber-600 font-bold mb-1">偵測到舊版開發記錄</p>
                                <button
                                    onClick={() => {
                                        const syntheticUpdates = [];
                                        if (data.beforeImage) syntheticUpdates.push({ id: 'b1', date: data.startDate || '前期', content: '專案前期準備', imageUrl: data.beforeImage, stage: 'before' as const });
                                        if (data.duringImage) syntheticUpdates.push({ id: 'd1', date: '', content: '專案進行中', imageUrl: data.duringImage, stage: 'during' as const });
                                        if (data.afterImage) syntheticUpdates.push({ id: 'a1', date: data.endDate || '後期', content: '專案結案成果', imageUrl: data.afterImage, stage: 'after' as const });
                                        handleFieldUpdate('updates', syntheticUpdates);
                                    }}
                                    className="text-[10px] text-amber-700 underline font-bold"
                                >
                                    點此轉換為歷程模式
                                </button>
                            </div>
                        )}

                        {(data.updates || []).map((update: any, idx: number) => (
                            <div key={update.id} className="relative pl-8 group/timeline">
                                {/* Timeline Dot */}
                                <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm
                                    ${update.stage === 'before' ? 'bg-emerald-400' :
                                        update.stage === 'after' ? 'bg-purple-400' :
                                            update.stage === 'during' ? 'bg-amber-400' : 'bg-slate-400'}`}>
                                    {update.stage === 'before' ? '🌱' :
                                        update.stage === 'after' ? '✨' :
                                            update.stage === 'during' ? '🛠️' : '📝'}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isEditMode ? (
                                                <input
                                                    type="date"
                                                    value={update.date}
                                                    onChange={(e) => {
                                                        const newUpdates = [...data.updates];
                                                        newUpdates[idx] = { ...update, date: e.target.value };
                                                        handleFieldUpdate('updates', newUpdates);
                                                    }}
                                                    className="text-xs font-bold text-slate-800 bg-slate-50 border-none p-0 focus:ring-0"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">{update.date || '未設定日期'}</span>
                                            )}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest
                                                ${update.stage === 'before' ? 'bg-emerald-100 text-emerald-700' :
                                                    update.stage === 'after' ? 'bg-purple-100 text-purple-700' :
                                                        update.stage === 'during' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {update.stage === 'before' ? '前期' :
                                                    update.stage === 'after' ? '成果' :
                                                        update.stage === 'during' ? '進行中' : '更新'}
                                            </span>
                                        </div>

                                        {isEditMode && (
                                            <button
                                                onClick={() => {
                                                    const newUpdates = data.updates.filter((u: any) => u.id !== update.id);
                                                    handleFieldUpdate('updates', newUpdates);
                                                }}
                                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {update.imageUrl && (
                                        <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group/update-img">
                                            <img src={update.imageUrl} className="w-full h-full object-cover" alt="Update" />
                                            {isEditMode && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/update-img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ImageUploader
                                                        value={update.imageUrl}
                                                        onChange={(url) => {
                                                            const newUpdates = [...data.updates];
                                                            newUpdates[idx] = { ...update, imageUrl: url || undefined };
                                                            handleFieldUpdate('updates', newUpdates);
                                                        }}
                                                        className="w-full h-full absolute inset-0 opacity-0 z-10 cursor-pointer"
                                                    />
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!update.imageUrl && isEditMode && (
                                        <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors relative">
                                            <ImageUploader
                                                onChange={(url) => {
                                                    const newUpdates = [...data.updates];
                                                    newUpdates[idx] = { ...update, imageUrl: url || undefined };
                                                    handleFieldUpdate('updates', newUpdates);
                                                }}
                                                className="w-full h-full absolute inset-0 opacity-0 z-10 cursor-pointer"
                                            />
                                            <Camera className="w-5 h-5 mb-2" />
                                            <span className="text-[10px] font-bold">上傳照片</span>
                                        </div>
                                    )}

                                    {isEditMode ? (
                                        <div className="space-y-2">
                                            <select
                                                value={update.stage}
                                                onChange={(e) => {
                                                    const newUpdates = [...data.updates];
                                                    newUpdates[idx] = { ...update, stage: e.target.value as any };
                                                    handleFieldUpdate('updates', newUpdates);
                                                }}
                                                className="text-[10px] font-bold bg-slate-50 border-none rounded-md py-1 px-2 focus:ring-0"
                                            >
                                                <option value="update">一般更新</option>
                                                <option value="before">前期</option>
                                                <option value="during">進行中</option>
                                                <option value="after">成果</option>
                                            </select>
                                            <textarea
                                                value={update.content}
                                                onChange={(e) => {
                                                    const newUpdates = [...data.updates];
                                                    newUpdates[idx] = { ...update, content: e.target.value };
                                                    handleFieldUpdate('updates', newUpdates);
                                                }}
                                                placeholder="輸入更新內容..."
                                                className="w-full text-sm bg-slate-50 border-none rounded-xl p-3 focus:ring-1 focus:ring-emerald-500 min-h-[80px]"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{update.content || '無描述內容'}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isEditMode && (data.updates || []).length === 0 && (
                            <div className="pl-8 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                <p className="text-xs font-bold text-slate-400">目前尚無歷程更新</p>
                                <button
                                    onClick={() => {
                                        const newUpdate = {
                                            id: Date.now().toString(),
                                            date: new Date().toISOString().split('T')[0],
                                            content: '',
                                            stage: 'update' as const
                                        };
                                        handleFieldUpdate('updates', [...(data.updates || []), newUpdate]);
                                    }}
                                    className="mt-2 text-xs font-black text-emerald-600 hover:underline"
                                >
                                    + 開始記錄第一個更新
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="h-full bg-white animate-fade-in relative z-10 overflow-y-auto">
                {/* 1. Hero / Cover Image / Multi-Image Carousel */}
                <div className="h-72 md:h-[400px] w-full bg-slate-100 relative group overflow-hidden shrink-0">
                    {/* Back Button - Conditional */}
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-md hover:bg-black/60 transition backdrop-blur-md z-30 flex items-center gap-2 text-sm font-medium border border-white/10"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    {isEditMode ? (
                        <div className="w-full h-full bg-slate-50 flex flex-col">
                            <div className="flex-1 min-h-0">
                                <ImageUploader
                                    value={coverImage || undefined}
                                    onChange={(url) => {
                                        if (url) {
                                            const newUrls = [...imageUrls];
                                            if (newUrls.length > 0) {
                                                newUrls[activeImageIdx] = url;
                                            } else {
                                                newUrls.push(url);
                                            }
                                            handleFieldUpdate('imageUrls', newUrls);
                                            handleFieldUpdate('coverImage', newUrls[0]);
                                        }
                                    }}
                                    height="h-full"
                                    className="w-full h-full"
                                    placeholder="封面圖片"
                                    allowAdjustment={true}
                                    imagePosition={data.coverImagePosition || { x: 50, y: 50 }}
                                    imageScale={data.coverImageScale || 1}
                                    onAdjustmentChange={(pos, scale) => {
                                        handleFieldUpdate('coverImagePosition', pos);
                                        handleFieldUpdate('coverImageScale', scale);
                                    }}
                                />
                            </div>
                        </div>
                    ) : imageUrls.length > 0 ? (
                        <div className="w-full h-full relative group/carousel">
                            {/* Blur Background for single/vertical-ish focus */}
                            <div
                                className="absolute inset-0 z-0 blur-2xl opacity-40 scale-110"
                                style={{
                                    backgroundImage: `url(${coverImage})`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover'
                                }}
                            />

                            <img
                                src={coverImage}
                                className="relative z-10 w-full h-full object-contain transition-transform duration-500"
                                style={{
                                    objectPosition: `${data.coverImagePosition?.x ?? 50}% ${data.coverImagePosition?.y ?? 50}%`,
                                    transform: `scale(${data.coverImageScale ?? 1})`
                                }}
                                alt="Cover"
                            />

                            {/* Carousel Indicators/Navigation */}
                            {imageUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImageIdx(prev => (prev - 1 + imageUrls.length) % imageUrls.length)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImageIdx(prev => (prev + 1) % imageUrls.length)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all opacity-0 group-hover/carousel:opacity-100"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                        {imageUrls.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIdx(idx)}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIdx ? 'bg-white w-4' : 'bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                    )}
                </div>

                {/* 2. Main Layout - Conditional Inspector */}
                <div className={`w-full max-w-7xl mx-auto px-4 md:px-8 pb-20 -mt-16 relative z-10`}>
                    <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-sm flex flex-col lg:flex-row min-h-[600px] overflow-visible">
                        {/* Left Column: Content */}
                        <div className="flex-1 px-8 md:px-16 pt-12 pb-16">
                            {/* Icon Section (Notion Style) */}
                            <div className="relative mb-6 z-[60]">
                                <div
                                    className={`w-32 h-32 text-8xl flex items-center justify-center -mt-24 mb-4 group/icon transition-all duration-300 relative z-[70] ${isEditMode ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}`}
                                    onClick={() => isEditMode && setIsIconPickerOpen(!isIconPickerOpen)}
                                >
                                    {data.icon || (type === 'event' ? '🗓️' : type === 'travel' ? '🗺️' : type === 'project' ? '💡' : type === 'culture' ? '🏛️' : type === 'care_action' ? '💝' : '📄')}

                                    {isEditMode && (
                                        <div className="absolute -right-2 -bottom-2 p-1.5 bg-white rounded-full shadow-md border border-slate-100 opacity-0 group-hover/icon:opacity-100 transition-opacity">
                                            <Smile className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Icon Picker Popup */}
                                {isEditMode && isIconPickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setIsIconPickerOpen(false)} />
                                        <div className="absolute top-16 left-0 z-[110] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-80 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {ICON_CATEGORIES.map(category => (
                                                    <div key={category.label}>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{category.label}</div>
                                                        <div className="grid grid-cols-5 gap-1">
                                                            {category.icons.map(icon => (
                                                                <button
                                                                    key={icon}
                                                                    onClick={() => handleIconSelect(icon)}
                                                                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-50 rounded-lg transition-colors"
                                                                >
                                                                    {icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Title */}
                            <div className="mb-10">
                                <div className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                                    <EditableText
                                        value={titleValue}
                                        onChange={(v) => handleFieldUpdate(titleField, v)}
                                        isEditMode={isEditMode}
                                        placeholder="Untitled"
                                        tagName="h1"
                                        className="font-black text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Mobile Properties */}
                            <div className="lg:hidden mb-12 space-y-8">
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">內容屬性</h3>
                                    {renderProperties()}
                                </div>
                                {isEditMode && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">相簿管理 (最多 4 張)</h3>
                                        <MultiImageUploader
                                            values={imageUrls}
                                            onChange={(urls) => {
                                                handleFieldUpdate('imageUrls', urls);
                                                handleFieldUpdate('coverImage', urls[0] || "");
                                                if (activeImageIdx >= urls.length) setActiveImageIdx(Math.max(0, urls.length - 1));
                                            }}
                                            maxImages={4}
                                            height="h-24"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 4. Page Content (Rich Text Body) */}
                            <div className="prose prose-lg prose-slate max-w-none">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-slate-300 select-none">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs uppercase font-bold tracking-wider">描述與內容</span>
                                    </div>
                                </div>

                                {isEditMode ? (
                                    <RichTextEditor
                                        value={data.description || ''}
                                        onChange={(v) => handleFieldUpdate('description', v)}
                                        placeholder="請輸入詳細內容..."
                                        className="min-h-[400px]"
                                    />
                                ) : (
                                    <div
                                        className="prose prose-slate prose-lg max-w-none"
                                        dangerouslySetInnerHTML={{ __html: data.description || '' }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right Column: Inspector */}
                        <div className="hidden lg:block w-80 shrink-0 border-l border-slate-100 bg-slate-50/50 lg:rounded-r-3xl p-8 space-y-8">
                            <div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">屬性面板 (Inspector)</h3>
                                    {renderProperties()}
                                </div>

                                {/* Contextual Widgets */}
                                {renderWidgets()}

                                {/* Gallery Management Section */}
                                {isEditMode && (
                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">相簿管理 (最多 4 張)</h3>
                                        <MultiImageUploader
                                            values={imageUrls}
                                            onChange={(urls) => {
                                                handleFieldUpdate('imageUrls', urls);
                                                handleFieldUpdate('coverImage', urls[0] || "");
                                                if (activeImageIdx >= urls.length) setActiveImageIdx(Math.max(0, urls.length - 1));
                                            }}
                                            maxImages={4}
                                            height="h-24"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Update Footer */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pb-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>ID: {data.id}</span>
                    {data.lastModifiedBy && (
                        <span>Last updated by <strong className="text-slate-500">{data.lastModifiedBy}</strong> at {data.lastModifiedAt}</span>
                    )}
                </div>
            </div >

            {/* AI Modal */}
            {
                isAIModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAIModalOpen(false)} />
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-slate-800">AI 內容助理</h3>
                                        <p className="text-xs text-slate-500">輸入關鍵字，讓我幫您生成豐富的文案。</p>
                                    </div>
                                </div>

                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    placeholder="請輸入重點提示，例如：&#10;- 百年歷史古蹟&#10;- 每年舉辦元宵祭典&#10;- 社區居民的信仰中心..."
                                    className="w-full h-32 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-sm placeholder:text-slate-400"
                                    autoFocus
                                />

                                <div className="flex items-center justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsAIModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-100 transition"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleAIGenerate}
                                        disabled={!aiPrompt.trim() || isGenerating}
                                        className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>思考中...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                <span>開始生成</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default ItemDetailView;
