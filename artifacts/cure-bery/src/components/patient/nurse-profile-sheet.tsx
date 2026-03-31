import { NursePublicProfile } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star, MapPin, Phone, CheckCircle2, Activity,
  Clock, Award, Stethoscope, ShieldCheck, X, DollarSign
} from "lucide-react";

interface NurseProfileSheetProps {
  nurse: NursePublicProfile | null;
  open: boolean;
  onClose: () => void;
  onConnect?: () => void;
}

export function NurseProfileSheet({ nurse, open, onClose, onConnect }: NurseProfileSheetProps) {
  if (!nurse) return null;

  const initials = nurse.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  const bio = nurse.bio ?? "Tenaga medis profesional dengan dedikasi tinggi dalam memberikan pelayanan perawatan kesehatan terbaik di rumah.";
  const yearsExperience = nurse.yearsExperience ?? 0;
  const totalPatients = nurse.totalPatients ?? 0;
  const phone = nurse.phone;
  const address = nurse.address;
  const rate = nurse.rate;
  const strExpiry = nurse.strExpiry;

  let services: string[] = [];
  if (nurse.services) {
    try { services = JSON.parse(nurse.services); } catch { services = [nurse.services]; }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-0 space-y-0">
          <SheetTitle className="sr-only">Profil Tenaga Medis</SheetTitle>
          <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 pt-10 pb-6 px-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                  <AvatarImage src={nurse.avatarUrl} alt={nurse.name} className="object-cover" />
                  <AvatarFallback className="bg-teal-200 text-teal-800 font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {nurse.isOnline && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white" />
                )}
              </div>
              <div className="pb-1">
                <Badge
                  variant={nurse.isOnline ? "default" : "secondary"}
                  className={`mb-2 text-xs ${nurse.isOnline ? "bg-emerald-400 hover:bg-emerald-500 text-white border-0" : "bg-white/20 text-white border-0"}`}
                >
                  {nurse.isOnline ? "● Online" : "○ Offline"}
                </Badge>
                <h2 className="text-xl font-bold text-white font-display leading-tight">{nurse.name}</h2>
                <p className="text-teal-100 text-sm mt-0.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  {nurse.specialization}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-gray-50">
          <div className="p-5 space-y-5">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center border border-border/40 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-lg">
                  <Star className="w-4 h-4 fill-current" />
                  {nurse.rating > 0 ? nurse.rating.toFixed(1) : "-"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Rating</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-border/40 shadow-sm">
                <div className="font-bold text-lg text-foreground">{yearsExperience > 0 ? `${yearsExperience} thn` : "-"}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pengalaman</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-border/40 shadow-sm">
                <div className="font-bold text-lg text-foreground">{totalPatients > 0 ? totalPatients : "-"}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pasien</p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Tentang
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
            </div>

            {/* Info grid */}
            <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-foreground mb-1">Informasi</h3>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground">{nurse.distanceKm} km dari lokasi Anda</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground font-mono text-xs">{nurse.strNumber}{strExpiry ? ` · Aktif s/d ${strExpiry}` : ""}</span>
              </div>
              {rate && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-muted-foreground font-semibold">Rp {parseInt(rate).toLocaleString("id")} / visit</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-muted-foreground">{phone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center gap-3 text-sm">
                  <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-muted-foreground">{address}</span>
                </div>
              )}
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-3">Layanan yang Tersedia</h3>
                <div className="space-y-2">
                  {services.map((service, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {services.length === 0 && (
              <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-2">
                  <Clock className="w-4 h-4 text-teal-600 inline mr-2" />
                  Spesialisasi
                </h3>
                <p className="text-sm text-muted-foreground">{nurse.specialization}</p>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Footer CTA */}
        <div className="p-4 bg-white border-t border-border/50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Tutup
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20"
            disabled={!nurse.isOnline}
            onClick={() => { if (nurse.isOnline) { onConnect?.(); onClose(); } }}
          >
            <Phone className="w-4 h-4 mr-2" />
            {nurse.isOnline ? "Hubungkan Sekarang" : "Sedang Offline"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
