import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { createPost } from '../services/interactionService';
import { User, PlusCircle, X, ImageIcon, Video, Send } from 'lucide-react';

interface SocialComposerProps {
    filterTag?: string;
    onPostCreated?: () => void;
}

const AVAILABLE_TAGS = ['閒聊', '問題', '情報', '二手', '緊急', '好康'];

const SocialComposer: React.FC<SocialComposerProps> = ({ filterTag, onPostCreated }) => {
    const { user, isLoggedIn, setLoginOverlay } = useUser();

    // Composer State
    const [newPostContent, setNewPostContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [postImages, setPostImages] = useState<string[]>([]);
    const [postVideo, setPostVideo] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');

    // Effect to auto-select tag if filterTag is provided and valid for new posts
    useEffect(() => {
        if (filterTag && filterTag !== 'all' && isExpanded) {
            // Check if it's a standard tag or a known category ID that maps to a display name
            // For now, we just use the filterTag value itself if it's not 'all'
            if (!selectedTags.includes(filterTag)) {
                setSelectedTags(prev => [...prev, filterTag]);
            }
        }
    }, [filterTag, isExpanded]);

    const handleCreatePost = async () => {
        if (!isLoggedIn) {
            setLoginOverlay(true);
            return;
        }
        if (!newPostContent.trim()) return;
        setIsSubmitting(true);
        try {
            // Default to 'Global' village for the shared board context
            const targetVillageId = 'Global';

            // Channel ID logic: use filterTag if it's a specific category, else 'public_discussion'
            const targetChannelId = (filterTag && filterTag !== 'all') ? filterTag : 'public_discussion';

            await createPost(
                targetVillageId,
                targetChannelId,
                newPostContent,
                user?.name || '神秘居民',
                user?.role || 'guest',
                postImages.length > 0 ? postImages : undefined,
                postVideo || undefined,
                selectedTags,
                undefined,
                user?.avatar
            );

            setNewPostContent('');
            setPostImages([]);
            setPostVideo(null);
            setSelectedTags([]);
            setCustomTagInput('');
            setIsExpanded(false);

            if (onPostCreated) {
                onPostCreated();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* Facebook-like Expandable Composer */}
            {isExpanded ? (
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 transition-all duration-300 overflow-hidden ring-4 ring-emerald-500/5 animate-in fade-in slide-in-from-top-4">
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-emerald-500" />
                                建立新主題 {filterTag && filterTag !== 'all' ? `(${filterTag})` : ''}
                            </h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold flex-shrink-0 border border-slate-200 shadow-inner overflow-hidden">
                                {isLoggedIn && user?.avatar && user.avatar !== '//' ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                                ) : (
                                    <span className="text-sm font-black text-slate-300">//</span>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <textarea
                                    autoFocus
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder={`有什麼想跟大家分享的嗎？...`}
                                    className="w-full bg-transparent border-0 rounded-none p-0 focus:ring-0 resize-none h-32 text-lg text-slate-800 placeholder:text-slate-400"
                                />
                                {postImages.length > 0 && (
                                    <div className={`grid gap-2 ${postImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                        {postImages.map((img, idx) => (
                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video">
                                                <img src={img} alt="Post preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-slate-900/60 text-white p-1 rounded-full hover:bg-slate-900 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {postVideo && (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black flex items-center justify-center">
                                        <video src={postVideo} className="max-w-full max-h-full" />
                                        <button
                                            onClick={() => setPostVideo(null)}
                                            className="absolute top-1 right-1 bg-slate-900/60 text-white p-1 rounded-full hover:bg-slate-900 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Topic Selector */}
                        <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
                            {AVAILABLE_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        if (selectedTags.includes(tag)) {
                                            setSelectedTags(selectedTags.filter(t => t !== tag));
                                        } else {
                                            setSelectedTags([...selectedTags, tag]);
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap
                                        ${selectedTags.includes(tag)
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    #{tag}
                                </button>
                            ))}

                            {/* Selected Custom Tags */}
                            {selectedTags.filter(t => !AVAILABLE_TAGS.includes(t)).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                    className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm whitespace-nowrap flex items-center gap-1 group"
                                >
                                    #{tag}
                                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </button>
                            ))}

                            {/* Custom Tag Input */}
                            <div className="relative flex items-center">
                                <span className="absolute left-2 text-slate-400 text-xs">#</span>
                                <input
                                    type="text"
                                    value={customTagInput}
                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = customTagInput.trim();
                                            if (val && !selectedTags.includes(val)) {
                                                setSelectedTags([...selectedTags, val]);
                                                setCustomTagInput('');
                                            }
                                        }
                                    }}
                                    placeholder="自訂標籤"
                                    className="pl-5 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-24 transition-all focus:w-32"
                                />
                                {customTagInput && (
                                    <button
                                        onClick={() => {
                                            const val = customTagInput.trim();
                                            if (val && !selectedTags.includes(val)) {
                                                setSelectedTags([...selectedTags, val]);
                                                setCustomTagInput('');
                                            }
                                        }}
                                        className="ml-1 text-emerald-600 hover:bg-emerald-50 p-1 rounded-full"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-2 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                            <div className="flex gap-2 text-slate-400">
                                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border hover:bg-slate-50 border-slate-100 ${postImages.length >= 4 || postVideo ? 'opacity-50 pointer-events-none' : 'text-slate-600'}`}>
                                    <ImageIcon className={`w-5 h-5 ${postImages.length > 0 ? 'text-emerald-500' : 'text-green-500'}`} />
                                    <span className="text-sm font-bold">
                                        相片 ({postImages.length}/4)
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            const remainingSlots = 4 - postImages.length;
                                            files.slice(0, remainingSlots).forEach(file => {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setPostImages(prev => [...prev.slice(0, 3), ev.target?.result as string].slice(0, 4));
                                                };
                                                reader.readAsDataURL(file);
                                            });
                                        }}
                                    />
                                </label>

                                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border hover:bg-slate-50 border-slate-100 ${postImages.length > 0 || postVideo ? 'opacity-50 pointer-events-none' : 'text-slate-600'}`}>
                                    <Video className={`w-5 h-5 ${postVideo ? 'text-emerald-500' : 'text-blue-500'}`} />
                                    <span className="text-sm font-bold">影片</span>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 10 * 1024 * 1024) {
                                                    alert("影片大小不能超過 10MB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    setPostVideo(ev.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || !newPostContent.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20"
                            >
                                <Send className="w-4 h-4" />
                                發佈
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 cursor-pointer p-3 flex items-center gap-4 group transition-all"
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-inner overflow-hidden">
                        {isLoggedIn && user?.avatar && user.avatar !== '//' ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                        ) : (
                            <span className="text-sm font-black text-slate-300 group-hover:text-emerald-300">//</span>
                        )}
                    </div>
                    <div className="flex-1 bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-emerald-200 rounded-full px-5 py-2.5 text-slate-400 group-hover:text-slate-600 font-medium transition-colors">
                        有什麼想跟大家分享的嗎？...
                    </div>
                    <div className="pr-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                            <ImageIcon className="w-5 h-5 text-slate-300 group-hover:text-green-500 transition-colors" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialComposer;
