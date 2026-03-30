import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Question Bank (100 entries, 10 unique stems) ─── */
interface Question {
  id: number;
  question: string;
  choices: { key: string; text: string }[];
  answer: string;
}

const QUESTION_BANK: Question[] = [
  // Pembuluh darah (×11)
  ...Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    question: "Apa nama pembuluh darah yang membawa darah dari jantung ke seluruh tubuh?",
    choices: [{ key: "A", text: "Vena" }, { key: "B", text: "Arteri" }, { key: "C", text: "Kapiler" }, { key: "D", text: "Aorta" }],
    answer: "B",
  })),
  // Sistem pernapasan (×12)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i + 12,
    question: "Organ utama dalam sistem pernapasan manusia adalah?",
    choices: [{ key: "A", text: "Jantung" }, { key: "B", text: "Paru-paru" }, { key: "C", text: "Lambung" }, { key: "D", text: "Ginjal" }],
    answer: "B",
  })),
  // Ginjal (×9)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: i + 24,
    question: "Organ yang berfungsi menyaring darah dan menghasilkan urin adalah?",
    choices: [{ key: "A", text: "Hati" }, { key: "B", text: "Paru-paru" }, { key: "C", text: "Ginjal" }, { key: "D", text: "Lambung" }],
    answer: "C",
  })),
  // Serebelum (×13)
  ...Array.from({ length: 13 }, (_, i) => ({
    id: i + 33,
    question: "Bagian otak yang mengatur keseimbangan tubuh adalah?",
    choices: [{ key: "A", text: "Serebrum" }, { key: "B", text: "Serebelum" }, { key: "C", text: "Medula oblongata" }, { key: "D", text: "Hipotalamus" }],
    answer: "B",
  })),
  // Hemoglobin (×8)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: i + 46,
    question: "Apa fungsi utama hemoglobin dalam darah?",
    choices: [{ key: "A", text: "Mengangkut oksigen" }, { key: "B", text: "Mengatur suhu tubuh" }, { key: "C", text: "Mencerna makanan" }, { key: "D", text: "Menghasilkan hormon" }],
    answer: "A",
  })),
  // Pupil (×10)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 54,
    question: "Apa nama bagian mata yang mengatur jumlah cahaya yang masuk?",
    choices: [{ key: "A", text: "Kornea" }, { key: "B", text: "Retina" }, { key: "C", text: "Pupil" }, { key: "D", text: "Lensa" }],
    answer: "C",
  })),
  // Insulin (×11)
  ...Array.from({ length: 11 }, (_, i) => ({
    id: i + 64,
    question: "Organ yang menghasilkan insulin adalah?",
    choices: [{ key: "A", text: "Hati" }, { key: "B", text: "Pankreas" }, { key: "C", text: "Ginjal" }, { key: "D", text: "Lambung" }],
    answer: "B",
  })),
  // Sel darah putih (×10)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 75,
    question: "Sel darah putih berfungsi untuk?",
    choices: [{ key: "A", text: "Mengangkut oksigen" }, { key: "B", text: "Membekukan darah" }, { key: "C", text: "Melawan infeksi" }, { key: "D", text: "Mengangkut hormon" }],
    answer: "C",
  })),
  // Kalsium (×12)
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i + 85,
    question: "Zat yang dibutuhkan tubuh untuk membentuk tulang adalah?",
    choices: [{ key: "A", text: "Zat besi" }, { key: "B", text: "Kalsium" }, { key: "C", text: "Kalium" }, { key: "D", text: "Magnesium" }],
    answer: "B",
  })),
  // Tengkorak (×4)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: i + 97,
    question: "Apa nama tulang yang melindungi otak?",
    choices: [{ key: "A", text: "Tulang rusuk" }, { key: "B", text: "Tulang belakang" }, { key: "C", text: "Tulang tengkorak" }, { key: "D", text: "Tulang dada" }],
    answer: "C",
  })),
];

/* Pick 10 unique-stem questions randomly */
function pickRandom10(): Question[] {
  const uniqueStems = new Map<string, Question[]>();
  QUESTION_BANK.forEach(q => {
    if (!uniqueStems.has(q.question)) uniqueStems.set(q.question, []);
    uniqueStems.get(q.question)!.push(q);
  });
  const stems = Array.from(uniqueStems.values());
  // Shuffle stems
  for (let i = stems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stems[i], stems[j]] = [stems[j], stems[i]];
  }
  // Pick 10, one representative per stem
  return stems.slice(0, 10).map(group => group[Math.floor(Math.random() * group.length)]);
}

const TIMER_SEC = 20;

export default function GameQuizPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "Rekan Nakes";
  const opponentSpec = params.get("spec") ?? "Perawat Umum";

  const backToConnected = () =>
    setLocation(`/nurse-connected?name=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(opponentSpec)}`);

  const [questions] = useState<Question[]>(() => pickRandom10());
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({ you: 0, opponent: 0 });
  const [timer, setTimer] = useState(TIMER_SEC);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; selectedKey: string | null }[]>([]);

  const q = questions[current];

  const handleReveal = useCallback((key: string | null) => {
    if (revealed) return;
    setSelected(key);
    setRevealed(true);
    const correct = key === q.answer;
    // Simulate opponent getting ~60% right
    const opponentCorrect = Math.random() < 0.6;
    setScores(s => ({
      you: s.you + (correct ? 1 : 0),
      opponent: s.opponent + (opponentCorrect ? 1 : 0),
    }));
    setResults(r => [...r, { correct, selectedKey: key }]);
  }, [revealed, q]);

  // Countdown timer
  useEffect(() => {
    if (revealed || done) return;
    if (timer <= 0) { handleReveal(null); return; }
    const t = setTimeout(() => setTimer(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, revealed, done, handleReveal]);

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
      setTimer(TIMER_SEC);
    }
  };

  const handleRestart = () => {
    setLocation(`/game-quiz?opponent=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(opponentSpec)}`);
    // Force re-mount
    window.location.reload();
  };

  /* ── Results screen ── */
  if (done) {
    const youWin = scores.you > scores.opponent;
    const tie = scores.you === scores.opponent;
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">
        <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
          <div className="px-4 h-14 flex items-center gap-3">
            <button onClick={backToConnected} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Kuis Selesai 🏁</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
          {/* Trophy */}
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg ${
            youWin ? "bg-yellow-400" : tie ? "bg-gray-200" : "bg-rose-100"
          }`}>
            {youWin ? "🏆" : tie ? "🤝" : "😅"}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground">
              {youWin ? "Kamu Menang!" : tie ? "Seri!" : "Kalah nih…"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {youWin ? "Wah keren banget, jago anatomi! 🔥" : tie ? "Sama kuat, tandingan nih! 💪" : "Belajar lagi yah, semangat 📚"}
            </p>
          </div>

          {/* Score card */}
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-md border border-border/40 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white text-center text-xs font-bold uppercase tracking-wide">
              Skor Akhir
            </div>
            <div className="flex">
              <div className="flex-1 text-center py-4 border-r border-border/30">
                <p className="text-3xl font-black text-violet-700">{scores.you}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Kamu</p>
              </div>
              <div className="flex-1 text-center py-4">
                <p className="text-3xl font-black text-fuchsia-700">{scores.opponent}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opponent.split(" ")[0]}</p>
              </div>
            </div>
          </div>

          {/* Per-question summary */}
          <div className="w-full max-w-xs space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${r.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                {r.correct
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <span className={`font-semibold ${r.correct ? "text-emerald-700" : "text-red-600"}`}>Soal {i + 1}</span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {r.selectedKey === null ? "Waktu habis" : r.correct ? "Benar ✓" : `Salah (jawaban: ${questions[i].answer})`}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl"
              onClick={handleRestart}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Main Lagi
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold"
              onClick={backToConnected}
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Question screen ── */
  const timerPct = (timer / TIMER_SEC) * 100;
  const timerColor = timer > 10 ? "bg-emerald-500" : timer > 5 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={backToConnected} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Kuis Cerdas Cermat 🧠</p>
            <p className="text-[11px] text-muted-foreground">vs {opponent.split(" ")[0]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-violet-700">{current + 1} / {questions.length}</p>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">

        {/* Scoreboard */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="flex">
            <div className="flex-1 text-center py-3 border-r border-border/30">
              <p className="text-xl font-black text-violet-700">{scores.you}</p>
              <p className="text-[11px] text-muted-foreground">Kamu</p>
            </div>
            <div className="flex items-center justify-center px-3">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 text-center py-3 border-l border-border/30">
              <p className="text-xl font-black text-fuchsia-700">{scores.opponent}</p>
              <p className="text-[11px] text-muted-foreground">{opponent.split(" ")[0]}</p>
            </div>
          </div>
        </div>

        {/* Timer chip */}
        <div className="flex items-center justify-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${timer <= 5 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
          <span className={`text-sm font-bold tabular-nums ${timer <= 5 ? "text-red-500" : "text-foreground"}`}>
            {timer}s
          </span>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-md p-5">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>
          </div>
        </div>

        {/* Choices */}
        <div className="space-y-2.5">
          {q.choices.map(choice => {
            const isSelected = selected === choice.key;
            const isCorrect = choice.key === q.answer;
            let bg = "bg-white border-border/50 hover:border-violet-300 hover:bg-violet-50/40";
            if (revealed) {
              if (isCorrect) bg = "bg-emerald-50 border-emerald-400 shadow-sm";
              else if (isSelected && !isCorrect) bg = "bg-red-50 border-red-400";
              else bg = "bg-white border-border/30 opacity-60";
            }
            return (
              <button
                key={choice.key}
                disabled={revealed}
                onClick={() => handleReveal(choice.key)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${bg} ${!revealed ? "active:scale-[0.98]" : ""}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                  revealed && isCorrect ? "bg-emerald-500 text-white"
                  : revealed && isSelected && !isCorrect ? "bg-red-400 text-white"
                  : "bg-gray-100 text-gray-600"
                }`}>
                  {choice.key}
                </span>
                <span className="text-sm font-medium text-foreground">{choice.text}</span>
                {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto flex-shrink-0" />}
                {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {revealed && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${
              selected === q.answer
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : selected === null
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              {selected === q.answer
                ? "✅ Benar! Kamu keren banget 🔥"
                : selected === null
                ? `⏰ Waktu habis! Jawaban: ${q.answer}`
                : `❌ Kurang tepat. Jawaban yang benar: ${q.answer}`}
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-md"
              onClick={handleNext}
            >
              {current + 1 >= questions.length ? "Lihat Hasil 🏁" : "Soal Berikutnya"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
