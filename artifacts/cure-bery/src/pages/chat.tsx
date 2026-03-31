import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, CheckCheck, ShoppingBag, X, Info, Loader2,
} from "lucide-react";
import { requestNotifPermission, showNotification } from "@/lib/notifications";

interface Message {
  id: number;
  senderUserId: number;
  senderRole: "patient" | "nurse";
  text: string;
  createdAt: string;
}

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const connectionId = params.get("connectionId");
  const partnerName = params.get("name") ?? "Tenaga Medis";
  const nurseSpec = params.get("spec") ?? "Perawat";
  const isNurseMode = params.get("type") === "nurse";

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  // Fetch current user ID once on mount
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) setCurrentUserId(data.id); })
      .catch(() => {});
  }, []);

  const fetchMessages = useCallback(async (initial = false) => {
    if (!connectionId) return;
    try {
      // Always fetch all messages for simplicity and reliability
      const res = await fetch(`/api/messages/${connectionId}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        if (initial) setFetchError(true);
        return;
      }
      setFetchError(false);
      const data: Message[] = await res.json();
      setMessages(prev => {
        if (initial) return data;
        // Merge new messages only
        const maxId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) : 0;
        const newMsgs = data.filter(m => m.id > maxId);
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
      });
      if (data.length > 0) {
        lastIdRef.current = data[data.length - 1].id;
      }
    } catch {
      if (initial) setFetchError(true);
    }
  }, [connectionId]);

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    lastIdRef.current = 0;
    fetchMessages(true).then(() => {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });
    if (!isNurseMode) requestNotifPermission();
    pollRef.current = setInterval(() => fetchMessages(false), 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [connectionId, fetchMessages]);

  useEffect(() => { if (messages.length > 0) scrollToBottom(); }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !connectionId || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${connectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      }
    } catch {}
    setSending(false);
  };

  const handleOrder = () => {
    setShowOrderConfirm(false);
    setOrdered(true);
    showNotification({
      title: "Order Berhasil Dikirim!",
      body: `${partnerName} akan segera menuju lokasi Anda`,
      tag: "order-sent",
    });
    setTimeout(() => {
      setLocation(`/tracking?name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`);
    }, 800);
  };

  const handleBack = () => {
    if (isNurseMode) setLocation("/nurse-dashboard");
    else setLocation("/patient-dashboard");
  };

  const isMine = (msg: Message): boolean => {
    // Use actual user ID if available (most reliable)
    if (currentUserId !== null) return msg.senderUserId === currentUserId;
    // Fallback: use role from URL params
    return isNurseMode ? msg.senderRole === "nurse" : msg.senderRole === "patient";
  };

  const initials = partnerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground leading-none truncate">{partnerName}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {nurseSpec} · {isNurseMode ? "Mode Perawat" : "Mode Pasien"} · Online
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-600 text-center flex-shrink-0">
          Gagal memuat pesan. Pastikan kamu sudah login. <button className="underline font-semibold" onClick={() => setLocation("/")}>Login ulang</button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="flex justify-center">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-white border border-border/40 rounded-full px-3 py-1 shadow-sm">
              <Info className="w-3 h-3" />
              {isNurseMode ? "Sesi chat dengan pasien dimulai 🤝" : "Sesi chat dimulai. Diskusikan kebutuhanmu dulu!"}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada pesan. Mulai percakapan!
            </div>
          ) : (
            messages.map(msg => {
              const mine = isMine(msg);
              return (
                <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                      {initials}
                    </div>
                  )}
                  <div className={`max-w-[72%] flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      mine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-foreground border border-border/40 shadow-sm rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] text-muted-foreground ${mine ? "flex-row-reverse" : ""}`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {mine && <CheckCheck className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Bottom area */}
      <div className="flex-shrink-0 bg-white border-t border-border/40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">

        {/* Input */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 max-w-xl mx-auto">
          <Input
            placeholder="Ketik pesan..."
            className="flex-1 h-10 bg-gray-50 border-border/60 rounded-xl text-sm"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !sending && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-3 max-w-xl mx-auto">
          {isNurseMode ? (
            <div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-10 bg-emerald-600 text-white font-bold"
                  onClick={() => setLocation(`/tracking?name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`)}
                >
                  Terima Order
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 border-red-200 text-red-600"
                  onClick={handleBack}
                >
                  Tolak
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-1.5 italic">
                sambil nunggu pasien, ngobrol dulu yuk!
              </p>
            </div>
          ) : ordered ? (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Order dikirim! Tenaga medis segera datang</span>
            </div>
          ) : showOrderConfirm ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p className="text-sm font-bold text-amber-800 text-center">Yakin mau order sekarang?</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-sm border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setShowOrderConfirm(false)}>
                  Batal
                </Button>
                <Button className="flex-1 h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleOrder}>
                  Ya, Order!
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                  onClick={() => setShowOrderConfirm(true)}
                >
                  <ShoppingBag className="w-4 h-4 mr-1.5" /> Order
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl"
                  onClick={handleBack}
                >
                  <X className="w-4 h-4 mr-1.5" /> Cancel
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-1.5 italic">
                nego dulu di chat baru klik order ya
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
