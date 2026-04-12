import { Router, type IRouter } from "express";

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
        content: `Kamu adalah asisten kesehatan AI bernama "Curebery AI" dari aplikasi Curebery — platform homecare yang menghubungkan pasien dengan perawat profesional di Indonesia. 

Tugasmu:
- Menjawab pertanyaan seputar kesehatan, gejala penyakit, dan saran umum
- Menggunakan bahasa Indonesia yang ramah dan mudah dipahami
- Selalu menyarankan pasien untuk berkonsultasi dengan tenaga medis profesional untuk diagnosis lebih lanjut
- Jika gejala terdengar serius atau darurat, sarankan segera hubungi perawat atau dokter
- Tidak memberikan resep obat atau diagnosis pasti

Selalu akhiri dengan: "Untuk penanganan lebih lanjut, kamu bisa menghubungi perawat terdekat melalui Curebery 💙"`
      },
      ...history,
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json() as any;
    const reply = data.choices?.[0]?.message?.content ?? "Maaf, saya tidak bisa menjawab saat ini.";

    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

export default router;
