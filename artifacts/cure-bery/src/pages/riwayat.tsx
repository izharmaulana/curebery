import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Star, CheckCircle2, XCircle, Clock, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceRecord {
  id: number;
  nurseName: string;
  nurseSpec: string;
  nurseInitials: string;
  date: string;
  time: string;
  service: string;
  status: "selesai" | "dibatalkan" | "berlangsung";
  rating: number | null;
  price: string;
  duration: string;
}

const MOCK_HISTORY: ServiceRecord[] = [
  { id: 1, nurseName: "Siti Rahayu, S.Kep", nurseSpec: "Perawat Umum", nurseInitials: "SR",
    date: "28 Mar 2026", time: "09:15", service: "Perawatan Luka",
    status: "selesai", rating: 5, price: "Rp 150.000", duration: "45 mnt" },
  { id: 2, nurseName: "Dewi Anggraini, S.Kep", nurseSpec: "Perawat Anak", nurseInitials: "DA",
    date: "22 Mar 2026", time: "14:30", service: "Injeksi & Suntikan",
    status: "selesai", rating: 4, price: "Rp 120.000", duration: "20 mnt" },
  { id: 3, nurseName: "Rina Kusuma, S.Kep", nurseSpec: "ICU", nurseInitials: "RK",
    date: "15 Mar 2026", time: "10:00", service: "Pemantauan Vital Signs",
    status: "dibatalkan", rating: null, price: "Rp 100.000", duration: "-" },
  { id: 4, nurseName: "Budi Santoso, S.Kep", nurseSpec: "Perawat Umum", nurseInitials: "BS",
    date: "10 Mar 2026", time: "16:45", service: "Pemasangan Infus",
    status: "selesai", rating: 5, price: "Rp 175.000", duration: "30 mnt" },
  { id: 5, nurseName: "Siti Rahayu, S.Kep", nurseSpec: "Perawat Umum", nurseInitials: "SR",
    date: "02 Mar 2026", time: "08:00", service: "Konsultasi Kesehatan",
    status: "selesai", rating: 4, price: "Rp 80.000", duration: "60 mnt" },
  { id: 6, nurseName: "Maya Putri, S.Kep", nurseSpec: "Geriatri", nurseInitials: "MP",
    date: "25 Feb 2026", time: "11:30", service: "Perawatan Luka",
    status: "selesai", rating: 3, price: "Rp 150.000", duration: "50 mnt" },
  { id: 7, nurseName: "Rina Kusuma, S.Kep", nurseSpec: "ICU", nurseInitials: "RK",
    date: "18 Feb 2026", time: "13:00", service: "Pemantauan Vital Signs",
    status: "selesai", rating: 5, price: "Rp 100.000", duration: "40 mnt" },
];

const STATUS_CONFIG = {
  selesai: { label: "Selesai", bg: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, iconColor: "text-emerald-500" },
  dibatalkan: { label: "Dibatalkan", bg: "bg-red-100 text-red-600", icon: XCircle, iconColor: "text-red-400" },
  berlangsung: { label: "Berlangsung", bg: "bg-amber-100 text-amber-700", icon: Clock, iconColor: "text-amber-500" },
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

  const filtered = MOCK_HISTORY.filter(r => {
    const matchSearch = r.nurseName.toLowerCase().includes(search.toLowerCase()) ||
      r.service.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "semua" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const totalSelesai = MOCK_HISTORY.filter(r => r.status === "selesai").length;
  const totalSpend = MOCK_HISTORY.filter(r => r.status === "selesai")
    .reduce((acc, r) => acc + parseInt(r.price.replace(/\D/g, "")), 0);
  const avgRating = (() => {
    const rated = MOCK_HISTORY.filter(r => r.rating !== null);
    if (!rated.length) return 0;
    return (rated.reduce((a, r) => a + (r.rating ?? 0), 0) / rated.length).toFixed(1);
  })();

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
            <p className="text-sm font-bold dark:text-white">Riwayat Layanan 📋</p>
            <p className="text-[11px] text-muted-foreground">{totalSelesai} layanan selesai</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden max-w-lg mx-auto w-full">
        {/* Stats row */}
        <div className="flex gap-3 px-4 pt-4 pb-3">
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-2xl font-black text-primary">{totalSelesai}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Selesai</p>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-2xl font-black text-amber-500">{avgRating}⭐</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rata-rata</p>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm p-3 text-center">
            <p className="text-xs font-black text-emerald-600">Rp {(totalSpend / 1000).toFixed(0)}rb</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="px-4 pb-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama perawat atau layanan..."
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

        {/* List */}
        <ScrollArea className="flex-1 px-4 pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-bold text-foreground">Tidak ada riwayat</p>
              <p className="text-sm text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.status];
                const Icon = cfg.icon;
                return (
                  <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                            {r.nurseInitials}
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">{r.nurseName}</p>
                            <p className="text-[11px] text-muted-foreground">{r.nurseSpec}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-muted-foreground">Layanan</span>
                          <p className="font-semibold dark:text-white">{r.service}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tanggal</span>
                          <p className="font-semibold dark:text-white">{r.date} · {r.time}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tarif</span>
                          <p className="font-semibold text-primary">{r.price}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Durasi</span>
                          <p className="font-semibold dark:text-white">{r.duration}</p>
                        </div>
                      </div>

                      {r.status === "selesai" && (
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Penilaian:</span>
                          <StarDisplay rating={r.rating} />
                        </div>
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
