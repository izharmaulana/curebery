import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const nurseIcon = L.divIcon({
  className: 'custom-nurse-self-marker',
  html: `
    <div style="
      background-color: #0d9488; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 0 0 6px rgba(13, 148, 136, 0.2), 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function RecenterMap({ location }: { location: {lat: number, lng: number} }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lng], 15, { animate: true });
  }, [location, map]);
  return null;
}

export function NurseMap({ location }: { location: {lat: number, lng: number} }) {
  return (
    <div className="h-full w-full relative rounded-2xl overflow-hidden shadow-inner border border-border/50">
      <MapContainer 
        center={[location.lat, location.lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={[location.lat, location.lng]} icon={nurseIcon}>
          <Popup>Lokasi Anda Saat Ini</Popup>
        </Marker>

        <Circle 
          center={[location.lat, location.lng]} 
          radius={500} 
          pathOptions={{ fillColor: '#0d9488', fillOpacity: 0.1, color: '#0d9488', weight: 2 }} 
        />

        <RecenterMap location={location} />
      </MapContainer>
    </div>
  );
}
