import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { registerNurse } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  HeartPulse, ArrowLeft, Shield, CheckCircle2, 
  User, Mail, Lock, FileText, Stethoscope, 
  Phone, MapPin, Briefcase, Eye, EyeOff, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SPECIALIZATIONS = [
  "Perawat Umum",
  "Perawat ICU / ICCU",
  "Perawat Anak (Pediatrik)",
  "Perawat Geriatri (Lansia)",
  "Perawat Luka (Wound Care)",
  "Perawat Maternitas",
  "Perawat Onkologi",
  "Perawat Jiwa (Psikiatri)",
  "Perawat Bedah",
  "Perawat Homecare",
];

const STEPS = [
  { id: 1, label: "Data Pribadi", icon: User },
  { id: 2, label: "Kredensial STR", icon: FileText },
  { id: 3, label: "Keamanan Akun", icon: Lock },
];

export default function NurseRegisterPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    strNumber: "",
    specialization: "",
    yearsExperience: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim() || form.name.trim().length < 3) newErrors.name = "Nama lengkap minimal 3 karakter";
      if (!form.phone.trim()) newErrors.phone = "Nomor telepon wajib diisi";
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Format email tidak valid";
    }
    if (s === 2) {
      if (!form.strNumber.trim() || form.strNumber.trim().length < 5) newErrors.strNumber = "Nomor STR minimal 5 karakter";
      if (!form.specialization) newErrors.specialization = "Pilih spesialisasi Anda";
    }
    if (s === 3) {
      if (!form.password || form.password.length < 6) newErrors.password = "Password minimal 6 karakter";
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Password tidak cocok";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else setLocation("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const res = await registerNurse({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        strNumber: form.strNumber.trim(),
        specialization: form.specialization,
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
      });

      setIsSuccess(true);
      setAuth(res.user, res.token);

      setTimeout(() => {
        toast({
          title: "Pendaftaran Berhasil!",
          description: `Selamat datang, ${res.user.name}. Akun perawat Anda telah aktif.`,
        });
        setLocation("/nurse-dashboard");
      }, 2000);
    } catch (err: any) {
      const msg = err?.message || "Gagal mendaftar, coba beberapa saat lagi";
      if (msg.includes("sudah terdaftar") || msg.includes("EMAIL_EXISTS")) {
        setStep(1);
        setErrors({ email: "Email ini sudah terdaftar, gunakan email lain" });
      } else {
        toast({ title: "Pendaftaran Gagal", description: msg, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-28 h-28 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/30"
          >
            <CheckCircle2 className="w-14 h-14 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-gray-900 mb-3"
          >
            Pendaftaran Berhasil!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-500 text-lg"
          >
            Mengarahkan ke dashboard perawat...
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg leading-none block">CureBery</span>
              <span className="text-xs text-teal-600 font-medium">Daftar Perawat</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full border border-teal-100 mb-4">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Registrasi Perawat Profesional</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bergabung dengan CureBery</h1>
          <p className="text-gray-500">Lengkapi data diri dan STR Anda untuk mulai melayani klien</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      backgroundColor: isDone ? "#10b981" : isActive ? "#0d9488" : "#e5e7eb",
                      scale: isActive ? 1.1 : 1,
                    }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                    )}
                  </motion.div>
                  <span className={`text-xs mt-1.5 font-medium ${isActive ? "text-teal-700" : isDone ? "text-emerald-600" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 mt-[-14px]">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{ backgroundColor: step > s.id ? "#10b981" : "#e5e7eb" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card className="shadow-xl shadow-teal-900/5 border-border/60 bg-white/90 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* STEP 1: Data Pribadi */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" /> Data Pribadi
                    </CardTitle>
                    <CardDescription>Isi informasi identitas Anda sebagai perawat</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Nama Lengkap (beserta gelar) <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Contoh: Siti Rahayu, S.Kep"
                          value={form.name}
                          onChange={e => update("name", e.target.value)}
                          className={`pl-10 h-11 ${errors.name ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="email@contoh.com"
                          value={form.email}
                          onChange={e => update("email", e.target.value)}
                          className={`pl-10 h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Nomor Telepon <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={form.phone}
                          onChange={e => update("phone", e.target.value)}
                          className={`pl-10 h-11 ${errors.phone ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`}
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Alamat <span className="text-gray-400 font-normal">(opsional)</span></Label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Jl. Contoh No. 1, Jakarta"
                          value={form.address}
                          onChange={e => update("address", e.target.value)}
                          className="pl-10 h-11 border-border/60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}

              {/* STEP 2: Kredensial STR */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" /> Kredensial & Spesialisasi
                    </CardTitle>
                    <CardDescription>Data STR (Surat Tanda Registrasi) dan keahlian Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex gap-3">
                      <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-teal-800">Verifikasi STR</p>
                        <p className="text-xs text-teal-600 mt-0.5">Nomor STR akan diverifikasi tim CureBery dalam 1x24 jam sebelum akun aktif sepenuhnya.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Nomor STR <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Contoh: STR-2024-001234"
                          value={form.strNumber}
                          onChange={e => update("strNumber", e.target.value)}
                          className={`pl-10 h-11 font-mono tracking-wide ${errors.strNumber ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`}
                        />
                      </div>
                      {errors.strNumber && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.strNumber}</p>}
                      <p className="text-xs text-gray-400">Nomor STR terdiri dari format STR-YYYY-XXXXXX</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Spesialisasi <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                        <Select value={form.specialization} onValueChange={v => update("specialization", v)}>
                          <SelectTrigger className={`pl-10 h-11 ${errors.specialization ? "border-red-400" : "border-border/60"}`}>
                            <SelectValue placeholder="Pilih spesialisasi Anda..." />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALIZATIONS.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.specialization && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.specialization}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Pengalaman Kerja <span className="text-gray-400 font-normal">(opsional)</span></Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          placeholder="Tahun pengalaman"
                          value={form.yearsExperience}
                          onChange={e => update("yearsExperience", e.target.value)}
                          className="pl-10 h-11 border-border/60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}

              {/* STEP 3: Keamanan Akun */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-teal-600" /> Keamanan Akun
                    </CardTitle>
                    <CardDescription>Buat password yang kuat untuk keamanan akun Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-border/50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pendaftaran</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Nama</span>
                          <span className="text-sm font-semibold text-gray-800">{form.name || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Email</span>
                          <span className="text-sm font-semibold text-gray-800">{form.email || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Spesialisasi</span>
                          <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50 text-xs">{form.specialization || "-"}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Nomor STR</span>
                          <span className="text-sm font-mono font-semibold text-gray-800">{form.strNumber || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          value={form.password}
                          onChange={e => update("password", e.target.value)}
                          className={`pl-10 pr-10 h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-300" : "border-border/60"}`}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.password}</p>}
                      {form.password && (
                        <div className="flex gap-1 mt-1">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${form.password.length >= [6, 8, 10, 12][i] ? "bg-teal-500" : "bg-gray-200"}`} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">Konfirmasi Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ulangi password Anda"
                          value={form.confirmPassword}
                          onChange={e => update("confirmPassword", e.target.value)}
                          className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? "border-red-400 focus-visible:ring-red-300" : form.confirmPassword && form.password === form.confirmPassword ? "border-emerald-400" : "border-border/60"}`}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {errors.confirmPassword}</p>}
                      {form.confirmPassword && form.password === form.confirmPassword && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Password cocok</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                      Dengan mendaftar, Anda menyetujui <span className="text-teal-600 underline cursor-pointer">Syarat & Ketentuan</span> dan <span className="text-teal-600 underline cursor-pointer">Kebijakan Privasi</span> CureBery.
                    </p>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 h-12 rounded-xl border-border/60"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 text-base transition-all hover:scale-[1.02]"
                >
                  Lanjutkan →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/20 text-base transition-all hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mendaftarkan...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Daftar Sekarang</>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Back to Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <button onClick={() => setLocation("/")} className="text-teal-600 font-semibold hover:underline">
            Masuk di sini
          </button>
        </p>
      </div>
    </div>
  );
}
