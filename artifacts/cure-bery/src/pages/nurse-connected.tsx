import { useSearch, useLocation } from "wouter";
import { CheckCircle2, MessageCircle, Gamepad2, ArrowLeft, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NurseConnectedPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const name = params.get("name") ?? "Tenaga Medis";
  const spec = params.get("spec") ?? "Perawat Umum";
  const rating = parseFloat(params.get("rating") ?? "4.8");
  const distance = parseFloat(params.get("dist") ?? "1.2");

  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Back to dashboard */}
        <button
          onClick={() => setLocation("/nurse-dashboard")}
          className="flex items-center gap-2 text-sm text-teal-700 font-semibold hover:text-teal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </button>

        {/* Connected card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-6 pt-6 pb-10 text-white text-center relative">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border-4 border-white/30 shadow-lg mx-auto">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
            </div>
            <h2 className="font-bold text-lg leading-tight">{name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{spec}</p>
            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-white/80 text-white/80" />{rating.toFixed(1)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{distance.toFixed(1)} km
              </span>
            </div>
          </div>

          {/* Status pill */}
          <div className="flex justify-center -mt-5 mb-1 relative z-10">
            <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Sedang Terhubung
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-3 pb-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Mau ngapain bareng <span className="font-semibold text-foreground">{name.split(" ")[0]}</span> sekarang?
            </p>

            <Button
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md text-sm"
              onClick={() =>
                setLocation(`/chat?name=${encodeURIComponent(name)}&spec=${encodeURIComponent(spec)}&type=nurse`)
              }
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Chat Bareng 💬
            </Button>

            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-md text-sm"
              onClick={() =>
                setLocation(`/game-select?opponent=${encodeURIComponent(name)}&spec=${encodeURIComponent(spec)}`)
              }
            >
              <Gamepad2 className="w-4 h-4 mr-2" /> Main Game Bareng 🎮
            </Button>

            <Button
              variant="outline"
              className="w-full h-10 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold rounded-xl text-sm"
              onClick={() => setLocation("/nurse-dashboard")}
            >
              Putuskan Koneksi
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground italic">
          Koneksi aktif selama kamu di halaman ini 🟢
        </p>
      </div>
    </div>
  );
}
