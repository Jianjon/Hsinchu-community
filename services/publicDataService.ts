
// Public Data Service - Handles fetching real-time or static public data
// Logic: Try API -> Fallback to Mock Data

interface WeatherData {
    temp: string;
    condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Windy';
    rainProb: number;
    aqi: number;
    location: string;
}

interface GarbageTruckData {
    nextTime: string;
    location: string;
    type: 'general' | 'recycle';
    distance: string; // e.g. "500m"
    status: 'coming' | 'left' | 'waiting';
}

interface TransportData {
    youbike: {
        station: string;
        bikes: number;
        docks: number;
        dist: string;
    }[];
    bus: {
        stop: string;
        route: string;
        arrivalTime: string; // e.g. "3 min"
    }[];
}

// Mock Data Generators
const MOCK_WEATHER: WeatherData = {
    temp: "24°C",
    condition: "Cloudy",
    rainProb: 30,
    aqi: 45,
    location: "新竹市東區"
};

const MOCK_GARBAGE: GarbageTruckData = {
    nextTime: "19:30 Today",
    location: "建功一路 58 號前",
    type: "general",
    distance: "350m",
    status: "coming"
};

const MOCK_TRANSPORT: TransportData = {
    youbike: [
        { station: "清華大學(小吃部)", bikes: 12, docks: 8, dist: "150m" },
        { station: "建功高中", bikes: 5, docks: 20, dist: "400m" }
    ],
    bus: [
        { stop: "清華大學站", route: "藍1區", arrivalTime: "5 min" },
        { stop: "清華大學站", route: "182", arrivalTime: "12 min" }
    ]
};

export const PublicDataService = {
    getWeather: async (locationId: string): Promise<WeatherData> => {
        // TODO: Integrate CWA API
        // For now, return mock with slight randomization for "liveness"
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    ...MOCK_WEATHER,
                    temp: `${22 + Math.floor(Math.random() * 4)}°C`,
                    rainProb: Math.floor(Math.random() * 40)
                });
            }, 500);
        });
    },

    getGarbageTrucks: async (locationId: string): Promise<GarbageTruckData> => {
        // TODO: Integrate local EPA API
        return new Promise(resolve => {
            setTimeout(() => resolve(MOCK_GARBAGE), 600);
        });
    },

    getTransportInfo: async (locationId: string): Promise<TransportData> => {
        // TODO: Integrate TDX API
        return new Promise(resolve => {
            setTimeout(() => resolve(MOCK_TRANSPORT), 700);
        });
    }
};
