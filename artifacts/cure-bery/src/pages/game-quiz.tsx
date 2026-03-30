import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types ─── */
interface Question {
  id: number;
  category: string;
  categoryColor: string;
  question: string;
  choices: { key: string; text: string }[];
  answer: string;
}

/* ─── Full Question Bank (60 unique stems × 500 total entries across 5 docs) ─── */
const QUESTION_BANK: Question[] = [

  /* ══════════════════════════════════════════
     1. ANATOMI & FISIOLOGI (10 unique)
  ══════════════════════════════════════════ */
  { id: 101, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Apa nama pembuluh darah yang membawa darah dari jantung ke seluruh tubuh?",
    choices: [{ key: "A", text: "Vena" }, { key: "B", text: "Arteri" }, { key: "C", text: "Kapiler" }, { key: "D", text: "Aorta" }],
    answer: "B" },
  { id: 102, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Organ utama dalam sistem pernapasan manusia adalah?",
    choices: [{ key: "A", text: "Jantung" }, { key: "B", text: "Paru-paru" }, { key: "C", text: "Lambung" }, { key: "D", text: "Ginjal" }],
    answer: "B" },
  { id: 103, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Organ yang berfungsi menyaring darah dan menghasilkan urin adalah?",
    choices: [{ key: "A", text: "Hati" }, { key: "B", text: "Paru-paru" }, { key: "C", text: "Ginjal" }, { key: "D", text: "Lambung" }],
    answer: "C" },
  { id: 104, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Bagian otak yang mengatur keseimbangan tubuh adalah?",
    choices: [{ key: "A", text: "Serebrum" }, { key: "B", text: "Serebelum" }, { key: "C", text: "Medula oblongata" }, { key: "D", text: "Hipotalamus" }],
    answer: "B" },
  { id: 105, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Apa fungsi utama hemoglobin dalam darah?",
    choices: [{ key: "A", text: "Mengangkut oksigen" }, { key: "B", text: "Mengatur suhu tubuh" }, { key: "C", text: "Mencerna makanan" }, { key: "D", text: "Menghasilkan hormon" }],
    answer: "A" },
  { id: 106, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Apa nama bagian mata yang mengatur jumlah cahaya yang masuk?",
    choices: [{ key: "A", text: "Kornea" }, { key: "B", text: "Retina" }, { key: "C", text: "Pupil" }, { key: "D", text: "Lensa" }],
    answer: "C" },
  { id: 107, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Organ yang menghasilkan insulin adalah?",
    choices: [{ key: "A", text: "Hati" }, { key: "B", text: "Pankreas" }, { key: "C", text: "Ginjal" }, { key: "D", text: "Lambung" }],
    answer: "B" },
  { id: 108, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Sel darah putih berfungsi untuk?",
    choices: [{ key: "A", text: "Mengangkut oksigen" }, { key: "B", text: "Membekukan darah" }, { key: "C", text: "Melawan infeksi" }, { key: "D", text: "Mengangkut hormon" }],
    answer: "C" },
  { id: 109, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Zat yang dibutuhkan tubuh untuk membentuk tulang adalah?",
    choices: [{ key: "A", text: "Zat besi" }, { key: "B", text: "Kalsium" }, { key: "C", text: "Kalium" }, { key: "D", text: "Magnesium" }],
    answer: "B" },
  { id: 110, category: "Anatomi", categoryColor: "bg-teal-100 text-teal-700",
    question: "Apa nama tulang yang melindungi otak?",
    choices: [{ key: "A", text: "Tulang rusuk" }, { key: "B", text: "Tulang belakang" }, { key: "C", text: "Tulang tengkorak" }, { key: "D", text: "Tulang dada" }],
    answer: "C" },

  /* ══════════════════════════════════════════
     2. FARMAKOLOGI & ETIKA (4 unique)
  ══════════════════════════════════════════ */
  { id: 201, category: "Farmakologi", categoryColor: "bg-violet-100 text-violet-700",
    question: "Bagaimana cara kerja obat analgesik?",
    choices: [{ key: "A", text: "Menghambat enzim COX" }, { key: "B", text: "Meningkatkan tekanan darah" }, { key: "C", text: "Menurunkan kadar gula darah" }, { key: "D", text: "Menstimulasi sistem imun" }],
    answer: "A" },
  { id: 202, category: "Farmakologi", categoryColor: "bg-violet-100 text-violet-700",
    question: "Apa efek samping umum dari penggunaan antibiotik?",
    choices: [{ key: "A", text: "Mual" }, { key: "B", text: "Sakit kepala" }, { key: "C", text: "Insomnia" }, { key: "D", text: "Batuk" }],
    answer: "A" },
  { id: 203, category: "Farmakologi", categoryColor: "bg-violet-100 text-violet-700",
    question: "Apa prinsip utama dalam menjaga kerahasiaan pasien?",
    choices: [{ key: "A", text: "Memberi tahu keluarga" }, { key: "B", text: "Menyimpan informasi pasien dengan aman" }, { key: "C", text: "Membagikan data ke teman" }, { key: "D", text: "Menyebarkan ke media" }],
    answer: "B" },
  { id: 204, category: "Farmakologi", categoryColor: "bg-violet-100 text-violet-700",
    question: "Obat parasetamol digunakan untuk?",
    choices: [{ key: "A", text: "Menurunkan tekanan darah" }, { key: "B", text: "Mengobati infeksi" }, { key: "C", text: "Meredakan nyeri dan demam" }, { key: "D", text: "Mengatasi alergi" }],
    answer: "C" },

  /* ══════════════════════════════════════════
     3. PENYAKIT UMUM & PENCEGAHAN (10 unique)
  ══════════════════════════════════════════ */
  { id: 301, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Cara terbaik mencegah hipertensi adalah?",
    choices: [{ key: "A", text: "Makan makanan asin" }, { key: "B", text: "Olahraga rutin" }, { key: "C", text: "Merokok" }, { key: "D", text: "Kurang tidur" }],
    answer: "B" },
  { id: 302, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Gejala umum dari diabetes melitus adalah?",
    choices: [{ key: "A", text: "Demam tinggi" }, { key: "B", text: "Sering buang air kecil" }, { key: "C", text: "Batuk berdahak" }, { key: "D", text: "Ruam kulit" }],
    answer: "B" },
  { id: 303, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Penyakit TBC menyerang organ?",
    choices: [{ key: "A", text: "Hati" }, { key: "B", text: "Paru-paru" }, { key: "C", text: "Ginjal" }, { key: "D", text: "Jantung" }],
    answer: "B" },
  { id: 304, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Apa penyebab utama penyakit flu?",
    choices: [{ key: "A", text: "Virus influenza" }, { key: "B", text: "Bakteri streptococcus" }, { key: "C", text: "Jamur candida" }, { key: "D", text: "Parasit malaria" }],
    answer: "A" },
  { id: 305, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Penyakit hepatitis menyerang organ?",
    choices: [{ key: "A", text: "Paru-paru" }, { key: "B", text: "Jantung" }, { key: "C", text: "Hati" }, { key: "D", text: "Ginjal" }],
    answer: "C" },
  { id: 306, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Cara mencegah obesitas adalah?",
    choices: [{ key: "A", text: "Makan berlebihan" }, { key: "B", text: "Kurang tidur" }, { key: "C", text: "Olahraga teratur" }, { key: "D", text: "Minum soda" }],
    answer: "C" },
  { id: 307, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Apa yang harus dilakukan untuk mencegah COVID-19?",
    choices: [{ key: "A", text: "Tidak mencuci tangan" }, { key: "B", text: "Berkerumun" }, { key: "C", text: "Menggunakan masker" }, { key: "D", text: "Berbagi alat makan" }],
    answer: "C" },
  { id: 308, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Penyakit jantung koroner disebabkan oleh?",
    choices: [{ key: "A", text: "Infeksi virus" }, { key: "B", text: "Penyumbatan pembuluh darah" }, { key: "C", text: "Kekurangan vitamin" }, { key: "D", text: "Kelebihan kalsium" }],
    answer: "B" },
  { id: 309, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Gejala utama hipertensi adalah?",
    choices: [{ key: "A", text: "Pusing" }, { key: "B", text: "Batuk" }, { key: "C", text: "Mual" }, { key: "D", text: "Ruam kulit" }],
    answer: "A" },
  { id: 310, category: "Penyakit", categoryColor: "bg-rose-100 text-rose-700",
    question: "Penyakit demam berdarah ditularkan oleh nyamuk?",
    choices: [{ key: "A", text: "Anopheles" }, { key: "B", text: "Culex" }, { key: "C", text: "Aedes aegypti" }, { key: "D", text: "Armigeres" }],
    answer: "C" },

  /* ══════════════════════════════════════════
     4. BUDAYA INDONESIA (26 unique)
  ══════════════════════════════════════════ */
  { id: 401, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Bahasa daerah 'Sunda' digunakan di provinsi?",
    choices: [{ key: "A", text: "Jawa Timur" }, { key: "B", text: "Jawa Tengah" }, { key: "C", text: "Jawa Barat" }, { key: "D", text: "Bali" }],
    answer: "C" },
  { id: 402, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Rumah adat 'Joglo' berasal dari?",
    choices: [{ key: "A", text: "Jawa Tengah" }, { key: "B", text: "Sumatera Utara" }, { key: "C", text: "Sulawesi Utara" }, { key: "D", text: "NTB" }],
    answer: "A" },
  { id: 403, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Papeda adalah makanan khas dari?",
    choices: [{ key: "A", text: "Papua" }, { key: "B", text: "Aceh" }, { key: "C", text: "Bali" }, { key: "D", text: "Jawa" }],
    answer: "A" },
  { id: 404, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Gudeg adalah makanan khas dari?",
    choices: [{ key: "A", text: "Yogyakarta" }, { key: "B", text: "Bandung" }, { key: "C", text: "Surabaya" }, { key: "D", text: "Makassar" }],
    answer: "A" },
  { id: 405, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Rumah adat 'Tongkonan' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Sulawesi Selatan" }, { key: "C", text: "Papua" }, { key: "D", text: "Bali" }],
    answer: "B" },
  { id: 406, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Rumah adat 'Gadang' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Jawa Barat" }, { key: "C", text: "NTT" }, { key: "D", text: "Maluku" }],
    answer: "A" },
  { id: 407, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Pakaian adat 'Beskap' berasal dari?",
    choices: [{ key: "A", text: "Jawa Tengah" }, { key: "B", text: "Aceh" }, { key: "C", text: "Papua" }, { key: "D", text: "Kalimantan" }],
    answer: "A" },
  { id: 408, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Pakaian adat 'Bundo Kanduang' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Jawa Timur" }, { key: "C", text: "Kalimantan Barat" }, { key: "D", text: "NTT" }],
    answer: "A" },
  { id: 409, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Tari Pendet berasal dari daerah?",
    choices: [{ key: "A", text: "Bali" }, { key: "B", text: "Jawa Barat" }, { key: "C", text: "Sumatera Utara" }, { key: "D", text: "Kalimantan Timur" }],
    answer: "A" },
  { id: 410, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Upacara 'Sekaten' berasal dari?",
    choices: [{ key: "A", text: "Jawa Tengah" }, { key: "B", text: "Sumatera Barat" }, { key: "C", text: "Bali" }, { key: "D", text: "NTT" }],
    answer: "A" },
  { id: 411, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Siapa tokoh emansipasi wanita Indonesia?",
    choices: [{ key: "A", text: "Cut Nyak Dien" }, { key: "B", text: "R.A. Kartini" }, { key: "C", text: "Fatmawati" }, { key: "D", text: "Martha Christina Tiahahu" }],
    answer: "B" },
  { id: 412, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Upacara 'Ngaben' berasal dari?",
    choices: [{ key: "A", text: "Bali" }, { key: "B", text: "Jawa" }, { key: "C", text: "Sumatera" }, { key: "D", text: "Papua" }],
    answer: "A" },
  { id: 413, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Rendang adalah makanan khas dari?",
    choices: [{ key: "A", text: "Jawa Barat" }, { key: "B", text: "Sumatera Barat" }, { key: "C", text: "Bali" }, { key: "D", text: "Sulawesi" }],
    answer: "B" },
  { id: 414, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Reog Ponorogo berasal dari provinsi?",
    choices: [{ key: "A", text: "Jawa Timur" }, { key: "B", text: "Jawa Tengah" }, { key: "C", text: "Aceh" }, { key: "D", text: "NTT" }],
    answer: "A" },
  { id: 415, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Pakaian adat 'Ulos' berasal dari daerah?",
    choices: [{ key: "A", text: "Bali" }, { key: "B", text: "Sumatera Utara" }, { key: "C", text: "Papua" }, { key: "D", text: "Sulawesi Selatan" }],
    answer: "B" },
  { id: 416, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Siapa tokoh pencipta lagu Indonesia Raya?",
    choices: [{ key: "A", text: "WR Supratman" }, { key: "B", text: "Ki Hajar Dewantara" }, { key: "C", text: "Soekarno" }, { key: "D", text: "Moh. Hatta" }],
    answer: "A" },
  { id: 417, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Rumah adat 'Honai' berasal dari?",
    choices: [{ key: "A", text: "Papua" }, { key: "B", text: "Bali" }, { key: "C", text: "Aceh" }, { key: "D", text: "Jambi" }],
    answer: "A" },
  { id: 418, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Bahasa 'Minang' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Jawa Tengah" }, { key: "C", text: "Sulawesi Utara" }, { key: "D", text: "Maluku" }],
    answer: "A" },
  { id: 419, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Pempek berasal dari kota?",
    choices: [{ key: "A", text: "Medan" }, { key: "B", text: "Palembang" }, { key: "C", text: "Padang" }, { key: "D", text: "Bandung" }],
    answer: "B" },
  { id: 420, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Siapa tokoh pelukis terkenal Indonesia?",
    choices: [{ key: "A", text: "Affandi" }, { key: "B", text: "Chairil Anwar" }, { key: "C", text: "R.A. Kartini" }, { key: "D", text: "Sutomo" }],
    answer: "A" },
  { id: 421, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Upacara 'Tabuik' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Jawa Timur" }, { key: "C", text: "Papua" }, { key: "D", text: "Sulawesi" }],
    answer: "A" },
  { id: 422, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Siapa tokoh tari legong dari Bali?",
    choices: [{ key: "A", text: "Ni Ketut Arini" }, { key: "B", text: "I Gusti Ngurah Rai" }, { key: "C", text: "Dewi Sartika" }, { key: "D", text: "Sukarno" }],
    answer: "A" },
  { id: 423, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Bahasa 'Batak' berasal dari?",
    choices: [{ key: "A", text: "Sumatera Utara" }, { key: "B", text: "Jawa Barat" }, { key: "C", text: "Bali" }, { key: "D", text: "NTT" }],
    answer: "A" },
  { id: 424, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Wayang kulit merupakan kesenian tradisional dari?",
    choices: [{ key: "A", text: "Bali" }, { key: "B", text: "Jawa Tengah" }, { key: "C", text: "Sulawesi Selatan" }, { key: "D", text: "Papua" }],
    answer: "B" },
  { id: 425, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Bahasa 'Bugis' berasal dari daerah?",
    choices: [{ key: "A", text: "Sumatera" }, { key: "B", text: "Sulawesi Selatan" }, { key: "C", text: "Kalimantan" }, { key: "D", text: "Papua" }],
    answer: "B" },
  { id: 426, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Angklung adalah alat musik tradisional dari?",
    choices: [{ key: "A", text: "Sumatera Barat" }, { key: "B", text: "Jawa Barat" }, { key: "C", text: "Bali" }, { key: "D", text: "Kalimantan" }],
    answer: "B" },
  { id: 427, category: "Budaya Indonesia", categoryColor: "bg-amber-100 text-amber-700",
    question: "Pakaian adat 'Baju Bodo' berasal dari?",
    choices: [{ key: "A", text: "Sulawesi Selatan" }, { key: "B", text: "Jawa Tengah" }, { key: "C", text: "Bali" }, { key: "D", text: "Maluku" }],
    answer: "A" },

  /* ══════════════════════════════════════════
     5. TINDAKAN RS BAHASA GAUL (10 unique)
  ══════════════════════════════════════════ */
  { id: 501, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien demam tinggi, apa tindakan awal yang bisa dilakukan?",
    choices: [{ key: "A", text: "Kompres hangat" }, { key: "B", text: "Selimutin rapat" }, { key: "C", text: "Kasih kopi panas" }, { key: "D", text: "Biarkan aja" }],
    answer: "A" },
  { id: 502, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien IGD ngeluh pusing berat, apa yang harus dicek dulu?",
    choices: [{ key: "A", text: "Cek tekanan darah" }, { key: "B", text: "Kasih teh manis" }, { key: "C", text: "Suruh jalan" }, { key: "D", text: "Pijat kepala" }],
    answer: "A" },
  { id: 503, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien jatuh di kamar mandi, kepala benjol. Langkah awal?",
    choices: [{ key: "A", text: "Kompres es" }, { key: "B", text: "Pijat benjolannya" }, { key: "C", text: "Suruh berdiri" }, { key: "D", text: "Kasih kopi" }],
    answer: "A" },
  { id: 504, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien muntah darah, tindakan pertama yang harus dilakukan?",
    choices: [{ key: "A", text: "Kasih makan dulu" }, { key: "B", text: "Baringkan telentang" }, { key: "C", text: "Miringkan tubuhnya" }, { key: "D", text: "Ajak ngobrol" }],
    answer: "C" },
  { id: 505, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien jatuh dari motor, kakinya bengkok aneh. Langkah pertama?",
    choices: [{ key: "A", text: "Lurusin aja langsung" }, { key: "B", text: "Bungkus pakai selimut" }, { key: "C", text: "Imobilisasi kaki" }, { key: "D", text: "Suruh jalan pelan-pelan" }],
    answer: "C" },
  { id: 506, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien muntah-muntah terus, tindakan awal?",
    choices: [{ key: "A", text: "Kasih nasi padang" }, { key: "B", text: "Observasi cairan tubuh" }, { key: "C", text: "Biarkan aja" }, { key: "D", text: "Suruh tidur" }],
    answer: "B" },
  { id: 507, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien IGD ngeluh nyeri dada, tindakan awal?",
    choices: [{ key: "A", text: "Suruh jalan-jalan" }, { key: "B", text: "Kasih makan" }, { key: "C", text: "Observasi EKG" }, { key: "D", text: "Pijat dadanya" }],
    answer: "C" },
  { id: 508, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien kejang-kejang, apa yang harus dilakukan?",
    choices: [{ key: "A", text: "Masukkan sendok ke mulut" }, { key: "B", text: "Pegangin biar gak gerak" }, { key: "C", text: "Jauhkan benda berbahaya" }, { key: "D", text: "Siram air" }],
    answer: "C" },
  { id: 509, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Pasien datang ke IGD pingsan, tindakan pertama yang harus dilakukan adalah?",
    choices: [{ key: "A", text: "Kasih kopi biar melek" }, { key: "B", text: "Cek napas dan nadi" }, { key: "C", text: "Tanya nama lengkapnya" }, { key: "D", text: "Suruh duduk dulu" }],
    answer: "B" },
  { id: 510, category: "Tindakan RS", categoryColor: "bg-sky-100 text-sky-700",
    question: "Kalau pasien ngeluh sesak napas, tindakan awal yang tepat apa?",
    choices: [{ key: "A", text: "Suruh tarik napas dalam-dalam" }, { key: "B", text: "Kasih minum air putih" }, { key: "C", text: "Pasang oksigen" }, { key: "D", text: "Suruh tidur aja" }],
    answer: "C" },
];

/* ─── Pick 10 random unique questions ─── */
function pickRandom10(): Question[] {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}

const TIMER_SEC = 20;

export default function GameQuizPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const opponent = params.get("opponent") ?? "Rekan Nakes";
  const opponentSpec = params.get("spec") ?? "Perawat Umum";

  const backToConnected = () =>
    setLocation(`/nurse-connected?name=${encodeURIComponent(opponent)}&spec=${encodeURIComponent(opponentSpec)}`);

  const [questions] = useState<Question[]>(() => pickRandom10());
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({ you: 0, opponent: 0 });
  const [timer, setTimer] = useState(TIMER_SEC);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; selectedKey: string | null }[]>([]);

  const q = questions[current];

  const handleReveal = useCallback((key: string | null) => {
    if (revealed) return;
    setSelected(key);
    setRevealed(true);
    const correct = key === q.answer;
    const opponentCorrect = Math.random() < 0.6;
    setScores(s => ({
      you: s.you + (correct ? 1 : 0),
      opponent: s.opponent + (opponentCorrect ? 1 : 0),
    }));
    setResults(r => [...r, { correct, selectedKey: key }]);
  }, [revealed, q]);

  useEffect(() => {
    if (revealed || done) return;
    if (timer <= 0) { handleReveal(null); return; }
    const t = setTimeout(() => setTimer(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, revealed, done, handleReveal]);

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
      setTimer(TIMER_SEC);
    }
  };

  const handleRestart = () => window.location.reload();

  /* ── Results screen ── */
  if (done) {
    const youWin = scores.you > scores.opponent;
    const tie = scores.you === scores.opponent;
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">
        <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
          <div className="px-4 h-14 flex items-center gap-3">
            <button onClick={backToConnected} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold">Kuis Selesai 🏁</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 max-w-sm mx-auto w-full">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg ${youWin ? "bg-yellow-400" : tie ? "bg-gray-200" : "bg-rose-100"}`}>
            {youWin ? "🏆" : tie ? "🤝" : "😅"}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black">{youWin ? "Kamu Menang!" : tie ? "Seri!" : "Kalah nih…"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {youWin ? "Wah keren banget, jago banget! 🔥" : tie ? "Sama kuat, tandingan nih! 💪" : "Belajar lagi yah, semangat 📚"}
            </p>
          </div>
          <div className="w-full bg-white rounded-2xl shadow-md border border-border/40 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white text-center text-xs font-bold uppercase tracking-wide">Skor Akhir</div>
            <div className="flex">
              <div className="flex-1 text-center py-4 border-r border-border/30">
                <p className="text-3xl font-black text-violet-700">{scores.you}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Kamu</p>
              </div>
              <div className="flex items-center justify-center px-3"><Trophy className="w-4 h-4 text-amber-400" /></div>
              <div className="flex-1 text-center py-4 border-l border-border/30">
                <p className="text-3xl font-black text-fuchsia-700">{scores.opponent}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opponent.split(" ")[0]}</p>
              </div>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${r.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                {r.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <span className={`font-semibold text-xs ${r.correct ? "text-emerald-700" : "text-red-600"}`}>Soal {i + 1}</span>
                <span className="text-muted-foreground text-xs ml-auto">
                  {r.selectedKey === null ? "Waktu habis" : r.correct ? "Benar ✓" : `Salah (jwb: ${questions[i].answer})`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 w-full">
            <Button className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Main Lagi
            </Button>
            <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={backToConnected}>Keluar</Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Question screen ── */
  const timerPct = (timer / TIMER_SEC) * 100;
  const timerColor = timer > 10 ? "bg-emerald-500" : timer > 5 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 flex flex-col">
      <header className="bg-white border-b border-border/50 shadow-sm flex-shrink-0">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={backToConnected} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">Kuis Cerdas Cermat 🧠</p>
            <p className="text-[11px] text-muted-foreground">vs {opponent.split(" ")[0]}</p>
          </div>
          <p className="text-xs font-bold text-violet-700">{current + 1} / {questions.length}</p>
        </div>
        <div className="h-1.5 bg-gray-100">
          <div className={`h-full transition-all duration-1000 ease-linear ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full">
        {/* Scoreboard */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="flex">
            <div className="flex-1 text-center py-3 border-r border-border/30">
              <p className="text-xl font-black text-violet-700">{scores.you}</p>
              <p className="text-[11px] text-muted-foreground">Kamu</p>
            </div>
            <div className="flex items-center justify-center px-3"><Trophy className="w-4 h-4 text-amber-400" /></div>
            <div className="flex-1 text-center py-3 border-l border-border/30">
              <p className="text-xl font-black text-fuchsia-700">{scores.opponent}</p>
              <p className="text-[11px] text-muted-foreground">{opponent.split(" ")[0]}</p>
            </div>
          </div>
        </div>

        {/* Timer + category */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${q.categoryColor}`}>{q.category}</span>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${timer <= 5 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
            <span className={`text-sm font-bold tabular-nums ${timer <= 5 ? "text-red-500" : "text-foreground"}`}>{timer}s</span>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-border/40 shadow-md p-5">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>
          </div>
        </div>

        {/* Choices */}
        <div className="space-y-2.5">
          {q.choices.map(choice => {
            const isSelected = selected === choice.key;
            const isCorrect = choice.key === q.answer;
            let bg = "bg-white border-border/50 hover:border-violet-300 hover:bg-violet-50/40";
            if (revealed) {
              if (isCorrect) bg = "bg-emerald-50 border-emerald-400 shadow-sm";
              else if (isSelected && !isCorrect) bg = "bg-red-50 border-red-400";
              else bg = "bg-white border-border/30 opacity-60";
            }
            return (
              <button
                key={choice.key}
                disabled={revealed}
                onClick={() => handleReveal(choice.key)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${bg} ${!revealed ? "active:scale-[0.98]" : ""}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${revealed && isCorrect ? "bg-emerald-500 text-white" : revealed && isSelected && !isCorrect ? "bg-red-400 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {choice.key}
                </span>
                <span className="text-sm font-medium text-foreground">{choice.text}</span>
                {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto flex-shrink-0" />}
                {revealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {revealed && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${selected === q.answer ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : selected === null ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
              {selected === q.answer ? "✅ Benar! Kamu keren banget 🔥" : selected === null ? `⏰ Waktu habis! Jawaban: ${q.answer}` : `❌ Kurang tepat. Jawaban yang benar: ${q.answer}`}
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-md"
              onClick={handleNext}
            >
              {current + 1 >= questions.length ? "Lihat Hasil 🏁" : "Soal Berikutnya"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
