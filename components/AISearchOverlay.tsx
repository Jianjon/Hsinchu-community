import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, X, MessageSquare, MapPin, ExternalLink, Building2 } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { searchCommunity, SearchResultItem } from '../services/searchService';

interface AISearchOverlayProps {
    onClose: () => void;
    currentLocation: string;
}

const AISearchOverlay: React.FC<AISearchOverlayProps> = ({ onClose, currentLocation }) => {
    const { user } = useUser(); // Get User Context
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);

        try {
            // Prepare User Info for AI
            const userInfo = {
                location: currentLocation,
                role: user?.role || 'guest',
                identity: user?.identities?.map(i => i.title).join(', ') || ''
            };

            const response = await searchCommunity(query, currentLocation, userInfo);
            setResult(response);
        } catch (e) {
            console.error(e);
            setResult({
                summary: '搜尋發生錯誤，請稍後再試。',
                relatedQuestions: [],
                results: []
            });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="absolute top-[88px] right-[40px] w-[400px] h-[calc(100vh-200px)] bg-white/95 backdrop-blur-xl border border-emerald-100 shadow-2xl rounded-[2rem] z-50 overflow-hidden flex flex-col font-sans-tc animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-white p-6 border-b border-emerald-100/50 flex justify-between items-start shrink-0">
                <div>
                    <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        社區智能助理
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        專屬於 {currentLocation} 的 AI 助理 (僅限社區事務)
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0">

                {/* Search Input */}
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-indigo-200 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
                    <div className="relative bg-white border border-slate-200 rounded-2xl flex items-center p-1 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                        <Search className="w-5 h-5 text-slate-400 ml-3" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="查垃圾車、活動、或分析議題..."
                            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-slate-700 placeholder:text-slate-400 text-sm font-medium"
                            autoFocus
                        />
                        <button
                            onClick={handleSearch}
                            disabled={!query.trim() || isSearching}
                            className={`p-2 rounded-xl transition-all ${query.trim() ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600' : 'bg-slate-100 text-slate-300'}`}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3 text-emerald-600">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                            <span className="text-xs font-bold tracking-widest uppercase animate-pulse">AI 分析中...</span>
                        </div>
                    ) : result ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* AI Summary */}
                            {/* AI Summary */}
                            <div className="bg-gradient-to-br from-emerald-50/50 to-indigo-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" /> 分析摘要
                                    </h4>
                                    {result.results?.length > 0 && (
                                        <div className="flex gap-1.5 items-center">
                                            {Array.from(new Set(result.results.map((r: any) => r.source))).map((source: any) => (
                                                <span key={source} className="px-2 py-0.5 bg-emerald-500/10 text-[10px] font-black text-emerald-600 rounded-full border border-emerald-200">
                                                    {source === 'wiki' ? '里百科' : source === 'report' ? '數據/分析' : source === 'gov' ? '政府資源' : '互助討論'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                                    {result.summary.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                                        part.match(/^https?:\/\//) ? (
                                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline hover:text-emerald-800 break-all">
                                                {part}
                                            </a>
                                        ) : (
                                            part
                                        )
                                    )}
                                </p>

                                {/* A2UI: Extended Questions */}
                                {result.relatedQuestions && result.relatedQuestions.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-emerald-100/50">
                                        <p className="text-[10px] text-slate-400 font-bold mb-2">您可能也想知道：</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.relatedQuestions.map((q: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => { setQuery(q); handleSearch(); }}
                                                    className="px-3 py-1.5 bg-white border border-emerald-100/50 rounded-lg text-xs font-bold text-emerald-600 shadow-sm hover:shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1"
                                                >
                                                    <MessageSquare className="w-3 h-3" />
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Wiki & Gov Results */}
                            {result.results.some((r: SearchResultItem) => r.source === 'wiki' || r.source === 'gov' || r.source === 'report') && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">官方資訊 & 百科</h4>
                                    <div className="space-y-2">
                                        {result.results.filter((r: SearchResultItem) => r.source === 'wiki' || r.source === 'gov' || r.source === 'report').map((item: SearchResultItem, i: number) => (
                                            <a
                                                key={i}
                                                href={item.url}
                                                target={item.url ? "_blank" : undefined}
                                                rel="noopener noreferrer"
                                                className={`block bg-white p-3 rounded-xl border transition-colors shadow-sm group cursor-pointer ${item.source === 'gov' || item.source === 'report' ? 'border-blue-100 hover:border-blue-300' : 'border-slate-100 hover:border-emerald-200'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.source === 'gov' || item.source === 'report' ? <Building2 className="w-3 h-3 text-blue-500" /> : <MapPin className="w-3 h-3 text-indigo-500" />}
                                                    <span className={`font-bold text-sm transition-colors ${item.source === 'gov' ? 'text-blue-700' : 'text-slate-700 group-hover:text-emerald-600'}`}>
                                                        {item.title}
                                                    </span>
                                                    {item.url && <ExternalLink className="w-3 h-3 text-slate-300" />}
                                                </div>
                                                <p className="text-xs text-slate-500 pl-5 line-clamp-2">{item.snippet}</p>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Post Results */}
                            {result.results.some((r: SearchResultItem) => r.source === 'post') && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 mt-4">相關討論</h4>
                                    <div className="space-y-2">
                                        {result.results.filter((r: SearchResultItem) => r.source === 'post').map((item: SearchResultItem, i: number) => (
                                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm cursor-pointer group">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-3 h-3 text-orange-400" />
                                                    <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-600 transition-colors line-clamp-1">{item.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-5 text-[10px] text-slate-400">
                                                    <span>{item.author}</span>
                                                    <span>•</span>
                                                    <span>{item.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-400">有什麼想知道的嗎？</p>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    試試「哪裡有資源回收？」或「最近的活動？」<br />
                                    <span className="text-[10px] opacity-70">※ 本助理僅回答與社區、村里相關之民生問題</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Intent Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 overflow-x-auto">
                {['大型垃圾', '老人共餐', '停車資訊', '申訴'].map(tag => (
                    <button
                        key={tag}
                        onClick={() => { setQuery(tag); handleSearch(); }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 whitespace-nowrap hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AISearchOverlay;
