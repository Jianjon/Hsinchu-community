import { Image as ImageIcon, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PhotoItem } from '../../hooks/useMixboardData';

interface PhotoCarouselWidgetProps {
    photos?: PhotoItem[];
}

const PhotoCarouselWidget: React.FC<PhotoCarouselWidgetProps> = ({ photos = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate logic
    useEffect(() => {
        if (photos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % photos.length);
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [photos.length]);

    // Fallback photo
    const currentPhoto = photos[currentIndex] || {
        url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop',
        title: '週末假日市集',
        author: '攝影: 林大哥',
        communityName: '社區',
        likes: 124
    };

    return (
        <div className="h-full bg-white p-3 relative group overflow-hidden">
            {/* Background Texture mock */}
            <div className="absolute inset-0 bg-[#FAFAFA] opacity-50 patterned-dots"></div>

            <div className="h-full relative rounded-2xl overflow-hidden shadow-inner border border-[#E5E7EB] cursor-pointer">
                <img
                    key={currentPhoto.id || 'default'}
                    src={currentPhoto.url}
                    alt={currentPhoto.title}
                    className="w-full h-full object-cover transition-transform duration-[2000ms] ease-in-out group-hover:scale-110 animate-in fade-in zoom-in"
                />

                {/* Overlay Gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                <div className="absolute top-4 left-4 z-10">
                    <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-sm">
                        <ImageIcon className="w-3 h-3 text-[#44403C]" />
                        <span className="text-[10px] font-bold text-[#44403C] uppercase tracking-wide">影像藝廊</span>
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] bg-white/20 px-1.5 rounded text-white/90">{currentPhoto.communityName}</span>
                    </div>
                    <h3 className="font-serif text-lg font-medium tracking-wide text-white drop-shadow-md leading-tight">{currentPhoto.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-white/80 font-medium">{currentPhoto.author}</span>
                        <button className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1 rounded-md transition-colors">
                            <Heart className="w-3 h-3 fill-white/50 text-white" />
                            {currentPhoto.likes}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoCarouselWidget;
