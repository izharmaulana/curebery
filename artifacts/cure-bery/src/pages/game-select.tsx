import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Grid3x3, Brain } from "lucide-react";

export default function GameSelectPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "Rekan Nakes";
  const spec = params.get("spec") ?? "Perawat Umum";

  const backToConnected = () =>
    setLocation(`/nurse-connected?name=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(spec)}`);

  const qp = `opponent=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(spec)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">
      <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={backToConnected}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Pilih Game 🎮</p>
            <p className="text-[11px] text-muted-foreground">Bareng {opponent.split(" ")[0]}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-center mb-2">
          <h2 className="text-xl font-black text-foreground">Mau main apa? 🤔</h2>
          <p className="text-sm text-muted-foreground mt-1">Pilih game yang mau dimainkan bareng {opponent.split(" ")[0]}</p>
        </div>

        {/* Tic-Tac-Toe card */}
        <button
          onClick={() => setLocation(`/game?${qp}`)}
          className="w-full max-w-sm bg-white rounded-2xl border-2 border-violet-200 hover:border-violet-400 hover:shadow-lg transition-all duration-200 p-5 text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Grid3x3 className="w-7 h-7 text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-base text-foreground">Tic-Tac-Toe ✕ ○</p>
              <p className="text-xs text-muted-foreground mt-0.5">Strategi klasik 3×3, giliran bergantian</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2 Pemain</span>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Santai</span>
              </div>
            </div>
          </div>
        </button>

        {/* Quiz card */}
        <button
          onClick={() => setLocation(`/game-quiz?${qp}`)}
          className="w-full max-w-sm bg-white rounded-2xl border-2 border-fuchsia-200 hover:border-fuchsia-400 hover:shadow-lg transition-all duration-200 p-5 text-left active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-7 h-7 text-fuchsia-600" />
            </div>
            <div>
              <p className="font-bold text-base text-foreground">Kuis Cerdas Cermat 🧠</p>
              <p className="text-xs text-muted-foreground mt-0.5">10 soal acak dari 5 kategori seputar dunia nakes</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="bg-fuchsia-100 text-fuchsia-700 text-[10px] font-bold px-2 py-0.5 rounded-full">500 Bank Soal</span>
                <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full">5 Kategori</span>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Timer 20d</span>
              </div>
            </div>
          </div>
        </button>

        <p className="text-xs text-muted-foreground italic text-center">
          sambil nunggu pasien, asah otak dulu! 🔥
        </p>
      </div>
    </div>
  );
}
