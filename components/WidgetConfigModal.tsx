
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface WidgetConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (props: any) => void;
    initialProps: any;
    widgetType: string;
}

const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({ isOpen, onClose, onSave, initialProps, widgetType }) => {
    const [props, setProps] = useState<any>(initialProps || {});

    useEffect(() => {
        setProps(initialProps || {});
    }, [initialProps, isOpen]);

    if (!isOpen) return null;

    const handleChange = (key: string, value: string) => {
        setProps((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">設定區塊: {widgetType}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Common Prop: Location */}
                    {['weather', 'garbage', 'transport'].includes(widgetType) && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">地區 (Location)</label>
                            <input
                                type="text"
                                value={props.location || ''}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="例如: 新竹市東區"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">輸入行政區以獲取正確資訊。</p>
                        </div>
                    )}

                    {/* Example: Custom Title for Feeds */}
                    {widgetType === 'feeds' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">標題</label>
                            <input
                                type="text"
                                value={props.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                        取消
                    </button>
                    <button
                        onClick={() => onSave(props)}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        <Save size={16} /> 儲存設定
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WidgetConfigModal;
