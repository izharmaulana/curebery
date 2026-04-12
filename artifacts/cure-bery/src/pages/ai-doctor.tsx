import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Stethoscope, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIDoctorPage() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem("curebot-history");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{
      role: "assistant" as const,
      content: "Halo! Saya Curebery AI, asisten kesehatan AI dari Curebery. Silakan ceritakan keluhan atau pertanyaan kesehatanmu, saya siap membantu!",
    }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    try { sessionStorage.setItem("curebot-history", JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    const prefill = sessionStorage.getItem("curebot-prefill");
    if (prefill) {
      sessionStorage.removeItem("curebot-prefill");
      setInput(prefill);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "user" as const, content: prefill }]);
        setLoading(true);
        const history = messages.map(m => ({ role: m.role, content: m.content }));
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: prefill, history }),
        })
          .then(res => res.json())
          .then(data => setMessages(prev => [...prev, { role: "assistant" as const, content: data.reply }]))
          .catch(() => setMessages(prev => [...prev, { role: "assistant" as const, content: "Maaf, terjadi kesalahan." }]))
          .finally(() => { setLoading(false); setInput(""); });
      }, 100);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => setLocation("/patient-dashboard")} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold">CureBery AI</p>
            <p className="text-[11px] text-muted-foreground">Asisten Kesehatan Curebery</p>
          </div>
        </div>
      </header>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-[11px] text-amber-700">Curebery AI bukan pengganti dokter. Untuk kondisi darurat, segera hubungi tenaga medis.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-teal-100"}`}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Stethoscope className="w-4 h-4 text-teal-600" />}
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-white border border-border/50 shadow-sm rounded-tl-sm"}`}>
              <ReactMarkdown className="prose prose-sm max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>ol]:pl-4 [&>ul]:pl-4 [&>li]:mb-1 [&>strong]:font-bold">
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-teal-600" />
            </div>
            <div className="bg-white border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 bg-white border-t border-border/40 px-3 py-2">
        <div className="flex gap-1.5 max-w-lg mx-auto items-center">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Tanya keluhan kesehatanmu..." className="flex-1 rounded-full h-9 text-sm px-4" disabled={loading} />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} className="rounded-full h-9 w-9 p-0 bg-teal-600 hover:bg-teal-700 flex-shrink-0">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
