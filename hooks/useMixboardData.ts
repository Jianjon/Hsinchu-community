import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { useFavorites } from '../contexts/FavoritesContext';
import { getPublicCommunities } from '../services/publicDataAdaptor';
import { PublicCommunity, SafetyInfo } from '../data/mock_public';
import { getVillagePosts } from '../services/interactionService';

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
    const [safetyInfo, setSafetyInfo] = useState<SafetyInfo | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const { user } = useUser();
    const { favorites } = useFavorites();

    useEffect(() => {
        // Debounce or simple effect
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            await generateData();
            if (isMounted) setLoading(false);
        };

        load();

        return () => { isMounted = false; };
    }, [user, favorites, userLocation.city, userLocation.district]);


    const generateData = async () => {
        // 1. Fetch Real Data
        const allCommunities = await getPublicCommunities();

        // 2. Identify Target Communities (Home + Favorites)
        const targetIds = new Set<string>();

        // Add Favorites
        favorites.forEach(id => targetIds.add(id));

        // Add Home Village
        if (user?.township && user?.village) {
            const home = allCommunities.find(c => c.district === user.township && c.name === user.village);
            if (home) targetIds.add(home.id);
        }

        const hasPersonalData = targetIds.size > 0;

        // 3. Filter Communities
        // If user has personal data, use ONLY that (or prioritize). 
        // Request says "Calendar also same data from profile village and favorited villages".
        // If NO personal data, fallback to "Nearby" or "Random" to populate UI? 
        // Let's fallback to "All" (or random 5) to avoid empty dashboard for new users.

        let targetCommunities = hasPersonalData
            ? allCommunities.filter(c => targetIds.has(c.id))
            : allCommunities; // Fallback to all if nothing specific

        // If targetCommunities is truly empty (unlikely with fallback), handle gracefully
        if (targetCommunities.length === 0) targetCommunities = allCommunities.slice(0, 5);


        // --- A. Generate Calendar Events ---
        const generatedEvents: CalendarEventItem[] = [];
        targetCommunities.forEach(comm => {
            comm.events?.forEach(evt => {
                const date = evt.date ? new Date(evt.date) : new Date(); // Fallback date
                generatedEvents.push({
                    id: evt.id || `evt-${Math.random()}`,
                    day: date.getDate().toString(),
                    month: `${date.getMonth() + 1}月`,
                    title: evt.title,
                    time: evt.time || '09:00',
                    communityName: comm.name,
                    communityId: comm.id,
                    isFollowed: true // Implied since it's in target list
                });
            });
        });
        // Sort by coming soon (mock logic, relying on string date parsing might be flaky if format varies, but usually YYYY-MM-DD)
        generatedEvents.sort((a, b) => {
            // Simple hack sort, real app would parse 'date' properly
            return parseInt(a.day) - parseInt(b.day);
        });
        setCalendarEvents(generatedEvents.slice(0, 5)); // Top 5


        // --- B. Generate Feeds ---
        const baseFeeds: FeedItem[] = [];
        const BATCH_SIZE = 3;

        // Fetch Discussion Posts (Real Logic)
        const postsPromises = Array.from(targetIds).map(id => getVillagePosts(id));
        const postsResults = await Promise.all(postsPromises);
        const allPosts = postsResults.flat();

        allPosts.forEach(post => {
            // Resolve author details
            const authorName = post.authorName || '熱心鄰居';
            // Resolve community name
            const comm = allCommunities.find(c => c.id === post.villageId);

            baseFeeds.push({
                id: `post-${post.id}`,
                communityName: comm ? comm.name : '社區討論',
                communityId: post.villageId, // Map villageId to communityId
                avatar: post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`,
                type: 'discussion',
                title: `【${post.channelId}】${authorName}`, // Use channel as title
                content: post.content,
                time: post.createdAt ? new Date(post.createdAt).toLocaleString() : '剛剛',
                images: post.imageUrls || [], // Map imageUrls to images
                likes: post.likes || 0,
                comments: post.comments ? post.comments.length : 0, // Count comments
                isPriority: true
            });
        });

        for (let i = 0; i < BATCH_SIZE; i++) {
            targetCommunities.forEach(comm => {
                // Events -> Feed
                comm.events?.forEach((evt, idx) => {
                    baseFeeds.push({
                        id: `evt-${evt.id}-${i}-${idx}`,
                        communityName: comm.name,
                        communityId: comm.id,
                        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${comm.name}`,
                        type: 'event',
                        title: `【活動】${evt.title}`,
                        content: evt.description || `${evt.title} 歡迎參加！`,
                        time: `${Math.floor(Math.random() * 24) + 1}小時前`, // Mock relative time
                        images: evt.imageUrls || (evt.coverImage ? [evt.coverImage] : []),
                        likes: Math.floor(Math.random() * 50),
                        comments: Math.floor(Math.random() * 5),
                    });
                });

                // Projects -> Feed
                comm.projects?.forEach((proj, idx) => {
                    baseFeeds.push({
                        id: `proj-${proj.id}-${i}-${idx}`,
                        communityName: comm.name,
                        communityId: comm.id,
                        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${comm.name}`,
                        type: 'news',
                        title: `【專案】${proj.title}`,
                        content: proj.description,
                        time: `${Math.floor(Math.random() * 5) + 1}天前`,
                        images: proj.imageUrls || (proj.coverImage ? [proj.coverImage] : []),
                        likes: Math.floor(Math.random() * 100),
                        comments: Math.floor(Math.random() * 10),
                    });
                });
            });
        }

        // FALLBACK: If personalized feed is empty (no events in home/favorites), 
        // fetch from ALL communities to ensure dashboard is not empty.
        if (baseFeeds.length === 0) {
            const fallbackCommunities = allCommunities.slice(0, 10); // Pick top 10 as fallback
            for (let i = 0; i < 1; i++) { // Just 1 batch
                fallbackCommunities.forEach(comm => {
                    comm.events?.forEach((evt, idx) => {
                        baseFeeds.push({
                            id: `evt-fallback-${evt.id}-${i}-${idx}`,
                            communityName: comm.name,
                            communityId: comm.id,
                            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${comm.name}`,
                            type: 'event',
                            title: `【活動】${evt.title}`,
                            content: evt.description || `${evt.title} 歡迎參加！`,
                            time: `${Math.floor(Math.random() * 24) + 1}小時前`,
                            images: evt.imageUrls || (evt.coverImage ? [evt.coverImage] : []),
                            likes: Math.floor(Math.random() * 50),
                            comments: Math.floor(Math.random() * 5),
                            isPriority: false
                        });
                    });
                    comm.projects?.forEach((proj, idx) => {
                        baseFeeds.push({
                            id: `proj-fallback-${proj.id}-${i}-${idx}`,
                            communityName: comm.name,
                            communityId: comm.id,
                            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${comm.name}`,
                            type: 'news',
                            title: `【專案】${proj.title}`,
                            content: proj.description,
                            time: `${Math.floor(Math.random() * 5) + 1}天前`,
                            images: proj.imageUrls || (proj.coverImage ? [proj.coverImage] : []),
                            likes: Math.floor(Math.random() * 100),
                            comments: Math.floor(Math.random() * 10),
                            isPriority: false
                        });
                    });
                });
            }
        }

        setFeeds(baseFeeds.sort(() => Math.random() - 0.5).slice(0, 30));


        // --- C. Generate Photos ---
        const allPhotos: PhotoItem[] = [];
        targetCommunities.forEach(c => {
            c.travelSpots?.forEach(spot => {
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
            c.cultureHeritages?.forEach(h => {
                if (h.coverImage || (h.photos && h.photos.length > 0)) {
                    allPhotos.push({
                        id: `heritage-${h.id}`,
                        url: h.coverImage || h.photos?.[0] || '',
                        title: h.name,
                        author: `@${c.name}文史組`,
                        communityName: c.name,
                        likes: Math.floor(Math.random() * 150)
                    });
                }
            });
        });
        setPhotos(allPhotos.sort(() => Math.random() - 0.5).slice(0, 10));


        // --- D. Generate Travel Recommendations ---
        const allSpots: TravelSpotItem[] = [];
        targetCommunities.forEach(c => {
            c.travelSpots?.forEach(spot => {
                allSpots.push({
                    id: spot.id,
                    name: spot.name,
                    description: spot.description,
                    imageUrl: spot.imageUrl || spot.coverImage || 'https://images.unsplash.com/photo-1571406634509-c16773a46675',
                    rating: (4 + Math.random()).toFixed(1),
                    reviewCount: Math.floor(Math.random() * 3000).toString(),
                    location: c.district
                });
            });
        });
        setTravelSpots(allSpots.sort(() => Math.random() - 0.5).slice(0, 5));

        // --- E. Safety Info (Context Based) ---
        // Find community matching current location to show relevant safety info
        const currentContextCommunity = allCommunities.find(c =>
            c.city === userLocation.city &&
            (c.district === userLocation.district || !userLocation.district)
        );

        // If specific village found in the context (often the first one in the filtered list if specific village logic existed), use it.
        // For now, use the first matching community's safety info
        if (currentContextCommunity && currentContextCommunity.safety) {
            setSafetyInfo(currentContextCommunity.safety);
        } else if (hasPersonalData && targetCommunities.length > 0) {
            // Fallback to home village safety if available
            setSafetyInfo(targetCommunities[0].safety);
        }
    };

    const loadMoreFeeds = () => {
        // Simplified load more - just mimics fetching more random items from cached 'targetCommunities' if we stored them 
        // For now, re-triggering logic or just ignoring effectively since we generated 30 items
        // To properly support infinite scroll, we'd need to paginate. 
        // For this demo, let's just append a few mock items.
    };

    return {
        feeds,
        calendarEvents,
        photos,
        travelSpots,
        safetyInfo,
        loading,
        currentLocation: userLocation,
        loadMoreFeeds
    };
};
