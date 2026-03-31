import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Navigation, CheckCircle2, Clock, Phone, MessageSquare, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingModal } from "@/components/patient/rating-modal";
import { useGeolocation } from "@/hooks/use-geolocation";

const nurseIcon = (heading: number) => L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:3px solid white;box-shadow:0 4px 12px rgba(14,165,233,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

const homeIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);border:3px solid white;box-shadow:0 4px 12px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

function calcHeading(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  return (Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180) / Math.PI;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function AutoPan({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.panTo(pos, { animate: true, duration: 0.8 }); }, [pos]);
  return null;
}

const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 };

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const connectionId = params.get("connectionId");
  const nurseName = params.get("name") ?? "Tenaga Medis";
  const nurseSpec = params.get("spec") ?? "Tenaga Medis";
  const isNurseMode = params.get("type") === "nurse";

  const { location: gpsLocation, isGpsActive } = useGeolocation();
  const myPos = isGpsActive ? gpsLocation : DEFAULT_CENTER;

  const [remotePos, setRemotePos] = useState<{ lat: number; lng: number } | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [noGps, setNoGps] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!connectionId) return;
    const endpoint = isNurseMode
      ? `/api/connections/${connectionId}/patient-location`
      : `/api/connections/${connectionId}/nurse-location`;

    const poll = async () => {
      try {
        const res = await fetch(endpoint, { credentials: "include", cache: "no-store" });
        if (!res.ok) { setNoGps(true); return; }
        const data = await res.json();
        if (data.lat && data.lng) {
          setNoGps(false);
          setRemotePos({ lat: data.lat, lng: data.lng });
          if (!isNurseMode) {
            setTrail(prev => {
              const last = prev[prev.length - 1];
              if (last && last[0] === data.lat && last[1] === data.lng) return prev;
              return [...prev.slice(-60), [data.lat, data.lng]];
            });
          }
        }
      } catch { setNoGps(true); }
    };

    poll();
    const interval = isNurseMode ? 8000 : 4000;
    pollRef.current = setInterval(poll, interval);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [connectionId, isNurseMode]);

  const dist = remotePos ? distanceKm(myPos, remotePos) : null;
  const arrived = !isNurseMode && dist !== null && dist < 0.05;
  const nurseArrived = isNurseMode && dist !== null && dist < 0.05;

  // Patient view: stage based on nurse distance to patient
  const stageIdx = arrived ? 2 : dist !== null && dist < 0.2 ? 1 : 0;
  const STAGES_PATIENT = [
    { label: "Tenaga medis menuju lokasi Anda", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Navigation },
    { label: "Hampir tiba!", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
    { label: "Tenaga medis sudah tiba! 🎉", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  ];
  const STAGE_NURSE = nurseArrived
    ? { label: "Anda sudah tiba di lokasi pasien!", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 }
    : { label: "Navigasi ke lokasi pasien", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Navigation };

  const stage = isNurseMode ? STAGE_NURSE : STAGES_PATIENT[stageIdx];
  const StageIcon = stage.icon;

  // For nurse mode: "remote" is patient (static), "my" moves (nurse GPS)
  // For patient mode: "remote" is nurse (moves), "my" is patient (static)
  const movingPos = isNurseMode ? myPos : remotePos;     // the thing that moves
  const staticPos = isNurseMode ? remotePos : myPos;     // the static target
  const heading = movingPos && staticPos ? calcHeading(movingPos, staticPos) : 0;

  const mapCenter: [number, number] = remotePos
    ? [(myPos.lat + remotePos.lat) / 2, (myPos.lng + remotePos.lng) / 2]
    : [myPos.lat, myPos.lng];

  const backUrl = connectionId
    ? `/chat?connectionId=${connectionId}&name=${encodeURIComponent(nurseName)}&spec=${encodeURIComponent(nurseSpec)}${isNurseMode ? "&type=nurse" : ""}`
    : isNurseMode ? "/nurse-dashboard" : "/patient-dashboard";

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans">
      <header className="bg-white border-b border-border/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => setLocation(backUrl)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground leading-none">
              {isNurseMode ? "Navigasi ke Pasien" : "Lacak Tenaga Medis"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{nurseName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {connectionId && (
              <button onClick={() => setLocation(backUrl)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-blue-600 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-teal-600 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className={`flex-shrink-0 ${stage.bg} ${stage.border} border-b px-4 py-3`}>
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className={`w-9 h-9 rounded-full ${stage.bg} border ${stage.border} flex items-center justify-center flex-shrink-0`}>
            <StageIcon className={`w-5 h-5 ${stage.color} ${(!arrived && !nurseArrived) ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${stage.color}`}>{stage.label}</p>
            {dist !== null && !arrived && !nurseArrived && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Jarak: <span className="font-semibold">{dist.toFixed(2)} km</span>
                {" · "}{isNurseMode ? "Diperbarui tiap 8 detik" : "GPS diperbarui tiap 4 detik"}
              </p>
            )}
            {noGps && (
              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> {isNurseMode ? "Menunggu lokasi pasien..." : "Menunggu GPS perawat..."}
              </p>
            )}
          </div>
          {!arrived && !nurseArrived && !noGps && remotePos && (
            <div className="flex gap-1 flex-shrink-0">
              {[0, 1, 2].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${stage.color.replace("text-", "bg-")} animate-bounce`} style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        {!remotePos && !noGps && (
          <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            <p className="text-sm text-muted-foreground font-medium">
              {isNurseMode ? "Memuat lokasi pasien..." : "Mencari lokasi perawat..."}
            </p>
          </div>
        )}
        {noGps && !remotePos && (
          <div className="absolute inset-0 z-[1001] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
            <WifiOff className="w-8 h-8 text-amber-500" />
            <p className="text-sm text-amber-700 font-medium text-center px-8">
              {isNurseMode ? "Lokasi pasien belum tersedia.\nPastikan pasien sudah klik Order." : "GPS perawat belum aktif."}
            </p>
          </div>
        )}

        <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {/* Trail (only nurse moving towards patient in patient view) */}
          {!isNurseMode && trail.length > 1 && (
            <Polyline positions={trail as [number, number][]} pathOptions={{ color: "#0ea5e9", weight: 3, opacity: 0.6, dashArray: "6 4" }} />
          )}

          {/* Static target circle */}
          {staticPos && (
            <Circle center={[staticPos.lat, staticPos.lng]} radius={80} pathOptions={{ fillColor: "#10b981", fillOpacity: 0.15, color: "#10b981", weight: 1.5 }} />
          )}

          {/* Patient/home marker (static) */}
          {staticPos && <Marker position={[staticPos.lat, staticPos.lng]} icon={homeIcon} />}

          {/* Nurse marker (moving) */}
          {movingPos && (
            <>
              <Marker position={[movingPos.lat, movingPos.lng]} icon={nurseIcon(heading)} />
              {isNurseMode && <AutoPan pos={[myPos.lat, myPos.lng]} />}
              {!isNurseMode && remotePos && <AutoPan pos={[remotePos.lat, remotePos.lng]} />}
            </>
          )}
        </MapContainer>

        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border/40 px-4 py-3 flex items-center gap-4 max-w-sm mx-auto">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground font-medium">{isNurseMode ? "Anda (Perawat)" : nurseName.split(" ")[0]}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-muted-foreground font-medium">{isNurseMode ? "Lokasi Pasien" : "Lokasi Anda"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient: arrived */}
      {arrived && !isNurseMode && (
        <div className="flex-shrink-0 bg-white border-t border-border/40 px-4 py-4">
          <div className="max-w-sm mx-auto space-y-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-emerald-700">Tenaga medis sudah di lokasi Anda!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Silakan buka pintu dan sambut kedatangannya 🏠</p>
            </div>
            <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm" onClick={() => setShowRating(true)}>
              Selesai & Beri Nilai ⭐
            </Button>
          </div>
        </div>
      )}

      {/* Nurse: arrived at patient */}
      {nurseArrived && isNurseMode && (
        <div className="flex-shrink-0 bg-white border-t border-border/40 px-4 py-4">
          <div className="max-w-sm mx-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-emerald-700">Anda telah tiba di lokasi pasien! 🎉</p>
              <p className="text-xs text-emerald-600 mt-0.5">Mulai layanan dan chat dengan pasien</p>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <RatingModal
          nurseName={nurseName}
          nurseSpec={nurseSpec}
          connectionId={connectionId}
          onClose={() => { setShowRating(false); setLocation("/patient-dashboard"); }}
          onSubmit={() => { setShowRating(false); setLocation("/patient-dashboard"); }}
        />
      )}
    </div>
  );
}
