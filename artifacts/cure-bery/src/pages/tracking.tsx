import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Navigation, CheckCircle2, Clock, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingModal } from "@/components/patient/rating-modal";
import { DEFAULT_PATIENT_LOCATION } from "@/lib/dummy-data";

const NURSE_START = { lat: -6.1900, lng: 106.8300 };
const PATIENT = DEFAULT_PATIENT_LOCATION;
const STEPS = 60;

const nurseIcon = (heading: number) => L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#0ea5e9,#0284c7);
    border:3px solid white;
    box-shadow:0 4px 12px rgba(14,165,233,0.5);
    display:flex;align-items:center;justify-content:center;
    transform:rotate(${heading}deg);
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const patientIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#10b981,#059669);
    border:3px solid white;
    box-shadow:0 4px 12px rgba(16,185,129,0.5);
    display:flex;align-items:center;justify-content:center;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function calcHeading(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function AutoPan({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(pos, { animate: true, duration: 0.8 });
  }, [pos]);
  return null;
}

const STAGES = [
  { label: "Tenaga medis menuju lokasi Anda", icon: Navigation, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { label: "Hampir tiba!", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Tenaga medis sudah tiba! 🎉", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
];

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const nurseName = params.get("name") ?? "Tenaga Medis";
  const nurseSpec = params.get("spec") ?? "Tenaga Medis";

  const [showRating, setShowRating] = useState(false);
  const [step, setStep] = useState(0);
  const [nursePos, setNursePos] = useState(NURSE_START);
  const [trail, setTrail] = useState<[number, number][]>([[NURSE_START.lat, NURSE_START.lng]]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const arrived = step >= STEPS;
  const stageIdx = arrived ? 2 : step > STEPS * 0.75 ? 1 : 0;
  const stage = STAGES[stageIdx];
  const StageIcon = stage.icon;

  const remaining = arrived ? 0 : Math.ceil(((STEPS - step) / STEPS) * 12);
  const dist = distanceKm(nursePos, PATIENT).toFixed(1);
  const heading = calcHeading(nursePos, PATIENT);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep(prev => {
        if (prev >= STEPS) {
          clearInterval(intervalRef.current!);
          return prev;
        }
        const next = prev + 1;
        const t = next / STEPS;
        const wiggle = Math.sin(next * 0.7) * 0.0004;
        const newPos = {
          lat: lerp(NURSE_START.lat, PATIENT.lat, t) + wiggle,
          lng: lerp(NURSE_START.lng, PATIENT.lng, t) + wiggle * 0.5,
        };
        setNursePos(newPos);
        setTrail(tr => [...tr, [newPos.lat, newPos.lng]]);
        return next;
      });
    }, 800);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const midLat = (NURSE_START.lat + PATIENT.lat) / 2;
  const midLng = (NURSE_START.lng + PATIENT.lng) / 2;

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setLocation("/patient-dashboard")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground leading-none">Lacak Tenaga Medis</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{nurseName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocation(`/chat?name=${encodeURIComponent(nurseName)}`)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-teal-600 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Status banner */}
      <div className={`flex-shrink-0 ${stage.bg} ${stage.border} border-b px-4 py-3`}>
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className={`w-9 h-9 rounded-full ${stage.bg} border ${stage.border} flex items-center justify-center flex-shrink-0`}>
            <StageIcon className={`w-5 h-5 ${stage.color} ${stageIdx === 0 ? "animate-pulse" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${stage.color}`}>{stage.label}</p>
            {!arrived && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Estimasi tiba: <span className="font-semibold">{remaining} menit</span>
                {" · "}Jarak: <span className="font-semibold">{dist} km</span>
              </p>
            )}
          </div>
          {!arrived && (
            <div className="flex gap-1 flex-shrink-0">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${stage.color.replace("text-", "bg-")} animate-bounce`}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[midLat, midLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Trail line */}
          {trail.length > 1 && (
            <Polyline
              positions={trail as [number, number][]}
              pathOptions={{ color: "#0ea5e9", weight: 3, opacity: 0.6, dashArray: "6 4" }}
            />
          )}

          {/* Patient pulse ring */}
          <Circle
            center={[PATIENT.lat, PATIENT.lng]}
            radius={80}
            pathOptions={{ fillColor: "#10b981", fillOpacity: 0.15, color: "#10b981", weight: 1.5 }}
          />

          {/* Patient marker */}
          <Marker position={[PATIENT.lat, PATIENT.lng]} icon={patientIcon} />

          {/* Nurse marker */}
          <Marker
            position={[nursePos.lat, nursePos.lng]}
            icon={nurseIcon(arrived ? 0 : heading)}
          />

          <AutoPan pos={[nursePos.lat, nursePos.lng]} />
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border/40 px-4 py-3 flex items-center gap-4 max-w-sm mx-auto">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground font-medium">{nurseName.split(" ")[0]}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-muted-foreground font-medium">Lokasi Anda</span>
            </div>
            {!arrived && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-blue-400" />
                  <span className="text-muted-foreground font-medium">Rute</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      {arrived && (
        <div className="flex-shrink-0 bg-white border-t border-border/40 px-4 py-4">
          <div className="max-w-sm mx-auto space-y-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-emerald-700">Tenaga medis sudah di lokasi Anda!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Silakan buka pintu dan sambut kedatangannya 🏠</p>
            </div>
            <Button
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm"
              onClick={() => setShowRating(true)}
            >
              Selesai & Beri Nilai ⭐
            </Button>
          </div>
        </div>
      )}

      {showRating && (
        <RatingModal
          nurseName={nurseName}
          nurseSpec={nurseSpec}
          onClose={() => { setShowRating(false); setLocation("/patient-dashboard"); }}
          onSubmit={() => { setShowRating(false); setLocation("/patient-dashboard"); }}
        />
      )}
    </div>
  );
}
