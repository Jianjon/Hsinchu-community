import React, { useState, useEffect, useRef } from 'react';
import { LocationData, AnalysisResult } from '../types';
import { runStep1_Draft } from '../services/geminiService';
import { initFirebase, saveVillageReport, saveErrorLog, hasHardcodedConfig } from '../services/firebase';
import { HSINCHU_VILLAGES } from '../services/hsinchu_data';
import { downloadAsCMSMarkdown } from '../services/fileExport';
import { exportToExcel, readVillageListFromExcel } from '../services/excelService';
import { Play, Pause, Database, AlertCircle, FileJson, CheckCircle, FileText, List, Upload, FileSpreadsheet } from 'lucide-react';
import { saveVillageRecord } from '../services/localDatabase';
import { AppStep } from '../types';

interface BatchModeProps {
  onBack: () => void;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const BatchMode: React.FC<BatchModeProps> = ({ onBack }) => {
  const [csvInput, setCsvInput] = useState<string>('新竹縣,竹北市,中興里\n新竹縣,竹北市,北興里\n新竹縣,關西鎮,金山里');
  const [firebaseConfigStr, setFirebaseConfigStr] = useState<string>('');
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);

  const [queue, setQueue] = useState<LocationData[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completedResults, setCompletedResults] = useState<{ location: LocationData, data: AnalysisResult }[]>([]);
  const [delaySec, setDelaySec] = useState<number>(15); // Default 15s delay

  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (hasHardcodedConfig()) {
      const success = initFirebase();
      if (success) {
        setIsFirebaseReady(true);
        addLog("已自動連線至預設 Firebase 設定", "success");
      }
    }
  }, []);

  const handleFirebaseInit = () => {
    try {
      const config = JSON.parse(firebaseConfigStr);
      const success = initFirebase(config);
      if (success) {
        setIsFirebaseReady(true);
        addLog("Firebase 手動連線成功", "success");
      } else {
        addLog("Firebase 連線失敗", "error");
      }
    } catch (e) {
      addLog("Firebase Config JSON 格式錯誤", "error");
    }
  };

  const loadHsinchuList = () => {
    const csvContent = HSINCHU_VILLAGES.map(v => `${v.city},${v.district},${v.village}`).join('\n');
    setCsvInput(csvContent);
    addLog(`已載入 ${HSINCHU_VILLAGES.length} 筆新竹縣村里資料`, "success");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const locations = await readVillageListFromExcel(file);
      if (locations.length > 0) {
        const csvContent = locations.map(v => `${v.city},${v.district},${v.village}`).join('\n');
        setCsvInput(csvContent);
        addLog(`已從 Excel 載入 ${locations.length} 筆資料`, "success");
      } else {
        addLog("Excel 檔案中未找到有效的村里資料 (需包含 縣市/行政區/村里 欄位)", "error");
      }
    } catch (error: any) {
      addLog(`Excel 讀取失敗: ${error.message}`, "error");
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = () => {
    const lines = csvInput.split('\n');
    const newQueue: LocationData[] = [];
    lines.forEach(line => {
      const parts = line.split(/[,\t]/);
      if (parts.length >= 3) {
        newQueue.push({
          city: parts[0].trim(),
          district: parts[1].trim(),
          village: parts[2].trim()
        });
      }
    });
    setQueue(newQueue);
    addLog(`已載入 ${newQueue.length} 筆待處理資料`, "info");
  };

  const processQueue = async () => {
    if (!isRunning && currentIndex < queue.length) {
      setIsRunning(true);
      isRunningRef.current = true;

      let idx = currentIndex;

      while (idx < queue.length && isRunningRef.current) {
        const item = queue[idx];
        addLog(`[${idx + 1}/${queue.length}] 開始分析：${item.city}${item.district}${item.village}`, "info");

        try {
          // 1. Run AI Analysis
          const result = await runStep1_Draft(item, (msg) => { /* quiet */ });

          // 2. Save to Local IndexedDB (New!)
          await saveVillageRecord(item, result, AppStep.STEP_1_DRAFT);
          addLog(`>> 已儲存至本地資料庫`, "success");

          // 3. Save to Firebase (Optional)
          if (isFirebaseReady) {
            await saveVillageReport(item, result);
            addLog(`>> 已寫入 Firebase`, "success");
          }

          // 4. Save to Memory state
          setCompletedResults(prev => [...prev, {
            location: item,
            data: result
          }]);

          addLog(`完成：${item.village}`, "success");

        } catch (error: any) {
          addLog(`失敗：${item.village} - ${error.message}`, "error");
          if (isFirebaseReady) {
            await saveErrorLog(item, error.message);
          }
        }

        // 5. Rate Limit Delay
        if (idx < queue.length - 1) {
          addLog(`冷卻中...等待 ${delaySec} 秒`, "info");
          await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
        }

        idx++;
        setCurrentIndex(idx);
      }

      setIsRunning(false);
      isRunningRef.current = false;
      addLog("排程結束或已暫停", "info");
    }
  };

  const stopProcessing = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    addLog("使用者暫停排程", "error");
  };

  const downloadAllJson = () => {
    const jsonString = JSON.stringify(completedResults, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportExcel = () => {
    exportToExcel(completedResults);
  };

  const downloadCMSMarkdown = () => {
    if (completedResults.length === 0) return;

    if (confirm(`即將下載 ${completedResults.length} 個 Markdown 檔案，這可能會彈出多個下載視窗。確定嗎？`)) {
      completedResults.forEach((res, index) => {
        setTimeout(() => {
          downloadAsCMSMarkdown(res.location, res.data.markdown);
        }, index * 500); // Stagger downloads
      });
      addLog("已開始下載 CMS Markdown 檔案", "success");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          批量自動化中心 (Batch Automation)
        </h2>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 underline">
          返回主畫面
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">

          {/* 1. Data Input */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2">1. 輸入村里清單</h3>

            <div className="flex gap-2 mb-2">
              <button
                onClick={loadHsinchuList}
                className="flex-1 py-1.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1"
              >
                <List className="w-3 h-3" /> 載入新竹縣全區 (213村里)
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 bg-green-50 text-green-600 text-xs rounded border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1"
              >
                <Upload className="w-3 h-3" /> 上傳 Excel
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                className="hidden"
                accept=".xlsx, .xls"
              />
            </div>

            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              className="w-full h-48 p-2 text-sm border border-slate-300 rounded mb-2 font-mono"
              placeholder="新竹縣,竹北市,中興里"
            />
            <button
              onClick={parseCSV}
              className="w-full py-2 bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200"
            >
              解析清單確認 ({csvInput.split('\n').filter(l => l.trim()).length})
            </button>
          </div>

          {/* 2. Controls */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2">2. 執行控制</h3>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs text-slate-600">冷卻延遲(秒):</label>
              <input
                type="number"
                value={delaySec}
                onChange={(e) => setDelaySec(Number(e.target.value))}
                className="w-16 p-1 border rounded text-center"
              />
            </div>

            {!isRunning ? (
              <button
                onClick={processQueue}
                disabled={queue.length === 0}
                className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2
                        ${queue.length === 0 ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                <Play className="w-4 h-4" /> 開始批次執行
              </button>
            ) : (
              <button
                onClick={stopProcessing}
                className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" /> 暫停
              </button>
            )}
          </div>

          {/* 3. Firebase (Optional) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 opacity-80 hover:opacity-100 transition-opacity">
            <h3 className="font-bold text-slate-700 mb-2 text-sm flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> 選用：Firebase 備份
            </h3>
            {isFirebaseReady ? (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 已連線
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                未連線 (僅儲存於本地)
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Console & Status */}
        <div className="lg:col-span-2 flex flex-col h-[600px]">
          <div className="bg-slate-800 text-green-400 p-4 rounded-t-xl font-mono text-sm flex justify-between items-center">
            <span>SYSTEM LOG CONSOLE</span>
            <span className="text-xs text-slate-400">Progress: {currentIndex} / {queue.length}</span>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 bg-slate-900 p-4 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar border-x border-slate-800"
          >
            {logs.length === 0 && <span className="text-slate-600">等待指令...</span>}
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                <span className="text-slate-500">[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
          <div className="bg-white p-4 rounded-b-xl border border-t-0 border-slate-200 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              已完成: <b>{completedResults.length}</b> 筆
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                disabled={completedResults.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> 匯出 Excel
              </button>
              <button
                onClick={downloadCMSMarkdown}
                disabled={completedResults.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 text-sm"
              >
                <FileText className="w-4 h-4" /> CMS (.md)
              </button>
              <button
                onClick={downloadAllJson}
                disabled={completedResults.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
              >
                <FileJson className="w-4 h-4" /> JSON
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BatchMode;
