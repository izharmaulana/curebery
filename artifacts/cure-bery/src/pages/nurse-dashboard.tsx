import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useMockableUpdateStatus, useMockableNearbyNurses, useMockableUpdateLocation } from "@/hooks/use-app-queries";
import { NurseMap } from "@/components/map/nurse-map";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useThemeStore } from "@/store/theme-store";
import {
  LogOut, ShieldPlus, Star, MapPin, Activity, Users, Moon, Sun,
  List, Map as MapIcon, Phone, Clock, Wifi, WifiOff,
  UserCircle2, Edit2, CheckCircle2, X, Mail, Phone as PhoneIcon,
  Home, Award, DollarSign, Shield, ChevronRight, Camera,
  Plus, FileText, Stethoscope,
} from "lucide-react";
import { NursePublicProfile } from "@workspace/api-client-react";
import { NurseProfileSheet } from "@/components/patient/nurse-profile-sheet";
import { NurseConnectModal } from "@/components/nurse/nurse-connect-modal";
import { IncomingConnectNotif } from "@/components/nurse/incoming-connect-notif";
import { useGeolocation } from "@/hooks/use-geolocation";
import { requestNotifPermission, notifyNurseNewOrder } from "@/lib/notifications";

const SUGGESTED_SERVICES = [
  "Perawatan Luka", "Pemasangan Infus", "Suntikan & Injeksi", "Pemantauan Vital Signs",
  "Fisioterapi Ringan", "Perawatan Pasca Operasi", "Perawatan Lansia", "Terapi Nebulizer",
  "Pemasangan Kateter", "Rawat Inap Rumah", "Konsultasi Kesehatan", "Perawatan Bayi",
];

type ActiveTab = "list" | "map" | "profile";

/* ─── Nurse List Item ─── */
function NurseListItem({ nurse, isSelected, onClick, onViewProfile, onConnect }: {
  nurse: NursePublicProfile; isSelected: boolean; onClick: () => void; onViewProfile?: (n: NursePublicProfile) => void; onConnect?: (n: NursePublicProfile) => void;
}) {
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
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${nurse.isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">{nurse.name}</p>
            <span className={`text-xs font-bold flex-shrink-0 ${nurse.isOnline ? "text-emerald-600" : "text-gray-400"}`}>
              {nurse.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{nurse.specialization}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              {nurse.rating > 0 ? (
                <><Star className="w-3 h-3 fill-current" />{nurse.rating}</>
              ) : (
                <span className="text-gray-400 font-medium">Baru</span>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{nurse.distanceKm} km
            </span>
          </div>
        </div>
      </div>
      {nurse.isOnline && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground flex-1 truncate">{nurse.strNumber}</span>
          <button
            onClick={e => { e.stopPropagation(); onViewProfile?.(nurse); }}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-2 py-1 hover:bg-teal-100 transition-colors"
          >
            <UserCircle2 className="w-3 h-3" /> Profil
          </button>
          <button
            onClick={e => { e.stopPropagation(); onConnect?.(nurse); }}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-primary border border-primary rounded-lg px-2 py-1 hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-3 h-3" /> Hubungkan
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Profile View ─── */
function ProfileView({ userName, onLogout, nurseRating, nurseTotalPatients }: { userName: string; onLogout: () => void; nurseRating: number; nurseTotalPatients: number }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [specialization, setSpecialization] = useState("Perawat Umum");
  const [rate, setRate] = useState("150000");
  const [radius, setRadius] = useState("5");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/nurses/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.address) setAddress(data.address);
        if (data.specialization) setSpecialization(data.specialization);
        if (data.bio) setBio(data.bio);
        if (data.services?.length) setServices(data.services);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      })
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false));
  }, []);

  const compressImage = (file: File): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.onload = () => {
          const MAX = 600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            const ratio = Math.min(MAX / width, MAX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const compressed = await compressImage(file);
    setAvatarUrl(compressed);
    setIsCompressing(false);
  };

  const SPECIALIZATIONS = [
    "Perawat Umum", "Perawat ICU", "Perawat Anak", "Perawat Geriatri",
    "Perawat Bedah", "Perawat Jiwa", "Perawat Maternitas",
    "Dokter Umum", "Bidan",
  ];

  const addService = (name?: string) => {
    const val = (name ?? serviceInput).trim();
    if (val && !services.includes(val)) setServices(prev => [...prev, val]);
    if (!name) setServiceInput("");
  };

  const removeService = (val: string) => setServices(prev => prev.filter(s => s !== val));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/nurses/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, address, specialization, bio, services, avatarUrl }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setIsEditing(false);
      toast({ title: "Profil Diperbarui", description: "Data profil Anda berhasil disimpan." });
    } catch {
      toast({ title: "Gagal Menyimpan", description: "Terjadi kesalahan. Coba lagi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">

        {/* Avatar & name */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_60%)]" />
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="relative inline-block mb-3">
              <img
                src={avatarUrl}
                alt="Avatar"
                className={`w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg mx-auto transition-opacity ${isCompressing ? "opacity-50" : ""}`}
              />
              {isCompressing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Camera className="w-3.5 h-3.5 text-teal-600" />
              </button>
            </div>
            <h2 className="font-bold text-lg leading-tight">{name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{specialization}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-white/30 text-xs font-mono hover:bg-white/30">
                STR-2024-001234
              </Badge>
              <Badge className="bg-emerald-400/30 text-white border-emerald-300/40 text-xs hover:bg-emerald-400/40">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Terverifikasi
              </Badge>
            </div>
          </div>
        </div>

        {/* Upload panel — visible only when editing */}
        {isEditing && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-teal-300 rounded-2xl p-4 bg-teal-50/60 hover:bg-teal-50 transition-colors text-center group"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-teal-100 group-hover:bg-teal-200 transition-colors flex items-center justify-center">
                {isCompressing ? (
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700">
                  {isCompressing ? "Lagi dikompresi bro..." : "Upload Foto Profil"}
                </p>
                <p className="text-xs text-teal-500 mt-0.5 italic font-medium">
                  "gaya bebas yahhhhhhhh chessssssssssss" 📸
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-teal-400 font-medium mt-0.5">
                <span className="px-2 py-0.5 bg-white border border-teal-200 rounded-full">JPG / PNG / WEBP</span>
                <span className="px-2 py-0.5 bg-white border border-teal-200 rounded-full">⚡ Auto-kompresi</span>
                <span className="px-2 py-0.5 bg-white border border-teal-200 rounded-full">Max 600px</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Star, val: nurseRating > 0 ? String(nurseRating) : "Baru", label: "Rating", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
            { icon: Users, val: String(nurseTotalPatients), label: "Layanan", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { icon: Award, val: "3 Thn", label: "Pengalaman", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl p-2.5 text-center`}>
              <div className={`font-bold text-base ${s.color} flex items-center justify-center gap-1`}>
                <s.icon className="w-3.5 h-3.5 fill-current" />{s.val}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Edit toggle */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">Informasi Pribadi</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-xs text-muted-foreground border border-border/60 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1 text-xs text-white bg-teal-600 rounded-lg px-2.5 py-1.5 hover:bg-teal-700 disabled:opacity-60">
                <CheckCircle2 className="w-3.5 h-3.5" /> {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 border border-teal-200 bg-teal-50 rounded-lg px-2.5 py-1.5 hover:bg-teal-100 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profil
            </button>
          )}
        </div>

        {/* Info fields */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden divide-y divide-border/40">
          {isEditing ? (
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Lengkap</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nomor HP</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spesialisasi</Label>
                <select
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                  className="w-full h-9 text-sm px-3 border border-border/60 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                >
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alamat</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tentang Saya</Label>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Ceritakan pengalaman dan keahlian Anda..."
                  className="resize-none min-h-[80px] text-sm border-border/60"
                  maxLength={400}
                />
                <p className="text-xs text-gray-400 text-right">{bio.length}/400 karakter</p>
              </div>
            </div>
          ) : (
            <>
              {[
                { icon: UserCircle2, label: "Nama", value: name },
                { icon: Mail, label: "Email", value: "perawat@cureberry.id" },
                { icon: PhoneIcon, label: "Nomor HP", value: phone },
                { icon: Activity, label: "Spesialisasi", value: specialization },
                { icon: Home, label: "Alamat", value: address },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-foreground font-medium truncate">{item.value}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </div>
              ))}
              {bio && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Tentang Saya</p>
                    <p className="text-sm text-foreground leading-relaxed mt-0.5">{bio}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Service settings */}
        <div>
          <h3 className="font-bold text-sm text-foreground mb-2">Pengaturan Layanan</h3>
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden divide-y divide-border/40">
            {isEditing ? (
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tarif Dasar (Rp / visit)</Label>
                  <Input value={rate} onChange={e => setRate(e.target.value)} type="number" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Radius Layanan (km)</Label>
                  <Input value={radius} onChange={e => setRadius(e.target.value)} type="number" className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Layanan Tersedia</Label>
                  {/* Selected tags */}
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-lg border border-border/40">
                      {services.map(s => (
                        <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200 font-medium">
                          {s}
                          <button type="button" onClick={() => removeService(s)} className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-teal-200 transition-colors">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Quick-select suggestions */}
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_SERVICES.filter(s => !services.includes(s)).map(s => (
                      <button key={s} type="button" onClick={() => addService(s)}
                        className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                  {/* Custom input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tambah layanan lain..."
                      value={serviceInput}
                      onChange={e => setServiceInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                      className="h-8 text-sm flex-1 border-border/60"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addService()}
                      disabled={!serviceInput.trim()} className="h-8 px-2 border-teal-200 text-teal-700 hover:bg-teal-50">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {[
                  { icon: DollarSign, label: "Tarif Dasar", value: `Rp ${parseInt(rate).toLocaleString("id")} / visit`, color: "bg-green-50", iconColor: "text-green-600" },
                  { icon: MapPin, label: "Radius Layanan", value: `${radius} km dari lokasi`, color: "bg-blue-50", iconColor: "text-blue-600" },
                  { icon: Shield, label: "Status STR", value: "Aktif s/d Desember 2026", color: "bg-purple-50", iconColor: "text-purple-600" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-foreground font-medium">{item.value}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                ))}
                {services.length > 0 && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">Layanan Tersedia</p>
                      <div className="flex flex-wrap gap-1.5">
                        {services.map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>

        <div className="h-2" />
      </div>
    </ScrollArea>
  );
}

/* ─── Sidebar List View ─── */
function SidebarListView({
  isOnline, onStatusChange, updatePending, onlineCount, offlineCount,
  displayNurses, filterOnlineOnly, setFilterOnlineOnly, selectedNurseId, setSelectedNurseId,
  onViewProfile, onConnect, nurseRating, nurseTotalPatients,
}: {
  isOnline: boolean;
  onStatusChange: (v: boolean) => void;
  updatePending: boolean;
  onlineCount: number;
  offlineCount: number;
  displayNurses: NursePublicProfile[];
  filterOnlineOnly: boolean;
  setFilterOnlineOnly: (v: boolean | ((p: boolean) => boolean)) => void;
  selectedNurseId: number | null;
  setSelectedNurseId: (v: number | null | ((p: number | null) => number | null)) => void;
  onViewProfile?: (n: NursePublicProfile) => void;
  onConnect?: (n: NursePublicProfile) => void;
  nurseRating: number;
  nurseTotalPatients: number;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Profile mini card */}
      <div className="p-4 border-b border-border/40">
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isOnline ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-border/50"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            <div>
              <p className="text-sm font-bold leading-none">{isOnline ? "Online" : "Offline"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{isOnline ? "Klien dapat menemukan Anda" : "Tidak terlihat oleh klien"}</p>
            </div>
          </div>
          <Switch checked={isOnline} onCheckedChange={onStatusChange} disabled={updatePending} className="data-[state=checked]:bg-emerald-500 scale-110" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { val: nurseRating > 0 ? `${nurseRating} ★` : "Baru", label: "Rating", cls: "text-amber-500" },
            { val: String(nurseTotalPatients), label: "Layanan", cls: "text-blue-600" },
            { val: `${isOnline ? "🟢" : "⚫"} ${isOnline ? "Live" : "Paused"}`, label: "Status", cls: "text-teal-600" },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center border border-border/40">
              <div className={`text-sm font-bold ${s.cls}`}>{s.val}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* List header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
        <div>
          <h3 className="font-bold text-sm text-foreground">Tenaga Medis di Area Ini</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-semibold">{onlineCount} online</span>{" · "}
            <span className="text-gray-500">{offlineCount} offline</span>
          </p>
        </div>
        <button
          onClick={() => setFilterOnlineOnly((p: boolean) => !p)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${filterOnlineOnly ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-muted-foreground border-border/50 hover:border-emerald-300"}`}
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
                onClick={() => setSelectedNurseId((prev: number | null) => prev === nurse.id ? null : nurse.id)}
                onViewProfile={onViewProfile}
                onConnect={onConnect}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border/30 bg-gray-50/80">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
          Posisi diperbarui tiap 4 detik · {isOnline ? "🟢 Live" : "⚫ Paused"}
        </div>
        {!isOnline && (
          <Button size="sm" onClick={() => onStatusChange(true)} className="w-full mt-2 h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg">
            Mulai Bekerja Sekarang
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function NurseDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [profileNurse, setProfileNurse] = useState<NursePublicProfile | null>(null);
  const [connectNurse, setConnectNurse] = useState<NursePublicProfile | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState<{ id: number; patientName: string; nurseSpec: string } | null>(null);
  const incomingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [nurseRating, setNurseRating] = useState<number>(0);
  const [nurseTotalPatients, setNurseTotalPatients] = useState<number>(0);

  const updateStatus = useMockableUpdateStatus();
  const demoNurse = { id: 0, name: "Demo Perawat", email: "demo@cureberry.id", role: "nurse" as const };
  const activeUser = (user && user.role === "nurse") ? user : demoNurse;

  const { location: gpsLocation, isGpsActive } = useGeolocation();

  const { data: allNurses = [] } = useMockableNearbyNurses(gpsLocation.lat, gpsLocation.lng, 5);
  const displayNurses = useMemo(() => filterOnlineOnly ? allNurses.filter(n => n.isOnline) : allNurses, [allNurses, filterOnlineOnly]);
  const onlineCount = allNurses.filter(n => n.isOnline).length;
  const offlineCount = allNurses.length - onlineCount;

  useEffect(() => {
    requestNotifPermission();
  }, []);

  useEffect(() => {
    fetch("/api/nurses/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (typeof data.rating === "number") setNurseRating(data.rating);
        if (typeof data.totalPatients === "number") setNurseTotalPatients(data.totalPatients);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOnline) {
      if (incomingPollRef.current) { clearInterval(incomingPollRef.current); incomingPollRef.current = null; }
      return;
    }
    const poll = async () => {
      try {
        const res = await fetch("/api/connections/incoming", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setIncomingRequest(prev => prev ?? { id: data[0].id, patientName: data[0].patientName, nurseSpec: data[0].nurseSpec });
        }
      } catch { }
    };
    poll();
    incomingPollRef.current = setInterval(poll, 3000);
    return () => { if (incomingPollRef.current) { clearInterval(incomingPollRef.current); incomingPollRef.current = null; } };
  }, [isOnline]);

  const handleAcceptConnection = async () => {
    if (!incomingRequest) return;
    try {
      await fetch(`/api/connections/${incomingRequest.id}/accept`, { method: "PUT", credentials: "include" });
      toast({ title: "✅ Permintaan diterima!", description: `Anda terhubung dengan ${incomingRequest.patientName}` });
      setIncomingRequest(null);
      setLocation(`/chat?connectionId=${incomingRequest.id}&name=${encodeURIComponent(incomingRequest.patientName)}&spec=${encodeURIComponent(incomingRequest.nurseSpec)}&type=nurse`);
    } catch {
      toast({ title: "Gagal menerima permintaan", variant: "destructive" });
    }
  };

  const handleRejectConnection = async () => {
    if (!incomingRequest) return;
    try {
      await fetch(`/api/connections/${incomingRequest.id}/reject`, { method: "PUT", credentials: "include" });
      toast({ title: "Permintaan ditolak" });
      setIncomingRequest(null);
    } catch {
      toast({ title: "Gagal menolak permintaan", variant: "destructive" });
    }
  };

  const orderSimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isOnline) {
      if (orderSimTimerRef.current) clearTimeout(orderSimTimerRef.current);
      return;
    }
    const PATIENT_NAMES = ["Budi Santoso", "Sari Dewi", "Ahmad Fauzi", "Rina Wulandari", "Hendra Kurniawan"];
    const SERVICES = ["perawatan luka", "pemasangan infus", "pemantauan vital signs", "suntikan & injeksi", "perawatan pasca operasi"];
    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 60000;
      orderSimTimerRef.current = setTimeout(() => {
        const name = PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)];
        const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        notifyNurseNewOrder(name, service, () => setActiveTab("list"));
        toast({
          title: "🔔 Order Baru Masuk!",
          description: `${name} membutuhkan ${service}`,
        });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (orderSimTimerRef.current) clearTimeout(orderSimTimerRef.current);
    };
  }, [isOnline]);

  const updateLocation = useMockableUpdateLocation();

  const handleLogout = () => { logout(); setLocation("/"); };
  const handleStatusChange = async (checked: boolean) => {
    setIsOnline(checked);
    try {
      if (checked && isGpsActive) {
        await updateLocation.mutateAsync({ lat: gpsLocation.lat, lng: gpsLocation.lng });
      }
      await updateStatus.mutateAsync({ isOnline: checked });
      toast({ title: "Status Diperbarui", description: `Anda sekarang ${checked ? "Online 🟢" : "Offline ⚫"}` });
    } catch {
      setIsOnline(!checked);
      toast({ title: "Gagal memperbarui status", variant: "destructive" });
    }
  };

  const DESKTOP_TABS = [
    { id: "list" as ActiveTab, icon: List, label: "Tenaga Medis" },
    { id: "profile" as ActiveTab, icon: UserCircle2, label: "Profil" },
  ];

  const MOBILE_TABS = [
    { id: "list" as ActiveTab, icon: List, label: "Tenaga Medis" },
    { id: "map" as ActiveTab, icon: MapIcon, label: "Peta", dot: isOnline },
    { id: "profile" as ActiveTab, icon: UserCircle2, label: "Profil" },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-950 font-sans overflow-hidden">

      {incomingRequest && (
        <IncomingConnectNotif
          fromName={incomingRequest.patientName}
          fromSpec={incomingRequest.nurseSpec}
          onAccept={handleAcceptConnection}
          onReject={handleRejectConnection}
        />
      )}

      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-border/50 z-50 shadow-sm flex-shrink-0">
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
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all ${isOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-100 border-border/60 text-gray-500"}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              {isOnline ? "Online" : "Offline"}
              <Switch checked={isOnline} onCheckedChange={handleStatusChange} disabled={updateStatus.isPending} className="data-[state=checked]:bg-emerald-500 ml-1 scale-90" />
            </div>
            {/* Profile avatar button (desktop) */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`hidden md:flex w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${activeTab === "profile" ? "border-teal-500 shadow-md shadow-teal-500/20" : "border-border/40 hover:border-teal-300"}`}
            >
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
            </button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Welcome Notice ── */}
      {showWelcome && (
        <div className="flex-shrink-0 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 text-white px-4 py-3 z-40 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,white_0%,transparent_60%)]" />
          <div className="relative flex items-start justify-between gap-3 max-w-5xl mx-auto">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl flex-shrink-0 mt-0.5">💘</span>
              <div>
                <p className="text-sm font-bold leading-snug">
                  kamu bisa terhubung dengan nakes yang lain
                </p>
                <p className="text-xs text-white/90 mt-0.5 leading-relaxed italic">
                  jadi Jangan maluuuu yahhhhhh 😳🙈 Cihuyyyyyyyyyyy
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors mt-0.5"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP: icon nav + sidebar + map ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">

        {/* Icon nav rail */}
        <nav className="w-16 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-border/50 flex flex-col items-center py-4 gap-2 shadow-sm">
          {DESKTOP_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-teal-600"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar panel */}
        <aside className="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-border/50 flex flex-col overflow-hidden shadow-sm">
          {activeTab === "list" && (
            <SidebarListView
              isOnline={isOnline}
              onStatusChange={handleStatusChange}
              updatePending={updateStatus.isPending}
              onlineCount={onlineCount}
              offlineCount={offlineCount}
              displayNurses={displayNurses}
              filterOnlineOnly={filterOnlineOnly}
              setFilterOnlineOnly={setFilterOnlineOnly}
              selectedNurseId={selectedNurseId}
              setSelectedNurseId={setSelectedNurseId}
              onViewProfile={setProfileNurse}
              onConnect={setConnectNurse}
              nurseRating={nurseRating}
              nurseTotalPatients={nurseTotalPatients}
            />
          )}
          {activeTab === "profile" && (
            <ProfileView userName={activeUser.name} onLogout={handleLogout} nurseRating={nurseRating} nurseTotalPatients={nurseTotalPatients} />
          )}
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <NurseMap nurses={displayNurses} location={gpsLocation} isOnline={isOnline} onViewProfile={setProfileNurse} onConnect={setConnectNurse} />
          <div className={`absolute top-3 left-3 z-[500] flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm border ${isGpsActive ? "bg-white/90 border-emerald-200 text-emerald-700" : "bg-white/90 border-amber-200 text-amber-700"}`}>
            <MapPin className="w-3 h-3" />
            {isGpsActive ? "GPS Aktif" : "GPS: Default"}
          </div>
          {!isOnline && (
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-[500] text-white">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <WifiOff className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Anda Sedang Offline</h3>
              <p className="text-white/70 text-sm mb-6 max-w-xs text-center">Aktifkan status untuk memulai live tracking</p>
              <Button onClick={() => handleStatusChange(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-8 h-12 rounded-xl font-semibold shadow-lg transition-all hover:scale-105">
                Mulai Bekerja Sekarang
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE: content + bottom tabs ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === "list" && (
            <div className="h-full bg-white overflow-hidden">
              <SidebarListView
                isOnline={isOnline}
                onStatusChange={handleStatusChange}
                updatePending={updateStatus.isPending}
                onlineCount={onlineCount}
                offlineCount={offlineCount}
                displayNurses={displayNurses}
                filterOnlineOnly={filterOnlineOnly}
                setFilterOnlineOnly={setFilterOnlineOnly}
                selectedNurseId={selectedNurseId}
                setSelectedNurseId={setSelectedNurseId}
                onViewProfile={setProfileNurse}
                onConnect={setConnectNurse}
                nurseRating={nurseRating}
                nurseTotalPatients={nurseTotalPatients}
              />
            </div>
          )}
          {activeTab === "map" && (
            <div className="h-full relative">
              <NurseMap nurses={displayNurses} location={gpsLocation} isOnline={isOnline} onViewProfile={setProfileNurse} onConnect={setConnectNurse} />
              {!isOnline && (
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-[500] text-white px-6">
                  <WifiOff className="w-10 h-10 mb-3 opacity-80" />
                  <h3 className="text-xl font-bold mb-1 text-center">Anda Sedang Offline</h3>
                  <p className="text-white/70 text-sm text-center mb-5">Aktifkan status untuk live tracking</p>
                  <Button onClick={() => handleStatusChange(true)} className="bg-teal-500 hover:bg-teal-600 text-white px-6 h-11 rounded-xl font-semibold">
                    Aktifkan Sekarang
                  </Button>
                </div>
              )}
            </div>
          )}
          {activeTab === "profile" && (
            <div className="h-full bg-gray-50 overflow-hidden">
              <ProfileView userName={activeUser.name} onLogout={handleLogout} nurseRating={nurseRating} nurseTotalPatients={nurseTotalPatients} />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <nav className="flex-shrink-0 bg-white border-t border-border/50 flex shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative ${
                activeTab === tab.id ? "text-teal-600" : "text-muted-foreground hover:text-teal-500"
              }`}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? "scale-110" : ""}`} />
                {tab.dot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white animate-pulse" />}
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Nurse Profile Sheet */}
      <NurseProfileSheet
        nurse={profileNurse}
        open={!!profileNurse}
        onClose={() => setProfileNurse(null)}
        onConnect={() => { if (profileNurse) { setConnectNurse(profileNurse); setProfileNurse(null); } }}
      />

      {/* Nurse Connect Modal */}
      {connectNurse && (
        <NurseConnectModal
          nurse={connectNurse}
          onClose={() => setConnectNurse(null)}
        />
      )}
    </div>
  );
}
