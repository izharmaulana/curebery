import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { NursePublicProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { X, Phone, CheckCircle2, Loader2, Star, MapPin } from "lucide-react";

interface ConnectModalProps {
  nurse: NursePublicProfile;
  onClose: () => void;
}

type Stage = "idle" | "requesting" | "waiting" | "accepted";

export function ConnectModal({ nurse, onClose }: ConnectModalProps) {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("idle");

  const handleSend = () => {
    setStage("requesting");
    setTimeout(() => setStage("waiting"), 1200);
    setTimeout(() => setStage("accepted"), 3200);
  };

  useEffect(() => {
    if (stage === "accepted") {
      const t = setTimeout(() => {
        setLocation(`/chat?name=${encodeURIComponent(nurse.name)}&spec=${encodeURIComponent(nurse.specialization)}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const initials = nurse.name.split(" ").map(n => n[0]).join("").substring(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={stage === "idle" ? onClose : undefined}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-6 pt-6 pb-8 text-white text-center relative">
          {stage === "idle" && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          <div className="relative inline-block mb-3">
            {nurse.avatarUrl ? (
              <img src={nurse.avatarUrl} alt={nurse.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg mx-auto" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white border-4 border-white/30 shadow-lg mx-auto">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <h2 className="font-bold text-lg leading-tight">{nurse.name}</h2>
          <p className="text-white/80 text-sm mt-0.5">{nurse.specialization}</p>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-white/70">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-white/80 text-white/80" />{nurse.rating.toFixed(1)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{nurse.distanceKm} km</span>
            <span>·</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Terverifikasi</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 -mt-4">
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 space-y-3 mb-4">
            {stage === "idle" && (
              <>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  Kirim permintaan hubungan ke <span className="font-semibold text-foreground">{nurse.name.split(" ")[0]}</span>. Tunggu konfirmasi dari mereka sebelum bisa chat.
                </p>
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100">
                  <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700 font-medium">Nego tarif dulu ya setelah terhubung!</p>
                </div>
              </>
            )}

            {stage === "requesting" && (
              <div className="py-2 text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Mengirim permintaan...</p>
                <p className="text-xs text-muted-foreground">Mohon tunggu sebentar</p>
              </div>
            )}

            {stage === "waiting" && (
              <div className="py-2 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-sm font-semibold text-foreground">Menunggu konfirmasi dari {nurse.name.split(" ")[0]}...</p>
                <p className="text-xs text-muted-foreground">Biasanya hanya beberapa detik</p>
              </div>
            )}

            {stage === "accepted" && (
              <div className="py-2 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-700">{nurse.name.split(" ")[0]} menerima permintaan!</p>
                <p className="text-xs text-muted-foreground">Mengalihkan ke halaman chat...</p>
              </div>
            )}
          </div>

          {stage === "idle" && (
            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm"
              onClick={handleSend}
            >
              <Phone className="w-4 h-4 mr-2" /> Kirim Permintaan Hubungan
            </Button>
          )}

          {stage === "idle" && (
            <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Batalkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
