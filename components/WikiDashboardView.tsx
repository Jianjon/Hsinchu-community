import React, { useState } from 'react';
import { MapPin, User, Clock, Phone, MousePointer2, Plus, Trash2, Building, Image as ImageIcon, Smile, Tag, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import EditableText from './EditableText';
import ImageUploader from './ImageUploader';
import { PublicFacility } from '../data/mock_public';

import { getVillageTypeDisplay } from '../data/village_types';

interface WikiDashboardViewProps {
    communityName: string;
    district: string;
    wiki: any;
    isEditMode: boolean;
    onUpdate: (field: string, value: any) => void;
    onUpdateItem?: (type: string, id: string, field: string, value: any) => void;
    onNavigateToItem: (type: string, id: string) => void;
    onAddItem?: (data: any) => void;
    onDeleteItem?: (type: string, id: string) => void;
    onLocate?: (pos: [number, number]) => void;
}

const WikiDashboardView: React.FC<WikiDashboardViewProps> = ({
    communityName,
    district,
    wiki,
    isEditMode,
    onUpdate,
    onUpdateItem,
    onNavigateToItem,
    onAddItem,
    onDeleteItem,
    onLocate
}) => {
    console.log('Wiki Data:', wiki);
    const { user } = useUser();
    const canEdit = isEditMode && user?.role === 'admin';

    // Local state for new entries in each category
    const [newEntries, setNewEntries] = useState<Record<string, { name: string, description: string, address: string }>>({});

    const handleNewEntryChange = (category: string, field: 'name' | 'description' | 'address', value: string) => {
        setNewEntries(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    const handleSaveNewEntry = (category: string, type: string, icon: string) => {
        const entry = newEntries[category];
        if (!entry || !entry.name) return;

        if (onAddItem) {
            onAddItem({
                type: 'facility_create',
                subtype: type,
                icon: icon,
                name: entry.name,
                description: entry.description,
                address: entry.address
            });
            // Clear input
            setNewEntries(prev => ({ ...prev, [category]: { name: '', description: '', address: '' } }));
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {/* 1. Cover Photo Section (Notion Style) */}
            <div className="h-64 md:h-80 w-full bg-slate-100 relative group overflow-hidden shrink-0">
                {canEdit ? (
                    <ImageUploader
                        value={wiki.coverImage}
                        onChange={(img) => onUpdate('coverImage', img)}
                        className="w-full h-full"
                        height="h-full"
                        allowAdjustment
                        imagePosition={wiki.coverImagePosition || { x: 50, y: 50 }}
                        imageScale={wiki.coverImageScale || 1}
                        onAdjustmentChange={(pos, scale) => {
                            onUpdate('coverImagePosition', pos);
                            onUpdate('coverImageScale', scale);
                        }}
                    />
                ) : wiki.coverImage ? (
                    <img
                        src={wiki.coverImage}
                        className="w-full h-full object-cover transition-transform duration-500"
                        style={{
                            objectPosition: `${wiki.coverImagePosition?.x ?? 50}% ${wiki.coverImagePosition?.y ?? 50}%`,
                            transform: `scale(${wiki.coverImageScale ?? 1})`
                        }}
                        alt="Cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12" />
                    </div>
                )}
            </div>

            {/* 2. Page Content Container */}
            <div className="w-full max-w-5xl mx-auto px-6 md:px-12 pb-20 -mt-12 relative z-10 bg-white rounded-t-3xl min-h-[calc(100%-8rem)] shadow-sm">
                <div className="pt-12 mb-8">
                    <h2 className="text-4xl font-black text-slate-800">關於 {communityName}</h2>
                </div>

                <div className="space-y-16">
                    {/* Top Section: Map & Stats */}
                    <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                        <div className="w-full lg:w-[38%] flex flex-col">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`新竹縣${district}${communityName}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-h-[320px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group cursor-pointer hover:shadow-lg transition block"
                            >
                                <iframe
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`新竹縣${district}${communityName}`)}&zoom=15&language=zh-TW`}
                                    className="w-full h-full border-0 pointer-events-none"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                                <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="flex items-center gap-2 font-bold text-slate-700 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md">
                                        <MapPin className="w-4 h-4" /> 開啟完整地圖
                                    </span>
                                </div>
                            </a>
                        </div>

                        <div className="flex-1 flex flex-col gap-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">人口數</div>
                                    <div className="text-2xl font-black text-slate-800 flex items-baseline gap-1">
                                        <EditableText
                                            value={wiki.population?.toString()}
                                            onChange={(v) => onUpdate('population', parseInt(v) || 0)}
                                            isEditMode={canEdit}
                                            placeholder="0"
                                        />
                                        <span className="text-sm">人</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">面積</div>
                                    <div className="text-2xl font-black text-slate-800">
                                        <EditableText
                                            value={wiki.area?.toString()}
                                            onChange={(v) => onUpdate('area', v)}
                                            isEditMode={canEdit}
                                            placeholder="N/A"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                                    {(() => {
                                        const typeInfo = getVillageTypeDisplay(communityName);
                                        return (
                                            <>
                                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">類型</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{typeInfo.emoji}</span>
                                                    <div>
                                                        <div className="text-base font-black" style={{ color: typeInfo.color }}>{typeInfo.subtypeName}</div>
                                                        <div className="text-xs text-slate-400">{typeInfo.categoryName}</div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:border-indigo-400 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">村里長</div>
                                            <div className="font-black text-slate-800 text-lg">
                                                <EditableText value={wiki.chief?.name} onChange={(v) => onUpdate('chief.name', v)} isEditMode={canEdit} placeholder="無資料" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        {wiki.chief?.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                <EditableText value={wiki.chief?.phone} onChange={(v) => onUpdate('chief.phone', v)} isEditMode={canEdit} placeholder="電話" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 text-slate-400 mt-1 shrink-0" />
                                            <EditableText value={wiki.chief?.officeAddress} onChange={(v) => onUpdate('chief.officeAddress', v)} isEditMode={canEdit} placeholder="辦公處地址" multiline />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:border-orange-400 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">社區發展協會</div>
                                            <div className="font-black text-slate-800 text-lg line-clamp-1">
                                                <EditableText value={wiki.association?.name} onChange={(v) => onUpdate('association.name', v)} isEditMode={canEdit} placeholder="計畫協會名稱" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-400">理事長:</span>
                                                <EditableText value={wiki.association?.chairman} onChange={(v) => onUpdate('association.chairman', v)} isEditMode={canEdit} placeholder="尚未指定" />
                                            </div>
                                        </div>
                                        {wiki.association?.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                <EditableText value={wiki.association?.phone} onChange={(v) => onUpdate('association.phone', v)} isEditMode={canEdit} placeholder="電話" />
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-3 h-3 text-slate-400 mt-1 shrink-0" />
                                            <EditableText value={wiki.association?.address} onChange={(v) => onUpdate('association.address', v)} isEditMode={canEdit} placeholder="協會地址" multiline />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Intro & Gallery - Refactored to vertical flow */}
                    <div className="space-y-12 pt-4">
                        <div className="space-y-12">
                            {/* Segment 1: Geo & Env */}
                            <div className="relative">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                    地理與環境
                                </h3>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-[16px] bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/50">
                                    <EditableText
                                        value={wiki.intro_geo || wiki.introduction}
                                        onChange={v => onUpdate('intro_geo', v)}
                                        isEditMode={canEdit}
                                        placeholder="描述該里的微型生活圈、主要街道、景觀特色..."
                                        multiline
                                    />
                                </div>
                            </div>

                            {/* Segment 2: History & Culture */}
                            <div className="relative">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-6 bg-orange-400 rounded-full shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                                    歷史與人文特色
                                </h3>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-[16px] bg-orange-50/30 p-6 rounded-2xl border border-orange-100/50">
                                    <EditableText
                                        value={wiki.intro_history}
                                        onChange={v => onUpdate('intro_history', v)}
                                        isEditMode={canEdit}
                                        placeholder="描述社區演變、居民特質、傳統活動或老地名起源..."
                                        multiline
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-4">
                                {wiki.features?.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 flex items-center gap-1.5">
                                        #{tag}
                                        {canEdit && <button onClick={() => onUpdate('features', wiki.features.filter((t: any) => t !== tag))}><X className="w-3 h-3" /></button>}
                                    </span>
                                ))}
                                {canEdit && (
                                    <input
                                        type="text"
                                        placeholder="+ 特色"
                                        className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value.trim();
                                                if (val) { onUpdate('features', [...(wiki.features || []), val]); e.currentTarget.value = ''; }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <div className="w-1 h-5 bg-orange-400 rounded-full" />
                                社區剪影
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {(wiki.gallery || []).map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative group">
                                        <img src={img} className="w-full h-full object-cover" />
                                        {canEdit && <button onClick={() => onUpdate('gallery', wiki.gallery.filter((_: any, i: any) => i !== idx))} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"><X className="w-3 h-3" /></button>}
                                    </div>
                                ))}
                                {canEdit && (
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.onchange = (e: any) => {
                                                const reader = new FileReader();
                                                reader.onload = (re) => onUpdate('gallery', [...(wiki.gallery || []), re.target?.result]);
                                                reader.readAsDataURL(e.target.files[0]);
                                            };
                                            input.click();
                                        }}
                                        className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sustainability & Goodness Section */}
                    {wiki.careActions?.length > 0 && (
                        <div className="space-y-8 pt-4">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                永續共好：社會共照資源
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {wiki.careActions.map((action: any, idx: number) => (
                                    <div key={idx} className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex gap-5 group hover:shadow-md transition-all">
                                        <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                            {action.title?.includes('食物銀行') ? '🍱' : '👵'}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h4 className="font-black text-slate-800 text-lg leading-tight">{action.title}</h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {action.location}
                                                </div>
                                                {action.phone && action.phone !== '無' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {action.phone}
                                                    </div>
                                                )}
                                                {action.time && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {action.time}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Section: Assets Directory */}
                    <div className="space-y-8 pt-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                            社區資產索引
                        </h3>

                        {[
                            { title: "公共設施", keyword: "public", icon: "🏛️", items: wiki.facilities?.filter((f: any) => ['activity_center', 'library', 'park', 'market'].includes(f.type)) },
                            { title: "機關學校", keyword: "institution", icon: "🏫", items: wiki.facilities?.filter((f: any) => ['school', 'police', 'hospital', 'gov'].includes(f.type)) },
                            { title: "其他資源", keyword: "other", icon: "📦", items: wiki.facilities?.filter((f: any) => !['activity_center', 'library', 'park', 'market', 'school', 'police', 'hospital', 'gov'].includes(f.type)) }
                        ].map(category => (
                            (category.items?.length > 0 || canEdit) && (
                                <div key={category.keyword}>
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{category.title}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {category.items?.map((fac: any) => (
                                            <div key={fac.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition cursor-pointer flex gap-4 group" onClick={() => onNavigateToItem('facility', fac.id)}>
                                                <div className="w-16 h-16 rounded-lg bg-slate-50 shrink-0 flex items-center justify-center text-2xl overflow-hidden">
                                                    {fac.coverImage ? <img src={fac.coverImage} className="w-full h-full object-cover" /> : (fac.address ? <MapPin className="w-6 h-6 text-emerald-500" /> : fac.icon)}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div onClick={e => e.stopPropagation()}><EditableText value={fac.name} onChange={v => onUpdateItem?.('facility', fac.id, 'name', v)} isEditMode={canEdit} className="font-bold" /></div>
                                                    <div onClick={e => e.stopPropagation()}><EditableText value={fac.description} onChange={v => onUpdateItem?.('facility', fac.id, 'description', v)} isEditMode={canEdit} className="text-xs text-slate-500" /></div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        <div onClick={e => e.stopPropagation()}><EditableText value={fac.address} onChange={v => onUpdateItem?.('facility', fac.id, 'address', v)} isEditMode={canEdit} className="truncate" /></div>
                                                        {fac.googleMapUrl && (
                                                            <a href={fac.googleMapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold hover:bg-indigo-100 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> 地圖
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                {canEdit && (
                                                    <button onClick={e => { e.stopPropagation(); onDeleteItem?.('facility', fac.id); }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        ))}
                                        {canEdit && (
                                            <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200 flex flex-col gap-2 relative">
                                                <input placeholder="名稱..." className="bg-transparent text-sm font-bold outline-none" value={newEntries[category.keyword]?.name || ''} onChange={e => handleNewEntryChange(category.keyword, 'name', e.target.value)} />
                                                <input placeholder="地址..." className="bg-transparent text-xs outline-none" value={newEntries[category.keyword]?.address || ''} onChange={e => handleNewEntryChange(category.keyword, 'address', e.target.value)} />
                                                <button onClick={() => handleSaveNewEntry(category.keyword, 'other', category.icon)} className="absolute right-4 bottom-4 bg-emerald-600 text-white p-1 rounded-full"><Plus className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Developer / Admin Footer */}
                {user?.role === 'admin' && (
                    <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            數據管理模式中
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm("確定要重設本地數據庫？這將清除所有已存在的 AI 分析紀錄，並重新從後端載入最新 JSON 檔案。")) {
                                    indexedDB.deleteDatabase("TaiwanVillageAnalystDB");
                                    window.location.reload();
                                }
                            }}
                            className="flex items-center gap-2 hover:text-red-500 transition"
                        >
                            <Trash2 className="w-3 h-3" /> 重設本地數據緩存
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WikiDashboardView;
