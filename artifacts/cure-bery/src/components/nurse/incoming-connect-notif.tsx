import { useEffect, useState } from "react";
import { X, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomingConnectNotifProps {
  fromName: string;
  fromSpec: string;
  onAutoAccepted: () => void;
  onReject: () => void;
}

const TIMEOUT_SEC = 10;

export function IncomingConnectNotif({ fromName, fromSpec, onAutoAccepted, onReject }: IncomingConnectNotifProps) {
  const [countdown, setCountdown] = useState(TIMEOUT_SEC);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      onAutoAccepted();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onAutoAccepted]);

  const initials = fromName.split(" ").map((n: string) => n[0]).join("").substring(0, 2);
  const progress = (countdown / TIMEOUT_SEC) * 100;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
        {/* Progress bar countdown (drains = auto accept) */}
        <div className="h-1.5 bg-gray-100 relative">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-4 py-3.5 flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              {initials}
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
              <Bell className="w-2.5 h-2.5 text-white fill-white" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide mb-0.5">
              Order Baru Masuk 🔔
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">
              <span className="font-semibold">{fromName.split(" ")[0]}</span> membutuhkan bantuan!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fromSpec} · Otomatis diterima dalam{" "}
              <span className="font-bold text-teal-600">{countdown}d</span>
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{countdown}d</span>
          </div>
        </div>

        {/* Only Tolak button */}
        <div className="px-4 pb-3.5">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-9 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl text-sm"
            onClick={onReject}
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Tolak Order
          </Button>
        </div>
      </div>
    </div>
  );
}
