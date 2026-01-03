
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, LocationData } from '../types';
import { FileText, ExternalLink, AlertTriangle, Download, FileJson, FileType, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToWord } from '../services/wordService';

interface ReportDisplayProps {
    result: AnalysisResult;
    location: string;
    locationData?: LocationData | null;
    readOnly?: boolean;
}



const ReportDisplay: React.FC<ReportDisplayProps> = ({ result, location, locationData, readOnly = false }) => {
    const [mapSrc, setMapSrc] = useState<string>('');

    useEffect(() => {
        // Generate Embed Google Map URL
        // Use basic embed mode: place
        const query = encodeURIComponent(location);
        // Note: In production, you should use your own Google Maps Embed API Key if you want to remove the watermark or ensure high limits.
        // For this demo, we use the standard structure. If no key is provided, it might show in dev mode.
        // However, the prompt asked for "using existing or generating". The most reliable free way for users is the standard embed if permitted, 
        // but strictly speaking, Google Maps Embed API requires a key. 
        // We will use the 'maps' output from the analysis if available, or fallback to a query.
        // A generic embed query is: https://www.google.com/maps?q=...&output=embed
        setMapSrc(`https://www.google.com/maps?q=${query}&output=embed`);
    }, [location]);

    const getFileName = (ext: string) => {
        const dateStr = new Date().toISOString().split('T')[0];
        return `${location}_村里調查報告_${dateStr}.${ext}`;
    };

    const handleDownloadWord = () => {
        const loc: LocationData = locationData || {
            city: location,
            district: "",
            village: ""
        };
        exportToWord(loc, result);
    };

    const handleDownloadMarkdown = () => {
        const blob = new Blob([result.markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName('md');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadJSON = () => {
        const dataToSave = {
            location: location,
            timestamp: new Date().toISOString(),
            source: "Taiwan Village Analyst AI",
            report_content: result.markdown,
            reference_sources: result.sources,
            checklist_data: result.checklist
        };

        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName('json');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = () => {
        const lines = result.markdown.split('\n');
        let csvContent = "\uFEFF";
        csvContent += '"類別/章節","詳細內容"\n';

        let currentSection = "報告資訊";
        let currentBuffer: string[] = [];

        csvContent += `"調查地點","${location}"\n`;
        csvContent += `"產出時間","${new Date().toISOString()}"\n`;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                if (currentBuffer.length > 0) {
                    const content = currentBuffer.join('\n').replace(/"/g, '""');
                    csvContent += `"${currentSection}","${content}"\n`;
                    currentBuffer = [];
                }
                currentSection = trimmed.replace(/^#+\s*/, '');
            } else {
                if (trimmed !== '') {
                    currentBuffer.push(trimmed);
                }
            }
        });

        if (currentBuffer.length > 0) {
            const content = currentBuffer.join('\n').replace(/"/g, '""');
            csvContent += `"${currentSection}","${content}"\n`;
        }

        if (result.sources && result.sources.length > 0) {
            const sourceText = result.sources.map(s => `${s.title}: ${s.uri}`).join('\n');
            csvContent += `"參考來源","${sourceText.replace(/"/g, '""')}"\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName('csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <div id="printable-area" className={`max-w-4xl mx-auto animate-fade-in ${readOnly ? '' : 'pb-12'}`}>

            {/* Map Header */}
            <div className="w-full h-64 bg-slate-100 rounded-t-xl overflow-hidden relative border-x border-t border-slate-200">
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={mapSrc}
                    allowFullScreen
                    title="Google Maps"
                    className="grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                ></iframe>
                <div className="absolute bottom-0 left-0 bg-gradient-to-t from-slate-900/80 to-transparent w-full p-4 pt-12">
                    <h2 className="text-2xl font-bold text-white shadow-sm">{location}</h2>
                </div>
            </div>

            {/* Toolbar */}
            {!readOnly && (
                <div className="bg-white border-x border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4 no-print">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <FileText className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">村里資料分析報告</h3>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button onClick={handleDownloadWord} className="btn-icon">
                            <FileText className="w-4 h-4 text-blue-600" /> Word
                        </button>
                        <button onClick={handlePrintPDF} className="btn-icon">
                            <Printer className="w-4 h-4" /> PDF
                        </button>
                        <button onClick={handleDownloadCSV} className="btn-icon">
                            <FileSpreadsheet className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={handleDownloadMarkdown} className="btn-icon">
                            <FileType className="w-4 h-4" /> MD
                        </button>
                        <button onClick={handleDownloadJSON} className="btn-primary">
                            <FileJson className="w-4 h-4" /> JSON
                        </button>
                    </div>
                </div>
            )}



            {/* Content */}
            <div className={`bg-white p-8 md:p-12 shadow-sm min-h-[500px] prose prose-slate max-w-none 
         prose-headings:text-slate-800 prose-headings:font-bold prose-p:text-slate-600 
         prose-li:text-slate-600 prose-strong:text-slate-800 prose-a:text-emerald-600 
         ${readOnly ? 'text-sm' : ''} border-x border-b border-slate-200 rounded-b-xl`}>
                <ReactMarkdown
                    components={{
                        h1: ({ node, ...props }) => <h1 className="text-3xl border-b-2 border-emerald-500 pb-4 mb-6 mt-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl mt-8 mb-4 flex items-center gap-2 before:content-[''] before:block before:w-1.5 before:h-6 before:bg-emerald-500 before:rounded-full" {...props} />,
                        ul: ({ node, ...props }) => <ul className="bg-slate-50 p-4 rounded-lg my-4 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="marker:text-emerald-500 pl-2" {...props} />
                    }}
                >
                    {result.markdown}
                </ReactMarkdown>
            </div>

            {/* Footer (Sources) */}
            {!readOnly && (
                <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        資料來源與參考連結
                    </h3>
                    {result.sources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {result.sources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-500 hover:text-emerald-600 hover:underline truncate block p-2 rounded hover:bg-emerald-50 transition-colors"
                                    title={source.title}
                                >
                                    {index + 1}. {source.title || source.uri}
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">無特定線上來源連結。</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            免責聲明：本報告由 AI 協助整理。部分資料可能不完整，請參考 Step 2 實地訪談結果。
                        </p>
                    </div>
                </div>
            )}

            <style>{`
            .btn-icon {
                @apply flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors;
            }
            .btn-primary {
                @apply flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors;
            }
        `}</style>
        </div>
    );
};

export default ReportDisplay;
