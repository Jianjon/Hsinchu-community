
import React, { useState } from 'react';
import SearchForm from '../components/SearchForm';
import ReportDisplay from '../components/ReportDisplay';
import LowCarbonChecklist from '../components/LowCarbonChecklist';
import StepIndicator from '../components/StepIndicator';
import BatchMode from '../components/BatchMode';
import QueryHistory from '../components/QueryHistory';
import { LocationData, AnalysisResult, AppStatus, AppStep, AuditCategory } from '../types';
import { runStep1_Draft, runStep3_Integrate } from '../services/geminiService';
import { saveVillageRecord } from '../services/localDatabase';
import { Trees, Database, History, ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { auth } from '../services/firebase';
import { useUser } from '../contexts/UserContext';

const AnalystTool: React.FC = () => {
  const { user } = useUser();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.STEP_1_DRAFT);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checklist, setChecklist] = useState<AuditCategory[]>([]);

  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Step 1: Search & Draft
  const handleSearch = async (location: LocationData) => {
    setStatus(AppStatus.ANALYZING);
    setCurrentStep(AppStep.STEP_1_DRAFT);
    setErrorMsg('');
    setResult(null);
    setChecklist([]);
    setLocationData(location);
    setCurrentLocation(`${location.city}${location.district}${location.village}`);
    setProgressMsg("系統初始化中...");

    try {
      const data = await runStep1_Draft(location, (msg) => {
        setProgressMsg(msg);
      });
      setResult(data);
      if (data.checklist) {
        setChecklist(data.checklist);
      }

      // Auto-save to local database
      try {
        await saveVillageRecord(location, data, AppStep.STEP_2_INTERVIEW);
        console.log('Record saved to local database');
      } catch (saveErr) {
        console.error('Failed to save to local database:', saveErr);
      }

      setStatus(AppStatus.COMPLETED);
      setCurrentStep(AppStep.STEP_2_INTERVIEW); // Auto move to Step 2 UI
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "發生未知錯誤，請稍後再試。");
    }
  };

  // Step 3: Integrate
  const handleIntegration = async (transcript: string) => {
    if (!result || !locationData) return;

    setStatus(AppStatus.ANALYZING); // Reuse analyzing state
    setCurrentStep(AppStep.STEP_3_FINAL); // Move to Step 3 UI loading
    setProgressMsg("正在閱讀您的逐字稿並整合資料...");

    try {
      const finalData = await runStep3_Integrate(locationData, result, transcript, (msg) => {
        setProgressMsg(msg);
      });
      setResult(finalData);

      // Auto-save final result to local database
      try {
        await saveVillageRecord(locationData, finalData, AppStep.STEP_3_FINAL);
        console.log('Final report saved to local database');
      } catch (saveErr) {
        console.error('Failed to save final report:', saveErr);
      }

      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg("整合失敗：" + err.message);
    }
  };

  // Load a record from history
  const handleLoadRecord = (location: LocationData, recordResult: AnalysisResult, step: AppStep) => {
    setLocationData(location);
    setCurrentLocation(`${location.city}${location.district}${location.village}`);
    setResult(recordResult);
    if (recordResult.checklist) {
      setChecklist(recordResult.checklist);
    }
    setCurrentStep(step);
    setStatus(AppStatus.COMPLETED);
  };

  if (isBatchMode) {
    return <BatchMode onBack={() => setIsBatchMode(false)} />;
  }

  // Verification Guard for Admins
  const isVerified = auth?.currentUser?.emailVerified;
  if (user?.role === 'admin' && !isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-zoom-in">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">需要驗證電子郵件</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            您目前的身份是 **管理員**。為了確保社區數據安全，管理權限需要先完成 Email 驗證才能開啟工具。
          </p>

          <div className="space-y-4">
            <button
              onClick={async () => {
                setResendLoading(true);
                try {
                  await authService.resendVerification();
                  setResendSuccess(true);
                  setTimeout(() => setResendSuccess(false), 5000);
                } catch (e) {
                  console.error(e);
                } finally {
                  setResendLoading(false);
                }
              }}
              disabled={resendLoading || resendSuccess}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200"
            >
              {resendLoading ? <Mail className="w-5 h-5 animate-bounce" /> : <Mail className="w-5 h-5" />}
              {resendSuccess ? '驗證信已再次寄出！' : '再次發送驗證信'}
            </button>

            <a
              href="/"
              className="w-full py-4 border border-slate-200 text-slate-400 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首頁
            </a>
          </div>

          <p className="mt-8 text-xs text-slate-300">
            驗證完成後，請重新整理此頁面即可進入。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Trees className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">台灣村里數據調查員 Pro</h1>
              <span className="text-xs text-emerald-600 font-medium tracking-wider">MULTI-AGENT ANALYST AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {status !== AppStatus.IDLE && (
              <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
                {currentLocation}
              </div>
            )}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition-colors"
            >
              <History className="w-3 h-3" />
              查詢歷史
            </button>
            <button
              onClick={() => setIsBatchMode(true)}
              className="flex items-center gap-2 text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
            >
              <Database className="w-3 h-3" />
              批量模式
            </button>
          </div>
        </div>
      </header>

      {/* Progress Breadcrumb */}
      {status !== AppStatus.IDLE && (
        <StepIndicator currentStep={currentStep} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Step 1 Input Form (Only show if IDLE or analyzing Step 1) */}
        {(status === AppStatus.IDLE || (status === AppStatus.ANALYZING && currentStep === AppStep.STEP_1_DRAFT)) && (
          <>
            {status === AppStatus.IDLE && (
              <div className="text-center mb-10 max-w-2xl mx-auto mt-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">深入了解您的社區</h2>
                <p className="text-slate-600 leading-relaxed">
                  全台首創三階段村里盤查系統：<br />
                  <b>1. AI 網路搜查 + 事實查核</b> → <b>2. 實地訪談清單</b> → <b>3. 智能整合報告</b>
                </p>
              </div>
            )}
            <SearchForm
              onSearch={handleSearch}
              isLoading={status === AppStatus.ANALYZING}
              loadingMessage={progressMsg}
            />
          </>
        )}

        {/* Error Message */}
        {status === AppStatus.ERROR && (
          <div className="max-w-2xl mx-auto mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <div className="font-bold">Error:</div>
            <div>{errorMsg}</div>
            <button onClick={() => setStatus(AppStatus.IDLE)} className="mt-2 text-sm underline hover:text-red-800">重試</button>
          </div>
        )}

        {/* Loading Skeleton for Step 3 */}
        {status === AppStatus.ANALYZING && currentStep === AppStep.STEP_3_FINAL && (
          <div className="max-w-4xl mx-auto mt-8 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-slate-700">{progressMsg}</h3>
            <p className="text-slate-500 mt-2">AI 正在過濾逐字稿雜訊並萃取關鍵事實...</p>
          </div>
        )}

        {/* Step 2 View: Web Report + Checklist Form */}
        {status === AppStatus.COMPLETED && currentStep === AppStep.STEP_2_INTERVIEW && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
            {/* Left Col: Web Draft (Reference) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2">Step 1: 網路初稿 (經 AI 二次查核)</h3>
                <div className="h-[800px] overflow-y-auto custom-scrollbar">
                  <ReportDisplay result={result} location={currentLocation} locationData={locationData} readOnly={true} />
                </div>
              </div>
            </div>

            {/* Right Col: Checklist & Transcript Input */}
            <div className="lg:col-span-5">
              <div className="sticky top-40 h-[800px]">
                <LowCarbonChecklist
                  categories={checklist}
                  onSubmit={handleIntegration}
                  isProcessing={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 View: Final Report */}
        {status === AppStatus.COMPLETED && currentStep === AppStep.STEP_3_FINAL && result && (
          <div className="mt-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-center">
              <h2 className="text-2xl font-bold text-emerald-800">🎉 最終報告已完成</h2>
              <p className="text-emerald-700">已成功將您的訪談逐字稿融合進分析報告中，您可以下載保存。</p>
            </div>
            <ReportDisplay result={result} location={currentLocation} locationData={locationData} />

            <div className="text-center mt-12">
              <button
                onClick={() => { setStatus(AppStatus.IDLE); setCurrentStep(AppStep.STEP_1_DRAFT); }}
                className="text-slate-500 hover:text-emerald-600 underline"
              >
                開始新的調查
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Query History Sidebar */}
      <QueryHistory
        onLoadRecord={handleLoadRecord}
        isVisible={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default AnalystTool;
