import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { NursePublicProfile } from "@workspace/api-client-react";
import { X, CheckCircle2, Gamepad2, MessageCircle, Star, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomingConnectNotif } from "./incoming-connect-notif";

interface NurseConnectModalProps {
  nurse: NursePublicProfile;
  onClose: () => void;
}

type Stage = "connecting" | "waiting" | "connected" | "rejected";

export function NurseConnectModal({ nurse, onClose }: NurseConnectModalProps) {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("connecting");
  const [showNotif, setShowNotif] = useState(false);

  /* After 1.5 s — switch to waiting & show incoming notif */
  useEffect(() => {
    const t = setTimeout(() => {
      setStage("waiting");
      setShowNotif(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    setShowNotif(false);
    setStage("connected");
  };

  const handleReject = () => {
    setShowNotif(false);
    setStage("rejected");
    setTimeout(onClose, 2000);
  };

  const initials = nurse.name.split(" ").map(n => n[0]).join("").substring(0, 2);

  return (
    <>
      {/* Incoming notification — rendered outside modal overlay */}
      {showNotif && (
        <IncomingConnectNotif
          fromName={nurse.name}
          fromSpec={nurse.specialization}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={stage === "connected" ? onClose : undefined}
      >
        <div
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header gradient */}
          <div className={`px-6 pt-6 pb-8 text-white text-center relative transition-colors duration-500 ${
            stage === "rejected"
              ? "bg-gradient-to-br from-red-400 to-rose-600"
              : "bg-gradient-to-br from-teal-500 to-emerald-600"
          }`}>
            {stage === "connected" && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}

            <div className="relative inline-block mb-3">
              {nurse.avatarUrl ? (
                <img src={nurse.avatarUrl} alt={nurse.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg mx-auto" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border-4 border-white/30 shadow-lg mx-auto">
                  {initials}
                </div>
              )}
              {stage === "connected" && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
              )}
              {stage === "rejected" && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-400 rounded-full border-2 border-white flex items-center justify-center">
                  <XCircle className="w-3.5 h-3.5 text-white" />
                </span>
              )}
            </div>

            <h2 className="font-bold text-lg leading-tight">{nurse.name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{nurse.specialization}</p>
            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-white/80 text-white/80" />{nurse.rating.toFixed(1)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{nurse.distanceKm} km
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 -mt-4 space-y-4">
            {/* Status card */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
              {(stage === "connecting" || stage === "waiting") && (
                <div className="text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-teal-50 flex items-center justify-center">
                      <span className="text-lg font-bold text-teal-600">{initials}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {stage === "connecting" ? "Mengirim permintaan..." : "Menunggu konfirmasi..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stage === "connecting"
                        ? `Menghubungi ${nurse.name.split(" ")[0]}, tunggu sebentar ya`
                        : `${nurse.name.split(" ")[0]} sedang melihat notifikasimu 👀`}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {stage === "connected" && (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-700">
                    Terhubung dengan {nurse.name.split(" ")[0]}! 🎉
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mau ngapain bareng sekarang?
                  </p>
                </div>
              )}

              {stage === "rejected" && (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-red-600">
                    Permintaan ditolak 😔
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nurse.name.split(" ")[0]} tidak bisa terhubung sekarang
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons — only after connected */}
            {stage === "connected" && (
              <div className="space-y-2">
                <Button
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md text-sm"
                  onClick={() => setLocation(`/chat?name=${encodeURIComponent(nurse.name)}&spec=${encodeURIComponent(nurse.specialization)}&type=nurse`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Chat Bareng 💬
                </Button>
                <Button
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-md text-sm"
                  onClick={() => setLocation(`/game-select?opponent=${encodeURIComponent(nurse.name)}&spec=${encodeURIComponent(nurse.specialization)}`)}
                >
                  <Gamepad2 className="w-4 h-4 mr-2" /> Main Game Bareng 🎮
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10 border-border/60 text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-xl text-sm font-semibold"
                  onClick={onClose}
                >
                  <X className="w-4 h-4 mr-1.5" /> Cancel
                </Button>
              </div>
            )}

            {/* Cancel button while waiting */}
            {(stage === "connecting" || stage === "waiting") && (
              <Button
                variant="outline"
                className="w-full h-10 border-border/60 text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-xl text-sm font-semibold"
                onClick={() => { setShowNotif(false); onClose(); }}
              >
                <X className="w-4 h-4 mr-1.5" /> Batalkan Permintaan
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
