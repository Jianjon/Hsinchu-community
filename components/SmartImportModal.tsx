import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, Loader2, CheckCircle2, AlertCircle, ArrowRight, Clipboard, Trash2 } from 'lucide-react';
import { parseCommunityContent, ParsedCommunityContent } from '../services/aiContentService';

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmed: (parsed: ParsedCommunityContent) => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onConfirmed }) => {
    const [rawText, setRawText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ParsedCommunityContent | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!rawText.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await parseCommunityContent(rawText);
            if (result) {
                setAnalysisResult(result);
            } else {
                setError('AI 無法正確解析內容，請嘗試提供更多上下文。');
            }
        } catch (e) {
            setError('解析過程中發生錯誤，請稍後再試。');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setRawText('');
        setAnalysisResult(null);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 font-serif-tc">AI 轉介助理</h2>
                            <p className="text-xs text-emerald-700 font-bold">輕鬆轉換 LINE/FB 內容</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!analysisResult ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-500 shrink-0" />
                                <div className="text-sm text-blue-700 leading-relaxed">
                                    <p className="font-bold mb-1">提示：</p>
                                    直接貼上來自 Facebook 社團貼文或 LINE 群組的長訊息，AI 會自動幫您判斷應該發布到哪個頻道。
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    className="w-full h-64 p-5 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none text-slate-700 placeholder:text-slate-300 resize-none font-sans-tc"
                                    placeholder="將內容貼在這裡... (例如：週六下午三點在活動中心有長青講座...)"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                                {rawText && !isAnalyzing && (
                                    <button
                                        onClick={() => setRawText('')}
                                        className="absolute right-4 bottom-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </div>
                            )}

                            <button
                                onClick={handleAnalyze}
                                disabled={!rawText.trim() || isAnalyzing}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>AI 正在分析中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6" />
                                        <span>開始智能解析</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* AI Result Card */}
                            <div className="rounded-2xl border-2 border-emerald-100 overflow-hidden shadow-sm">
                                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span className="font-black text-emerald-800">解析成功</span>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded-lg">
                                        信心指數: {Math.round(analysisResult.confidence * 100)}%
                                    </div>
                                </div>
                                <div className="p-5 space-y-4 bg-white font-sans-tc">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase">
                                            建議頻道
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                        <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black">
                                            {analysisResult.channelType === 'events' ? '在地活動' :
                                                analysisResult.channelType === 'travel' ? '輕旅行' :
                                                    analysisResult.channelType === 'projects' ? '地方創生' :
                                                        analysisResult.channelType === 'culture' ? '文化資產' :
                                                            analysisResult.channelType === 'care' ? '永續共好' :
                                                                analysisResult.channelType === 'facility' ? '社區維基' : '一般討論'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">標題</label>
                                        <div className="text-lg font-bold text-slate-800">{analysisResult.data.title}</div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">內容摘要</label>
                                        <p className="text-sm text-slate-600 leading-relaxed">{analysisResult.data.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        {analysisResult.data.date && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">日期</label>
                                                <div className="text-sm font-bold text-slate-700">{analysisResult.data.date}</div>
                                            </div>
                                        )}
                                        {analysisResult.data.location && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">地點</label>
                                                <div className="text-sm font-bold text-slate-700">{analysisResult.data.location}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI 思考邏輯</label>
                                        <p className="text-xs text-slate-400 italic font-medium">{analysisResult.reasoning}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all hover:bg-slate-200"
                                >
                                    重新貼上
                                </button>
                                <button
                                    onClick={() => onConfirmed(analysisResult)}
                                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    確認並繼續發布 <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartImportModal;
