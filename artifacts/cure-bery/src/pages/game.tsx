import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";

const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWinner(board: (string|null)[]) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

export default function Game() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "Rekan Nakes";
  const connectionId = params.get("connectionId");
  const opponentFirst = opponent.split(" ")[0];

  const [board, setBoard] = useState<(string|null)[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState<string|null>(null);
  const [myMark, setMyMark] = useState<"X"|"O">("X");
  const [myUserId, setMyUserId] = useState<number|null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (connectionId) {
      fetch(`/api/nurse-connections/${connectionId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState: "playing" })
      });
    }
  }, [connectionId]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMyUserId(data.id);
          if (connectionId) {
            fetch(`/api/nurse-connections/${connectionId}`, { credentials: "include" })
              .then(r => r.json())
              .then(conn => { if (conn.requesterUserId === data.id) setMyMark("X"); else setMyMark("O"); });
          }
        }
      });
  }, [connectionId]);

  const fetchState = useCallback(async () => {
    if (!connectionId) return;
    const res = await fetch(`/api/nurse-connections/${connectionId}/game-state`, { credentials: "include", cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setBoard(data.board);
      setIsXTurn(data.isXTurn);
      setWinner(data.winner);
    }
  }, [connectionId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    if (!connectionId) return;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/nurse-connections/${connectionId}`, { credentials: "include" });
        if (!r.ok) return;
        const d = await r.json();
        if (d.gameState === "game_exited") { clearInterval(poll); setGameEnded(true); }
      } catch {}
    }, 2000);
    return () => clearInterval(poll);
  }, [connectionId]);

  const handleClick = async (i: number) => {
    if (!connectionId || board[i] || winner) return;
    const isMyTurn = (isXTurn && myMark === "X") || (!isXTurn && myMark === "O");
    if (!isMyTurn) return;
    const newBoard = [...board];
    newBoard[i] = myMark;
    const newWinner = checkWinner(newBoard);
    const newIsXTurn = !isXTurn;
    setBoard(newBoard);
    setIsXTurn(newIsXTurn);
    setWinner(newWinner);
    await fetch(`/api/nurse-connections/${connectionId}/game-state`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board: newBoard, isXTurn: newIsXTurn, winner: newWinner })
    });
  };

  const resetGame = async () => {
    const newState = { board: Array(9).fill(null), isXTurn: true, winner: null };
    setBoard(newState.board);
    setIsXTurn(newState.isXTurn);
    setWinner(newState.winner);
    if (connectionId) {
      await fetch(`/api/nurse-connections/${connectionId}/game-state`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState)
      });
    }
  };

  const exitGame = async () => {
    if (connectionId) {
      await fetch(`/api/nurse-connections/${connectionId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameState: "game_exited" })
      });
    }
    setGameEnded(true);
  };

  const isMyTurn = (isXTurn && myMark === "X") || (!isXTurn && myMark === "O");
  const status = winner
    ? winner === "draw" ? "Seri! 🤝" : winner === myMark ? "Kamu menang! 🏆" : `${opponentFirst} menang! 🏆`
    : isMyTurn ? "Giliran kamu!" : `Giliran ${opponentFirst}...`;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-4 shadow-xl text-center">
            <p className="text-lg font-bold text-red-500 mb-2">Game Dihentikan</p>
            <p className="text-sm text-gray-500 mb-4">Salah satu pemain keluar dari permainan.</p>
            <button onClick={() => setLocation(`/game-select?connectionId=${connectionId}&opponent=${encodeURIComponent(opponent)}`)} className="bg-violet-500 text-white px-6 py-2 rounded-xl font-bold text-sm">Kembali ke Pilihan Game</button>
          </div>
        </div>
      )}
      <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3 border-b border-border/50 shadow-sm">
        <button onClick={async () => { if (connectionId) await fetch(`/api/nurse-connections/${connectionId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameState: "playing" }) }); setLocation(`/nurse-chat?connectionId=${connectionId}&name=${encodeURIComponent(opponent)}`); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm">Tic-Tac-Toe</p>
          <p className="text-xs text-muted-foreground">vs {opponentFirst} • Kamu: {myMark}</p>
        </div>
        <button onClick={exitGame} className="text-xs text-red-500 font-bold px-3 py-1 rounded-full border border-red-200 hover:bg-red-50">Keluar</button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl px-6 py-3 shadow-sm">
          <p className="text-sm font-semibold text-center">{status}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, i) => (
            <button key={i} onClick={() => handleClick(i)}
              className={`w-24 h-24 rounded-xl text-3xl font-bold flex items-center justify-center border-2 transition-all
                ${cell === "X" ? "border-violet-400 text-violet-500 bg-violet-50" : cell === "O" ? "border-teal-400 text-teal-500 bg-teal-50" : "border-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50"}`}>
              {cell}
            </button>
          ))}
        </div>
        {winner && (
          <button onClick={resetGame} className="bg-violet-500 text-white px-6 py-2 rounded-full font-bold text-sm">
            Main Lagi
          </button>
        )}
      </div>
    </div>
  );
}