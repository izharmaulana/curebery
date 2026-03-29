import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useMockableUpdateStatus } from "@/hooks/use-app-queries";
import { NurseMap } from "@/components/map/nurse-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Activity, Star, Users, MapPin, CheckCircle2, ShieldPlus } from "lucide-react";
import { motion } from "framer-motion";

const NURSE_LOCATION = { lat: -6.2000, lng: 106.8400 };

export default function NurseDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  
  const [isOnline, setIsOnline] = useState(false);
  const updateStatus = useMockableUpdateStatus();

  // If not authenticated as nurse, return to home
  if (!user || user.role !== 'nurse') {
    setLocation('/');
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleStatusChange = async (checked: boolean) => {
    setIsOnline(checked);
    try {
      await updateStatus.mutateAsync({ isOnline: checked });
      toast({
        title: "Status Diperbarui",
        description: `Anda sekarang ${checked ? 'Online dan siap menerima panggilan' : 'Offline'}.`,
      });
    } catch (err) {
      setIsOnline(!checked); // revert on error
      toast({
        title: "Gagal Memperbarui Status",
        description: "Terjadi kesalahan sistem.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-teal-950 leading-tight">CureBery</h1>
              <p className="text-xs text-teal-700/70 font-medium">Portal Tenaga Medis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-border/60">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <Label htmlFor="status-toggle" className="text-sm font-semibold cursor-pointer select-none">
                {isOnline ? 'Online' : 'Offline'}
              </Label>
              <Switch 
                id="status-toggle" 
                checked={isOnline} 
                onCheckedChange={handleStatusChange} 
                disabled={updateStatus.isPending}
                className="data-[state=checked]:bg-emerald-500 ml-2"
              />
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* Mobile Status Toggle */}
        <div className="sm:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-border/50 mb-6">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`} />
            <span className="font-bold text-foreground">Status Aktif</span>
          </div>
          <Switch 
            checked={isOnline} 
            onCheckedChange={handleStatusChange} 
            disabled={updateStatus.isPending}
            className="data-[state=checked]:bg-emerald-500 scale-110"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-border/50 shadow-lg shadow-teal-900/5 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-teal-500 to-emerald-400 relative">
                  <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border border-border/50">
                      <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop" alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                    </div>
                  </div>
                </div>
                <CardContent className="pt-14 pb-6 px-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold font-display text-foreground leading-tight">{user.name}</h2>
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                        <Activity className="w-3.5 h-3.5 text-teal-600" /> Perawat Umum
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200 font-mono text-xs py-1">
                      STR-2024-001234
                    </Badge>
                    <Badge variant="outline" className="text-gray-500 text-xs py-1">
                      3 Tahun Exp
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/60">
                    <div className="bg-gray-50 p-3 rounded-xl border border-border/50 text-center">
                      <div className="text-2xl font-bold text-teal-600 flex items-center justify-center gap-1">
                        4.8 <Star className="w-4 h-4 fill-current text-amber-400" />
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">Rating Pasien</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-border/50 text-center">
                      <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                        124 <Users className="w-4 h-4 opacity-70" />
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">Total Layanan</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Card className="border-border/50 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" /> Informasi Layanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Area Layanan</span>
                    <span className="font-semibold flex items-center gap-1"><MapPin className="w-3 h-3 text-teal-600"/> Radius 5km</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-muted-foreground">Status STR</span>
                    <span className="font-semibold text-emerald-600">Aktif s/d 2026</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Tarif Dasar</span>
                    <span className="font-semibold">Rp 150.000 / visit</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-white relative group">
              
              <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white flex items-center gap-3">
                <MapPin className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-sm leading-tight text-foreground">Lokasi Broadcast Anda</h3>
                  <p className="text-xs text-muted-foreground">Pasien dalam radius 3km dapat melihat Anda</p>
                </div>
              </div>

              {/* Only show map if status is online, otherwise show a nice offline state */}
              {isOnline ? (
                <NurseMap location={NURSE_LOCATION} />
              ) : (
                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center p-6 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30" />
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 relative z-10 border border-border/50">
                    <Activity className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 relative z-10 font-display">Anda Sedang Offline</h3>
                  <p className="text-muted-foreground max-w-md relative z-10">Aktifkan status Anda di panel atas untuk mulai menerima permintaan layanan dari pasien di sekitar Anda.</p>
                  
                  <Button 
                    className="mt-8 relative z-10 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/30 rounded-xl px-8 h-12 text-base font-semibold transition-all hover:scale-105"
                    onClick={() => handleStatusChange(true)}
                  >
                    Mulai Bekerja Sekarang
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
