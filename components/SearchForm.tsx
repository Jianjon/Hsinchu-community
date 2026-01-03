import React, { useState } from 'react';
import { LocationData } from '../types';
import { Search, MapPin, Loader2, CheckCircle2 } from 'lucide-react';

interface SearchFormProps {
  onSearch: (data: LocationData) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, loadingMessage }) => {
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city && district && village) {
      onSearch({ city, district, village });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 md:p-8 max-w-2xl mx-auto border border-slate-100">
      <div className="flex items-center gap-2 mb-6 text-slate-700">
        <MapPin className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold">輸入調查地點</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label htmlFor="city" className="text-sm font-medium text-slate-600 mb-1">縣市</label>
            <input
              id="city"
              type="text"
              placeholder="例如：臺北市"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="district" className="text-sm font-medium text-slate-600 mb-1">行政區</label>
            <input
              id="district"
              type="text"
              placeholder="例如：大安區"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="village" className="text-sm font-medium text-slate-600 mb-1">村里</label>
            <input
              id="village"
              type="text"
              placeholder="例如：龍門里"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isLoading || !city || !district || !village}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-white font-medium transition-all shadow-sm
              ${isLoading || !city || !district || !village 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md active:transform active:scale-[0.99]'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                處理中...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                開始三階段盤查
              </>
            )}
          </button>
          
          {isLoading ? (
             <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 flex items-center justify-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                {loadingMessage || "資料搜集與分析中..."}
             </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2 text-center">
              系統將依序執行：1.初稿生成 → 2.事實查核 → 3.缺漏補全。過程約需 60-90 秒。
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
