import React, { useState, useEffect } from 'react';
import { X, User, Camera, Trophy, Calendar, MapPin, LogOut, CheckCircle, Edit3, Save, Plus, Trash2, Home, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { UserIdentity } from '../types';
import ImageUploader from './ImageUploader';

interface ProfileOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileOverlay: React.FC<ProfileOverlayProps> = ({ isOpen, onClose }) => {
    const { user, logout, updateProfile } = useUser();
    const [isEditing, setIsEditing] = useState(false);

    // Form States
    const [editedName, setEditedName] = useState(user?.name || '');
    const [editedBio, setEditedBio] = useState(user?.bio || '');
    const [editedTownship, setEditedTownship] = useState(user?.township || '尖石鄉');
    const [editedVillage, setEditedVillage] = useState(user?.village || '秀巒村');
    const [editedAvatar, setEditedAvatar] = useState(user?.avatar || '');
    const [editedCoverImage, setEditedCoverImage] = useState(user?.coverImage || '');
    const [editedCoverPosition, setEditedCoverPosition] = useState(user?.coverImagePosition || { x: 50, y: 50 });
    const [editedCoverScale, setEditedCoverScale] = useState(user?.coverImageScale || 1);

    // Structured Identities
    const [editedIdentities, setEditedIdentities] = useState<UserIdentity[]>(user?.identities || []);

    const [newOrgInput, setNewOrgInput] = useState('');
    const [newTitleInput, setNewTitleInput] = useState('');
    const [showNewRoleInput, setShowNewRoleInput] = useState(false);

    // Personalization 2.0 States
    const [editedInterests, setEditedInterests] = useState<string[]>(user?.interests || []);
    const AVAILABLE_INTERESTS = ['生態環保', '文化資產', '在地美食', '親子活動', '長者照護', '運動健身', '地方創生', '志工參與'];

    useEffect(() => {
        if (user) {
            setEditedName(user.name);
            setEditedBio(user.bio || '');
            setEditedTownship(user.township || '尖石鄉');
            setEditedVillage(user.village || '秀巒村');
            setEditedAvatar(user.avatar || '');
            setEditedCoverImage(user.coverImage || '');
            setEditedCoverPosition(user.coverImagePosition || { x: 50, y: 50 });
            setEditedCoverScale(user.coverImageScale || 1);
            setEditedIdentities(user.identities && user.identities.length > 0
                ? user.identities
                : [{ organization: '新竹縣', title: '居民' }]);
            setEditedInterests(user.interests || []);
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleSave = () => {
        updateProfile({
            name: editedName,
            bio: editedBio,
            township: editedTownship,
            village: editedVillage,
            identities: editedIdentities,
            avatar: editedAvatar,
            coverImage: editedCoverImage,
            coverImagePosition: editedCoverPosition,
            coverImageScale: editedCoverScale,
            interests: editedInterests
        });
        setIsEditing(false);
    };

    const toggleInterest = (interest: string) => {
        setEditedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const addIdentity = () => {
        if (newOrgInput.trim() && newTitleInput.trim()) {
            setEditedIdentities([...editedIdentities, {
                organization: newOrgInput.trim(),
                title: newTitleInput.trim()
            }]);
            setNewOrgInput('');
            setNewTitleInput('');
            setShowNewRoleInput(false);
        }
    };

    const removeIdentity = (index: number) => {
        if (editedIdentities.length > 1) {
            setEditedIdentities(editedIdentities.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 backdrop-blur-md animate-in fade-in duration-300"
                style={{ backgroundColor: 'rgba(74, 74, 74, 0.6)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl rounded-[40px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300" style={{ backgroundColor: '#FDFBF7' }}>
                {/* Header Background - Customizable Cover */}
                <div className="h-40 md:h-56 relative group/cover overflow-hidden bg-slate-100 shrink-0">
                    {isEditing ? (
                        <ImageUploader
                            value={editedCoverImage}
                            onChange={(img) => setEditedCoverImage(img || '')}
                            className="w-full h-full"
                            height="h-full"
                            allowAdjustment
                            imagePosition={editedCoverPosition}
                            imageScale={editedCoverScale}
                            onAdjustmentChange={(pos, scale) => {
                                setEditedCoverPosition(pos);
                                setEditedCoverScale(scale);
                            }}
                        />
                    ) : user.coverImage ? (
                        <img
                            src={user.coverImage}
                            className="w-full h-full object-cover"
                            style={{
                                objectPosition: `${user.coverImagePosition?.x ?? 50}% ${user.coverImagePosition?.y ?? 50}%`,
                                transform: `scale(${user.coverImageScale ?? 1})`
                            }}
                            alt="Profile Cover"
                        />
                    ) : (
                        <div className="w-full h-full relative" style={{ background: 'linear-gradient(135deg, #8DAA91 0%, #6B8E6B 100%)' }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }} />
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {!isEditing && (
                        <div className="absolute inset-0 bg-transparent group-hover/cover:bg-black/5 transition-colors pointer-events-none" />
                    )}
                </div>

                {/* Profile Content */}
                <div className="px-10 pb-10 -mt-16 relative">
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-[40px] p-1.5 shadow-2xl relative" style={{ backgroundColor: '#FDFBF7' }}>
                            <div className="w-full h-full rounded-[34px] flex items-center justify-center overflow-hidden relative group/avatar" style={{ backgroundColor: 'rgba(141,170,145,0.1)', border: '3px solid rgba(141,170,145,0.2)' }}>
                                {isEditing ? (
                                    <div className="w-full h-full">
                                        <ImageUploader
                                            value={editedAvatar}
                                            onChange={(img) => setEditedAvatar(img || '')}
                                            className="w-full h-full"
                                            height="h-full"
                                            placeholder="頭像"
                                        />
                                    </div>
                                ) : user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full text-white flex items-center justify-center text-4xl font-black font-serif-tc" style={{ backgroundColor: '#8DAA91' }}>
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute bottom-1 right-1 p-3 rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 z-20"
                                style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(141,170,145,0.2)', color: '#8DAA91' }}
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex justify-between items-start mb-8">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="text-3xl font-black font-serif-tc focus:outline-none w-full px-4 py-2 rounded-t-2xl transition-all"
                                            style={{ color: '#4A4A4A', borderBottom: '4px solid #8DAA91', backgroundColor: 'rgba(141,170,145,0.1)' }}
                                            placeholder="您的暱稱"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <Edit3 className="w-5 h-5 opacity-50" style={{ color: '#8DAA91' }} />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest pl-1 font-sans-tc" style={{ color: '#8B8B8B' }}>鄉鎮市</label>
                                            <input
                                                type="text"
                                                value={editedTownship}
                                                onChange={(e) => setEditedTownship(e.target.value)}
                                                className="w-full rounded-xl px-4 py-2 text-sm font-bold font-sans-tc outline-none transition-all"
                                                style={{ backgroundColor: 'rgba(141,170,145,0.05)', border: '1px solid rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest pl-1 font-sans-tc" style={{ color: '#8B8B8B' }}>村里</label>
                                            <input
                                                type="text"
                                                value={editedVillage}
                                                onChange={(e) => setEditedVillage(e.target.value)}
                                                className="w-full rounded-xl px-4 py-2 text-sm font-bold font-sans-tc outline-none transition-all"
                                                style={{ backgroundColor: 'rgba(141,170,145,0.05)', border: '1px solid rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black leading-tight font-serif-tc" style={{ color: '#4A4A4A' }}>{user.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans-tc"
                                            style={{ backgroundColor: 'rgba(141,170,145,0.1)', color: '#4A4A4A', border: '1px solid rgba(141,170,145,0.2)' }}
                                        >
                                            <MapPin className="w-3.5 h-3.5" style={{ color: '#8DAA91' }} />
                                            {user.township || '新竹縣'} {user.village || '尖石鄉'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold font-sans-tc" style={{ color: '#8B8B8B' }}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            加入於 {user.joinedDate}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {user.role === 'admin' && (
                                <span
                                    className="px-3 py-1.5 rounded-full text-xs font-black font-sans-tc"
                                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                                >
                                    管理員
                                </span>
                            )}
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className="px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 border-2 shrink-0 font-sans-tc"
                                style={isEditing
                                    ? { backgroundColor: '#8DAA91', borderColor: '#8DAA91', color: 'white', boxShadow: '0 8px 24px rgba(141,170,145,0.3)' }
                                    : { backgroundColor: '#FDFBF7', borderColor: 'rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                            >
                                {isEditing ? <><Save className="w-4 h-4" /> 儲存修改</> : <><Edit3 className="w-4 h-4" /> 編輯資料</>}
                            </button>
                        </div>
                    </div>

                    {/* Identities Section - Organization + Title */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest font-sans-tc" style={{ color: '#8B8B8B' }}>在地身份 / 職稱</label>
                            {isEditing && !showNewRoleInput && (
                                <button
                                    onClick={() => setShowNewRoleInput(true)}
                                    className="text-[10px] font-black flex items-center gap-1 transition-all font-sans-tc"
                                    style={{ color: '#8DAA91' }}
                                >
                                    <Plus className="w-3 h-3" /> 新增身份
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {editedIdentities.map((identity, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl flex items-center justify-between transition-all group/card"
                                    style={idx === 0
                                        ? { backgroundColor: 'rgba(141,170,145,0.1)', border: '1px solid rgba(141,170,145,0.3)' }
                                        : { backgroundColor: '#FDFBF7', border: '1px solid rgba(141,170,145,0.15)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={idx === 0
                                                ? { backgroundColor: '#8DAA91', color: 'white' }
                                                : { backgroundColor: 'rgba(141,170,145,0.1)', color: '#8B8B8B' }}
                                        >
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold font-sans-tc" style={{ color: '#4A4A4A' }}>{identity.organization}</div>
                                            <div className="text-[10px] font-bold font-sans-tc" style={{ color: '#8B8B8B' }}>{identity.title}</div>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <button
                                            onClick={() => removeIdentity(idx)}
                                            className="p-1 transition-colors"
                                            style={{ color: '#C88A75' }}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {isEditing && showNewRoleInput && (
                                <div
                                    className="rounded-xl p-3 animate-in fade-in slide-in-from-top-2"
                                    style={{ backgroundColor: 'rgba(141,170,145,0.05)', border: '2px dashed rgba(141,170,145,0.3)' }}
                                >
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newOrgInput}
                                            onChange={(e) => setNewOrgInput(e.target.value)}
                                            placeholder="組織/單位 (例：發展協會)"
                                            className="rounded-lg px-3 py-2 text-xs font-bold outline-none font-sans-tc"
                                            style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                                        />
                                        <input
                                            type="text"
                                            value={newTitleInput}
                                            onChange={(e) => setNewTitleInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addIdentity()}
                                            placeholder="職稱 (例：理事長)"
                                            className="rounded-lg px-3 py-2 text-xs font-bold outline-none font-sans-tc"
                                            style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setShowNewRoleInput(false)}
                                            className="px-3 py-1.5 text-xs font-bold rounded-lg font-sans-tc"
                                            style={{ color: '#8B8B8B' }}
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={addIdentity}
                                            className="px-3 py-1.5 text-xs font-bold text-white rounded-lg font-sans-tc"
                                            style={{ backgroundColor: '#8DAA91', boxShadow: '0 2px 8px rgba(141,170,145,0.3)' }}
                                        >
                                            確認新增
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Personalization 2.0: Interests Section */}
                    <div className="mb-8">
                        <label className="text-[10px] font-black uppercase tracking-widest block mb-3 px-1 font-sans-tc" style={{ color: '#8B8B8B' }}>我的興趣標籤</label>
                        <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                                AVAILABLE_INTERESTS.map(interest => (
                                    <button
                                        key={interest}
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${editedInterests.includes(interest)
                                            ? 'bg-[#8DAA91] text-white border-[#8DAA91] shadow-md'
                                            : 'bg-white text-[#8DAA91] border-slate-200 hover:border-[#8DAA91]'
                                            }`}
                                    >
                                        {interest}
                                    </button>
                                ))
                            ) : (
                                (user.interests || []).length > 0 ? (
                                    user.interests!.map(interest => (
                                        <span
                                            key={interest}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8DAA91]/10 text-[#8DAA91] border border-[#8DAA91]/20"
                                        >
                                            {interest}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-400 italic">尚未設定感興趣的主題</span>
                                )
                            )}
                        </div>
                    </div>

                    {/* Personalization 2.0: Recently Viewed Section */}
                    {!isEditing && (user.recentlyViewed || []).length > 0 && (
                        <div className="mb-8">
                            <label className="text-[10px] font-black uppercase tracking-widest block mb-3 px-1 font-sans-tc" style={{ color: '#8B8B8B' }}>最近瀏覽社區</label>
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                {user.recentlyViewed!.map((item, idx) => (
                                    <Link
                                        key={idx}
                                        to={`/community/${item.id}`}
                                        className="min-w-[120px] p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group/item"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                                            <Home className="w-4 h-4 text-emerald-600 group-hover/item:text-white" />
                                        </div>
                                        <div className="text-xs font-bold text-slate-700 truncate">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(item.time).toLocaleDateString()}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Personalization 2.0: Achievements Section */}
                    {!isEditing && (
                        <div className="mb-8">
                            <label className="text-[10px] font-black uppercase tracking-widest block mb-3 px-1 font-sans-tc" style={{ color: '#8B8B8B' }}>榮譽勳章</label>
                            <div className="flex gap-4">
                                {(user.achievements || []).includes('pioneer') && (
                                    <div className="group relative">
                                        <div className="p-3 bg-amber-100 rounded-2xl border border-amber-200">
                                            <Trophy className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                            社區先行者 (收藏超過 3 個社區)
                                        </div>
                                    </div>
                                )}
                                {(user.achievements || []).includes('explorer') && (
                                    <div className="group relative">
                                        <div className="p-3 bg-blue-100 rounded-2xl border border-blue-200">
                                            <MapPin className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                            村里探索家 (瀏覽超過 5 個村里)
                                        </div>
                                    </div>
                                )}
                                {(user.achievements || []).length === 0 && (
                                    <span className="text-xs text-slate-400 italic">參與社區互動，贏得您的第一面勳章！</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bio Section */}
                    <div
                        className="mb-10 p-6 rounded-[32px] backdrop-blur-sm shadow-inner group"
                        style={{ backgroundColor: 'rgba(141,170,145,0.05)', border: '1px solid rgba(141,170,145,0.1)' }}
                    >
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 font-sans-tc" style={{ color: '#8B8B8B' }}>
                                <Edit3 className="w-3 h-3" /> 個人簡介
                            </label>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                className="w-full rounded-2xl p-4 text-sm font-medium h-32 resize-none outline-none transition-all font-sans-tc"
                                style={{ backgroundColor: '#FDFBF7', border: '2px solid rgba(141,170,145,0.2)', color: '#4A4A4A' }}
                                placeholder="分享一下您對社區的熱愛與想法..."
                            />
                        ) : (
                            <p className="text-sm leading-relaxed font-bold animate-in fade-in duration-500 font-sans-tc" style={{ color: '#4A4A4A' }}>
                                {user.bio || '尚未填寫自我介紹，讓大家認識你吧！'}
                            </p>
                        )}
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-8">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest mb-1 font-sans-tc" style={{ color: '#8B8B8B' }}>社區貢獻</div>
                                <div className="text-xl font-black flex items-center gap-2 font-sans-tc" style={{ color: '#4A4A4A' }}>
                                    <Trophy className="w-5 h-5" style={{ color: '#C88A75' }} />
                                    {user.points}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); onClose(); }}
                            className="flex items-center gap-2 px-6 py-3 font-black rounded-2xl transition-all active:scale-95 group font-sans-tc"
                            style={{ color: '#C88A75' }}
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            登出
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileOverlay;
