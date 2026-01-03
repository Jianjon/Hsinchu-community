
import React from 'react';
import { AppStep } from '../types';
import { Globe, ClipboardList, Sparkles, ChevronRight } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    {
      id: AppStep.STEP_1_DRAFT,
      label: "網路資料搜集",
      subLabel: "AI 初稿生成",
      icon: Globe,
    },
    {
      id: AppStep.STEP_2_INTERVIEW,
      label: "實地訪談與查核",
      subLabel: "人工填寫確認",
      icon: ClipboardList,
    },
    {
      id: AppStep.STEP_3_FINAL,
      label: "智能整合報告",
      subLabel: "數據彙整完成",
      icon: Sparkles,
    },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200 mb-8 sticky top-16 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between md:justify-center relative">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 transform -translate-y-1/2"></div>

          <div className="flex items-center justify-between w-full md:w-3/4 max-w-3xl gap-2 md:gap-0">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none justify-center md:justify-start last:justify-end relative">
                  
                  {/* Step Item */}
                  <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60 grayscale'}`}>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white
                      ${isActive || isCompleted ? 'border-emerald-500 text-emerald-600 shadow-md' : 'border-slate-300 text-slate-400'}`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="text-center hidden md:block">
                      <p className={`text-sm font-bold ${isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500">{step.subLabel}</p>
                    </div>
                  </div>

                  {/* Arrow (Mobile only) */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden text-slate-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                  
                  {/* Progress Line Segment (Desktop) */}
                  {index < steps.length - 1 && (
                     <div className={`hidden md:block absolute left-[50%] top-1/2 w-full h-1 transform -translate-y-1/2 -z-10
                        ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} 
                        style={{ width: 'calc(100% - 3rem)', left: 'calc(50% + 1.5rem)' }}
                     ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Labels */}
        <div className="md:hidden mt-3 text-center">
            <p className="text-emerald-700 font-bold text-sm">
                {steps.find(s => s.id === currentStep)?.label}
            </p>
             <p className="text-xs text-slate-500">
                {steps.find(s => s.id === currentStep)?.subLabel}
            </p>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
