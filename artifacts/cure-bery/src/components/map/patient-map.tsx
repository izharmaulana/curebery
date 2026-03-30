import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NursePublicProfile } from '@workspace/api-client-react';
import { DEFAULT_PATIENT_LOCATION } from '@/lib/dummy-data';
import { Star, Phone, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Fix for default Leaflet icons in React
const createNurseIcon = (isOnline: boolean) => L.divIcon({
  className: 'custom-nurse-marker',
  html: `
    <div style="
      background-color: ${isOnline ? '#10b981' : '#9ca3af'}; 
      width: 28px; 
      height: 28px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const patientIcon = L.divIcon({
  className: 'custom-patient-marker',
  html: `
    <div style="
      background-color: #2563eb; 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 4px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FitBounds({ nurses, location }: { nurses: NursePublicProfile[], location: {lat: number, lng: number} }) {
  const map = useMap();
  useEffect(() => {
    if (nurses.length === 0) {
      map.setView([location.lat, location.lng], 13);
      return;
    }
    const bounds = L.latLngBounds([
      [location.lat, location.lng],
      ...nurses.map(n => [n.lat, n.lng] as [number, number])
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [nurses, location, map]);
  return null;
}

interface PatientMapProps {
  nurses: NursePublicProfile[];
  userLocation?: { lat: number, lng: number };
  selectedNurseId?: number | null;
  onViewProfile?: (nurse: NursePublicProfile) => void;
  onConnect?: (nurse: NursePublicProfile) => void;
}

export function PatientMap({ nurses, userLocation = DEFAULT_PATIENT_LOCATION, selectedNurseId, onViewProfile, onConnect }: PatientMapProps) {
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[userLocation.lat, userLocation.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Patient Location */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={patientIcon}>
          <Popup className="font-sans">
            <div className="font-bold text-sm">Lokasi Anda</div>
          </Popup>
        </Marker>

        {/* Search Radius 3km */}
        <Circle 
          center={[userLocation.lat, userLocation.lng]} 
          radius={3000} 
          pathOptions={{ fillColor: '#0ea5e9', fillOpacity: 0.05, color: '#0ea5e9', weight: 1, dashArray: '4 4' }} 
        />

        {/* Nurses */}
        {nurses.map((nurse) => (
          <Marker 
            key={nurse.id} 
            position={[nurse.lat, nurse.lng]} 
            icon={createNurseIcon(nurse.isOnline)}
            zIndexOffset={selectedNurseId === nurse.id ? 1000 : (nurse.isOnline ? 500 : 0)}
          >
            <Popup className="font-sans rounded-xl">
              <div className="w-48 p-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                    {nurse.avatarUrl ? (
                      <img src={nurse.avatarUrl} alt={nurse.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-bold bg-primary/10">
                        {nurse.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-foreground">{nurse.name}</h3>
                    <div className="text-xs text-muted-foreground">{nurse.specialization}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs mb-3">
                  <Badge variant="outline" className={nurse.isOnline ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-gray-500"}>
                    {nurse.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <div className="flex items-center text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-current mr-1" />
                    {nurse.rating}
                  </div>
                </div>
                
                <div className={`flex gap-1.5 ${nurse.isOnline ? '' : ''}`}>
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

        <FitBounds nurses={nurses} location={userLocation} />
      </MapContainer>
      
      {/* Map Overlay Gradients */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-[400]" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-[400]" />
    </div>
  );
}
