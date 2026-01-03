import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen font-sans-tc" style={{ backgroundColor: '#FDFBF7' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#FDFBF7', borderBottom: '1px solid rgba(141,170,145,0.2)' }}>
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1 font-bold transition-colors" style={{ color: '#8DAA91' }}>
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">返回首頁</span>
                    </Link>
                    <h1 className="text-lg font-bold font-serif-tc tracking-tight" style={{ color: '#4A4A4A' }}>
                        關於本平台
                    </h1>
                    <div className="w-8"></div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="rounded-2xl p-8 shadow-sm text-center paper-texture" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(141,170,145,0.2)' }}>
                    <h2 className="text-3xl font-bold font-serif-tc mb-8" style={{ color: '#4A4A4A' }}>設計理念</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12" style={{ color: '#6B6B6B' }}>
                        <div className="p-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl" style={{ backgroundColor: 'rgba(141,170,145,0.15)' }}>🚫</div>
                            <h3 className="text-xl font-bold font-serif-tc mb-3" style={{ color: '#4A4A4A' }}>非政治</h3>
                            <p className="text-base leading-relaxed">不涉及政黨色彩，專注於社區公共事務與自發性的治理行動。</p>
                        </div>
                        <div className="p-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl" style={{ backgroundColor: 'rgba(141,170,145,0.15)' }}>🤝</div>
                            <h3 className="text-xl font-bold font-serif-tc mb-3" style={{ color: '#4A4A4A' }}>非評比</h3>
                            <p className="text-base leading-relaxed">不做排名與分數比較，鼓勵良性交流，讓每一個微小的改變都被看見。</p>
                        </div>
                        <div className="p-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl" style={{ backgroundColor: 'rgba(200,138,117,0.15)' }}>💰</div>
                            <h3 className="text-xl font-bold font-serif-tc mb-3" style={{ color: '#4A4A4A' }}>非補助</h3>
                            <p className="text-base leading-relaxed">本平台並非官方補助申請管道，僅作為行動紀錄與資源媒合的透明空間。</p>
                        </div>
                        <div className="p-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-3xl" style={{ backgroundColor: 'rgba(200,138,117,0.15)' }}>👵</div>
                            <h3 className="text-xl font-bold font-serif-tc mb-3" style={{ color: '#4A4A4A' }}>高齡友善</h3>
                            <p className="text-base leading-relaxed">介面簡單直覺，字體清晰，讓社區長輩也能輕鬆了解並參與社區動態。</p>
                        </div>
                    </div>

                    <div className="text-left p-6 rounded-xl" style={{ backgroundColor: 'rgba(141,170,145,0.08)', border: '1px solid rgba(141,170,145,0.2)' }}>
                        <h3 className="text-lg font-bold font-serif-tc mb-3" style={{ color: '#4A4A4A' }}>為什麼建立這個平台？</h3>
                        <p className="leading-relaxed mb-4" style={{ color: '#4A4A4A' }}>
                            我們相信，社區的改變源自於對生活的關心。既有的評鑑制度往往流於形式，而許多的在地努力卻因為缺乏數位工具而被忽視。
                        </p>
                        <p className="leading-relaxed" style={{ color: '#4A4A4A' }}>
                            本平台希望透過 AI 輔助與地圖視覺化，將複雜的數據轉化為易懂的資訊，連結人與社區，推動由下而上的永續治理。
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center text-sm" style={{ color: '#8B8B8B' }}>
                    <span>© 2025 新竹社區共好平台</span>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
