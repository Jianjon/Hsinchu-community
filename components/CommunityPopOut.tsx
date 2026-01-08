import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Star, StarOff, MessageSquare, MapPin, Calendar, Hammer, Info, Layout, Hash, Send, User, ChevronRight, PlusCircle, Trophy, Settings, ArrowRight, ArrowLeft, Plus, Edit3, Trash2, Eye, Edit, Image as ImageIcon, Clock, Phone, Save, Coffee, Wind, BookOpen, TreePine, Library, Heart, Sparkles, Camera, Flag, Leaf, ShoppingBag } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useUser } from '../hooks/useUser';
import { PublicCommunity } from '../data/mock_public';
import PostFeed from './PostFeed';
import GlobalSocialFeed from './GlobalSocialFeed';
import SocialComposer from './SocialComposer';
import GlobalMixboardView from './GlobalMixboardView';
import ItemDetailView from './ItemDetailView';
import CommunityItemCard from './CommunityItemCard';
import EditableText from './EditableText';
import WikiDashboardView from './WikiDashboardView';
import QuickCreateModal, { CreateItemData } from './QuickCreateModal';
import SmartImportModal from './SmartImportModal';
import { ParsedCommunityContent } from '../services/aiContentService';
// WIKI_DATA import removed

export type PopOutTab = 'feed' | 'wiki' | 'events' | 'projects';

interface CommunityPopOutProps {
    open: boolean;
    mode: 'home' | 'community' | 'bulletin' | 'preview';
    community: PublicCommunity | null;
    initialChannel?: string;
    onClose: () => void;
    onNavigateToCommunity?: (id: string) => void;
    onOpenProfile?: () => void;
    onLocate?: (pos: [number, number]) => void;
    onUpdate?: (id: string, updatedCommunity: PublicCommunity) => void;
}

const CommunityPopOut: React.FC<CommunityPopOutProps> = ({
    open,
    mode,
    community,
    initialChannel,
    onClose,
    onNavigateToCommunity,
    onOpenProfile,
    onLocate,
    onUpdate
}) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const { user, isLoggedIn, setLoginOverlay } = useUser();
    const [activeChannelId, setActiveChannelId] = useState('general');
    const [isComposerExpanded, setIsComposerExpanded] = useState(false);

    // Edit Mode & Local Data State
    const [isEditMode, setIsEditMode] = useState(false);
    const [localCommunity, setLocalCommunity] = useState<PublicCommunity | null>(community);

    // Bulletin Board State with New Categories
    const [bulletinChannels, setBulletinChannels] = useState([
        { id: 'public_discussion', label: '公共討論', icon: MessageSquare },
        { id: 'community_planner', label: '社區規劃師', icon: User },
        { id: 'rural_rejuvenation', label: '農村再造', icon: Layout },
        { id: 'low_carbon', label: '低碳家園', icon: Leaf },
        { id: 'second_hand', label: '二手交換', icon: ShoppingBag },
        { id: 'recruitment', label: '活動招募', icon: Flag }
    ]);
    const [activeBulletinCategory, setActiveBulletinCategory] = useState<string>('public_discussion');

    // Channels State
    const [channelList, setChannelList] = useState([
        { id: 'general', name: '一般討論', icon: <Coffee className="w-4 h-4" />, type: 'system' },
        { id: 'announce', name: '重要公告', icon: <Wind className="w-4 h-4" />, type: 'system' },
        { id: 'wiki', name: '社區維基', icon: <BookOpen className="w-4 h-4" />, type: 'system' },
        { id: 'events', name: '在地活動', icon: <Sparkles className="w-4 h-4" />, type: 'system' },
        { id: 'travel', name: '輕旅行', icon: <Camera className="w-4 h-4" />, type: 'system' },
        { id: 'projects', name: '地方創生', icon: <TreePine className="w-4 h-4" />, type: 'system' },
        { id: 'culture', name: '文化資產', icon: <Library className="w-4 h-4" />, type: 'system' },
        { id: 'care', name: '永續共好', icon: <Heart className="w-4 h-4" />, type: 'system' },
    ]);

    const activeChannelObj = channelList.find(c => c.id === activeChannelId) || channelList[0];
    const activeChannelName = activeChannelObj.name;

    // ...

    useEffect(() => {
        setLocalCommunity(community);
        setIsEditMode(false);
        setSelectedItem(null);
        if (mode === 'preview' && initialChannel) {
            // Find ID by name if initialChannel is name, or use direct if ID
            const found = channelList.find(c => c.name === initialChannel || c.id === initialChannel);
            if (found) setActiveChannelId(found.id);
        }
    }, [community, mode, initialChannel]);

    // ...

    const handleRenameChannel = (id: string, newName: string) => {
        setChannelList(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
    };

    const handleAddChannel = () => {
        const newId = `custom_${Date.now()}`;
        setChannelList(prev => [...prev, {
            id: newId,
            name: '新頻道',
            icon: <Hash className="w-4 h-4" />,
            type: 'custom'
        }]);
        setActiveChannelId(newId);
        // Auto-enter edit mode for name? (Implied by UI)
    };

    const handleDeleteChannel = (id: string) => {
        if (window.confirm('確定要刪除此頻道？')) {
            setChannelList(prev => prev.filter(c => c.id !== id));
            if (activeChannelId === id) setActiveChannelId('general');
        }
    };

    // ... Update Render Logic to use activeChannelId ...
    // I will need to replace the big renderContent block in a separate call or carefully here.
    // The instructions say "Modify CommunityPopOut.tsx". I should do it in valid chunks.
    // This tool call is for state setup and helper functions.


    // In-Sidebar Detail View State (Stores ID only to always fetch fresh data)
    const [selectedItem, setSelectedItem] = useState<{ type: string; id: string } | null>(null);

    // Quick Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalChannel, setCreateModalChannel] = useState<'events' | 'travel' | 'projects' | 'culture' | 'care' | 'resource' | 'facility'>('events');
    const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
    const [aiInitialData, setAiInitialData] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Ref to track pending auto-save operations
    const pendingSaveRef = useRef<{ id: string; reason: string } | null>(null);

    useEffect(() => {
        setLocalCommunity(community);
        setIsEditMode(false); // Reset edit mode when community changes
        setSelectedItem(null); // Reset selection
        if (mode === 'preview' && initialChannel) {
            const found = channelList.find(c => c.name === initialChannel || c.id === initialChannel);
            if (found) setActiveChannelId(found.id);
        }
    }, [community, mode, initialChannel]);

    // Handle channel change -> Reset selection
    useEffect(() => {
        setSelectedItem(null);
    }, [activeChannelId]);

    // Auto-save effect: triggers when localCommunity changes AND there's a pending save
    useEffect(() => {
        if (pendingSaveRef.current && localCommunity && onUpdate) {
            const { id, reason } = pendingSaveRef.current;
            // Only save if the community ID matches what we're expecting
            if (localCommunity.id === id) {
                // console.log('[CommunityPopOut] 🔄 Auto-save triggered:', reason, 'careActions count:', localCommunity.careActions?.length);
                onUpdate(id, localCommunity);
                // console.log('[CommunityPopOut] ✅ Auto-saved to Firestore:', reason);
            }
            // Clear the pending save
            pendingSaveRef.current = null;
        }
    }, [localCommunity, onUpdate]);

    // Helper to get fresh data derived from localCommunity
    const getSelectedItemData = () => {
        if (!selectedItem || !localCommunity) return null;
        const { type, id } = selectedItem;

        if (type === 'event') return localCommunity.events?.find(e => e.id === id);
        if (type === 'travel') return localCommunity.travelSpots?.find(t => t.id === id);
        if (type === 'project') return localCommunity.projects?.find(p => p.id === id);
        if (type === 'culture') return localCommunity.cultureHeritages?.find(c => c.id === id);
        if (type === 'care_action') return localCommunity.careActions?.find(c => c.id === id);
        if (type === 'facility') return localCommunity.wiki?.facilities?.find(f => f.id === id);

        return null;
    };

    const handleSmartImportConfirm = (parsed: ParsedCommunityContent) => {
        setIsSmartImportOpen(false);
        setAiInitialData({
            ...parsed.data,
            metadata: {
                organizer: parsed.data.organizer,
                cost: parsed.data.cost,
                status: parsed.data.status,
                progress: parsed.data.progress,
                fundingSource: parsed.data.fundingSource,
                seasonality: parsed.data.seasonality
            }
        });
        setCreateModalChannel(parsed.channelType);
        setIsCreateModalOpen(true);
    };


    const handleAddItem = (channelOrData: string | any) => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        if (!localCommunity) return;

        // Check if object (Direct creation from Wiki Dashboard)
        if (typeof channelOrData === 'object' && channelOrData.type === 'facility_create') {
            const { subtype, icon, name, description } = channelOrData;
            const newId = `new_${Date.now()}`;
            setLocalCommunity((prev: any) => {
                if (!prev) return prev;
                const baseWiki = prev.wiki || {};
                return {
                    ...prev,
                    wiki: {
                        ...baseWiki,
                        facilities: [...(baseWiki.facilities || []), {
                            id: newId,
                            name: name || "新項目",
                            description: description,
                            type: subtype,
                            icon: icon,
                            creatorId: user?.id
                        }]
                    }
                };
            });
            return;
        }

        const channel = channelOrData as string;

        // Map channel name to type for modal
        let mappedType: 'events' | 'travel' | 'projects' | 'culture' | 'care' | 'facility' | 'resource' | null = null;

        if (channel === '在地活動') mappedType = 'events';
        else if (channel === '輕旅行') mappedType = 'travel';
        else if (channel === '地方創生') mappedType = 'projects';
        else if (channel === '文化資產') mappedType = 'culture';
        else if (channel === '永續共好') mappedType = 'care';
        else if (channel === '一般討論') mappedType = 'resource';
        else if (channel === '社區維基' || channel.startsWith('wiki_facility_')) mappedType = 'facility';

        if (mappedType) {
            setAiInitialData(null); // Clear previous AI data
            setCreateModalChannel(mappedType);
            setIsCreateModalOpen(true);
            return;
        }
    };

    const handleCreateItem = (data: CreateItemData) => {
        if (!localCommunity || !user) return;

        const newId = `new_${Date.now()}`;
        let newItemType = '';

        setLocalCommunity(prev => {
            if (!prev) return prev;
            const next = { ...prev };

            if (createModalChannel === 'events') {
                next.events = [{
                    id: newId,
                    title: data.title,
                    description: data.description,
                    imageUrl: data.coverImage,
                    date: data.date || new Date().toISOString().split('T')[0],
                    time: data.time || "09:00",
                    location: data.location || localCommunity.name || "社區中心",
                    coordinates: data.coordinates, // Add coordinates for map
                    registrationLink: data.link,
                    type: "workshop",
                    creatorId: user.id,
                    organizer: data.metadata?.organizer,
                    cost: data.metadata?.cost,
                }, ...(next.events || [])];
                newItemType = 'event';
            } else if (createModalChannel === 'travel') {
                next.travelSpots = [{
                    id: newId,
                    name: data.title,
                    description: data.description,
                    imageUrl: data.coverImage,
                    tags: data.tags || ["新景點"],
                    location: data.coordinates || localCommunity.location || [24.5, 121], // Use real coords or community fallback
                    address: data.location,
                    googleMapLink: data.link,
                    creatorId: user.id,
                    seasonality: data.metadata?.seasonality,
                }, ...(next.travelSpots || [])];
                newItemType = 'travel';
            } else if (createModalChannel === 'projects') {
                next.projects = [{
                    id: newId,
                    title: data.title,
                    description: data.description,
                    imageUrl: data.coverImage,
                    what: data.metadata?.status === 'planning' ? "提案階段" : (data.metadata?.status === 'active' ? "執行階段" : "結案階段"),
                    owner: user.name,
                    progress: data.metadata?.progress || 0,
                    status: data.metadata?.status || "planning",
                    creatorId: user.id,
                    location: data.coordinates || localCommunity.location || [24.5, 121], // Add location for map visibility
                    address: data.location,
                    fundingSource: data.metadata?.fundingSource,
                    updates: []
                }, ...(next.projects || [])];
                newItemType = 'project';
            } else if (createModalChannel === 'culture') {
                next.cultureHeritages = [{
                    id: newId,
                    name: data.title,
                    description: data.description,
                    coverImage: data.coverImage,
                    category: "historic_site",
                    location: data.coordinates || localCommunity.location || [24.5, 121], // Use real coords
                    address: data.location,
                    creatorId: user.id
                }, ...(next.cultureHeritages || [])];
                newItemType = 'culture';
            } else if (createModalChannel === 'care') {
                next.careActions = [{
                    id: newId,
                    title: data.title,
                    description: data.description,
                    coverImage: data.coverImage,
                    type: "other",
                    area: data.location || "一般區域",
                    status: "ongoing",
                    date: data.date, // Generic: No default date if not provided
                    link: data.link,
                    tags: data.tags,
                    location: data.coordinates, // Add location for map
                    address: data.location,
                    creatorId: user.id
                }, ...(next.careActions || [])];
                newItemType = 'care_action';
            } else if (createModalChannel === 'facility') {
                const newFacility: any = {
                    id: newId,
                    name: data.title,
                    description: data.description,
                    address: data.location,
                    coverImage: data.coverImage,
                    type: "other", // Default, could be refined
                    icon: "🏛️",
                    location: data.coordinates, // Add location for map
                    creatorId: user.id
                };

                if (next.wiki) {
                    next.wiki.facilities = [newFacility, ...(next.wiki.facilities || [])];
                }
                newItemType = 'facility';
            }

            return next;
        });

        // Mark pending save - will be handled by useEffect when state is updated
        pendingSaveRef.current = { id: localCommunity.id, reason: `created:${newId}` };
        // console.log('[CommunityPopOut] 📝 Created item, pending save set:', createModalChannel, newId);

        // Open detail view for the newly created item
        setTimeout(() => setSelectedItem({ type: newItemType, id: newId }), 0);
    };

    const handleDeleteItem = (category: string, id: string) => {
        const communityId = localCommunity?.id;

        setLocalCommunity(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            if (category === 'facility' && next.wiki) {
                next.wiki.facilities = next.wiki.facilities.filter(i => i.id !== id);
            } else if (category === 'event') {
                next.events = next.events?.filter(i => i.id !== id);
            } else if (category === 'travel') {
                next.travelSpots = next.travelSpots?.filter(i => i.id !== id);
            } else if (category === 'project') {
                next.projects = next.projects?.filter(i => i.id !== id);
            } else if (category === 'culture') {
                next.cultureHeritages = next.cultureHeritages?.filter(i => i.id !== id);
            } else if (category === 'care_action') {
                next.careActions = next.careActions?.filter(i => i.id !== id);
            }
            return next;
        });

        // Mark pending save - will be handled by useEffect when state is updated
        if (communityId) {
            pendingSaveRef.current = { id: communityId, reason: `deleted:${id}` };
        }

        // If deleted item was selected, close detail view
        if (selectedItem?.id === id) setSelectedItem(null);
    };

    const handleUpdateItem = (category: string, id: string, field: string, value: any) => {
        setLocalCommunity(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            // Simple mapping or complex switch based on category
            // Reuse logic from previous implementation but ensure it matches map calls

            const timestamp = new Date().toLocaleString();
            const modifier = user?.name || 'Unknown';
            const meta = { lastModifiedBy: modifier, lastModifiedAt: timestamp };

            if (category === 'wiki_basic') {
                const baseWiki = (next as any).wiki || {};
                (next as any).wiki = { ...baseWiki }; // Ensure wiki object exists and is mutable
                if (field.includes('.')) {
                    const [obj, key] = field.split('.');
                    (next.wiki as any)[obj] = { ...(next.wiki as any)[obj], [key]: value };
                } else {
                    (next.wiki as any)[field] = value;
                }
            } else if (category === 'facility' && next.wiki) {
                next.wiki.facilities = next.wiki.facilities.map(f =>
                    f.id === id ? { ...f, [field]: value, ...meta } : f
                );
            } else if (category === 'event') {
                next.events = next.events?.map(e => e.id === id ? { ...e, [field]: value } : e);
            } else if (category === 'travel') {
                next.travelSpots = next.travelSpots?.map(t => t.id === id ? { ...t, [field]: value } : t);
            } else if (category === 'project') {
                next.projects = next.projects?.map(p => p.id === id ? { ...p, [field]: value } : p);
            } else if (category === 'culture') {
                next.cultureHeritages = next.cultureHeritages?.map(c => c.id === id ? { ...c, [field]: value } : c);
            } else if (category === 'care_action') {
                next.careActions = next.careActions?.map(ca => ca.id === id ? { ...ca, [field]: value } : ca);
            }

            return next;
        });
    };

    const handleSave = () => {
        // Only admins can save wiki/community changes
        if (user?.role !== 'admin') {
            alert('您不具備管理員權限，無法儲存變更。');
            setIsEditMode(false);
            return;
        }

        if (onUpdate && localCommunity) {
            onUpdate(localCommunity.id, localCommunity);
            setIsEditMode(false);
        }
        // Alert user or show toast
        console.log('Community saved:', localCommunity);
    };

    // Wrapper for ItemDetailView to handle updates
    const handleDetailUpdate = (itemId: string, updates: any) => {
        if (!selectedItem) return;
        Object.entries(updates).forEach(([key, value]) => {
            handleUpdateItem(selectedItem.type, itemId, key, value);
        });
    };

    // Channels are now in state `channelList`


    const toggleFavorite = () => {
        if (!community) return;
        if (isFavorite(community.id)) {
            removeFavorite(community.id);
        } else {
            addFavorite(community.id);
        }
    };

    if (!open) return null;

    const renderFooter = () => {
        if (isLoggedIn && user) {
            return (
                <div
                    className="p-4 border-t flex items-center gap-3 cursor-pointer transition-colors group"
                    style={{ backgroundColor: '#FDFBF7', borderColor: 'rgba(141,170,145,0.2)' }}
                    onClick={onOpenProfile}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg overflow-hidden font-sans-tc" style={{ backgroundColor: '#8DAA91' }}>
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="User Avatar" /> : user.name.substring(0, 2)}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black truncate transition-colors flex items-center gap-1 font-sans-tc" style={{ color: '#4A4A4A' }}>
                            {user.name}
                        </div>
                    </div>
                    <Settings className="w-4 h-4 transition-all group-hover:rotate-45" style={{ color: '#8B8B8B' }} />
                </div>
            );
        }
        return (
            <div
                className="p-4 border-t flex items-center gap-3 cursor-pointer transition-colors group"
                style={{ backgroundColor: '#FDFBF7', borderColor: 'rgba(141,170,145,0.2)' }}
                onClick={() => setLoginOverlay(true)}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: 'rgba(141,170,145,0.1)', color: '#8B8B8B' }}>
                    <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="text-[13px] font-black transition-colors font-sans-tc" style={{ color: '#8B8B8B' }}>尚未加入居民</div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (mode === 'home') {
            return (
                <div className="flex flex-col h-full bg-slate-50">
                    <div className="flex-1 overflow-y-auto">
                        <GlobalMixboardView
                            community={community || undefined}
                            onNavigate={onNavigateToCommunity}
                        />
                    </div>
                </div>
            );
        }

        if (mode === 'bulletin') {
            return (
                <div className="flex h-full">
                    {/* Sidebar - Matching Community Style */}
                    <div className="w-80 flex flex-col shrink-0" style={{ backgroundColor: '#FDFBF7', borderRight: '1px solid rgba(141,170,145,0.2)' }}>
                        <div className="p-6 backdrop-blur" style={{ borderBottom: '1px solid rgba(141,170,145,0.2)', backgroundColor: 'rgba(253,251,247,0.95)' }}>
                            <h3 className="font-black truncate font-serif-tc text-3xl flex items-center gap-3" style={{ color: '#4A4A4A' }}>
                                <MessageSquare className="w-8 h-8 text-emerald-600" />
                                共用佈告欄
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="text-[12px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 font-sans-tc"
                                    style={{ backgroundColor: 'rgba(141,170,145,0.1)', color: '#8B8B8B' }}
                                >
                                    跨區交流 • 鄰里互助
                                </div>
                            </div>
                        </div>

                        {/* Channels/Categories */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            <div className="px-2 mb-3 flex items-center justify-between">
                                <div className="text-[10px] font-black uppercase tracking-widest font-sans-tc" style={{ color: '#8B8B8B' }}>
                                    討論看板
                                </div>
                                <button
                                    onClick={() => {
                                        const newName = prompt("請輸入新看板名稱");
                                        if (newName) {
                                            const newId = `custom_${Date.now()}`;
                                            setBulletinChannels(prev => [...prev, { id: newId, label: newName, icon: MessageSquare }]);
                                            setActiveBulletinCategory(newId);
                                        }
                                    }}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                                    title="新增看板"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {bulletinChannels.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveBulletinCategory(cat.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm group font-sans-tc relative"
                                    style={activeBulletinCategory === cat.id
                                        ? { backgroundColor: '#8DAA91', color: 'white', boxShadow: '0 4px 12px rgba(141,170,145,0.25)' }
                                        : { color: '#4A4A4A' }
                                    }
                                >
                                    <span style={{ color: activeBulletinCategory === cat.id ? 'white' : '#8DAA91' }}>
                                        <cat.icon className="w-4 h-4" />
                                    </span>
                                    <div className="flex-1 text-left truncate">
                                        {cat.label}
                                    </div>

                                    {/* Delete button for custom channels */}
                                    {cat.id.startsWith('custom_') && (
                                        <div
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-400 rounded transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`確定要刪除「${cat.label}」嗎？`)) {
                                                    setBulletinChannels(prev => prev.filter(c => c.id !== cat.id));
                                                    if (activeBulletinCategory === cat.id) setActiveBulletinCategory('public_discussion');
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            ))}

                            <div className="mt-8 mx-2 p-4 rounded-2xl border" style={{ backgroundColor: 'rgba(141,170,145,0.05)', borderColor: 'rgba(141,170,145,0.1)' }}>
                                <h4 className="font-bold mb-2 text-sm flex items-center gap-2" style={{ color: '#4A4A4A' }}>
                                    <Info className="w-4 h-4 text-emerald-600" />
                                    關於本版
                                </h4>
                                <p className="text-xs leading-relaxed font-sans-tc" style={{ color: '#666' }}>
                                    這是一個跨社區的公開交流空間。無論是尋求合作夥伴、分享成功經驗，或是發布活動訊息，都歡迎在此張貼。
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Feed */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 z-50 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
                                {/* Composer at top of feed */}
                                <SocialComposer
                                    filterTag={activeBulletinCategory}
                                    onPostCreated={() => setRefreshKey(k => k + 1)}
                                />

                                <GlobalSocialFeed
                                    compact={false}
                                    filterTag={activeBulletinCategory}
                                    refreshTrigger={refreshKey}
                                    onNavigate={(id) => {
                                        if (onNavigateToCommunity) onNavigateToCommunity(id);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }


        if (!community) return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 bg-slate-50">
                <Layout className="w-16 h-16 opacity-20" />
                <p>請從地圖選擇一個社區</p>
            </div>
        );

        // --- PAGE RENDERERS ---
        const renderChannelContent = () => {
            const targetCommunity = localCommunity || community;
            const itemData = getSelectedItemData();

            if (!targetCommunity) return null;

            // 0. DETAIL VIEW (If item selected)
            if (selectedItem && itemData) {
                return (
                    <div className="flex-1 overflow-hidden bg-white">
                        <ItemDetailView
                            type={selectedItem.type as any}
                            data={itemData}
                            villageName={targetCommunity.name}
                            communityLocation={targetCommunity.location}
                            isEditMode={isEditMode}
                            onBack={() => setSelectedItem(null)}
                            onClose={() => setSelectedItem(null)}
                            onUpdate={handleDetailUpdate}
                        />
                    </div>
                );
            }

            // 1. WIKI - Village Dashboard (Phase 25)
            if (activeChannelId === 'wiki') {
                // Simplified wiki data extraction from community object
                const wiki = {
                    introduction: (localCommunity || targetCommunity).wiki?.introduction || "",
                    population: (localCommunity || targetCommunity).wiki?.population || 0,
                    area: (localCommunity || targetCommunity).wiki?.area || "N/A",
                    type: (localCommunity || targetCommunity).wiki?.type || 'mixed',
                    icon: (localCommunity || targetCommunity).wiki?.icon || "",
                    chief: (localCommunity || targetCommunity).wiki?.chief || { name: "", phone: "", officeAddress: "" },
                    association: (localCommunity || targetCommunity).wiki?.association || { chairman: "", contact: "", address: "" },
                    facilities: (localCommunity || targetCommunity).wiki?.facilities || [],
                    awards: (localCommunity || targetCommunity).wiki?.awards || [],
                    features: (localCommunity || targetCommunity).wiki?.features || [],
                    intro_geo: (localCommunity || targetCommunity).wiki?.intro_geo || "",
                    intro_history: (localCommunity || targetCommunity).wiki?.intro_history || "",
                    careActions: (localCommunity || targetCommunity).wiki?.careActions || (localCommunity || targetCommunity).careActions,
                    coverImage: (localCommunity || targetCommunity).wiki?.coverImage,
                    coverImagePosition: (localCommunity || targetCommunity).wiki?.coverImagePosition,
                    coverImageScale: (localCommunity || targetCommunity).wiki?.coverImageScale,
                    // Inject location from community root if not present in wiki
                    location: (localCommunity || targetCommunity).location ? {
                        lat: (localCommunity || targetCommunity).location[0],
                        lng: (localCommunity || targetCommunity).location[1]
                    } : undefined
                };
                // console.log('[CommunityPopOut] Rendering WikiDashboard, intro_history:', wiki.intro_history);
                return (
                    <WikiDashboardView
                        communityName={targetCommunity.name}
                        district={targetCommunity.district}
                        wiki={wiki}
                        isEditMode={isEditMode}
                        onUpdate={(field, value) => handleUpdateItem('wiki_basic', '', field, value)}
                        onUpdateItem={(type, id, field, value) => handleUpdateItem(type, id, field, value)}
                        onNavigateToItem={(type, id) => setSelectedItem({ type: type as any, id })}
                        onAddItem={handleAddItem}
                        onDeleteItem={handleDeleteItem}
                        onLocate={onLocate}
                    />
                );
            }

            // 2. EVENTS - Calendar List View
            if (activeChannelId === 'events') {
                return (
                    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FDFBF7' }}>
                        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {targetCommunity.events?.map(evt => (
                                <CommunityItemCard
                                    key={evt.id}
                                    type="event"
                                    data={evt}
                                    isEditMode={isEditMode}
                                    onClick={() => setSelectedItem({ type: 'event', id: evt.id })}
                                    onDelete={() => handleDeleteItem('event', evt.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            }

            // 3. TRAVEL - Gallery View
            if (activeChannelId === 'travel') {
                return (
                    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FDFBF7' }}>
                        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {targetCommunity.travelSpots?.map(spot => (
                                <CommunityItemCard
                                    key={spot.id}
                                    type="travel"
                                    data={spot}
                                    isEditMode={isEditMode}
                                    onClick={() => setSelectedItem({ type: 'travel', id: spot.id })}
                                    onDelete={() => handleDeleteItem('travel', spot.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            }

            // 4. PROJECTS - Kanban/Gallery View
            if (activeChannelId === 'projects') {
                return (
                    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FDFBF7' }}>
                        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {targetCommunity.projects?.map(proj => (
                                <CommunityItemCard
                                    key={proj.id}
                                    type="project"
                                    data={proj}
                                    isEditMode={isEditMode}
                                    onClick={() => setSelectedItem({ type: 'project', id: proj.id })}
                                    onDelete={() => handleDeleteItem('project', proj.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            }

            // 5. CULTURE - Portrait Gallery
            if (activeChannelId === 'culture') {
                return (
                    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FDFBF7' }}>
                        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {targetCommunity.cultureHeritages?.map(cult => (
                                <CommunityItemCard
                                    key={cult.id}
                                    type="culture"
                                    data={cult}
                                    isEditMode={isEditMode}
                                    onClick={() => setSelectedItem({ type: 'culture', id: cult.id })}
                                    onDelete={() => handleDeleteItem('culture', cult.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            }

            // 6. CARE - Action Log (New Phase 23)
            if (activeChannelId === 'care') {
                return (
                    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#FDFBF7' }}>
                        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {targetCommunity.careActions
                                ?.filter(action => {
                                    const title = action.title || '';
                                    // Rule: Only keep "關懷據點" (Care Centers) and "食物銀行" (Food Banks)
                                    // Explicitly exclude "協會" (Association) unless it's part of a Care Center name (which usually starts with "社區照顧關懷據點")
                                    // But user said "no association", so typically we want the service, not the org.
                                    // However, the data typically looks like "社區照顧關懷據點：XX社區發展協會". 
                                    // So we simply check if it contains Key Words.
                                    return title.includes('關懷據點') || title.includes('食物銀行');
                                })
                                .map(action => (
                                    <CommunityItemCard
                                        key={action.id}
                                        type="care_action"
                                        data={action}
                                        isEditMode={isEditMode}
                                        onClick={() => setSelectedItem({ type: 'care_action', id: action.id })}
                                        onDelete={() => handleDeleteItem('care_action', action.id)}
                                    />
                                ))}
                        </div>
                    </div>
                );
            }

            // DEFAULT -> Feed
            return (
                <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30">
                    <div className="max-w-5xl mx-auto w-full p-6">
                        <PostFeed
                            villageId={targetCommunity.id}
                            villageName={targetCommunity.name}
                            channelId={activeChannelId}
                            isExternalExpanded={isComposerExpanded}
                            onExpandedChange={setIsComposerExpanded}
                        />
                    </div>
                </div>
            )
        };

        return (
            <div className="flex h-full">
                {/* Sidebar - HIDDEN IN PREVIEW MODE */}
                {mode !== 'preview' && (
                    <div className="w-80 flex flex-col shrink-0" style={{ backgroundColor: '#FDFBF7', borderRight: '1px solid rgba(141,170,145,0.2)' }}>
                        <div className="p-6 backdrop-blur" style={{ borderBottom: '1px solid rgba(141,170,145,0.2)', backgroundColor: 'rgba(253,251,247,0.95)' }}>
                            <h3 className="font-black truncate font-serif-tc text-3xl" style={{ color: '#4A4A4A' }} title={community.name}>
                                {community.district} {community.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={toggleFavorite}
                                    className="text-[10px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 font-sans-tc"
                                    style={isFavorite(community.id)
                                        ? { backgroundColor: 'rgba(200,138,117,0.15)', color: '#C88A75' }
                                        : { backgroundColor: 'rgba(141,170,145,0.1)', color: '#8B8B8B' }
                                    }
                                >
                                    {isFavorite(community.id) ? <Star className="w-3 h-3 fill-current" /> : <StarOff className="w-3 h-3" />}
                                    {isFavorite(community.id) ? '已收藏' : '收藏社區'}
                                </button>
                            </div>
                        </div>
                        {/* Channels */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest mb-3 px-2 font-sans-tc flex justify-between items-center" style={{ color: '#8B8B8B' }}>
                                討論頻道
                            </div>
                            {channelList.map(channel => (
                                <div key={channel.id} className="group/channel relative">
                                    <button
                                        onClick={() => setActiveChannelId(channel.id)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm group font-sans-tc relative"
                                        style={activeChannelId === channel.id
                                            ? { backgroundColor: '#8DAA91', color: 'white', boxShadow: '0 4px 12px rgba(141,170,145,0.25)' }
                                            : { color: '#4A4A4A' }
                                        }
                                    >
                                        <span style={{ color: activeChannelId === channel.id ? 'white' : '#8DAA91' }}>{channel.icon}</span>
                                        <div className="flex-1 text-left truncate">
                                            {isEditMode ? (
                                                <input
                                                    value={channel.name}
                                                    onChange={(e) => handleRenameChannel(channel.id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-transparent outline-none w-full border-b border-dashed border-slate-300 focus:border-emerald-500"
                                                />
                                            ) : channel.name}
                                        </div>
                                    </button>
                                    {isEditMode && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/channel:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel.id); }}
                                                className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {renderFooter()}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur sticky top-0 z-30">
                        {/* Header Controls */}
                        <div className="flex items-center gap-4">
                            {/* In PREVIEW mode, maybe hide back button or make it close? Actually close is on right. So hide 'Back' if simplified. */}
                            {mode !== 'preview' && activeChannelId !== 'general' && (
                                <button onClick={() => setActiveChannelId('general')} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors -ml-2"><ArrowLeft className="w-5 h-5" /></button>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">{activeChannelObj?.icon || <Hash className="w-5 h-5" />}</span>
                                <span className="font-bold text-slate-800">{activeChannelName}</span>
                            </div>

                            {/* Action Buttons */}
                            {mode === 'community' && isLoggedIn && (
                                <div className="flex items-center gap-2">
                                    {/* Edit Toggle - For Everyone */}
                                    {activeChannelId !== 'general' && (
                                        <button
                                            onClick={() => isEditMode ? handleSave() : setIsEditMode(true)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-sm
                                                ${isEditMode ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-400'}`}
                                        >
                                            {isEditMode ? <><Save className="w-4 h-4" /> 儲存變更</> : <><Edit3 className="w-4 h-4" /> 編輯內容</>}
                                        </button>
                                    )}

                                    {/* Separator if Edit Mode and something follows */}
                                    {isEditMode && <div className="w-px h-4 bg-slate-200 mx-1" />}

                                    {/* Manual Add Buttons */}
                                    {(activeChannelId === 'general' || activeChannelId === 'announce') && (
                                        <button
                                            onClick={() => setIsComposerExpanded(!isComposerExpanded)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border
                                                    ${isComposerExpanded
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200'}`}
                                        >
                                            {isComposerExpanded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                            {isComposerExpanded ? '取消' : '建立主題'}
                                        </button>
                                    )}

                                    {activeChannelId === 'events' && isEditMode && <button onClick={() => handleAddItem('在地活動')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> 發布活動</button>}
                                    {activeChannelId === 'travel' && isEditMode && <button onClick={() => handleAddItem('輕旅行')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> 推薦景點</button>}
                                    {activeChannelId === 'projects' && isEditMode && <button onClick={() => handleAddItem('地方創生')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> 提案回報</button>}
                                    {activeChannelId === 'culture' && isEditMode && <button onClick={() => handleAddItem('文化資產')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 transition flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> 提供史料</button>}
                                    {activeChannelId === 'care' && isEditMode && <button onClick={() => handleAddItem('永續共好')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border-2 border-rose-500 text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 shadow-sm"><Plus className="w-3.5 h-3.5" /> 回報行動</button>}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X className="w-5 h-5" /></button>
                    </div>
                    {renderChannelContent()}
                </div>
            </div>

        );
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto transition-all duration-500" onClick={onClose} />
            <div className="w-[80%] h-[96%] bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto relative animate-in fade-in zoom-in duration-500 border border-white/20" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <QuickCreateModal
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            setIsCreateModalOpen(false);
                            setAiInitialData(null);
                        }}
                        onCreate={handleCreateItem}
                        channelType={createModalChannel}
                        initialData={aiInitialData}
                        onOpenSmartImport={() => setIsSmartImportOpen(true)}
                        community={localCommunity || community}
                    />
                    <SmartImportModal
                        isOpen={isSmartImportOpen}
                        onClose={() => setIsSmartImportOpen(false)}
                        onConfirmed={handleSmartImportConfirm}
                        targetChannel={createModalChannel}
                    />
                </div>
            </div>
        </div>
    );
};

export default CommunityPopOut;
