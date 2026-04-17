import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useNearbyNurses } from "@/hooks/use-app-queries";
import { PatientMap } from "@/components/map/patient-map";
import { NurseCard } from "@/components/patient/nurse-card";
import { NurseProfileSheet } from "@/components/patient/nurse-profile-sheet";
import { ConnectModal } from "@/components/patient/connect-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HeartPulse, Stethoscope, Send, ChevronRight, LogOut, Loader2, SlidersHorizontal, MapPin, List, ClipboardList, Moon, Sun, Navigation } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NursePublicProfile } from "@workspace/api-client-react";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function PatientDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const [profileNurse, setProfileNurse] = useState<NursePublicProfile | null>(null);
  const [connectNurse, setConnectNurse] = useState<NursePublicProfile | null>(null);
  const [radius, setRadius] = useState(3);

  const RADIUS_OPTIONS = [1, 3, 5, 10, 20, 50, 100, 500, 5000];

  const demoUser = { id: 0, name: "Demo Klien", email: "demo@cureberry.id", role: "patient" as const };
  const isLoggedIn = !!(user && user.role === 'patient');
  const activeUser = isLoggedIn ? user! : demoUser;

  const { location: gpsLocation, isGpsActive, loading: gpsLoading } = useGeolocation();

  const { data: nurses, isLoading, error } = useNearbyNurses(
    Math.round(gpsLocation.lat * 1000) / 1000,
    Math.round(gpsLocation.lng * 1000) / 1000,
    radius
  );

  const filteredNurses = useMemo(() => {
    if (!nurses) return [];
    return nurses.filter(n =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nurses, searchQuery]);

  const { isDark, toggle: toggleTheme } = useThemeStore();

  const [activeConn, setActiveConn] = useState<{id: number, nurseName: string, status: string, orderStatus: string} | null>(null);

  useEffect(() => {
    if (localStorage.getItem("session_ended") === "1") {
      localStorage.removeItem("session_ended");
      setActiveConn(null);
    }
  }, []);

  const checkActiveConn = () => {
    fetch(`/api/connections/patient-history?t=${Date.now()}`, { credentials: "include", cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const active = data.find((c: any) => c.status === "accepted" && c.orderStatus !== "completed");
          setActiveConn(active ? { id: active.id, nurseName: active.nurseName, status: active.status, orderStatus: active.orderStatus ?? "none" } : null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    checkActiveConn();
    const interval = setInterval(checkActiveConn, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") checkActiveConn(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Yakin mau keluar akun?")) return;
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    logout();
    setLocation('/');
  };

  const NurseListContent = () => (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Mencari tenaga medis terdekat...</p>
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
        <div className="space-y-2.5">
          {filteredNurses.map((nurse) => (
            <div
              key={nurse.id}
              onMouseEnter={() => setSelectedNurseId(nurse.id)}
              onMouseLeave={() => setSelectedNurseId(null)}
            >
              <NurseCard
                nurse={nurse}
                onClick={(n) => setSelectedNurseId(n.id)}
                onViewProfile={(n) => setProfileNurse(n)}
                onConnect={(n) => {
                  if (!isLoggedIn) { setLocation("/"); return; }
                  setConnectNurse(n);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">

      {/* ── DESKTOP: Sidebar + Map side by side ── */}
      <aside className="hidden md:flex w-[420px] flex-shrink-0 bg-white dark:bg-gray-900 shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)] z-10 flex-col border-r border-border/50">
        <header className="px-6 py-5 border-b border-border/50 bg-white dark:bg-gray-900 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground leading-tight">CureBery</h1>
              <p className="text-xs text-muted-foreground font-medium">Dashboard Klien</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/ai-doctor")} className="text-muted-foreground hover:text-teal-600 rounded-full" title="CureBot AI">
              <Stethoscope className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLocation("/riwayat")} className="text-muted-foreground hover:text-primary rounded-full" title="Riwayat Layanan">
              <ClipboardList className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary rounded-full">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {activeConn && (
          <div onClick={() => setLocation(`/chat?connectionId=${activeConn.id}&name=${encodeURIComponent(activeConn.nurseName)}&spec=Perawat%20Umum`)} className="mx-4 mt-3 px-4 py-3 bg-teal-500 text-white rounded-xl flex items-center justify-between cursor-pointer shadow-sm">
            <div>
              <p className="text-xs font-bold">Sesi Aktif dengan {activeConn.nurseName}</p>
              <p className="text-[11px] opacity-80">Tap untuk lanjut</p>
            </div>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}

        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/80">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">
            Halo, {activeUser.name.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Temukan tenaga medis terbaik di sekitar Anda
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

        <div className="px-6 py-3 border-b border-border/30 bg-white dark:bg-gray-900 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground">Tenaga Medis Terdekat</h3>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              {filteredNurses.length} Tersedia
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground mr-1">Radius:</span>
            <select value={radius} onChange={e => setRadius(Number(e.target.value))}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary text-white border-none outline-none cursor-pointer">
              {RADIUS_OPTIONS.map(r => (
                <option key={r} value={r}>{r === 5000 ? "Se-Indonesia" : `${r} km`}</option>
              ))}
            </select>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-gray-50/50 dark:bg-gray-950 p-6 pt-4">
          <NurseListContent />
        </ScrollArea>
        <div className="flex-shrink-0 bg-white border-t border-border/40 px-3 py-2">
          <div className="flex gap-1.5 items-center">
            <Stethoscope className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <input type="text" placeholder="Tanya Curebery AI..."
              className="flex-1 h-8 text-xs px-3 rounded-full border border-border/60 bg-gray-50 outline-none focus:border-teal-400"
              onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) { sessionStorage.setItem("curebot-prefill", e.currentTarget.value.trim()); setLocation("/ai-doctor"); } }}
            />
            <button className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0"
              onClick={e => { const inp = e.currentTarget.previousElementSibling as HTMLInputElement; if (inp?.value.trim()) { sessionStorage.setItem("curebot-prefill", inp.value.trim()); setLocation("/ai-doctor"); } }}>
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </aside>

      <main className="hidden md:block flex-1 relative bg-gray-100">
        <PatientMap
          nurses={filteredNurses}
          userLocation={gpsLocation}
          selectedNurseId={selectedNurseId}
          onViewProfile={(n) => setProfileNurse(n)}
          onConnect={(n) => setConnectNurse(n)}
        />
        <div className={`absolute top-3 left-3 z-[500] flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm border transition-all ${
          gpsLoading ? "bg-white/80 border-gray-200 text-gray-500" :
          isGpsActive ? "bg-white/90 border-emerald-200 text-emerald-700" :
          "bg-white/90 border-amber-200 text-amber-700"
        }`}>
          <Navigation className={`w-3 h-3 ${gpsLoading ? "animate-pulse" : ""}`} />
          {gpsLoading ? "Mencari GPS..." : isGpsActive ? "GPS Aktif" : "GPS: Jakarta (default)"}
        </div>
      </main>

      {/* ── MOBILE: Full screen with tab switcher ── */}
      <div className="flex md:hidden flex-col w-full h-full">

        {/* Mobile Header */}
        <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-border/50 shadow-sm z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-base text-foreground leading-none">CureBery</h1>
              <p className="text-[11px] text-muted-foreground">Halo, {activeUser.name.split(' ')[0]} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setLocation("/ai-doctor")} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-teal-600 hover:bg-teal-50 transition-colors">
              <Stethoscope className="w-4 h-4" />
            </button>
            <button onClick={() => setLocation("/riwayat")} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <ClipboardList className="w-4 h-4" />
            </button>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Tab Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-border/50 flex z-10">
          <button
            onClick={() => setMobileTab("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
              mobileTab === "list"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
            Daftar Tenaga Medis
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
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground">Radius:</span>
                  <select value={radius} onChange={e => setRadius(Number(e.target.value))}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white border-none outline-none cursor-pointer">
                    {RADIUS_OPTIONS.map(r => (
                      <option key={r} value={r}>{r === 5000 ? "Se-Indonesia" : `${r} km`}</option>
                    ))}
                  </select>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                  {filteredNurses.length} tersedia
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1 bg-gray-50/50 dark:bg-gray-950 p-4">
              <NurseListContent />
            </ScrollArea>
          </div>
        )}

        {/* AI Bar - selalu muncul di mobile */}
        {mobileTab === "list" && (
          <div className="flex-shrink-0 bg-white border-t border-border/40 px-3 py-2">
            <div className="flex gap-1.5 items-center">
              <Stethoscope className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <input type="text" placeholder="Tanya Curebery AI..."
                className="flex-1 h-8 text-xs px-3 rounded-full border border-border/60 bg-gray-50 outline-none focus:border-teal-400"
                onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) { sessionStorage.setItem("curebot-prefill", e.currentTarget.value.trim()); setLocation("/ai-doctor"); } }}
              />
              <button className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0"
                onClick={e => { const inp = e.currentTarget.previousElementSibling as HTMLInputElement; if (inp?.value.trim()) { sessionStorage.setItem("curebot-prefill", inp.value.trim()); setLocation("/ai-doctor"); } }}>
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}
        {/* Mobile: Map Tab */}
        {mobileTab === "map" && (
          <div className="flex-1 relative">
            <PatientMap
              nurses={filteredNurses}
              userLocation={gpsLocation}
              selectedNurseId={selectedNurseId}
              onViewProfile={(n) => setProfileNurse(n)}
              onConnect={(n) => setConnectNurse(n)}
            />
            <div className={`absolute top-3 left-3 z-[500] flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm border transition-all ${
              gpsLoading ? "bg-white/80 border-gray-200 text-gray-500" :
              isGpsActive ? "bg-white/90 border-emerald-200 text-emerald-700" :
              "bg-white/90 border-amber-200 text-amber-700"
            }`}>
              <Navigation className={`w-3 h-3 ${gpsLoading ? "animate-pulse" : ""}`} />
              {gpsLoading ? "Mencari GPS..." : isGpsActive ? "GPS Aktif" : "Default"}
            </div>
            {/* Floating nurse count badge */}
            <div className="absolute top-12 left-3 z-[500] bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-2 border border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground">{filteredNurses.filter(n => n.isOnline).length} tenaga medis online</span>
            </div>
            {/* Switch to list button */}
            <button
              onClick={() => setMobileTab("list")}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-xl rounded-full px-5 py-3 flex items-center gap-2 border border-border/30 text-sm font-semibold text-foreground active:scale-95 transition-transform"
            >
              <List className="w-4 h-4 text-blue-600" />
              Lihat Daftar Tenaga Medis
            </button>
          </div>
        )}
      </div>
    </div>

    <NurseProfileSheet
      nurse={profileNurse}
      open={profileNurse !== null}
      onClose={() => setProfileNurse(null)}
    />
    {connectNurse && (
      <ConnectModal
        nurse={connectNurse}
        onClose={() => setConnectNurse(null)}
      />
    )}
    </>
  );
}
