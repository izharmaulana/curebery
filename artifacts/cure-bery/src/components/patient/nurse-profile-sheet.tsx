import { NursePublicProfile } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star, MapPin, Phone, CheckCircle2, Activity,
  Clock, Award, Stethoscope, ShieldCheck, X
} from "lucide-react";

const NURSE_EXTRAS: Record<number, {
  bio: string;
  experienceYears: number;
  totalServices: number;
  price: string;
  services: string[];
  education: string;
  availability: string;
}> = {
  1: {
    bio: "Perawat berpengalaman dengan fokus pada perawatan luka, infus, dan monitoring kondisi pasien di rumah. Memiliki pengalaman bekerja di RS Cipto Mangunkusumo selama 6 tahun.",
    experienceYears: 6,
    totalServices: 312,
    price: "Rp 150.000 / kunjungan",
    services: ["Perawatan Luka", "Pemasangan Infus", "Injeksi", "Pengukuran Vital Sign", "Konsultasi Kesehatan"],
    education: "S.Kep – Universitas Indonesia",
    availability: "Senin – Sabtu, 07.00 – 20.00",
  },
  2: {
    bio: "Spesialis perawatan intensif dengan keahlian dalam penanganan pasien kritis dan post-operasi. Berpengalaman di ICU RSUD Tarakan Jakarta.",
    experienceYears: 8,
    totalServices: 487,
    price: "Rp 200.000 / kunjungan",
    services: ["Perawatan Post-Operasi", "Monitor Pasien Kritis", "Pemasangan NGT", "Suction", "Injeksi IV"],
    education: "S.Kep – Universitas Airlangga",
    availability: "Setiap Hari, 08.00 – 22.00",
  },
  3: {
    bio: "Perawat anak yang lembut dan sabar, berpengalaman menangani bayi, balita, dan anak-anak dengan berbagai kondisi medis.",
    experienceYears: 5,
    totalServices: 228,
    price: "Rp 175.000 / kunjungan",
    services: ["Perawatan Bayi", "Imunisasi Anak", "Nebulisasi", "Pemantauan Tumbuh Kembang", "Perawatan Luka Anak"],
    education: "S.Kep – Universitas Padjajaran",
    availability: "Senin – Jumat, 08.00 – 18.00",
  },
  4: {
    bio: "Spesialis perawatan lansia dengan keahlian khusus dalam rehabilitasi, pendampingan harian, dan penanganan penyakit degeneratif.",
    experienceYears: 10,
    totalServices: 563,
    price: "Rp 180.000 / kunjungan",
    services: ["Perawatan Lansia", "Fisioterapi Ringan", "Manajemen Obat", "Pemantauan Gula Darah", "Perawatan Dekubitus"],
    education: "S.Kep – Universitas Diponegoro",
    availability: "Senin – Minggu, 07.00 – 19.00",
  },
  5: {
    bio: "Perawat umum yang berdedikasi, siap membantu berbagai kebutuhan medis dasar di rumah dengan pelayanan yang profesional dan ramah.",
    experienceYears: 4,
    totalServices: 189,
    price: "Rp 130.000 / kunjungan",
    services: ["Perawatan Luka", "Injeksi", "Pengukuran Vital Sign", "Pemasangan Infus", "Konsultasi Medis"],
    education: "S.Kep – Universitas Hasanuddin",
    availability: "Selasa – Minggu, 08.00 – 20.00",
  },
};

const DEFAULT_EXTRA = {
  bio: "Tenaga medis profesional dengan dedikasi tinggi dalam memberikan pelayanan perawatan kesehatan terbaik di rumah.",
  experienceYears: 3,
  totalServices: 120,
  price: "Rp 150.000 / kunjungan",
  services: ["Perawatan Luka", "Injeksi", "Pengukuran Vital Sign", "Konsultasi Kesehatan"],
  education: "S.Kep – Universitas Negeri",
  availability: "Senin – Sabtu, 08.00 – 20.00",
};

interface NurseProfileSheetProps {
  nurse: NursePublicProfile | null;
  open: boolean;
  onClose: () => void;
}

export function NurseProfileSheet({ nurse, open, onClose }: NurseProfileSheetProps) {
  if (!nurse) return null;

  const extra = NURSE_EXTRAS[nurse.id] ?? DEFAULT_EXTRA;
  const initials = nurse.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-0 space-y-0">
          <SheetTitle className="sr-only">Profil Tenaga Medis</SheetTitle>
          {/* Hero banner */}
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
                  {nurse.rating.toFixed(1)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Rating</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-border/40 shadow-sm">
                <div className="font-bold text-lg text-foreground">{extra.experienceYears} thn</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pengalaman</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-border/40 shadow-sm">
                <div className="font-bold text-lg text-foreground">{extra.totalServices}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Layanan</p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Tentang
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{extra.bio}</p>
            </div>

            {/* Info grid */}
            <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-foreground mb-1">Informasi</h3>
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground">{extra.education}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground">{extra.availability}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground">{nurse.distanceKm} km dari lokasi Anda</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-muted-foreground font-mono text-xs">{nurse.strNumber}</span>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl p-4 border border-border/40 shadow-sm">
              <h3 className="font-bold text-sm text-foreground mb-3">Layanan yang Tersedia</h3>
              <div className="space-y-2">
                {extra.services.map((service, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    {service}
                  </div>
                ))}
              </div>
            </div>

            {/* Tariff */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
              <p className="text-xs text-teal-700 font-medium mb-0.5">Tarif Layanan</p>
              <p className="text-xl font-bold text-teal-800">{extra.price}</p>
            </div>

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
          >
            <Phone className="w-4 h-4 mr-2" />
            {nurse.isOnline ? "Hubungi Sekarang" : "Sedang Offline"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
