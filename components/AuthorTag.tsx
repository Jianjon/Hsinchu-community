import React from 'react';
import { User } from 'lucide-react';

interface AuthorTagProps {
    userId?: string;
    userName?: string;
    userAvatar?: string;
    subText?: string;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const AuthorTag: React.FC<AuthorTagProps> = ({
    userId,
    userName = '匿名使用者',
    userAvatar,
    subText,
    size = 'md',
    onClick
}) => {
    // Mock user lookup if only userId provided (skipping strict lookup for now, relying on props)
    // In a real app, we'd use a hook to fetch user info by ID.

    const sizeClasses = {
        sm: { container: 'gap-1.5', avatar: 'w-6 h-6', name: 'text-xs', sub: 'text-[10px]' },
        md: { container: 'gap-2', avatar: 'w-8 h-8', name: 'text-sm', sub: 'text-xs' },
        lg: { container: 'gap-3', avatar: 'w-10 h-10', name: 'text-base', sub: 'text-sm' },
    };

    const currentSize = sizeClasses[size];

    return (
        <div
            className={`flex items-center ${currentSize.container} group cursor-pointer hover:bg-slate-50 rounded-lg pr-2 transition-colors`}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick();
                else alert(`Open profile for: ${userName}`);
            }}
        >
            <div className={`${currentSize.avatar} rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100`}>
                {userAvatar ? (
                    <img src={userAvatar} className="w-full h-full object-cover" alt={userName} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User className="w-1/2 h-1/2" />
                    </div>
                )}
            </div>
            <div className="flex flex-col min-w-0">
                <span className={`font-bold text-slate-700 truncate group-hover:text-emerald-600 transition-colors ${currentSize.name}`}>
                    {userName}
                </span>
                {subText && (
                    <span className={`text-slate-400 truncate ${currentSize.sub}`}>
                        {subText}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AuthorTag;
