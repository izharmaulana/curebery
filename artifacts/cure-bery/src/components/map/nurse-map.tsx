import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NursePublicProfile } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { UserCircle, Phone } from 'lucide-react';

const NURSE_LOCATION = { lat: -6.2000, lng: 106.8400 };

const selfIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(13,148,136,0.25);animation:pulse-ring 2s ease-out infinite;"></div>
      <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:#0d9488;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

const createOtherNurseIcon = (nurse: NursePublicProfile) => {
  const initials = nurse.name.split(' ').slice(0, 2).map(w => w[0]).join('');
  const color = nurse.isOnline ? '#10b981' : '#6b7280';
  const pulse = nurse.isOnline ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${color}22;animation:pulse-ring 2s ease-out infinite 0.5s;"></div>` : '';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="width:36px;height:36px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;font-family:system-ui;">
          ${initials}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

function RecenterMap({ location }: { location: { lat: number; lng: number } }) {
  const map = useMap();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      map.setView([location.lat, location.lng], 14, { animate: true });
      firstRender.current = false;
    }
  }, [location, map]);
  return null;
}

interface NurseMapProps {
  nurses: NursePublicProfile[];
  location?: { lat: number; lng: number };
  isOnline: boolean;
  onViewProfile?: (nurse: NursePublicProfile) => void;
  onConnect?: (nurse: NursePublicProfile) => void;
  serviceRadius?: number;
}

function jitter(val: number, amount = 0.001) {
  return val + (Math.random() - 0.5) * amount;
}

export function NurseMap({ nurses, location = NURSE_LOCATION, isOnline, onViewProfile, onConnect, serviceRadius = 3 }: NurseMapProps) {
  const [liveNurses, setLiveNurses] = useState(nurses);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time movement for online nurses
  useEffect(() => {
    setLiveNurses(nurses);
  }, [nurses]);

  useEffect(() => {
    if (!isOnline) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setLiveNurses(prev =>
        prev.map(n =>
          n.isOnline
            ? { ...n, lat: jitter(n.lat, 0.0008), lng: jitter(n.lng, 0.0008) }
            : n
        )
      );
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <div className="h-full w-full relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Self location */}
          <Marker position={[location.lat, location.lng]} icon={selfIcon}>
            <Popup className="font-sans">
              <div className="font-bold text-sm text-teal-700">📍 Lokasi Anda</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isOnline ? '🟢 Anda sedang Online' : '⚫ Anda sedang Offline'}
              </div>
            </Popup>
          </Marker>

          {/* Broadcast radius */}
          <Circle
            center={[location.lat, location.lng]}
            radius={serviceRadius * 1000}
            pathOptions={{
              fillColor: '#0d9488',
              fillOpacity: 0.04,
              color: '#0d9488',
              weight: 1.5,
              dashArray: '6 4',
            }}
          />

          {/* Other nurses */}
          {liveNurses.map(nurse => (
            <Marker
              key={nurse.id}
              position={[nurse.lat, nurse.lng]}
              icon={createOtherNurseIcon(nurse)}
            >
              <Popup className="font-sans" minWidth={192}>
                <div className="w-48 p-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {nurse.avatarUrl ? (
                      <img src={nurse.avatarUrl} alt={nurse.name} className="w-10 h-10 rounded-full object-cover border border-border/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                        {nurse.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm leading-tight">{nurse.name}</p>
                      <p className="text-xs text-muted-foreground">{nurse.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${nurse.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {nurse.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </span>
                    <span className="text-amber-600 font-semibold">⭐ {nurse.rating}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {nurse.isOnline && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50 text-xs px-2"
                        onClick={() => onViewProfile?.(nurse)}
                      >
                        <UserCircle className="w-3 h-3 mr-1" /> Profil
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className={`${nurse.isOnline ? 'flex-1' : 'w-full'} bg-primary text-white hover:bg-primary/90 text-xs px-2`}
                      disabled={!nurse.isOnline}
                      onClick={() => nurse.isOnline && onConnect?.(nurse)}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {nurse.isOnline ? 'Hubungkan' : 'Offline'}
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <RecenterMap location={location} />
        </MapContainer>

        {/* Live indicator badge */}
        {isOnline && (
          <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
        )}
      </div>
    </>
  );
}
