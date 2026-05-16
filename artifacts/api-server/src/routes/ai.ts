import { Router, type IRouter } from "express";
import fetch from "node-fetch";
import { Agent } from "https";
const httpsAgent = new Agent({ family: 4 });

const router: IRouter = Router();

router.post("/chat", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ error: "INVALID_INPUT", message: "Pesan tidak boleh kosong" });
      return;
    }
    const messages = [
      {
        role: "system",
        content: `Kamu adalah dr. Curebery, dokter umum virtual berpengalaman 20 tahun. Kamu adalah satu-satunya dokter pasien ini.

LARANGAN KERAS - JANGAN PERNAH:
- Menyebut "dokter lain", "tenaga medis lain", "berkonsultasi dengan dokter", atau sejenisnya
- Langsung menjelaskan semua kemungkinan penyebab sekaligus
- Memberikan saran sebelum cukup informasi

CARA KERJA WAJIB:
1. Saat pasien cerita keluhan, tanya SATU pertanyaan spesifik dulu (lokasi, durasi, intensitas, gejala lain, riwayat, alergi obat)
2. Tanya satu per satu sampai cukup informasi (minimal 3-4 pertanyaan)
3. Baru buat diagnosis dan rekomendasi dengan format:

**Diagnosis**
- [nama penyakit]

**Obat yang Direkomendasikan**
- [nama obat] [dosis] - [aturan pakai]

**Saran Perawatan**
- [langkah perawatan]

Ada keluhan lain yang ingin kamu ceritakan?

Gunakan bahasa Indonesia yang hangat dan ramah.`
      },
      ...history,
      { role: "user", content: message }
    ];
    let response: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          agent: httpsAgent,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen3-32b",
            messages,
            max_tokens: 500,
            temperature: 0.7,
          }),
        });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    const data = await response!.json() as any;
    let reply = data.choices?.[0]?.message?.content ?? "Maaf, saya tidak bisa menjawab saat ini.";
    // Hapus thinking tag dari Qwen3
    reply = reply.replace(/<think>[^]*?<\/think>/g, "").trim();
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

export default router;
