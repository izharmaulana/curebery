import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useMockableUpdateStatus, useMockableNearbyNurses } from "@/hooks/use-app-queries";
import { NurseMap } from "@/components/map/nurse-map";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, ShieldPlus, Star, MapPin, Activity, Users,
  CheckCircle2, List, Map, Phone, Clock, Wifi, WifiOff,
} from "lucide-react";
import { NursePublicProfile } from "@workspace/api-client-react";

const NURSE_LOCATION = { lat: -6.2000, lng: 106.8400 };

function NurseListItem({ nurse, isSelected, onClick }: { nurse: NursePublicProfile; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "bg-teal-50 border-teal-300 shadow-sm shadow-teal-100"
          : "bg-white border-border/50 hover:border-teal-200 hover:bg-teal-50/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {nurse.avatarUrl ? (
            <img src={nurse.avatarUrl} alt={nurse.name} className="w-10 h-10 rounded-full object-cover border border-border/40" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              {nurse.name.charAt(0)}
            </div>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${nurse.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{nurse.name}</p>
            <span className={`text-xs font-bold flex-shrink-0 ${nurse.isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
              {nurse.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{nurse.specialization}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Star className="w-3 h-3 fill-current" />{nurse.rating}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{nurse.distanceKm} km
            </span>
          </div>
        </div>
      </div>

      {nurse.isOnline && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">{nurse.strNumber}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-2 py-1">
            <Phone className="w-3 h-3" /> Hubungi
          </span>
        </div>
      )}
    </div>
  );
}

export default function NurseDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  const updateStatus = useMockableUpdateStatus();

  const demoNurse = { id: 0, name: "Demo Perawat", email: "demo@cureberry.id", role: "nurse" as const };
  const activeUser = (user && user.role === "nurse") ? user : demoNurse;

  const { data: allNurses = [] } = useMockableNearbyNurses(
    NURSE_LOCATION.lat,
    NURSE_LOCATION.lng,
    5
  );

  const displayNurses = useMemo(() =>
    filterOnlineOnly ? allNurses.filter(n => n.isOnline) : allNurses,
    [allNurses, filterOnlineOnly]
  );

  const onlineCount = allNurses.filter(n => n.isOnline).length;
  const offlineCount = allNurses.length - onlineCount;

  const handleLogout = () => { logout(); setLocation("/"); };

  const handleStatusChange = async (checked: boolean) => {
    setIsOnline(checked);
    try {
      await updateStatus.mutateAsync({ isOnline: checked });
      toast({
        title: "Status Diperbarui",
        description: `Anda sekarang ${checked ? "Online dan siap menerima panggilan 🟢" : "Offline ⚫"}`,
      });
    } catch {
      setIsOnline(!checked);
      toast({ title: "Gagal memperbarui status", variant: "destructive" });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Profile card */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop"
              alt="Avatar"
              className="w-12 h-12 rounded-xl object-cover border border-border/40 shadow-sm"
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{activeUser.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-600" /> Perawat Umum
            </p>
            <Badge variant="secondary" className="mt-1 text-[10px] font-mono bg-teal-50 text-teal-700 border-teal-200 h-5">
              STR-2024-001234
            </Badge>
          </div>
        </div>

        {/* Status toggle */}
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-border/50'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <div>
              <p className="text-sm font-bold">{isOnline ? 'Online' : 'Offline'}</p>
              <p className="text-[10px] text-muted-foreground">{isOnline ? 'Pasien dapat menemukan Anda' : 'Tidak terlihat oleh pasien'}</p>
            </div>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={handleStatusChange}
            disabled={updateStatus.isPending}
            className="data-[state=checked]:bg-emerald-500 scale-110"
          />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-border/40">
            <div className="text-base font-bold text-amber-500 flex items-center justify-center gap-0.5">4.8 <Star className="w-3 h-3 fill-current" /></div>
            <div className="text-[10px] text-muted-foreground">Rating</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-border/40">
            <div className="text-base font-bold text-blue-600 flex items-center justify-center gap-0.5">124 <Users className="w-3 h-3" /></div>
            <div className="text-[10px] text-muted-foreground">Layanan</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-border/40">
            <div className="text-base font-bold text-teal-600 flex items-center justify-center gap-0.5">5 <MapPin className="w-3 h-3" /></div>
            <div className="text-[10px] text-muted-foreground">km Radius</div>
          </div>
        </div>
      </div>

      {/* Nurse list */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
        <div>
          <h3 className="font-bold text-sm text-foreground">Perawat di Area Ini</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-semibold">{onlineCount} online</span>
            {" · "}
            <span className="text-gray-500">{offlineCount} offline</span>
          </p>
        </div>
        <button
          onClick={() => setFilterOnlineOnly(p => !p)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${filterOnlineOnly ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-muted-foreground border-border/50 hover:border-emerald-300'}`}
        >
          {filterOnlineOnly ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          Online
        </button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2.5">
          {displayNurses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Tidak ada perawat online</p>
            </div>
          ) : (
            displayNurses.map(nurse => (
              <NurseListItem
                key={nurse.id}
                nurse={nurse}
                isSelected={selectedNurseId === nurse.id}
                onClick={() => setSelectedNurseId(prev => prev === nurse.id ? null : nurse.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Info strip */}
      <div className="p-3 border-t border-border/30 bg-gray-50/80">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          Posisi diperbarui otomatis setiap 4 detik · {isOnline ? '🟢 Live' : '⚫ Paused'}
        </div>
        {!isOnline && (
          <Button
            size="sm"
            onClick={() => handleStatusChange(true)}
            className="w-full mt-2 h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
          >
            Mulai Bekerja Sekarang
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-border/50 z-50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-teal-950 leading-none">CureBery</h1>
              <p className="text-[10px] text-teal-700/70 font-medium">Portal Tenaga Medis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge (desktop) */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-border/60 text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
              <Switch
                checked={isOnline}
                onCheckedChange={handleStatusChange}
                disabled={updateStatus.isPending}
                className="data-[state=checked]:bg-emerald-500 ml-1 scale-90"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── DESKTOP LAYOUT: sidebar + map ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-white border-r border-border/50 flex flex-col overflow-hidden shadow-sm">
          <SidebarContent />
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <NurseMap nurses={displayNurses} location={NURSE_LOCATION} isOnline={isOnline} />
          {!isOnline && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-[500] text-white">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Anda Sedang Offline</h3>
              <p className="text-white/70 text-sm mb-6 max-w-xs text-center">Aktifkan status untuk memulai live tracking dan terlihat oleh pasien</p>
              <Button
                onClick={() => handleStatusChange(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 h-12 rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
              >
                Mulai Bekerja Sekarang
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE LAYOUT: tabs ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border/50 bg-white flex-shrink-0">
          <button
            onClick={() => setMobileTab("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${mobileTab === "list" ? "border-teal-600 text-teal-600 bg-teal-50/50" : "border-transparent text-muted-foreground"}`}
          >
            <List className="w-4 h-4" /> Daftar Perawat
          </button>
          <button
            onClick={() => setMobileTab("map")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${mobileTab === "map" ? "border-teal-600 text-teal-600 bg-teal-50/50" : "border-transparent text-muted-foreground"}`}
          >
            <Map className="w-4 h-4" /> Peta Live
            {isOnline && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />}
          </button>
        </div>

        {/* Mobile: List tab */}
        {mobileTab === "list" && (
          <div className="flex-1 overflow-hidden bg-white">
            <SidebarContent />
          </div>
        )}

        {/* Mobile: Map tab */}
        {mobileTab === "map" && (
          <div className="flex-1 relative">
            <NurseMap nurses={displayNurses} location={NURSE_LOCATION} isOnline={isOnline} />
            {!isOnline && (
              <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-[500] text-white px-6">
                <WifiOff className="w-10 h-10 mb-3 opacity-80" />
                <h3 className="text-xl font-bold mb-1 text-center">Anda Sedang Offline</h3>
                <p className="text-white/70 text-sm text-center mb-5">Aktifkan status untuk memulai live tracking</p>
                <Button
                  onClick={() => { handleStatusChange(true); }}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 h-11 rounded-xl font-semibold"
                >
                  Aktifkan Sekarang
                </Button>
              </div>
            )}
            {/* Floating switch to list button */}
            <button
              onClick={() => setMobileTab("list")}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-white shadow-xl rounded-full px-5 py-3 flex items-center gap-2 border border-border/30 text-sm font-semibold active:scale-95 transition-transform"
            >
              <List className="w-4 h-4 text-teal-600" /> Lihat Daftar Perawat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
