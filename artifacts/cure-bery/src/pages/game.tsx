import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Cell = "X" | "O" | null;

const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function calcWinner(b: Cell[]): { winner: Cell; line: number[] } | null {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a, c, d] };
  }
  return null;
}

export default function GamePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "Rekan Nakes";
  const opponentSpec = params.get("spec") ?? "Perawat Umum";
  const opponentFirst = opponent.split(" ")[0];

  const backToConnected = () =>
    setLocation(`/nurse-connected?name=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(opponentSpec)}`);

  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const result = calcWinner(board);
  const isDraw = !result && board.every(Boolean);
  const currentMark = isX ? "X" : "O";
  const status = result
    ? `${result.winner === "X" ? "Kamu" : opponentFirst} menang! 🏆`
    : isDraw
    ? "Seri! 🤝"
    : `Giliran ${isX ? "Kamu" : opponentFirst} (${currentMark})`;

  const handleClick = (i: number) => {
    if (board[i] || result) return;
    const next = board.slice();
    next[i] = currentMark;
    setBoard(next);
    const r = calcWinner(next);
    if (r) setScores(s => ({ ...s, [r.winner!]: s[r.winner!] + 1 }));
    setIsX(p => !p);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsX(true);
  };

  const winLine = result?.line ?? [];

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-violet-50 to-fuchsia-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={backToConnected}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-sm text-foreground leading-none">Main Bareng 🎮</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">vs {opponentFirst}</p>
          </div>
          <button
            onClick={reset}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">

        {/* Score board */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 bg-white rounded-2xl border border-violet-200 shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium mb-1">Kamu (X)</p>
            <p className="text-3xl font-black text-violet-600">{scores.X}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground font-semibold">VS</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-fuchsia-200 shadow-sm p-3 text-center">
            <p className="text-xs text-muted-foreground font-medium mb-1">{opponentFirst} (O)</p>
            <p className="text-3xl font-black text-fuchsia-600">{scores.O}</p>
          </div>
        </div>

        {/* Status */}
        <div className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm border ${
          result
            ? result.winner === "X"
              ? "bg-violet-100 border-violet-300 text-violet-700"
              : "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700"
            : isDraw
            ? "bg-amber-100 border-amber-300 text-amber-700"
            : "bg-white border-border/50 text-foreground"
        }`}>
          {status}
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {board.map((cell, i) => {
            const isWinCell = winLine.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={!!cell || !!result}
                className={`aspect-square rounded-2xl text-4xl font-black flex items-center justify-center transition-all duration-150 border-2 shadow-sm
                  ${cell === "X" ? "text-violet-600" : "text-fuchsia-600"}
                  ${isWinCell
                    ? "bg-amber-100 border-amber-400 scale-105 shadow-md"
                    : cell
                    ? "bg-white border-border/50"
                    : "bg-white border-border/40 hover:border-violet-300 hover:bg-violet-50 active:scale-95"
                  }`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            onClick={reset}
            className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-md"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" /> Main Lagi
          </Button>
          <Button
            variant="outline"
            onClick={backToConnected}
            className="flex-1 h-11 border-border/60 rounded-xl font-bold text-muted-foreground hover:text-foreground"
          >
            Keluar
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground italic text-center">
          Sambil nunggu pasien, main dulu gaesss 😄
        </p>
      </div>
    </div>
  );
}
