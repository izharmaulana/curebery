import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Star, CheckCircle2, XCircle, Clock, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePatientHistory, type PatientConnectionHistory } from "@/hooks/use-app-queries";

type DisplayStatus = "selesai" | "dibatalkan" | "berlangsung";

function getDisplayStatus(conn: PatientConnectionHistory): DisplayStatus {
  if (conn.status === "rejected" || conn.status === "cancelled") return "dibatalkan";
  if (conn.ratingGiven !== null) return "selesai";
  return "berlangsung";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; bg: string; icon: React.ElementType; iconColor: string }> = {
  selesai:     { label: "Selesai",     bg: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-500" },
  dibatalkan:  { label: "Dibatalkan",  bg: "bg-red-100 text-red-600",         icon: XCircle,      iconColor: "text-red-400"     },
  berlangsung: { label: "Berlangsung", bg: "bg-amber-100 text-amber-700",     icon: Clock,        iconColor: "text-amber-500"   },
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-muted-foreground italic">Belum dinilai</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

type FilterStatus = "semua" | "selesai" | "dibatalkan";

export default function RiwayatPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("semua");

  const { data: history = [], isLoading, isError } = usePatientHistory();

  const enriched = history.map(conn => ({
    ...conn,
    displayStatus: getDisplayStatus(conn),
    initials: getInitials(conn.nurseName),
    date: formatDate(conn.createdAt),
    time: formatTime(conn.createdAt),
  }));

  const filtered = enriched.filter(r => {
    const matchSearch = (r.nurseName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.nurseSpec ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "semua" || r.displayStatus === filter;
    return matchSearch && matchFilter;
  });

  const totalSelesai = enriched.filter(r => r.displayStatus === "selesai").length;
  const avgRating = (() => {
    const rated = enriched.filter(r => r.ratingGiven !== null);
    if (!rated.length) return "–";
    return (rated.reduce((a, r) => a + (r.ratingGiven ?? 0), 0) / rated.length).toFixed(1);
  })();
  const totalKoneksi = enriched.length;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <header className="bg-white dark:bg-gray-900 border-b border-border/50 shadow-sm flex-shrink-0 z-10">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setLocation("/patient-dashboard")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold dark:text-white">Riwayat Layanan</p>
            <p className="text-[11px] text-muted-foreground">{totalSelesai} layanan selesai</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden max-w-lg mx-auto w-full">
        <div className="flex gap-3 px-4 pt-4 pb-3">
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-2xl font-black text-primary">{totalSelesai}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Selesai</p>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-2xl font-black text-amber-500">{avgRating !== "–" ? `${avgRating}⭐` : "–"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rata-rata</p>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-2xl font-black text-blue-500">{totalKoneksi}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
          </div>
        </div>

        <div className="px-4 pb-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama perawat atau spesialisasi..."
              className="pl-9 h-10 bg-white dark:bg-gray-900 rounded-xl text-sm border-border/60"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {(["semua", "selesai", "dibatalkan"] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all capitalize ${
                  filter === f
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                {f === "semua" ? "Semua" : f === "selesai" ? "✅ Selesai" : "❌ Dibatalkan"}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="font-bold text-foreground">Gagal memuat riwayat</p>
              <p className="text-sm text-muted-foreground">Pastikan Anda sudah masuk</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-bold text-foreground">Belum ada riwayat</p>
              <p className="text-sm text-muted-foreground">
                {enriched.length > 0 ? "Coba ubah filter atau kata kunci pencarian" : "Hubungi perawat untuk memulai layanan"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.displayStatus];
                const Icon = cfg.icon;
                return (
                  <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                            {r.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">{r.nurseName ?? "Perawat"}</p>
                            <p className="text-[11px] text-muted-foreground">{r.nurseSpec ?? "–"}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Koneksi #</span>
                          <p className="font-semibold dark:text-white">{r.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tanggal</span>
                          <p className="font-semibold dark:text-white">{r.date} · {r.time}</p>
                        </div>
                      </div>

                      {r.displayStatus === "selesai" && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/20 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Penilaian:</span>
                          <StarDisplay rating={r.ratingGiven} />
                        </div>
                      )}
                      {r.reviewText && (
                        <p className="mt-2 text-[11px] text-muted-foreground italic border-t border-border/20 pt-2">
                          "{r.reviewText}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
