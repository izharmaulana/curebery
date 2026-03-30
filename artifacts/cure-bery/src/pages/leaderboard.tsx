import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaderEntry {
  rank: number;
  name: string;
  initials: string;
  score: number;
  totalGames: number;
  badge: string;
  isYou?: boolean;
}

const BADGE_CONFIG: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  legend: { icon: "👑", label: "Legend", color: "text-yellow-700", bgColor: "bg-yellow-100 border-yellow-300" },
  master: { icon: "🏆", label: "Master", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-300" },
  expert: { icon: "🥇", label: "Expert", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-300" },
  pro: { icon: "🥈", label: "Pro", color: "text-gray-600", bgColor: "bg-gray-100 border-gray-300" },
  starter: { icon: "🥉", label: "Starter", color: "text-orange-600", bgColor: "bg-orange-100 border-orange-300" },
};

const BASE_ENTRIES = [
  { name: "Siti Rahayu, S.Kep", score: 94, totalGames: 21, badge: "legend" },
  { name: "Dewi Anggraini, S.Kep", score: 87, totalGames: 18, badge: "master" },
  { name: "Budi Santoso, S.Kep", score: 82, totalGames: 15, badge: "master" },
  { name: "Rina Kusuma, S.Kep", score: 78, totalGames: 12, badge: "expert" },
  { name: "Maya Putri, S.Kep", score: 74, totalGames: 11, badge: "expert" },
  { name: "Andi Wijaya, S.Kep", score: 69, totalGames: 9, badge: "pro" },
  { name: "Lisa Permata, S.Kep", score: 65, totalGames: 8, badge: "pro" },
  { name: "Hendra Saputra, S.Kep", score: 60, totalGames: 7, badge: "pro" },
  { name: "Nining Rahayu, S.Kep", score: 54, totalGames: 5, badge: "starter" },
  { name: "Agus Susanto, S.Kep", score: 48, totalGames: 4, badge: "starter" },
];

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("");
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 fill-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-orange-400 fill-orange-300" />;
  return <span className="text-sm font-black text-muted-foreground">{rank}</span>;
}

const podiumColors = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-orange-300 to-orange-400",
];

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "";
  const spec = params.get("spec") ?? "";
  const myScoreParam = parseInt(params.get("score") ?? "0");
  const myGamesParam = parseInt(params.get("games") ?? "1");

  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    let base = BASE_ENTRIES.map(e => ({ ...e, initials: getInitials(e.name), isYou: false }));

    const stored = JSON.parse(localStorage.getItem("quiz_leaderboard") ?? "null");
    if (stored) {
      const idx = base.findIndex(e => e.name === stored.name);
      if (idx >= 0) {
        base[idx].score = Math.max(base[idx].score, stored.score);
        base[idx].totalGames += stored.games ?? 1;
      } else {
        base.push({ name: stored.name, initials: getInitials(stored.name), score: stored.score, totalGames: stored.games ?? 1, badge: stored.score >= 80 ? "expert" : stored.score >= 60 ? "pro" : "starter", isYou: true });
      }
    }

    if (myScoreParam > 0) {
      const score = Math.round((myScoreParam / 10) * 100);
      base.push({ name: "Kamu", initials: "KM", score, totalGames: myGamesParam, badge: score >= 80 ? "expert" : score >= 60 ? "pro" : "starter", isYou: true });
    }

    base.sort((a, b) => b.score - a.score);
    const ranked: LeaderEntry[] = base.map((e, i) => ({ ...e, rank: i + 1 }));
    setEntries(ranked);
  }, [myScoreParam, myGamesParam]);

  const back = () => {
    if (opponent) {
      setLocation(`/game-select?opponent=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(spec)}`);
    } else {
      setLocation("/nurse-dashboard");
    }
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col font-sans">
      <header className="bg-white dark:bg-gray-900 border-b border-border/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={back}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold dark:text-white">Leaderboard Kuis 🏆</p>
            <p className="text-[11px] text-muted-foreground">Top perawat cerdas minggu ini</p>
          </div>
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        {/* Podium top 3 */}
        {top3.length >= 3 && (
          <div className="px-4 pt-6 pb-4">
            <div className="flex items-end justify-center gap-3">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-black text-base shadow-md">
                  {top3[1]?.initials}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold dark:text-white">{top3[1]?.name.split(",")[0]}</p>
                  <p className="text-xs font-black text-gray-500">{top3[1]?.score}pts</p>
                </div>
                <div className="w-full h-16 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl flex items-center justify-center">
                  <span className="text-xl font-black text-gray-600">2</span>
                </div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <Crown className="w-6 h-6 text-yellow-500 fill-yellow-400" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-yellow-300">
                  {top3[0]?.initials}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold dark:text-white">{top3[0]?.name.split(",")[0]}</p>
                  <p className="text-xs font-black text-amber-600">{top3[0]?.score}pts</p>
                </div>
                <div className="w-full h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-xl flex items-center justify-center">
                  <span className="text-2xl font-black text-yellow-700">1</span>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-white font-black text-base shadow-md">
                  {top3[2]?.initials}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold dark:text-white">{top3[2]?.name.split(",")[0]}</p>
                  <p className="text-xs font-black text-orange-500">{top3[2]?.score}pts</p>
                </div>
                <div className="w-full h-10 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-xl flex items-center justify-center">
                  <span className="text-lg font-black text-orange-600">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of rankings */}
        <ScrollArea className="flex-1 px-4 pb-6">
          <div className="space-y-2">
            {rest.map(entry => {
              const badge = BADGE_CONFIG[entry.badge] ?? BADGE_CONFIG.starter;
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                    entry.isYou
                      ? "bg-violet-50 dark:bg-violet-950 border-violet-300 shadow-sm"
                      : "bg-white dark:bg-gray-900 border-border/40"
                  }`}
                >
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${entry.isYou ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : "bg-gradient-to-br from-teal-400 to-emerald-500"}`}>
                    {entry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold truncate ${entry.isYou ? "text-violet-700 dark:text-violet-300" : "dark:text-white"}`}>
                        {entry.name.split(",")[0]}{entry.isYou ? " (Kamu)" : ""}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{entry.totalGames} game dimainkan</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-sm font-black text-foreground dark:text-white">{entry.score}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">pts</span></p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badge.bgColor} ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
