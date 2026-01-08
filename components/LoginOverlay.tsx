import React, { useState, useEffect } from 'react';
import { X, Globe, Heart, Users, Shield, Loader2, ArrowRight } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { authService } from '../services/authService';
import { getTotalUserCount } from '../services/firestoreService';
import { UserRole } from '../types';

interface LoginOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ isOpen, onClose }) => {
    const { setLoginOverlay, visualMode, setVisualMode, bypassLogin } = useUser();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<'resident' | 'admin'>('resident');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVerificationPending, setShowVerificationPending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [userCount, setUserCount] = useState<number>(0);

    useEffect(() => {
        getTotalUserCount().then(c => setUserCount(c));
    }, []);

    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
        setLoginOverlay(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setInviteCode('');
        setName('');
        setError(null);
        setShowVerificationPending(false);
        setResendSuccess(false);
    };

    const handleGuest = () => handleClose();

    const getAuthErrorMessage = (err: any) => {
        const errorCode = err.code || err.message;

        switch (errorCode) {
            case 'email-not-verified':
                return '此帳號需要電子郵件驗證。管理員角色必須驗證後才能使用管理功能。';
            case 'invalid-invite-code':
                return '邀請碼錯誤，請聯繫系統管理員獲取正確的邀請碼。';
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return '帳號或密碼錯誤';
            case 'auth/email-already-in-use':
                return '此電子郵件已被註冊';
            case 'auth/weak-password':
                return '密碼強度不足（至少需要 6 個字元）';
            case 'auth/invalid-email':
                return '電子郵件格式不正確';
            case 'auth/popup-blocked':
                return '登入視窗被瀏覽器阻擋，請在設定中開啟';
            case 'auth/operation-not-allowed':
                return '此登入方式尚未啟用，請聯繫管理員';
            case 'auth/popup-closed-by-user':
                return '登入視窗已被關閉';
            case 'auth-not-initialized':
                return '系統尚未與 Firebase 連線，請聯繫管理員';
            case 'auth/too-many-requests':
                return '嘗試次數過多，請稍後再試';
            case 'auth/internal-error':
                return '伺服器內部錯誤，請檢查網路連線';
            default:
                return `認證失敗 (${errorCode})`;
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    throw new Error('密碼兩次輸入不一致');
                }
                await authService.register(email, password, name, role, inviteCode);

                // For admins, we still want to show the verification reminder
                if (role === 'admin') {
                    setShowVerificationPending(true);
                } else {
                    // For residents, just close and enjoy
                    handleClose();
                }
            } else {
                const user = await authService.login(email, password);
                // If we get a user back (especially Guest), force the context to update
                // because onAuthStateChanged won't fire for our fake Guest login.
                if (user) {
                    bypassLogin(user);
                }
                handleClose();
            }
        } catch (err: any) {
            console.error("Auth Exception:", err);
            const errMsg = getAuthErrorMessage(err);
            setError(errMsg);

            if (err.message === 'email-not-verified') {
                setShowVerificationPending(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await authService.resendVerification();
            setResendSuccess(true);
            setTimeout(() => setResendSuccess(false), 3000);
        } catch (err: any) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-5xl min-h-[640px] bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden animate-zoom-in">

                {/* Left Side: Branding (Cream style) */}
                <div className="md:w-[45%] bg-[#FAF9F6] p-10 md:p-14 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-100">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <Globe className="w-5 h-5 text-[#8DAA91]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">新竹社區共好平台</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Hsinchu Community Pulse</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-serif text-slate-800 leading-[1.2] tracking-tight">
                                在新竹的風中，<br />
                                吹響共好的號角。
                            </h2>
                            <p className="text-slate-500 font-medium italic text-sm leading-relaxed max-w-xs">
                                「這裡是一個屬於你我的在地連結平台，讓每一顆想服務社區的心，都能找到發芽的土壤。」
                            </p>
                        </div>

                        <div className="mt-12 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                    <Heart className="w-4 h-4 text-[#8DAA91]" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-700">在地連結</h4>
                                    <p className="text-xs text-slate-400 font-medium">深入鄉鎮，挖掘那些被遺忘的故事與溫暖。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                    <Users className="w-4 h-4 text-[#8DAA91]" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-700">共好生活</h4>
                                    <p className="text-xs text-slate-400 font-medium">我們相信，一個人的小事，是社區的大事。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                    <Shield className="w-4 h-4 text-[#8DAA91]" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-700">溫暖共融</h4>
                                    <p className="text-xs text-slate-400 font-medium">不分老幼，這裡是與你共構的溫暖港灣。</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-slate-200/60 mt-10">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                        <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">{userCount > 0 ? userCount.toLocaleString() : '...'} 居民已加入</p>
                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Community Members</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Primary Interaction (White style) */}
                <div className="md:w-[55%] p-10 md:p-14 bg-white relative flex flex-col justify-center">
                    <button onClick={handleClose} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-600 rounded-full transition-all z-20">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-6 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
                                {showVerificationPending ? '請驗證電子郵件' : mode === 'login' ? '歡迎回來' : '加入共好圈'}
                            </h2>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed">
                                {showVerificationPending
                                    ? '我們已寄送驗證信至您的信箱，請點擊信中連結完成認證後再進行登入。'
                                    : mode === 'login' ? '請輸入您的登入資訊，回到這片溫暖的社區。' : '建立您的居民身份，開始參與社區連結。'}
                            </p>
                        </div>

                        {showVerificationPending ? (
                            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-[#8DAA91]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-10 h-10 text-[#8DAA91]" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-500">認證信已寄送至：</p>
                                    <p className="font-bold text-slate-700">{email}</p>
                                </div>
                                <button
                                    onClick={handleResend}
                                    disabled={loading || resendSuccess}
                                    className="text-sm font-bold text-[#8DAA91] hover:underline disabled:text-slate-300"
                                >
                                    {resendSuccess ? '驗證信已再次寄出！' : '沒收到郵件？點此重試'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowVerificationPending(false);
                                        setMode('login');
                                    }}
                                    className="w-full py-4 bg-[#8DAA91] text-white rounded-2xl font-bold hover:bg-[#7A957E] transition-all mt-4"
                                >
                                    已完成認證，前往登入
                                </button>
                                <button
                                    onClick={() => setShowVerificationPending(false)}
                                    className="w-full py-4 border border-slate-200 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    返回修改資料
                                </button>
                            </div>
                        ) : (
                            <>

                                {/* Visual Mode Selector (Compact) */}
                                <div className="flex gap-3 mb-8 bg-slate-50 p-1.5 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setVisualMode('standard')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all
                                    ${visualMode === 'standard' ? 'bg-white text-[#7A957E] shadow-sm ring-1 ring-[#8DAA91]/20' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <span className="bg-[#8DAA91] text-white w-5 h-5 rounded flex items-center justify-center text-[10px]">A</span>
                                        標準模式
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisualMode('senior')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all
                                    ${visualMode === 'senior' ? 'bg-white text-[#7A957E] shadow-sm ring-1 ring-[#8DAA91]/20' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <span className="bg-[#8DAA91] text-white w-5 h-5 rounded flex items-center justify-center text-[10px] text-lg">A+</span>
                                        友善大字
                                    </button>
                                </div>

                                {/* Integration: Form fields always visible */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-5 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex gap-6 mb-2 border-b border-slate-100 pb-2">
                                            <button type="button" onClick={() => setRole('resident')} className={`text-xs font-bold transition-all border-b-2 pb-1 ${role === 'resident' ? 'text-[#8DAA91] border-[#8DAA91]' : 'text-slate-300 border-transparent hover:text-slate-400'}`}>一般居民</button>
                                            <button type="button" onClick={() => setRole('admin')} className={`text-xs font-bold transition-all border-b-2 pb-1 ${role === 'admin' ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-transparent hover:text-slate-400'}`}>管理權限</button>
                                        </div>

                                        <div className="space-y-4">
                                            {mode === 'register' && (
                                                <input
                                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8DAA91]/20 font-medium text-slate-600 placeholder:text-slate-300"
                                                    placeholder="您的姓名"
                                                />
                                            )}
                                            <input
                                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8DAA91]/20 font-medium text-slate-600 placeholder:text-slate-300"
                                                placeholder="電子郵件地址"
                                            />
                                            <input
                                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8DAA91]/20 font-medium text-slate-600 placeholder:text-slate-300"
                                                placeholder="請輸入密碼"
                                            />
                                            {mode === 'register' && (
                                                <input
                                                    type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#8DAA91]/20 font-medium text-slate-600 placeholder:text-slate-300"
                                                    placeholder="確認密碼"
                                                />
                                            )}
                                            {mode === 'register' && role === 'admin' && (
                                                <input
                                                    type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                                                    className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-600 placeholder:text-indigo-300"
                                                    placeholder="請輸入管理員核心邀請碼"
                                                />
                                            )}
                                        </div>
                                        {error && <p className="text-[11px] text-red-500 font-bold ml-2">{error}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-5 bg-[#8DAA91] hover:bg-[#7A957E] text-white rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#8DAA91]/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                {mode === 'login' ? '登入' : '立即註冊'}
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <div className="flex flex-col items-center gap-4 mt-6">
                                        <div className="text-[13px] font-medium flex items-center gap-2">
                                            <span className="text-slate-300">{mode === 'login' ? '還沒有帳號嗎？' : '已經有帳號了？'}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode(mode === 'login' ? 'register' : 'login');
                                                    setError(null);
                                                }}
                                                className="text-[#8DAA91] font-bold hover:underline"
                                            >
                                                {mode === 'login' ? '註冊帳號' : '前往登入'}
                                            </button>
                                        </div>

                                        <button type="button" onClick={handleGuest} className="text-[13px] text-slate-400 hover:text-slate-600 font-bold transition-colors">
                                            先等等，我先隨便看看
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@900&display=swap');
                .font-serif { font-family: 'Noto Serif TC', serif; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.7s ease-out; }
                .animate-zoom-in { animation: zoom-in 0.7s ease-out; }
            `}} />
        </div>
    );
};

export default LoginOverlay;
