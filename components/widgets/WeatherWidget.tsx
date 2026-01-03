import React, { useState, useEffect } from 'react';
import { CloudSun, Wind, Droplets, Sun, MapPin, CloudRain, CloudLightning, CloudFog, CloudSnow, ChevronDown, Loader2 } from 'lucide-react';
import { HSINCHU_REGION_DATA } from '../../src/data/hsinchu_administrative_data';

interface WeatherWidgetProps {
    location?: { city: string, district?: string };
}

// Open-Meteo WMO Code Mapping
const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-14 h-14 text-amber-400 drop-shadow-sm animate-pulse-slow" />;
    if (code >= 1 && code <= 3) return <CloudSun className="w-14 h-14 text-orange-300 drop-shadow-sm" />;
    if (code >= 45 && code <= 48) return <CloudFog className="w-14 h-14 text-slate-400 drop-shadow-sm" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-14 h-14 text-blue-400 drop-shadow-sm" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-14 h-14 text-sky-200 drop-shadow-sm" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-14 h-14 text-blue-500 drop-shadow-sm" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-14 h-14 text-purple-500 drop-shadow-sm" />;
    return <CloudSun className="w-14 h-14 text-slate-400 drop-shadow-sm" />;
};

const getWeatherDescription = (code: number) => {
    if (code === 0) return "晴朗";
    if (code >= 1 && code <= 3) return "多雲";
    if (code >= 45 && code <= 48) return "有霧";
    if (code >= 51 && code <= 67) return "有雨";
    if (code >= 71 && code <= 77) return "降雪";
    if (code >= 80 && code <= 82) return "陣雨";
    if (code >= 95 && code <= 99) return "雷雨";
    return "多雲"; // Default
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ location = { city: '新竹縣', district: '竹北市' } }) => {
    const [selectedDistrict, setSelectedDistrict] = useState(location.district || '竹北市');
    const [weatherData, setWeatherData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Flatten districts for easier lookup
    const allDistricts = HSINCHU_REGION_DATA.flatMap(city =>
        city.districts.map(d => ({ ...d, city: city.city }))
    );

    const currentDistrictInfo = allDistricts.find(d => d.name === selectedDistrict);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!currentDistrictInfo?.coordinates) return;

            setLoading(true);
            try {
                const { lat, lng } = currentDistrictInfo.coordinates;

                // Fetch Weather and Air Quality in parallel
                const [weatherRes, aqiRes] = await Promise.all([
                    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTaipei`),
                    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=Asia%2FTaipei`)
                ]);

                const weatherData = await weatherRes.json();
                const aqiData = await aqiRes.json();

                setWeatherData({ ...weatherData, aqi: aqiData });
            } catch (error) {
                console.error("Failed to fetch weather", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [selectedDistrict]);

    // Handle Selection Change
    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDistrict(e.target.value);
    };

    const current = weatherData?.current;
    const aqi = weatherData?.aqi?.current?.us_aqi;

    // Helper for AQI Color
    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-green-500';
        if (aqi <= 100) return 'text-yellow-500';
        if (aqi <= 150) return 'text-orange-500';
        return 'text-red-500';
    };


    return (
        <div className="h-full flex flex-col justify-between p-5 bg-gradient-to-br from-[#F0F9FF] via-[#F8FAFC] to-[#FFFFFF] relative overflow-hidden group">
            {/* Background Decorative Elements - Subtle Blue Glow */}
            <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header with Selector */}
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 relative z-20">
                        <div className="bg-blue-100 p-1.5 rounded-lg shrink-0">
                            <MapPin className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="relative">
                            <select
                                value={selectedDistrict}
                                onChange={handleLocationChange}
                                className="appearance-none bg-transparent font-serif text-lg font-bold text-[#334155] pr-6 outline-none cursor-pointer max-w-[120px]"
                            >
                                <optgroup label="新竹市">
                                    {HSINCHU_REGION_DATA.find(c => c.city === '新竹市')?.districts.map(d => (
                                        <option key={d.name} value={d.name}>{d.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="新竹縣">
                                    {HSINCHU_REGION_DATA.find(c => c.city === '新竹縣')?.districts.map(d => (
                                        <option key={d.name} value={d.name}>{d.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded-full border border-[#E2E8F0]">
                        即時天氣
                    </span>
                    {aqi !== undefined && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border bg-white/80 backdrop-blur-sm border-slate-100 shadow-sm ml-2`}>
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[8px] text-[#94A3B8] font-bold uppercase tracking-wider">AQI</span>
                            </div>
                            <span className={`text-xs font-bold ${getAqiColor(aqi)}`}>{aqi}</span>
                        </div>
                    )}

                </div>

                {/* Main Content */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-300 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Main Temp Display */}
                        <div className="flex flex-col items-center justify-center py-2 flex-shrink-0 flex-1">
                            <div className="flex items-center gap-4">
                                {getWeatherIcon(current?.weather_code || 0)}
                                <div className="flex flex-col">
                                    <span className="text-4xl font-serif text-[#334155] font-medium tracking-tighter">
                                        {current?.temperature_2m ? Math.round(current.temperature_2m) : '--'}°
                                    </span>
                                    <span className="text-xs text-[#64748B] font-medium tracking-widest pl-1">
                                        {getWeatherDescription(current?.weather_code || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="relative z-10 grid grid-cols-2 gap-2 mt-auto mb-3">
                            <div className="bg-white/80 rounded-lg p-2 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">濕度</span>
                                    <span className="text-sm font-serif text-[#475569] font-bold">
                                        {current?.relative_humidity_2m || '--'}%
                                    </span>
                                </div>
                                <Droplets className="w-4 h-4 text-blue-300" />
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">風速</span>
                                    <span className="text-sm font-serif text-[#475569] font-bold">
                                        {current?.wind_speed_10m || '--'}km
                                    </span>
                                </div>
                                <Wind className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>

                        {/* Forecast Row */}
                        <div className="relative z-10 flex justify-between pt-2 border-t border-blue-100/50">
                            {weatherData?.daily?.time?.slice(0, 4).map((date: string, i: number) => {
                                const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
                                const wCode = weatherData.daily.weather_code[i];
                                const dayLabel = new Date(date).toLocaleDateString('zh-TW', { weekday: 'short' }).replace('週', '');

                                return (
                                    <div key={date} className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-[#94A3B8] font-medium uppercase font-sans">{dayLabel}</span>
                                        <div className="scale-75 origin-center transform">
                                            {/* Simplified icons for small forecast */}
                                            {wCode <= 3 ? <CloudSun className="w-4 h-4 text-orange-300" /> : <CloudRain className="w-4 h-4 text-blue-300" />}
                                        </div>
                                        <span className="text-[10px] font-bold text-[#64748B]">{maxTemp}°</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WeatherWidget;
