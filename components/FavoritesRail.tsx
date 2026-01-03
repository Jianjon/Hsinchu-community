import { Home, Star, Menu, User as UserIcon, MessageSquare } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useUser } from '../contexts/UserContext';

interface FavoritesRailProps {
    activeVillageId: string | null;
    drawerMode: 'home' | 'community' | 'bulletin' | 'preview';
    onSelectHome: () => void;
    onSelectBulletin: () => void;
    onSelectCommunity: (id: string) => void;
    onToggleSidebar: () => void;
    onOpenProfile: () => void;
    communities: Array<{ id: string; name: string; district: string }>;
}

// Cultural theme district colors - warmer palette
const DISTRICT_STYLES: Record<string, { active: string; bg: string }> = {
    '竹北市': { active: '#5B8A5A', bg: 'rgba(91,138,90,0.15)' },
    '竹東鎮': { active: '#C88A75', bg: 'rgba(200,138,117,0.15)' },
    '新埔鎮': { active: '#C47A6A', bg: 'rgba(196,122,106,0.15)' },
    '關西鎮': { active: '#8DAA91', bg: 'rgba(141,170,145,0.15)' },
    '湖口鄉': { active: '#6A9A8C', bg: 'rgba(106,154,140,0.15)' },
    '新豐鄉': { active: '#7A9DAA', bg: 'rgba(122,157,170,0.15)' },
    '芎林鄉': { active: '#9A8AB0', bg: 'rgba(154,138,176,0.15)' },
    '橫山鄉': { active: '#B08A9A', bg: 'rgba(176,138,154,0.15)' },
    '北埔鄉': { active: '#AA7A7A', bg: 'rgba(170,122,122,0.15)' },
    '寶山鄉': { active: '#7A8AAA', bg: 'rgba(122,138,170,0.15)' },
    '峨眉鄉': { active: '#6A9A9A', bg: 'rgba(106,154,154,0.15)' },
    '尖石鄉': { active: '#8A7AAA', bg: 'rgba(138,122,170,0.15)' },
    '五峰鄉': { active: '#AA7A8A', bg: 'rgba(170,122,138,0.15)' },
    '東區': { active: '#AA9A6A', bg: 'rgba(170,154,106,0.15)' },
    '北區': { active: '#8A8A8A', bg: 'rgba(138,138,138,0.15)' },
    '香山區': { active: '#9A8A7A', bg: 'rgba(154,138,122,0.15)' },
};

const FavoritesRail: React.FC<FavoritesRailProps> = ({
    activeVillageId,
    drawerMode,
    onSelectHome,
    onSelectBulletin,
    onSelectCommunity,
    onToggleSidebar,
    onOpenProfile,
    communities
}) => {
    const { favorites } = useFavorites();
    const { user, isLoggedIn, setLoginOverlay } = useUser();

    // Get community data for favorites
    const favoriteCommunities = favorites
        .map(id => communities.find(c => c.id === id))
        .filter(Boolean) as Array<{ id: string; name: string; district: string }>;

    // Generate avatar from community name (first 2 characters)
    const getAvatar = (name: string) => {
        return name.substring(0, 2);
    };

    const handleProfileClick = () => {
        if (isLoggedIn) {
            onOpenProfile();
        } else {
            setLoginOverlay(true);
        }
    };

    // Get style for district
    const getDistrictStyle = (district: string) => {
        return DISTRICT_STYLES[district] || { active: '#8DAA91', bg: 'rgba(141,170,145,0.15)' };
    };

    return (
        <div
            className="w-[72px] flex flex-col items-center py-4 space-y-3 shrink-0 overflow-y-auto z-[1001]"
            style={{ backgroundColor: '#FDFBF7', borderRight: '1px solid rgba(141,170,145,0.2)' }}
        >
            {/* User Avatar / Login Inlet */}
            <button
                onClick={handleProfileClick}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[14px] flex items-center justify-center transition-all duration-300 group relative mb-2 ring-2 ring-offset-2 border-2`}
                style={{
                    borderColor: 'rgba(141,170,145,0.2)',
                    outlineColor: isLoggedIn ? '#8DAA91' : 'rgba(141,170,145,0.3)', // Replaced ringColor/ringOffsetColor which are tw utilities not css props
                    backgroundColor: isLoggedIn ? 'rgba(141,170,145,0.1)' : 'rgba(141,170,145,0.05)'
                }}
                title={isLoggedIn ? `個人資料: ${user?.name}` : "登入社區平台"}
            >
                {isLoggedIn && user ? (
                    <div
                        className="w-full h-full overflow-hidden flex items-center justify-center text-white font-black text-lg font-sans-tc"
                        style={{ borderRadius: 'inherit', backgroundColor: '#8DAA91' }}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="User" />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                ) : (
                    <UserIcon className="w-6 h-6 transition-colors" style={{ color: '#8B8B8B' }} />
                )}
                {isLoggedIn && (
                    <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#8DAA91', border: '2px solid #FDFBF7' }}
                    >
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                )}
            </button>

            {/* Home Button (Shared Feed) */}
            <button
                onClick={onSelectHome}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative`}
                style={{
                    backgroundColor: drawerMode === 'home' ? '#8DAA91' : 'rgba(141,170,145,0.15)',
                    color: drawerMode === 'home' ? 'white' : '#4A4A4A',
                    borderRadius: drawerMode === 'home' ? '16px' : '24px'
                }}
                title="首頁總覽"
            >
                <Home className="w-6 h-6" />
                {drawerMode === 'home' && (
                    <div className="absolute -left-1 w-1 h-8 bg-white rounded-r-full" />
                )}
            </button>

            {/* Shared Bulletin Board (New Feature) */}
            <button
                onClick={onSelectBulletin}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 group relative`}
                style={{
                    backgroundColor: drawerMode === 'bulletin' ? '#8DAA91' : 'rgba(141,170,145,0.15)',
                    color: drawerMode === 'bulletin' ? 'white' : '#4A4A4A',
                    borderRadius: drawerMode === 'bulletin' ? '16px' : '24px'
                }}
                title="共用佈告欄 (跨區留言)"
            >
                <MessageSquare className="w-6 h-6" />
                {drawerMode === 'bulletin' && (
                    <div className="absolute -left-1 w-1 h-8 bg-white rounded-r-full" />
                )}
            </button>

            <div className="w-8 h-[2px] rounded-full mx-auto mb-2" style={{ backgroundColor: 'rgba(141,170,145,0.2)' }} />

            {/* Sidebar Toggle Button (Menu) */}
            <button
                onClick={onToggleSidebar}
                className="w-12 h-12 rounded-[24px] hover:rounded-[12px] flex items-center justify-center transition-all duration-200 mb-2"
                style={{ backgroundColor: 'rgba(141,170,145,0.1)', color: '#6B6B6B' }}
                title="切換選單"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Separator */}
            <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: 'rgba(141,170,145,0.2)' }} />

            {/* Favorite Communities */}
            {favoriteCommunities.length > 0 ? (
                favoriteCommunities.map(community => {
                    const isActive = activeVillageId === community.id;
                    const style = getDistrictStyle(community.district);
                    return (
                        <button
                            key={community.id}
                            onClick={() => onSelectCommunity(community.id)}
                            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 group relative font-sans-tc`}
                            style={{
                                backgroundColor: isActive ? style.active : style.bg,
                                color: isActive ? 'white' : '#4A4A4A',
                                borderRadius: isActive ? '16px' : '24px'
                            }}
                            title={`${community.district} ${community.name}`}
                        >
                            <span className="text-sm font-bold leading-tight">{getAvatar(community.name)}</span>
                            {isActive && (
                                <div className="absolute -left-1 w-1 h-8 bg-white rounded-r-full" />
                            )}
                        </button>
                    );
                })
            ) : (
                <div className="flex flex-col items-center gap-2 px-2 text-center" style={{ color: '#8B8B8B' }}>
                    <Star className="w-5 h-5 opacity-50" />
                    <span className="text-[10px] leading-tight font-sans-tc">
                        收藏社區<br />會顯示在這
                    </span>
                </div>
            )}
        </div>
    );
};

export default FavoritesRail;
