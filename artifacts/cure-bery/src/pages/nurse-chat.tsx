import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Send, Gamepad2 } from "lucide-react";

export default function NurseChat() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const connectionId = params.get("connectionId");
  const partnerName = params.get("name") ?? "Nakes";
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [myName, setMyName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setMyUserId(data.id); setMyName(data.name); } });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!connectionId) return;
    const res = await fetch(`/api/nurse-connections/${connectionId}/messages`, { credentials: "include", cache: "no-store" });
    if (res.ok) setMessages(await res.json());
  }, [connectionId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !connectionId) return;
    const text = input.trim();
    setInput("");
    await fetch(`/api/nurse-connections/${connectionId}/messages`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, senderName: myName })
    });
    fetchMessages();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3 border-b border-border/50 shadow-sm">
        <button onClick={() => setLocation("/nurse-dashboard")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-bold text-sm">{partnerName}</p>
          <p className="text-xs text-muted-foreground">Sesama Tenaga Medis</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.senderUserId === myUserId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.senderUserId === myUserId ? "bg-violet-500 text-white" : "bg-white dark:bg-gray-800 text-foreground border border-border/30"}`}>
              {msg.senderUserId !== myUserId && <p className="text-[10px] font-semibold opacity-60 mb-0.5">{msg.senderName}</p>}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="bg-white dark:bg-gray-900 px-4 py-2 flex justify-center border-t border-border/50">
        <button onClick={() => setLocation(`/game-select?opponent=${encodeURIComponent(partnerName)}`)} className="flex items-center gap-1.5 bg-violet-100 text-violet-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-violet-200">
          <Gamepad2 className="w-3.5 h-3.5" /> Main Bareng
        </button>
      </div>
      <div className="bg-white dark:bg-gray-900 border-t border-border/50 px-4 py-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Tulis pesan..." className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none" />
        <button onClick={sendMessage} className="w-9 h-9 bg-violet-500 rounded-full flex items-center justify-center text-white">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}