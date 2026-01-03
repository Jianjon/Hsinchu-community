import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
    value?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    onChange: (date: string, endDate?: string) => void;
    isEditMode: boolean;
    className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    endDate,
    onChange,
    isEditMode,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const parseDateStr = (str?: string) => {
        if (!str) return new Date();
        const parts = str.split('-').map(Number);
        if (parts.length !== 3) return new Date();
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };

    const [viewDate, setViewDate] = useState(parseDateStr(value));
    const [showRange, setShowRange] = useState(!!endDate);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = rect.bottom + 8;
            let left = rect.left;

            if (left + 280 > window.innerWidth) {
                left = window.innerWidth - 290;
            }
            if (top + 350 > window.innerHeight) {
                top = rect.top - 360;
            }

            setPopoverPos({ top, left });
        }
    };

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            updatePosition();
            setViewDate(parseDateStr(value));
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // If portal is used, we also need to check if the click was inside the portal
                const portal = document.getElementById('datepicker-portal-content');
                if (portal && portal.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };
        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleResize);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    const formatDateArr = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getDisplayDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = parseDateStr(dateStr);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (showRange) {
            const currentStart = value ? parseDateStr(value) : null;
            if (!currentStart || newDate < currentStart) {
                onChange(formatDateArr(newDate), endDate);
            } else {
                onChange(value!, formatDateArr(newDate));
                setIsOpen(false);
            }
        } else {
            onChange(formatDateArr(newDate));
            setIsOpen(false);
        }
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const currentStr = formatDateArr(new Date(year, month, d));
            const isSelected = value === currentStr || endDate === currentStr;
            const inRange = value && endDate &&
                new Date(year, month, d) > parseDateStr(value) &&
                new Date(year, month, d) < parseDateStr(endDate);

            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => handleDateClick(d)}
                    className={`h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-indigo-600 text-white font-bold' : inRange ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-700'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const displayValue = value ? (
        <span className="flex items-center gap-1">
            {getDisplayDate(value)}
            {endDate && (
                <>
                    <span className="text-slate-300 mx-1">→</span>
                    {getDisplayDate(endDate)}
                </>
            )}
        </span>
    ) : <span className="text-slate-400">選擇日期</span>;

    if (!isEditMode) {
        return <div className={`text-slate-700 ${className}`}>{displayValue}</div>;
    }

    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={toggleOpen}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-slate-700 border w-full text-left
                    ${isOpen ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-50' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-slate-100'}`}
            >
                <CalendarIcon className={`w-4 h-4 ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="flex-1 truncate text-sm font-medium">{displayValue}</span>
            </button>

            {isOpen && createPortal(
                <div
                    id="datepicker-portal-content"
                    className="fixed z-[999] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200 p-4 w-[280px] animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        top: `${popoverPos.top}px`,
                        left: `${popoverPos.left}px`,
                        pointerEvents: 'auto'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-sm font-black text-slate-800 tracking-tight">
                            {viewDate.getFullYear()}年 {monthNames[viewDate.getMonth()]}
                        </div>
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
                        ))}
                        {renderCalendar()}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <input
                                type="checkbox"
                                checked={showRange}
                                onChange={(e) => {
                                    setShowRange(e.target.checked);
                                    if (!e.target.checked) onChange(value || formatDateArr(new Date()), undefined);
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">結束日期 (期程模式)</span>
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    onChange(formatDateArr(today));
                                    setViewDate(today);
                                    if (!showRange) setIsOpen(false);
                                }}
                                className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-100"
                            >
                                今天
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('', '');
                                    setIsOpen(false);
                                }}
                                className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg transition-colors border border-slate-200 hover:border-red-100"
                                title="清除"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DatePicker;
