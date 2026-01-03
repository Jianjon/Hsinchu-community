import { useState, useEffect } from 'react';
import {
    MOCK_FOLLOWED_COMMUNITIES,
    MOCK_COMMUNITIES,
    PublicCommunity,
    PublicEvent
} from '../data/mock_public';

// Define unified interfaces for widget consumption
export interface FeedItem {
    id: string;
    communityName: string;
    communityId: string;
    avatar?: string;
    type: 'announcement' | 'event' | 'news' | 'alert' | 'discussion';
    title?: string;
    content: string;
    time: string;
    images?: string[];
    videoUrl?: string; // Placeholder for video-like content
    likes: number;
    comments: number;
    isPriority?: boolean;
}

export interface CalendarEventItem {
    id: string;
    day: string;
    month: string;
    title: string;
    time: string;
    communityName: string;
    communityId: string;
    isFollowed: boolean;
}

export interface PhotoItem {
    id: string;
    url: string;
    title: string;
    author: string;
    communityName: string;
    likes: number;
}

export interface TravelSpotItem {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rating: string;
    reviewCount: string;
    location: string;
}

const DEFAULT_LOCATION = { city: '新竹縣', district: '竹北市' };

export const useMixboardData = (userLocation: { city: string, district?: string } = DEFAULT_LOCATION) => {
    const [feeds, setFeeds] = useState<FeedItem[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [travelSpots, setTravelSpots] = useState<TravelSpotItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to find full community object
    const getCommunity = (id: string) => MOCK_COMMUNITIES.find(c => c.id === id);

    useEffect(() => {
        // Simulate data fetching delay
        const timer = setTimeout(() => {
            generateData();
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [userLocation.city, userLocation.district]); // Check properties, not object reference


    const generateData = () => {

        // 1. Generate Feeds
        // In a real app, this would be an API call to get aggregated feeds
        // Here we derive feeds from projects, events, and mock 'posts'
        // Generate ample feed items (target 30+)
        const baseFeeds: FeedItem[] = [];
        // Repeat generation loop to ensure enough content
        for (let i = 0; i < 5; i++) {
            MOCK_FOLLOWED_COMMUNITIES.forEach(followed => {
                const community = getCommunity(followed.id);
                if (!community) return;

                // From Events
                community.events.forEach((evt, idx) => {
                    baseFeeds.push({
                        id: `evt-${evt.id}-${i}-${idx}`,
                        communityName: followed.name,
                        communityId: followed.id,
                        avatar: followed.avatar,
                        type: 'event',
                        title: `【活動】${evt.title}`,
                        content: evt.description || `${evt.title} 將於 ${evt.date} 在 ${evt.location} 舉行，歡迎大家踴躍參加！`,
                        time: `${Math.floor(Math.random() * 24) + 1}小時前`,
                        images: evt.imageUrls || (evt.coverImage ? [evt.coverImage] : []),
                        likes: Math.floor(Math.random() * 50) + 10,
                        comments: Math.floor(Math.random() * 10),
                    });
                });

                // From Projects
                community.projects.forEach((proj, idx) => {
                    baseFeeds.push({
                        id: `proj-${proj.id}-${i}-${idx}`,
                        communityName: followed.name,
                        communityId: followed.id,
                        avatar: followed.avatar,
                        type: 'news',
                        title: `【專案分享】${proj.title}`,
                        content: proj.description,
                        time: `${Math.floor(Math.random() * 5) + 1}天前`,
                        images: proj.imageUrls || (proj.coverImage ? [proj.coverImage] : []),
                        likes: Math.floor(Math.random() * 100) + 20,
                        comments: Math.floor(Math.random() * 20),
                    });
                });
            });
        }

        // Add some random "Video" content mock
        baseFeeds.push({
            id: 'video-mock-1',
            communityName: '竹北生活大小事',
            communityId: 'sys-zhubei',
            avatar: '📺',
            type: 'news',
            title: '週末市集現場直擊',
            content: '這個週末的市集真的太熱鬧了！現場有超過50個攤位，還有街頭藝人表演，大家快來！',
            time: '30分鐘前',
            videoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop',
            likes: 245,
            comments: 42,
            isPriority: true
        });

        // Shuffle and limit to 30
        const finalFeeds = baseFeeds.sort(() => Math.random() - 0.5).slice(0, 30);
        setFeeds(finalFeeds);


        // 2. Generate Calendar Events
        const generatedEvents: CalendarEventItem[] = [];
        MOCK_FOLLOWED_COMMUNITIES.forEach(followed => {
            const community = getCommunity(followed.id);
            if (!community) return;

            community.events.forEach(evt => {
                const date = new Date(evt.date);
                generatedEvents.push({
                    id: evt.id,
                    day: date.getDate().toString(),
                    month: `${date.getMonth() + 1}月`,
                    title: evt.title,
                    time: evt.time,
                    communityName: followed.name,
                    communityId: followed.id,
                    isFollowed: true
                });
            });
        });
        // Sort by closest date (mock logic since dates might be old)
        setCalendarEvents(generatedEvents.slice(0, 5));


        // 3. Generate Photos
        // Collect all images from travel spots and heritage
        const allPhotos: PhotoItem[] = [];
        MOCK_COMMUNITIES.forEach(c => {
            // Travel Spots
            c.travelSpots.forEach(spot => {
                if (spot.imageUrl || spot.coverImage) {
                    allPhotos.push({
                        id: `travel-${spot.id}`,
                        url: spot.imageUrl || spot.coverImage || '',
                        title: spot.name,
                        author: `@${c.name}志工`,
                        communityName: c.name,
                        likes: Math.floor(Math.random() * 200)
                    });
                }
            });
            // Heritage
            c.cultureHeritages.forEach(h => {
                if (h.coverImage && h.photos && h.photos.length > 0) {
                    allPhotos.push({
                        id: `heritage-${h.id}`,
                        url: h.coverImage || h.photos[0],
                        title: h.name,
                        author: `@${c.name}文史組`,
                        communityName: c.name,
                        likes: Math.floor(Math.random() * 150)
                    });
                }
            });
        });
        setPhotos(allPhotos.sort(() => Math.random() - 0.5).slice(0, 10)); // Random 10


        // 4. Generate Travel Recommendations
        // Just pick random travel spots from all communities
        const allSpots: TravelSpotItem[] = [];
        MOCK_COMMUNITIES.forEach(c => {
            c.travelSpots.forEach(spot => {
                allSpots.push({
                    id: spot.id,
                    name: spot.name,
                    description: spot.description,
                    imageUrl: spot.imageUrl || spot.coverImage || 'https://images.unsplash.com/photo-1571406634509-c16773a46675',
                    rating: (4 + Math.random()).toFixed(1),
                    reviewCount: Math.floor(Math.random() * 3000).toString(),
                    location: c.district // Use district as location label
                });
            });
        });
        setTravelSpots(allSpots.sort(() => Math.random() - 0.5).slice(0, 5));
    };

    const loadMoreFeeds = () => {
        setLoading(true);
        setTimeout(() => {
            const newFeeds: FeedItem[] = [];
            // Generate 30 more items
            for (let i = 0; i < 1; i++) { // Generate 1 batch of all communities (~30 items)
                MOCK_FOLLOWED_COMMUNITIES.forEach(followed => {
                    const community = getCommunity(followed.id);
                    if (!community) return;

                    // From Events
                    community.events.forEach((evt, idx) => {
                        newFeeds.push({
                            id: `evt-${evt.id}-more-${Date.now()}-${idx}`,
                            communityName: followed.name,
                            communityId: followed.id,
                            avatar: followed.avatar,
                            type: 'event',
                            title: `【活動】${evt.title}`,
                            content: evt.description || `${evt.title} 將於 ${evt.date} 在 ${evt.location} 舉行，歡迎大家踴躍參加！`,
                            time: `${Math.floor(Math.random() * 48) + 24}小時前`,
                            images: evt.imageUrls || (evt.coverImage ? [evt.coverImage] : []),
                            likes: Math.floor(Math.random() * 50) + 10,
                            comments: Math.floor(Math.random() * 10),
                        });
                    });

                    // From Projects
                    community.projects.forEach((proj, idx) => {
                        newFeeds.push({
                            id: `proj-${proj.id}-more-${Date.now()}-${idx}`,
                            communityName: followed.name,
                            communityId: followed.id,
                            avatar: followed.avatar,
                            type: 'news',
                            title: `【專案分享】${proj.title}`,
                            content: proj.description,
                            time: `${Math.floor(Math.random() * 5) + 2}天前`,
                            images: proj.imageUrls || (proj.coverImage ? [proj.coverImage] : []),
                            likes: Math.floor(Math.random() * 100) + 20,
                            comments: Math.floor(Math.random() * 20),
                        });
                    });
                });
            }
            // Shuffle and limit to 30
            const additionalFeeds = newFeeds.sort(() => Math.random() - 0.5).slice(0, 30);

            setFeeds(prev => [...prev, ...additionalFeeds]);
            setLoading(false);
        }, 800);
    };

    return {
        feeds,
        calendarEvents,
        photos,
        travelSpots,
        loading,
        currentLocation: userLocation,
        loadMoreFeeds
    };
};
