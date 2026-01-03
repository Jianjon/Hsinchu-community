import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { PublicCommunity } from '../data/mock_public';
import CHIEFS_DATA from '../data/hsinchu_county_chiefs.json';
import CITY_CHIEFS_DATA from '../data/hsinchu_city_chiefs.json';

interface MapSearchControlProps {
    communities: PublicCommunity[];
    onSelectLocation: (center: [number, number], zoom: number) => void;
}

export const MapSearchControl: React.FC<MapSearchControlProps> = ({ communities, onSelectLocation }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Combine chiefs data for address search
    const allChiefs = [...CHIEFS_DATA, ...CITY_CHIEFS_DATA];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (input: string) => {
        setQuery(input);
        if (!input.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsOpen(true);
        setLoading(true);
        const searchResults: any[] = [];

        // 1. Coordinate Search (Lat, Lng)
        const coordRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
        const match = input.match(coordRegex);
        if (match) {
            searchResults.push({
                type: 'coordinate',
                title: `座標: ${input}`,
                subtitle: '直接定位',
                location: [parseFloat(match[1]), parseFloat(match[3])],
                zoom: 16
            });
        }

        // 2. Local Data Search (Community Name)
        const matchedCommunities = communities.filter(c =>
            c.name.includes(input) || c.district.includes(input)
        ).slice(0, 5);

        matchedCommunities.forEach(c => {
            searchResults.push({
                type: 'community',
                title: `${c.district} ${c.name}`,
                subtitle: '社區/村里',
                location: c.location,
                zoom: 15
            });
        });

        // 3. Local Data Search (Address - via Chiefs Data)
        const matchedAddresses = allChiefs.filter(c =>
            c.address && c.address.includes(input)
        ).slice(0, 3);

        matchedAddresses.forEach(c => {
            // Find community location for this chief
            const village = communities.find(v => v.name === c.village && v.district === c.district);
            if (village && village.location) {
                searchResults.push({
                    type: 'address',
                    title: c.address,
                    subtitle: `${c.district}${c.village} 辦公處`,
                    location: village.location, // Approximate to village center
                    zoom: 16
                });
            }
        });

        // 4. External Search (Nominatim) - Debounced or on 'Enter' typically, but here we do it simple
        // Only if local results are few
        if (searchResults.length < 3 && input.length > 2) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&viewbox=120.8,25.0,121.3,24.5&bounded=1`);
                const data = await response.json();
                data.slice(0, 3).forEach((item: any) => {
                    searchResults.push({
                        type: 'external',
                        title: item.display_name.split(',')[0],
                        subtitle: item.display_name,
                        location: [parseFloat(item.lat), parseFloat(item.lon)],
                        zoom: 16
                    });
                });
            } catch (e) {
                console.error("Nominatim error", e);
            }
        }

        setResults(searchResults);
        setLoading(false);
    };

    const handleSelect = (item: any) => {
        onSelectLocation(item.location, item.zoom);
        setQuery(item.title);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm shadow-lg transition-shadow"
                    placeholder="搜尋村里、地址或座標 (lat, lng)"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (query) setIsOpen(true); }}
                />
                {query && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => { setQuery(''); setResults([]); }}>
                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </div>
                )}
            </div>

            {isOpen && (results.length > 0 || loading) && (
                <div className="absolute mt-2 w-full left-0 px-4">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 max-h-[60vh] overflow-y-auto">
                        {loading && results.length === 0 && (
                            <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" /> 搜尋中...
                            </div>
                        )}
                        {results.map((item, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors flex items-start gap-3"
                                onClick={() => handleSelect(item)}
                            >
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-medium text-gray-800">{item.title}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[250px]">{item.subtitle}</div>
                                </div>
                                {item.type === 'community' && <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">社區</span>}
                                {item.type === 'coordinate' && <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">座標</span>}
                                {item.type === 'external' && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Web</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
