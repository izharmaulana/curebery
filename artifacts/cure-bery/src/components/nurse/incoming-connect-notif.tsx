import { useEffect, useState } from "react";
import { CheckCircle2, X, UserCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomingConnectNotifProps {
  fromName: string;
  fromSpec: string;
  onAccept: () => void;
  onReject: () => void;
}

const TIMEOUT_SEC = 15;

export function IncomingConnectNotif({ fromName, fromSpec, onAccept, onReject }: IncomingConnectNotifProps) {
  const [countdown, setCountdown] = useState(TIMEOUT_SEC);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (countdown <= 0) { onReject(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onReject]);

  const initials = fromName.split(" ").map((n: string) => n[0]).join("").substring(0, 2);
  const progress = (countdown / TIMEOUT_SEC) * 100;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
        {/* Progress bar countdown */}
        <div className="h-1 bg-gray-100 relative">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-4 py-3.5 flex items-start gap-3">
          {/* Icon/badge */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              {initials}
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
              <Bell className="w-2.5 h-2.5 text-white fill-white" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Simulasi label */}
            <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-0.5">
              Simulasi — Notif ke {fromName.split(" ")[0]}
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">
              Kamu diajak terhubung! 🔗
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">{fromName.split(" ")[0]}</span>
              {" "}({fromSpec}) ingin berkenalan
            </p>
          </div>

          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">{countdown}d</span>
        </div>

        {/* Buttons */}
        <div className="px-4 pb-3.5 flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-9 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm"
            onClick={onAccept}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Terima
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-9 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl text-sm"
            onClick={onReject}
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Tolak
          </Button>
        </div>
      </div>
    </div>
  );
}
