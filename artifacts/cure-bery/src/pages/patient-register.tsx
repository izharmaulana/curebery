import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, UserCircle2, Shield, CheckCircle2, Eye, EyeOff, HeartPulse, CalendarDays, Phone, MapPin, User } from "lucide-react";

const GENDERS = ["Laki-laki", "Perempuan"] as const;
const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const textColors = ["", "text-red-600", "text-yellow-600", "text-blue-600", "text-green-600"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

export default function PatientRegisterPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<string>("");
  const [address, setAddress] = useState("");
  const [bloodType, setBloodType] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) e.name = "Nama minimal 3 karakter";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Format email tidak valid";
    if (!phone.trim() || !/^08\d{8,11}$/.test(phone.replace(/\s/g, ""))) e.phone = "Nomor HP harus diawali 08 (10-13 digit)";
    if (!birthDate) e.birthDate = "Tanggal lahir wajib diisi";
    if (!gender) e.gender = "Pilih jenis kelamin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = "Password minimal 8 karakter";
    if (password !== confirmPassword) e.confirmPassword = "Konfirmasi password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, birthDate, gender, address, bloodType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setStep(1);
          setErrors({ email: "Email sudah terdaftar, gunakan email lain" });
          return;
        }
        throw new Error(data.message || "Gagal mendaftar");
      }
      setAuth(data.user, data.token);
      setIsDone(true);
      setTimeout(() => setLocation("/patient-dashboard"), 2000);
    } catch (err: any) {
      toast({ title: "Gagal Mendaftar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Pendaftaran Berhasil!</h2>
          <p className="text-muted-foreground">Selamat datang di CureBery, <span className="font-semibold text-blue-600">{name}</span>.</p>
          <p className="text-sm text-muted-foreground">Mengarahkan ke dashboard pasien...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { icon: UserCircle2, label: "Data Pribadi" },
    { icon: Shield, label: "Keamanan Akun" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => step === 1 ? setLocation("/") : setStep(1)}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-sm">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground leading-none">CureBery</h1>
            <p className="text-[11px] text-muted-foreground">Daftar Pasien</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <UserCircle2 className="w-3.5 h-3.5" /> Daftar sebagai Pasien
            </div>
            <h2 className="text-3xl font-bold text-foreground">Buat Akun Pasien</h2>
            <p className="text-muted-foreground mt-2 text-sm">Isi data diri Anda untuk mulai mencari perawat terdekat</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const idx = i + 1;
              const isActive = step === idx;
              const isDone = step > idx;
              return (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-gray-100 text-gray-400"}`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${isActive ? "text-blue-600" : isDone ? "text-green-600" : "text-muted-foreground"}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-[2px] w-24 mx-2 mb-5 rounded-full transition-all duration-500 ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-border/50 overflow-hidden">
            {/* Step 1: Data Pribadi */}
            {step === 1 && (
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Data Pribadi</h3>
                    <p className="text-xs text-muted-foreground">Isi informasi identitas Anda sebagai pasien</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nama */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }}
                        placeholder="Contoh: Budi Pratama"
                        className={`pl-10 h-11 ${errors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Email <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }}
                        placeholder="email@contoh.com"
                        className={`pl-8 h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  {/* Nomor HP */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Nomor HP <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }}
                        placeholder="08xxxxxxxxxx"
                        className={`pl-10 h-11 ${errors.phone ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>

                  {/* Tanggal Lahir & Jenis Kelamin */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-foreground">Tanggal Lahir <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={birthDate}
                          onChange={e => { setBirthDate(e.target.value); setErrors(p => ({ ...p, birthDate: "" })); }}
                          className={`pl-9 h-11 ${errors.birthDate ? "border-red-400" : ""}`}
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-foreground">Jenis Kelamin <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2 h-11">
                        {GENDERS.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => { setGender(g); setErrors(p => ({ ...p, gender: "" })); }}
                            className={`flex-1 text-sm font-medium rounded-lg border transition-all ${gender === g ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white border-border/60 text-muted-foreground hover:border-blue-300 hover:text-blue-600"}`}
                          >
                            {g === "Laki-laki" ? "♂ L" : "♀ P"}
                          </button>
                        ))}
                      </div>
                      {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                    </div>
                  </div>

                  {/* Golongan Darah (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Golongan Darah <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                    <div className="flex gap-2">
                      {BLOOD_TYPES.map(bt => (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setBloodType(bt === bloodType ? "" : bt)}
                          className={`flex-1 h-10 text-sm font-bold rounded-lg border transition-all ${bloodType === bt ? "bg-red-500 text-white border-red-500 shadow-sm" : "bg-white border-border/60 text-muted-foreground hover:border-red-300 hover:text-red-500"}`}
                        >
                          {bt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alamat (optional) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Alamat <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                      <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Jl. Contoh No. 123, Kota..."
                        rows={2}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-border/60 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01]"
                >
                  Lanjutkan <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="mt-5 pt-5 border-t border-border/40 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <button onClick={() => setLocation("/")} className="text-blue-600 font-semibold hover:underline">
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Keamanan Akun */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Keamanan Akun</h3>
                    <p className="text-xs text-muted-foreground">Buat password yang kuat untuk melindungi akun Anda</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Ringkasan Data</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                      <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-blue-500 text-xs font-bold flex-shrink-0">@</span>
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                      <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span>{phone}</span>
                    </div>
                    {gender && (
                      <div className="flex items-center gap-2 text-sm text-blue-900">
                        <span className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 text-center">⚥</span>
                        <span>{gender}{bloodType ? ` · Gol. Darah ${bloodType}` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
                        placeholder="Min. 8 karakter"
                        className={`pl-10 pr-10 h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-foreground">Konfirmasi Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: "" })); }}
                        placeholder="Ulangi password"
                        className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400" : confirmPassword && confirmPassword === password ? "border-green-400" : ""}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {confirmPassword && confirmPassword === password && (
                        <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  {/* Syarat & Ketentuan */}
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-muted-foreground border border-border/40">
                    Dengan mendaftar, Anda menyetujui <span className="text-blue-600 font-medium cursor-pointer hover:underline">Syarat & Ketentuan</span> dan <span className="text-blue-600 font-medium cursor-pointer hover:underline">Kebijakan Privasi</span> CureBery.
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-12 rounded-xl px-5 border-border/60"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Mendaftar...</span>
                    ) : (
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Buat Akun</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
