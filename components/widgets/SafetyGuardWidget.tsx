
import React from 'react';
import { Shield, AlertTriangle, PhoneCall, CheckCircle } from 'lucide-react';
import { SafetyInfo } from '../../data/mock_public';

interface SafetyGuardWidgetProps {
    safety?: SafetyInfo;
}

const SafetyGuardWidget: React.FC<SafetyGuardWidgetProps> = ({ safety }) => {
    // If no data, show a default safe state
    const hasAlerts = safety?.alerts && safety.alerts.length > 0;
    const patrolStatus = safety?.patrolStatus;
    const contacts = safety?.contacts || [];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-[#FFFFFF] p-6 relative overflow-hidden group">
            {/* Background Decor - Subtle Circle */}
            <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                            <Shield className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#374151]">平安守護</h3>
                    </div>
                </div>

                <div className="flex-1 space-y-3 relative z-10">
                    {/* 1. Alerts Section */}
                    {hasAlerts ? (
                        safety!.alerts.map(alert => (
                            <div key={alert.id} className={`p-3 rounded-xl flex items-start gap-3 border transition-all ${alert.level === 'high' ? 'bg-red-50 border-red-100' :
                                    alert.level === 'medium' ? 'bg-orange-50 border-orange-100' :
                                        'bg-blue-50 border-blue-100'
                                }`}>
                                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.level === 'high' ? 'text-red-500 animate-pulse' :
                                        alert.level === 'medium' ? 'text-orange-500' :
                                            'text-blue-500'
                                    }`} />
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${alert.level === 'high' ? 'text-red-600' :
                                            alert.level === 'medium' ? 'text-orange-600' :
                                                'text-blue-600'
                                        }`}>
                                        {alert.title}
                                    </div>
                                    <div className="text-xs text-slate-700 font-bold leading-relaxed">{alert.description}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">目前無災害警示</div>
                                <div className="text-xs text-[#6B7280] font-medium">社區狀況良好，請安心。</div>
                            </div>
                        </div>
                    )}

                    {/* 2. Patrol Status */}
                    {patrolStatus && (
                        <div className="grid grid-cols-1 gap-2 pt-1">
                            <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl text-xs border border-emerald-100/50 shadow-sm">
                                <span className="text-slate-500 font-medium">巡守隊動態</span>
                                <span className={`font-bold tracking-tighter uppercase text-[10px] px-2 py-0.5 rounded-full ${patrolStatus.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                        patrolStatus.status === 'reinforced' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {patrolStatus.description}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Contacts */}
                <div className="mt-auto pt-4 border-t border-emerald-100/50 flex gap-2">
                    {contacts.map((contact, idx) => (
                        <button key={idx} className="flex-1 py-2.5 bg-white hover:bg-emerald-50 text-slate-700 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border border-emerald-100/30 shadow-sm hover:shadow-md hover:border-emerald-200">
                            <div className="flex items-center gap-1.5 opacity-60">
                                <PhoneCall className="w-3 h-3 text-emerald-600" />
                                <span className="text-[#6B7280] uppercase tracking-tighter">{contact.title}</span>
                            </div>
                            <span className="tracking-wider text-slate-800">{contact.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SafetyGuardWidget;
