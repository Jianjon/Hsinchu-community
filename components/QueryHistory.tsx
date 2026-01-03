
import React, { useState, useEffect } from 'react';
import { VillageRecord, LocationData, AnalysisResult, AppStep } from '../types';
import { getAllVillageRecords, deleteVillageRecord, getRecordCount } from '../services/localDatabase';
import { downloadAllStages } from '../services/fileExport';
import { History, Trash2, MapPin, Clock, ChevronRight, Database, RefreshCw, Download } from 'lucide-react';

interface QueryHistoryProps {
    onLoadRecord: (location: LocationData, result: AnalysisResult, step: AppStep) => void;
    isVisible: boolean;
    onClose: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onLoadRecord, isVisible, onClose }) => {
    const [records, setRecords] = useState<VillageRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [recordCount, setRecordCount] = useState<number>(0);

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const allRecords = await getAllVillageRecords();
            setRecords(allRecords);
            setRecordCount(allRecords.length);
        } catch (error) {
            console.error("Error loading records:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible) {
            loadRecords();
        }
    }, [isVisible]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('確定要刪除這筆記錄嗎？')) {
            try {
                await deleteVillageRecord(id);
                await loadRecords();
            } catch (error) {
                console.error("Error deleting record:", error);
            }
        }
    };

    const handleDownload = (record: VillageRecord, e: React.MouseEvent) => {
        e.stopPropagation();
        downloadAllStages(record.location, record.stage1, record.stage2, record.stage3);
    };

    const handleLoadRecord = (record: VillageRecord) => {
        onLoadRecord(record.location, record.result, record.step);
        onClose();
    };

    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('zh-TW', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getStepLabel = (step: AppStep): string => {
        switch (step) {
            case AppStep.STEP_1_DRAFT:
                return '初稿';
            case AppStep.STEP_2_INTERVIEW:
                return '待訪談';
            case AppStep.STEP_3_FINAL:
                return '已完成';
            default:
                return '未知';
        }
    };

    const getStepColor = (step: AppStep): string => {
        switch (step) {
            case AppStep.STEP_1_DRAFT:
                return 'bg-amber-100 text-amber-700';
            case AppStep.STEP_2_INTERVIEW:
                return 'bg-blue-100 text-blue-700';
            case AppStep.STEP_3_FINAL:
                return 'bg-emerald-100 text-emerald-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5" />
                        <div>
                            <h2 className="font-bold">查詢歷史記錄</h2>
                            <p className="text-xs text-slate-300">本地資料庫 · {recordCount} 筆記錄</p>
                        </div>
                    </div>
                    <button
                        onClick={loadRecords}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="重新整理"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Records List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                            載入中...
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>尚無查詢記錄</p>
                            <p className="text-xs mt-1">完成查詢後會自動儲存</p>
                        </div>
                    ) : (
                        records.map((record) => (
                            <div
                                key={record.id}
                                onClick={() => handleLoadRecord(record)}
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                            <MapPin className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">
                                                {record.location.village}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {record.location.city} {record.location.district}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStepColor(record.step)}`}>
                                            {getStepLabel(record.step)}
                                        </span>
                                        <button
                                            onClick={(e) => handleDownload(record, e)}
                                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="下載檔案 (JSON Bundles)"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(record.id, e)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="刪除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(record.updatedAt)}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                        關閉
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default QueryHistory;
