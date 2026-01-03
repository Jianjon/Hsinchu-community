
import React from 'react';
import { Repeat, Package } from 'lucide-react';

const GoodsExchangeWidget: React.FC = () => {
    const items = [
        { name: "二手推車 (9成新)", type: "贈送", user: "王小姐" },
        { name: "露營用帳篷", type: "借用", user: "張先生" },
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
            <div className="flex items-center gap-2 mb-4">
                <Repeat className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white tracking-wide">好物流轉</h3>
            </div>

            <div className="flex-1 space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-4 hover:border-emerald-500/20 transition-all">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Package className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-white/90">{item.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-widest leading-none">
                                    {item.type}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/30">刊登者：{item.user}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-2 bg-emerald-500/5 rounded-lg text-center">
                <span className="text-[10px] text-emerald-400/60 font-bold">目前共有 8 件物品等待流轉</span>
            </div>
        </div>
    );
};

export default GoodsExchangeWidget;
