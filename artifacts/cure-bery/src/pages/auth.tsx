import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useLogin } from "@/hooks/use-app-queries";
import { useToast } from "@/hooks/use-toast";
import { HeartPulse, UserCircle2, ShieldPlus, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'patient' | 'nurse' | null>(null);
  
  const [patientEmail, setPatientEmail] = useState("pasien@cureberry.id");
  const [patientPassword, setPatientPassword] = useState("password123");
  
  const [nurseEmail, setNurseEmail] = useState("perawat1@cureberry.id");
  const [nursePassword, setNursePassword] = useState("password123");

  const patientLogin = useLogin("patient");
  const nurseLogin = useLogin("nurse");

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await patientLogin.mutateAsync({ email: patientEmail, password: patientPassword });
      setAuth(res.user, res.token);
      toast({ title: "Berhasil Masuk", description: `Selamat datang, ${res.user.name}` });
      setLocation("/patient-dashboard");
    } catch (err: any) {
      toast({ title: "Gagal Masuk", description: err.message, variant: "destructive" });
    }
  };

  const handleNurseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await nurseLogin.mutateAsync({ email: nurseEmail, password: nursePassword });
      setAuth(res.user, res.token);
      toast({ title: "Berhasil Masuk", description: `Selamat datang kembali, ${res.user.name}` });
      setLocation("/nurse-dashboard");
    } catch (err: any) {
      toast({ title: "Gagal Masuk", description: err.message, variant: "destructive" });
    }
  };

  // Mobile View Tabs
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-border/50">
          <div className="p-6 text-center bg-primary text-white">
            <div className="flex justify-center items-center gap-2 mb-2">
              <HeartPulse className="w-8 h-8" />
              <h1 className="text-2xl font-display font-bold">CureBery</h1>
            </div>

          </div>
          
          <div className="flex border-b border-border/50">
            <button 
              className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab !== 'nurse' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('patient')}
            >
              Klien
            </button>
            <button 
              className={`flex-1 py-4 font-semibold text-sm transition-colors ${activeTab === 'nurse' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('nurse')}
            >
              Tenaga Medis
            </button>
          </div>

          <div className="p-6">
            {activeTab !== 'nurse' ? (
              <form onSubmit={handlePatientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={patientPassword} onChange={e => setPatientPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={patientLogin.isPending}>
                  {patientLogin.isPending ? "Memproses..." : "Masuk"}
                </Button>
                <div className="mt-3 pt-3 border-t border-blue-100 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/patient-register")}
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Daftar sebagai Klien
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleNurseLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={nurseEmail} onChange={e => setNurseEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={nursePassword} onChange={e => setNursePassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={nurseLogin.isPending}>
                  {nurseLogin.isPending ? "Memproses..." : "Masuk"}
                </Button>
                <div className="mt-3 pt-3 border-t border-teal-100 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/nurse-register")}
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Daftar sebagai Tenaga Medis
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Split Screen View
  return (
    <div className="min-h-screen flex w-full overflow-hidden">
      {/* Patient Side */}
      <div className="w-1/2 relative flex items-center justify-center group overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/patient-bg.png`} 
            alt="Patient Background" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-blue-500/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
        
        <Card className="w-full max-w-[420px] relative z-10 shadow-2xl shadow-blue-900/20 border-white/50 bg-white/90 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
              <UserCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-display text-blue-950">Klien</CardTitle>
            <CardDescription className="text-blue-800/70">Cari perawat terdekat ke lokasi Anda dengan cepat.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePatientLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-blue-950 font-medium">Email</Label>
                <Input 
                  type="email" 
                  value={patientEmail} 
                  onChange={e => setPatientEmail(e.target.value)} 
                  className="bg-white/80 border-blue-200 focus-visible:ring-blue-500"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-950 font-medium">Password</Label>
                <Input 
                  type="password" 
                  value={patientPassword} 
                  onChange={e => setPatientPassword(e.target.value)} 
                  className="bg-white/80 border-blue-200 focus-visible:ring-blue-500"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 h-12 text-lg rounded-xl transition-all hover:scale-[1.02]"
                disabled={patientLogin.isPending}
              >
                {patientLogin.isPending ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-blue-100/60 text-center">
              <p className="text-sm text-blue-700/60 mb-3">Belum punya akun klien?</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/patient-register")}
                className="w-full h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Daftar sebagai Klien
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Divider / Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center p-1 relative border-4 border-white/80">
          <div className="absolute inset-0 rounded-full border border-gray-100" />
          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white">
            <HeartPulse className="w-10 h-10" />
          </div>
        </div>
        <div className="mt-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/50 text-gray-800 font-display font-bold tracking-widest uppercase text-sm">
          CUREBERY
        </div>
      </div>

      {/* Nurse Side */}
      <div className="w-1/2 relative flex items-center justify-center group overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/nurse-bg.png`} 
            alt="Nurse Background" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/60 to-emerald-500/20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
        
        <Card className="w-full max-w-[420px] relative z-10 shadow-2xl shadow-teal-900/20 border-white/50 bg-white/90 backdrop-blur-xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
              <ShieldPlus className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-display text-teal-950">Tenaga Medis</CardTitle>
            <CardDescription className="text-teal-800/70">Kelola status Anda dan terima permintaan klien.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNurseLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-teal-950 font-medium">Email</Label>
                <Input 
                  type="email" 
                  value={nurseEmail} 
                  onChange={e => setNurseEmail(e.target.value)} 
                  className="bg-white/80 border-teal-200 focus-visible:ring-teal-500"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-teal-950 font-medium">Password</Label>
                <Input 
                  type="password" 
                  value={nursePassword} 
                  onChange={e => setNursePassword(e.target.value)} 
                  className="bg-white/80 border-teal-200 focus-visible:ring-teal-500"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/30 h-12 text-lg rounded-xl transition-all hover:scale-[1.02]"
                disabled={nurseLogin.isPending}
              >
                {nurseLogin.isPending ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-teal-100/60 text-center">
              <p className="text-sm text-teal-700/60 mb-3">Belum punya akun perawat?</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/nurse-register")}
                className="w-full h-11 rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Daftar sebagai Tenaga Medis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
