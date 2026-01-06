
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// ... (keep default icon and custom icon logic) ...

// Helper to re-center map when props change
const MapRecenter: React.FC<{ lat: number, lng: number, zoom: number }> = ({ lat, lng, zoom }) => {
    const map = useMap();
    React.useEffect(() => {
        map.setView([lat, lng], zoom);
    }, [lat, lng, zoom, map]);
    return null;
};

// Custom Icon for Community Center
const createCustomIcon = () => {
    const iconHtml = renderToString(
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <MapPin size={16} />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
        </div>
    );
    return L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 36],
        popupAnchor: [0, -36]
    });
};

interface WikiMiniMapProps {
    lat: number;
    lng: number;
    title: string;
    zoom?: number;
}

const WikiMiniMap: React.FC<WikiMiniMapProps> = ({ lat, lng, title, zoom = 15 }) => {
    // Safety check
    if (isNaN(lat) || isNaN(lng)) {
        return (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">無座標資料</span>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={zoom}
            scrollWheelZoom={false}
            dragging={false} // Static feel like a mini-map
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter lat={lat} lng={lng} zoom={zoom} />
            <Marker position={[lat, lng]} icon={createCustomIcon()}>
                <Popup closeButton={false} autoClose={false}>
                    <div className="font-bold text-sm text-center">
                        {title}
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default WikiMiniMap;
