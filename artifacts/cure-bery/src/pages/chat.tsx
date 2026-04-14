import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, CheckCheck, Info, Loader2, Navigation,
  MapPin, X, CheckCircle2, AlertCircle, ShoppingBag, Star,
} from "lucide-react";
import { requestNotifPermission } from "@/lib/notifications";
import { RatingModal } from "@/components/patient/rating-modal";

interface Message {
  id: number;
  senderUserId: number;
  senderRole: "patient" | "nurse";
  text: string;
  createdAt: string;
}

type OrderStatus = "none" | "ordered" | "order_accepted" | "order_rejected";

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
  const [fetchError, setFetchError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [orderStatus, setOrderStatus] = useState<OrderStatus>("none");
  const [orderSending, setOrderSending] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelledPopup, setShowCancelledPopup] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) setCurrentUserId(data.id); })
      .catch(() => {});
  }, []);

  const fetchMessages = useCallback(async (initial = false) => {
    if (!connectionId) return;
    try {
      const res = await fetch(`/api/messages/${connectionId}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) { if (initial) setFetchError(true); return; }
      setFetchError(false);
      const data: Message[] = await res.json();
      setMessages(prev => {
        if (initial) return data;
        const maxId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) : 0;
        const newMsgs = data.filter(m => m.id > maxId);
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
      });
    } catch { if (initial) setFetchError(true); }
  }, [connectionId]);

  const fetchOrderStatus = useCallback(async () => {
    if (!connectionId) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/order-status`, {
        credentials: "include", cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setOrderStatus(data.orderStatus ?? "none");
      if (data.patientName) setPatientName(data.patientName);
    } catch {}
  }, [connectionId]);

  // Nurse: polling untuk detect pasien cancel
  useEffect(() => {
    console.log("NURSE POLL CHECK:", isNurseMode, connectionId);
    if (!isNurseMode || !connectionId) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/connections/${connectionId}`, { credentials: "include", cache: "no-store" });
        console.log("Poll response:", res.status);
        if (!res.ok) return;
        const data = await res.json();
        console.log("Poll data:", JSON.stringify(data));
        if (data.status === "cancelled") {
          clearInterval(poll);
          setShowCancelledPopup(data.cancelReason || "Tidak ada alasan");
        }
      } catch {}
    }, 6000);
    return () => clearInterval(poll);
  }, [isNurseMode, connectionId]);

  useEffect(() => {
    if (!connectionId) return;
    setLoading(true);
    fetchMessages(true).then(() => { setLoading(false); setTimeout(scrollToBottom, 100); });
    if (!isNurseMode) requestNotifPermission();
    pollRef.current = setInterval(() => fetchMessages(false), 1500);
    orderPollRef.current = setInterval(fetchOrderStatus, 3000);
    fetchOrderStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (orderPollRef.current) clearInterval(orderPollRef.current);
    };
  }, [connectionId, fetchMessages, fetchOrderStatus]);

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
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    } catch {}
    setSending(false);
  };

  const handlePlaceOrder = () => {
    if (!connectionId || orderSending || gettingGps) return;
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGettingGps(false);
        setOrderSending(true);
        try {
          const res = await fetch(`/api/connections/${connectionId}/order`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          if (res.ok) {
            setOrderStatus("ordered");
            setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`);
          }
        } catch {}
        setOrderSending(false);
      },
      async () => {
        setGettingGps(false);
        setOrderSending(true);
        try {
          const res = await fetch(`/api/connections/${connectionId}/order`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ lat: null, lng: null }),
          });
          if (res.ok) {
            setOrderStatus("ordered");
            setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`);
          }
        } catch {}
        setOrderSending(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleAcceptOrder = async () => {
    if (!connectionId) return;
    setOrderSending(true);
    try {
      await fetch(`/api/connections/${connectionId}/accept-order`, {
        method: "PUT", credentials: "include",
      });
      setOrderStatus("order_accepted");
      setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}&type=nurse`);
    } catch {}
    setOrderSending(false);
  };

  const handleRejectOrder = async () => {
    if (!connectionId) return;
    setOrderSending(true);
    try {
      await fetch(`/api/connections/${connectionId}/reject-order`, {
        method: "PUT", credentials: "include",
      });
      setOrderStatus("order_rejected");
    } catch {}
    setOrderSending(false);
  };

  const handleBack = () => {
    if (isNurseMode) setLocation("/nurse-dashboard");
    else setLocation("/patient-dashboard");
  };

  const isMine = (msg: Message): boolean => {
    if (currentUserId !== null) return msg.senderUserId === currentUserId;
    return isNurseMode ? msg.senderRole === "nurse" : msg.senderRole === "patient";
  };

  const initials = partnerName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const showNurseOrderNotif = isNurseMode && orderStatus === "ordered";
  const patientOrderRejected = !isNurseMode && orderStatus === "order_rejected";
  const patientOrderAccepted = !isNurseMode && orderStatus === "order_accepted";

  return (
    <>
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={handleBack} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
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
          {!isNurseMode && connectionId && (
            <button
              onClick={() => setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`)}
              className="w-9 h-9 rounded-full hover:bg-teal-50 flex items-center justify-center transition-colors flex-shrink-0"
              title="Lacak Perawat"
            >
              <Navigation className="w-4 h-4 text-teal-600" />
            </button>
          )}
        </div>
      </header>

      {/* NURSE: Incoming order notification */}
      {showNurseOrderNotif && (
        <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 z-20">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 flex-shrink-0 animate-bounce" />
              <p className="font-bold text-sm">Pasien minta layanan kunjungan rumah!</p>
            </div>
            <p className="text-xs text-orange-100 mb-3">
              {patientName || "Pasien"} sedang menunggu konfirmasi Anda. Lokasi sudah terdeteksi.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptOrder}
                disabled={orderSending}
                className="flex-1 h-9 rounded-xl bg-white text-orange-600 font-bold text-sm hover:bg-orange-50 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-70"
              >
                {orderSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Terima
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={orderSending}
                className="flex-1 h-9 rounded-xl bg-orange-700 text-white font-bold text-sm hover:bg-orange-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-70"
              >
                <X className="w-3.5 h-3.5" />
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NURSE: order was rejected confirmation */}
      {isNurseMode && orderStatus === "order_rejected" && (
        <div className="flex-shrink-0 bg-gray-100 border-b border-border/30 px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <X className="w-3 h-3 text-red-400" />
          Anda menolak order kunjungan pasien.
        </div>
      )}

      {/* PATIENT: order sent, waiting */}
      {!isNurseMode && orderStatus === "ordered" && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-700">
            <Loader2 className="w-3 h-3 animate-spin" />
            Menunggu perawat konfirmasi order…
          </div>
          <button
            onClick={() => setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`)}
            className="text-[10px] font-semibold text-blue-600 underline whitespace-nowrap"
          >
            Lihat Peta
          </button>
        </div>
      )}

      {/* PATIENT: order accepted! */}
      {patientOrderAccepted && (
        <div className="flex-shrink-0 bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Perawat sedang menuju lokasimu!
          </div>
          <button
            onClick={() => setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`)}
            className="text-[10px] font-bold text-emerald-700 underline whitespace-nowrap"
          >
            Lacak sekarang
          </button>
        </div>
      )}

      {/* PATIENT: order rejected */}
      {patientOrderRejected && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-3 h-3" />
          Perawat tidak bisa menerima kunjungan. Silakan chat ulang.
        </div>
      )}

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-600 text-center flex-shrink-0">
          Gagal memuat pesan. <button className="underline font-semibold" onClick={() => setLocation("/")}>Login ulang</button>
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
            <div className="text-center py-8 text-muted-foreground text-sm">Belum ada pesan. Mulai percakapan!</div>
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
                      mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-foreground border border-border/40 shadow-sm rounded-bl-sm"
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

        {/* Patient: Order button row */}
        {!isNurseMode && orderStatus === "none" && (
          <div className="px-4 pt-3 pb-0 max-w-xl mx-auto space-y-2">
            <button
              onClick={handlePlaceOrder}
              disabled={orderSending || gettingGps}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-70"
            >
              {gettingGps ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mendapatkan lokasi…</>
              ) : orderSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim order…</>
              ) : (
                <><MapPin className="w-4 h-4" /> Order Kunjungan Rumah</>
              )}
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
              Batalkan & Keluar
            </button>
          </div>
        )}

        {/* Patient: order already sent — show tracking shortcut */}
        {!isNurseMode && (orderStatus === "ordered" || orderStatus === "order_accepted") && (
          <div className="px-4 pt-3 pb-0 max-w-xl mx-auto space-y-2">
            <button
              onClick={() => setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}`)}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              Lihat Lokasi Perawat di Peta
            </button>
            {orderStatus === "ordered" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
                Batalkan Order
              </button>
            )}
            {orderStatus === "order_accepted" && (
              <button
                onClick={() => setShowRating(true)}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Star className="w-4 h-4" />
                Selesaikan Orderan &amp; Beri Rating
              </button>
            )}
          </div>
        )}

        {/* Nurse: track patient button if order accepted */}
        {isNurseMode && orderStatus === "order_accepted" && (
          <div className="px-4 pt-3 pb-0 max-w-xl mx-auto">
            <button
              onClick={() => setLocation(`/tracking?connectionId=${connectionId}&name=${encodeURIComponent(partnerName)}&spec=${encodeURIComponent(nurseSpec)}&type=nurse`)}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              Navigasi ke Lokasi Pasien
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pt-2 pb-2 flex items-center gap-2 max-w-xl mx-auto">
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

        <div className="px-4 pb-3 max-w-xl mx-auto">
          {isNurseMode ? (
            <p className="text-center text-[10px] text-muted-foreground italic">
              Tunggu order dari pasien untuk mulai kunjungan
            </p>
          ) : (
            <p className="text-center text-[10px] text-muted-foreground italic">
              Nego tarif dulu, lalu klik tombol Order untuk pesan kunjungan
            </p>
          )}
        </div>
      </div>
    </div>

          {showCancelledPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 text-center">
            <div className="text-4xl">❌</div>
            <h3 className="font-bold text-lg">Pasien Membatalkan Sesi</h3>
            <p className="text-sm text-muted-foreground">Alasan: <span className="font-semibold text-foreground">{showCancelledPopup}</span></p>
            <button onClick={() => { setShowCancelledPopup(null); setLocation("/nurse-dashboard"); }}
              className="w-full h-10 rounded-xl bg-primary text-white font-bold text-sm">
              OK, Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Batalkan Sesi?</h3>
            <p className="text-sm text-muted-foreground">Pilih alasan pembatalan:</p>
            <div className="space-y-2">
              {["Harga tidak sesuai", "Perawat terlalu jauh", "Sudah tidak butuh", "Isi sendiri"].map(r => (
                <button key={r} onClick={() => { setCancelReason(r); setCustomReason(""); }}
                  className={"w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all " + (cancelReason === r ? "border-red-500 bg-red-50 text-red-600" : "border-border/60 hover:bg-gray-50")}>
                  {r}
                </button>
              ))}
              {cancelReason === "Isi sendiri" && (
                <input type="text" placeholder="Tulis alasan..." value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 text-sm outline-none focus:border-red-400" />
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); setCustomReason(""); }}
                className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-semibold">
                Kembali
              </button>
              <button
                disabled={!cancelReason || (cancelReason === "Isi sendiri" && !customReason.trim())}
                onClick={async () => {
                  const reason = cancelReason === "Isi sendiri" ? customReason : cancelReason;
                  await fetch("/api/connections/" + connectionId + "/cancel", {
                    method: "PUT", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason })
                  });

                  setShowCancelModal(false);
                  setLocation("/patient-dashboard");
                }}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold">
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
      {showRating && (
      <RatingModal
        nurseName={partnerName}
        nurseSpec={nurseSpec}
        connectionId={connectionId}
        onClose={() => setShowRating(false)}
        onSubmit={() => { setShowRating(false); localStorage.setItem("session_ended", "1"); setLocation("/patient-dashboard"); }}
      />
    )}
    </>
  );
}
