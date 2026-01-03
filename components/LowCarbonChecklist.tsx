
import React, { useState, useEffect } from 'react';
import { AuditCategory } from '../types';
import { ClipboardList, Mic, Save, FileText, CheckCircle2 } from 'lucide-react';

interface LowCarbonChecklistProps {
  categories: AuditCategory[];
  onSubmit: (transcript: string) => void;
  isProcessing: boolean;
}

const LowCarbonChecklist: React.FC<LowCarbonChecklistProps> = ({ categories, onSubmit, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.name || '');
  const [transcript, setTranscript] = useState<string>('');
  
  // Sync props to local state
  useEffect(() => {
    if (!activeTab && categories.length > 0) {
      setActiveTab(categories[0].name);
    }
  }, [categories]);

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col h-full">
      
      {/* 1. Header & Instructions */}
      <div className="bg-slate-50 p-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            實地訪談提綱 (Checklist)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
            這份清單是根據網路資料不足處所自動生成的。請在訪談時參考這些問題。<br/>
            訪談結束後，請將錄音轉成的文字稿貼在下方，AI 將自動進行整合。
        </p>
      </div>

      {/* 2. Scrollable Checklist Area (Reference Only) */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-[300px] border-b border-slate-200">
         {/* Tabs */}
         <div className="flex overflow-x-auto border-b border-slate-200 bg-white">
            {categories.map((cat) => (
            <button
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2
                ${activeTab === cat.name 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/30' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
                {cat.name}
            </button>
            ))}
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar flex-1">
            {categories.map((cat) => (
            <div key={cat.name} className={activeTab === cat.name ? 'block' : 'hidden'}>
                <div className="space-y-3">
                {cat.items.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center
                                ${item.status === 'resolved' ? 'bg-emerald-100 border-emerald-300 text-emerald-600' : 'bg-white border-slate-300'}`}>
                                {item.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">{item.actionItem}</h3>
                                {item.description && (
                                    <p className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-slate-200">
                                        參考: {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* 3. Transcript Input Area */}
      <div className="p-5 bg-white">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-emerald-600" />
            訪談錄音逐字稿輸入
        </label>
        <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="請在此貼上訪談的逐字稿或筆記..."
            className="w-full h-40 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none mb-3"
        />
        
        <button
            onClick={() => onSubmit(transcript)}
            disabled={isProcessing || !transcript.trim()}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white shadow-md transition-all
              ${isProcessing || !transcript.trim()
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99]'}`}
        >
            {isProcessing ? 'AI 智能整合中...' : '送出逐字稿並生成最終報告'}
            {!isProcessing && <Save className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default LowCarbonChecklist;
