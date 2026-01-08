import React, { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Settings, Type, X, Monitor, BookOpen } from 'lucide-react';

const AccessibilityWidget: React.FC = () => {
    const { fontSize, fontFamily, setFontSize, setFontFamily } = useAccessibility();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-24 right-6 z-[9999] font-sans">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                    aria-label="開啟輔助設定"
                >
                    <Settings className="w-6 h-6" />
                </button>
            )}

            {/* Settings Panel */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-emerald-600" />
                            瀏覽設定
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Font Size Control */}
                        <div>
                            <span className="text-sm font-bold text-slate-500 mb-3 block">字體大小</span>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setFontSize('normal')}
                                    className={`flex-1 py-2 px-2 rounded-md text-sm font-bold transition-all ${fontSize === 'normal'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    預設
                                </button>
                                <button
                                    onClick={() => setFontSize('large')}
                                    className={`flex-1 py-2 px-2 rounded-md text-base font-bold transition-all ${fontSize === 'large'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    大
                                </button>
                                <button
                                    onClick={() => setFontSize('huge')}
                                    className={`flex-1 py-2 px-2 rounded-md text-lg font-bold transition-all ${fontSize === 'huge'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    特大
                                </button>
                            </div>
                        </div>

                        {/* Font Family Control */}
                        <div>
                            <span className="text-sm font-bold text-slate-500 mb-3 block">閱讀模式</span>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setFontFamily('system')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${fontFamily === 'system'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-100 hover:border-emerald-200 bg-white'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${fontFamily === 'system' ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                                        <Monitor className={`w-5 h-5 ${fontFamily === 'system' ? 'text-emerald-700' : 'text-slate-500'}`} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${fontFamily === 'system' ? 'text-emerald-900' : 'text-slate-700'}`}>標準模式 (Modern)</div>
                                        <div className="text-xs text-slate-500">適合年輕族群，現代簡潔</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setFontFamily('serif')}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left font-serif ${fontFamily === 'serif'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-100 hover:border-emerald-200 bg-white'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${fontFamily === 'serif' ? 'bg-emerald-200' : 'bg-slate-100'}`}>
                                        <BookOpen className={`w-5 h-5 ${fontFamily === 'serif' ? 'text-emerald-700' : 'text-slate-500'}`} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${fontFamily === 'serif' ? 'text-emerald-900' : 'text-slate-700'}`}>閱讀模式 (Serif)</div>
                                        <div className="text-xs text-slate-500">適合長輩閱讀，類書本字體</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessibilityWidget;
