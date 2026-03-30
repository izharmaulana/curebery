import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Send, ShieldPlus, Phone, Video,
  CheckCheck, ShoppingBag, X, Info,
} from "lucide-react";

interface Message {
  id: number;
  from: "client" | "nurse";
  text: string;
  time: string;
  read: boolean;
}

const DEMO_MESSAGES: Message[] = [
  { id: 1, from: "nurse", text: "Halo! Saya sudah terima permintaan Anda. Ada yang bisa saya bantu? 😊", time: "09:00", read: true },
  { id: 2, from: "client", text: "Halo kak, saya butuh perawatan luka pasca operasi di rumah", time: "09:01", read: true },
  { id: 3, from: "nurse", text: "Baik, bisa ceritakan kondisi lukanya? Sudah berapa hari pasca operasi?", time: "09:02", read: true },
  { id: 4, from: "client", text: "Sekitar 5 hari pasca operasi appendix, luka masih basah perlu dibersihkan", time: "09:03", read: true },
  { id: 5, from: "nurse", text: "Oke, saya bisa bantu. Untuk tarif kunjungan rumah Rp 200.000 ya, termasuk material perawatan luka 🩺", time: "09:04", read: true },
  { id: 6, from: "client", text: "Wah bisa kurang sedikit kak? 😅", time: "09:05", read: true },
  { id: 7, from: "nurse", text: "Boleh, Rp 175.000 sudah termasuk semua ya. Gimana? 🙏", time: "09:06", read: false },
];

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const nurseName = params.get("name") ?? "Tenaga Medis";
  const nurseSpec = params.get("spec") ?? "Perawat Umum";

  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), from: "client", text: input.trim(), time: now(), read: false }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, from: "nurse",
        text: "Oke siap! Segera saya proses ya 🙏",
        time: now(), read: false,
      }]);
    }, 1200);
  };

  const handleOrder = () => {
    setShowOrderConfirm(false);
    setOrdered(true);
    setTimeout(() => {
      setLocation(`/tracking?name=${encodeURIComponent(nurseName)}&spec=${encodeURIComponent(nurseSpec)}`);
    }, 800);
  };

  const handleCancel = () => {
    setLocation("/patient-dashboard");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 font-sans">

      {/* Header */}
      <header className="bg-white border-b border-border/50 shadow-sm z-10 flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setLocation("/patient-dashboard")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {nurseName.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground leading-none truncate">{nurseName}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{nurseSpec} · Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-teal-600 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-teal-600 transition-colors">
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-3 max-w-xl mx-auto">

          {/* Info chip */}
          <div className="flex justify-center">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-white border border-border/40 rounded-full px-3 py-1 shadow-sm">
              <Info className="w-3 h-3" />
              Sesi chat dimulai. Diskusikan kebutuhanmu dulu ya!
            </span>
          </div>

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
              {msg.from === "nurse" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                  {nurseName.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </div>
              )}
              <div className={`max-w-[72%] ${msg.from === "client" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "client"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-foreground border border-border/40 shadow-sm rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
                <div className={`flex items-center gap-1 text-[10px] text-muted-foreground ${msg.from === "client" ? "flex-row-reverse" : ""}`}>
                  <span>{msg.time}</span>
                  {msg.from === "client" && <CheckCheck className={`w-3 h-3 ${msg.read ? "text-blue-500" : "text-gray-400"}`} />}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Bottom area */}
      <div className="flex-shrink-0 bg-white border-t border-border/40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">

        {/* Chat Input */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 max-w-xl mx-auto">
          <Input
            placeholder="Ketik pesan..."
            className="flex-1 h-10 bg-gray-50 border-border/60 rounded-xl text-sm"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Order / Cancel buttons */}
        <div className="px-4 pb-3 max-w-xl mx-auto">
          {ordered ? (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Order dikirim! Tenaga medis segera datang 🚀</span>
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
                onClick={handleCancel}
              >
                <X className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            </div>
          )}

          {/* Hint text */}
          {!ordered && (
            <p className="text-center text-[10px] text-muted-foreground mt-1.5 italic">
              nego dulu di chat baru klik order yahhhhhhh 🙏
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
