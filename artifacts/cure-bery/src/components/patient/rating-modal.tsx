import { useState } from "react";
import { Star, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RatingModalProps {
  nurseName: string;
  nurseSpec?: string;
  onClose: () => void;
  onSubmit?: (rating: number, comment: string) => void;
}

const QUICK_LABELS = ["Luar biasa 🔥", "Ramah sekali 😊", "Tepat waktu ⏰", "Profesional 👨‍⚕️", "Sangat membantu 💪"];

export function RatingModal({ nurseName, nurseSpec, onClose, onSubmit }: RatingModalProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setQuickTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    if (!selected) return;
    const fullComment = [
      ...quickTags,
      ...(comment.trim() ? [comment.trim()] : []),
    ].join(", ");
    onSubmit?.(selected, fullComment);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  const starLabel = ["", "Kurang memuaskan", "Cukup baik", "Baik", "Sangat baik", "Luar biasa!"][hovered || selected] || "";
  const initials = nurseName.split(" ").slice(0, 2).map(w => w[0]).join("");

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-center dark:text-white">Terima kasih! 🎉</h3>
          <p className="text-sm text-muted-foreground text-center">Ulasan Anda membantu tenaga medis berkembang lebih baik.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-teal-400 px-5 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-lg">
              {initials}
            </div>
            <div>
              <p className="font-bold text-sm">{nurseName}</p>
              <p className="text-[11px] opacity-80">{nurseSpec ?? "Tenaga Medis"}</p>
            </div>
          </div>
          <p className="text-sm font-semibold mt-3 opacity-90">Bagaimana layanan yang diberikan?</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Stars */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(s)}
                  className="transition-all duration-150 active:scale-90"
                >
                  <Star
                    className={`w-9 h-9 transition-all ${
                      s <= (hovered || selected)
                        ? "fill-amber-400 text-amber-400 scale-110"
                        : "text-gray-200 dark:text-gray-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-sm font-semibold transition-all duration-200 ${selected ? "text-amber-500" : "text-muted-foreground"}`}>
              {starLabel || "Tap bintang untuk memberi nilai"}
            </p>
          </div>

          {/* Quick tags */}
          {selected > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ceritakan sedikit (opsional)</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_LABELS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      quickTags.includes(tag)
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800 text-muted-foreground border-border/50 hover:border-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Tuliskan pengalaman Anda... (opsional)"
                className="resize-none text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border-border/50 min-h-[70px]"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onClose}>
              Lewati
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 bg-gradient-to-r from-primary to-teal-400 text-white font-bold shadow-md"
              disabled={!selected}
              onClick={handleSubmit}
            >
              Kirim Ulasan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
