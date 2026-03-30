import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useMockableNearbyNurses } from "@/hooks/use-app-queries";
import { DEFAULT_PATIENT_LOCATION } from "@/lib/dummy-data";
import { PatientMap } from "@/components/map/patient-map";
import { NurseCard } from "@/components/patient/nurse-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HeartPulse, LogOut, Loader2, SlidersHorizontal, MapPin, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PatientDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");

  const demoUser = { id: 0, name: "Demo Pasien", email: "demo@cureberry.id", role: "patient" as const };
  const activeUser = (user && user.role === 'patient') ? user : demoUser;

  const { data: nurses, isLoading, error } = useMockableNearbyNurses(
    DEFAULT_PATIENT_LOCATION.lat,
    DEFAULT_PATIENT_LOCATION.lng,
    3
  );

  const filteredNurses = useMemo(() => {
    if (!nurses) return [];
    return nurses.filter(n =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nurses, searchQuery]);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const NurseListContent = () => (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Mencari perawat terdekat...</p>
        </div>
      ) : error ? (
        <div className="text-center p-6 text-destructive bg-destructive/5 rounded-xl border border-destructive/10">
          <p className="font-medium">Gagal memuat data.</p>
          <p className="text-sm opacity-80 mt-1">Silakan coba beberapa saat lagi.</p>
        </div>
      ) : filteredNurses.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl border border-border/50 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="font-bold text-foreground">Tidak ditemukan</h4>
          <p className="text-sm text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNurses.map((nurse) => (
            <div
              key={nurse.id}
              onMouseEnter={() => setSelectedNurseId(nurse.id)}
              onMouseLeave={() => setSelectedNurseId(null)}
            >
              <NurseCard
                nurse={nurse}
                onClick={(n) => setSelectedNurseId(n.id)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">

      {/* ── DESKTOP: Sidebar + Map side by side ── */}
      <aside className="hidden md:flex w-[420px] flex-shrink-0 bg-white shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] z-10 flex-col border-r border-border/50">
        <header className="px-6 py-5 border-b border-border/50 bg-white flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground leading-tight">CureBery</h1>
              <p className="text-xs text-muted-foreground font-medium">Dashboard Pasien</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-gray-50 to-white">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            Halo, {activeUser.name.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Temukan perawat terbaik di sekitar Anda
          </p>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau spesialisasi..."
                className="pl-10 h-11 bg-white border-border/60 shadow-sm rounded-xl focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-foreground" />
            </Button>
          </div>
        </div>

        <div className="px-6 py-3 flex justify-between items-center border-b border-border/30 bg-white">
          <h3 className="font-bold text-sm text-foreground">Perawat Terdekat (Radius 3km)</h3>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {filteredNurses.length} Tersedia
          </span>
        </div>

        <ScrollArea className="flex-1 bg-gray-50/50 p-6 pt-4">
          <NurseListContent />
        </ScrollArea>
      </aside>

      <main className="hidden md:block flex-1 relative bg-gray-100">
        <PatientMap
          nurses={filteredNurses}
          userLocation={DEFAULT_PATIENT_LOCATION}
          selectedNurseId={selectedNurseId}
        />
      </main>

      {/* ── MOBILE: Full screen with tab switcher ── */}
      <div className="flex md:hidden flex-col w-full h-full">

        {/* Mobile Header */}
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-border/50 shadow-sm z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-base text-foreground leading-none">CureBery</h1>
              <p className="text-[11px] text-muted-foreground">Halo, {activeUser.name.split(' ')[0]} 👋</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive rounded-full w-8 h-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Mobile Tab Bar */}
        <div className="bg-white border-b border-border/50 flex z-10">
          <button
            onClick={() => setMobileTab("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
              mobileTab === "list"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            Daftar Perawat
          </button>
          <button
            onClick={() => setMobileTab("map")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
              mobileTab === "map"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Peta
          </button>
        </div>

        {/* Mobile: Nurse List Tab */}
        {mobileTab === "list" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 pt-4 pb-3 bg-white border-b border-border/30">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau spesialisasi..."
                    className="pl-9 h-10 bg-gray-50 border-border/60 rounded-xl text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl flex-shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Radius 3km dari lokasi Anda</p>
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {filteredNurses.length} tersedia
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1 bg-gray-50/50 p-4">
              <NurseListContent />
            </ScrollArea>
          </div>
        )}

        {/* Mobile: Map Tab */}
        {mobileTab === "map" && (
          <div className="flex-1 relative">
            <PatientMap
              nurses={filteredNurses}
              userLocation={DEFAULT_PATIENT_LOCATION}
              selectedNurseId={selectedNurseId}
            />
            {/* Floating nurse count badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground">{filteredNurses.filter(n => n.isOnline).length} perawat online</span>
            </div>
            {/* Switch to list button */}
            <button
              onClick={() => setMobileTab("list")}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl rounded-full px-5 py-3 flex items-center gap-2 border border-border/30 text-sm font-semibold text-foreground active:scale-95 transition-transform"
            >
              <List className="w-4 h-4 text-blue-600" />
              Lihat Daftar Perawat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
