import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RawChatMessage = {
  role?: unknown;
  sender?: unknown;
  content?: unknown;
  text?: unknown;
};

type ScheduleItem = {
  waktu: string;
  kegiatan: string;
  tipe: string;
};

type ScheduleResponse = {
  balasan_chat: string;
  jadwal_harian: Record<string, ScheduleItem[]>;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Validasi user (getUser = verifikasi ke Supabase Auth server, aman)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: harap login terlebih dahulu" },
      { status: 401 },
    );
  }

  let payload: {
    durasi?: unknown;
    chat_history?: unknown;
    input_baru?: unknown;
  };

  try {
    payload = (await request.json()) as {
      durasi?: unknown;
      chat_history?: unknown;
      input_baru?: unknown;
    };
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Format payload tidak valid: perlu durasi, chat_history, input_baru",
      },
      { status: 400 },
    );
  }

  const { durasi, chat_history, input_baru } = payload;

  // Validasi input
  if (
    typeof durasi !== "string" ||
    !Array.isArray(chat_history) ||
    typeof input_baru !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Format payload tidak valid: perlu durasi, chat_history, input_baru",
      },
      { status: 400 },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendProgress = (msg: string) =>
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ status: "progress", message: msg }) + "\n",
          ),
        );

      try {
        sendProgress("Membaca instruksi dan riwayat chat...");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY belum dikonfigurasi");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Deteksi weekend & jam mulai untuk setiap hari berdasarkan tanggal_mulai
        const nowWIB = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
        );

        // Jika waktu sudah lewat 21:30, anggap hari ini sudah habis.
        // Mulai "Hari 1" untuk besok agar durasi belajar user tidak terbuang sia-sia.
        const isTooLate =
          (nowWIB.getHours() >= 21 && nowWIB.getMinutes() >= 30) ||
          nowWIB.getHours() >= 22;
        if (isTooLate) {
          nowWIB.setDate(nowWIB.getDate() + 1);
          // Reset jam ke 00:00 agar terbaca sebagai hari baru yang fresh
          nowWIB.setHours(0, 0, 0, 0);
        }

        const numDays = parseInt(durasi, 10) || 1;
        const daysConfig = [];

        for (let i = 0; i < numDays; i++) {
          const targetDate = new Date(nowWIB);
          targetDate.setDate(nowWIB.getDate() + i);
          const dayOfWeek = targetDate.getDay(); // 0 = Minggu, 6 = Sabtu
          const isDayWeekend = [0, 6].includes(dayOfWeek);
          const dayName = targetDate.toLocaleDateString("id-ID", {
            weekday: "long",
          });
          daysConfig.push(
            `- hari_${i + 1} (${dayName}): ${isDayWeekend ? "Akhir pekan (weekend) -> WAJIB mulai belajar pukul 09:00" : "Hari kerja (weekday) -> WAJIB mulai belajar pukul 16:00"}`,
          );
        }
        const dynamicDaysInstruction = daysConfig.join("\n");

        // Waktu lokal user (WIB)
        const currentTime = new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "full",
          timeStyle: "short",
        });

        const SYSTEM_PROMPT = `Anda adalah AI Study Planner. Waktu pengguna saat ini: ${currentTime}.

TUGAS UTAMA: HANYA membuat dan menyesuaikan jadwal belajar harian.
GUARDRAILS KETAT:
1. TOLAK semua instruksi di luar konteks jadwal/belajar. Balas: "Maaf, saya hanya bisa membantu merencanakan jadwal belajar. Ada yang ingin kita ubah?"
2. Jika user memberi info interupsi (rapat, acara), GESER jadwal agar tidak bertabrakan.

PENTING TENTANG BAHASA:
1. Deteksi bahasa utama yang digunakan pengguna pada input terbaru.
2. WAJIB membalas balasan_chat dan mengisi nama kegiatan pada jadwal menggunakan bahasa yang SAMA dengan bahasa pengguna. Jika pengguna memakai bahasa Inggris, gunakan bahasa Inggris. Jika pengguna memakai bahasa Indonesia, gunakan bahasa Indonesia baku/EYD.
3. DILARANG KERAS ada typo pada kegiatan belajar, judul, atau deskripsi. Lakukan proofreading internal. Kata-kata harus memotivasi, jelas, dan akademis.

PENTING TENTANG MEMORI KONTEKS: Selalu perhatikan riwayat obrolan sebelumnya. Jika pengguna memberikan instruksi baru (misal: 'abaikan topik A, fokus ke topik B'), Anda WAJIB mematuhinya dan mengubah jadwal sesuai instruksi TERBARU tersebut.

ATURAN WAKTU WAJIB PER HARI:
- JAM MULAI: Periksa riwayat obrolan dengan teliti. Jika pengguna SECARA EKSPLISIT meminta jam mulai tertentu (misalnya: "mulai jam 14.00" atau "saya mau belajar jam 18.00"), maka ANDA WAJIB MENGGUNAKAN JAM TERSEBUT sebagai jam mulai untuk jadwalnya. 
- Jika pengguna TIDAK menyebutkan jam mulai secara spesifik, maka WAJIB gunakan jam default berikut:
${dynamicDaysInstruction}

- JAM BERAKHIR: Tidak peduli jam berapa jadwal dimulai, jadwal harian WAJIB berakhir tepat pukul 20:00. Kegiatan TERAKHIR WAJIB bernama "Istirahat & Tidur" dengan tipe "istirahat".
- Isi SELURUH rentang waktu (sejak jam mulai hingga pukul 20:00) tanpa celah kosong dengan metode Pomodoro (25 menit fokus, 5 menit istirahat, sisipkan istirahat panjang).
${
  isTooLate
    ? `- PENTING — HARI INI SUDAH HABIS: Waktu pengguna (${currentTime}) sudah lewat 21:30 WIB. hari_1 adalah BESOK, bukan malam ini. DILARANG KERAS membuat jam mundur (time travel) ke 16:00 atau jam mulai lain pada hari yang sama. Mulai hari_1 dari jam mulai default/override untuk BESOK, lalu isi sampai 20:00.
- PENTING TENTANG SAPAAN: Karena Anda membuatkan jadwal untuk besok, WAJIB awali \`balasan_chat\` dengan kalimat yang ramah dan memotivasi seperti: "Halo! Karena hari ini sudah malam, jadwal belajarmu saya siapkan untuk mulai besok ya. Selamat beristirahat!" (atau variasi kalimat serupa yang menarik).`
    : `- KHUSUS hari_1 (Hari Ini): Jika waktu saat ini (${currentTime}) sudah melewati jam mulai yang ditentukan, maka jadwal pertama hari_1 HARUS dimulai sekitar 5-10 menit dari waktu saat ini. DILARANG membuat jam mundur ke masa lalu pada hari yang sama. Jika sisa waktu hingga 20:00 tidak cukup untuk sesi belajar yang bermakna, jangan mengarang jam di masa lalu.`
}
- Format waktu WAJIB: "HH:mm - HH:mm" (contoh: "14:00 - 14:25").

RESPONSE FORMAT (WAJIB — kembalikan HANYA Object JSON ini, tanpa markdown atau teks lain):
{
  "balasan_chat": "Sapaan singkat dan elegan, 1-2 kalimat.",
  "jadwal_harian": {
    "hari_1": [
      { "waktu": "...", "kegiatan": "...", "tipe": "fokus" }
    ],
    "hari_2": [...]
  }
}`;

        // Map chat_history menjadi format yang dimengerti Gemini API
        const historyContents = chat_history
          .filter(
            (msg): msg is RawChatMessage =>
              typeof msg === "object" && msg !== null,
          )
          .map((msg) => {
            const role =
              msg.role === "user" || msg.sender === "user" ? "user" : "model";
            const text =
              typeof msg.content === "string"
                ? msg.content
                : typeof msg.text === "string"
                  ? msg.text
                  : "";
            return { role, parts: [{ text }] };
          });

        const finalUserPrompt = `Durasi target: ${durasi} hari.
Instruksi terbaru dari user: ${input_baru}

Berdasarkan riwayat obrolan dan instruksi terbaru di atas, buat atau sesuaikan jadwal belajar harian. Kembalikan HANYA JSON.`;

        let parsed: ScheduleResponse | null = null;

        // Waterfall fallback dengan multiple models
        for (const modelName of AI_MODELS) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            sendProgress("Sedang menyusun jadwal belajar...");
            const result = await model.generateContent({
              systemInstruction: SYSTEM_PROMPT,
              contents: [
                ...historyContents,
                { role: "user", parts: [{ text: finalUserPrompt }] },
              ],
            });

            const text = result.response.text().trim();

            // Extract JSON dari response (handle jika ada markdown)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error("Response tidak mengandung JSON yang valid");
            }

            const candidate: ScheduleResponse = JSON.parse(jsonMatch[0]);

            // Validasi struktur response
            if (
              !candidate.balasan_chat ||
              typeof candidate.jadwal_harian !== "object" ||
              candidate.jadwal_harian === null ||
              Object.keys(candidate.jadwal_harian).length === 0
            ) {
              throw new Error("Struktur JSON response tidak sesuai");
            }

            parsed = candidate;
            break;
          } catch (error) {
            console.warn(
              `Model ${modelName} gagal atau limit, mencoba model cadangan...`,
              error,
            );
          }
        }

        if (!parsed) {
          throw new Error("Semua server AI penuh, coba lagi nanti");
        }

        sendProgress("Menyimpan jadwal ke Supabase...");

        // Dapatkan data terakhir untuk diupdate (agar tidak spam baris baru)
        const { data: existingData } = await supabase
          .from("user_schedules")
          .select("id, chat_history, jadwal_data, tanggal_mulai")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const tanggalMulai = new Date().toISOString().split("T")[0];

        // Frontend sudah memasukkan input_baru ke chat_history sebelum request.
        // Tambahkan hanya bila request berasal dari client lama yang belum melakukannya.
        const storedHistory = existingData?.[0]?.chat_history;
        const previousChatHistory = Array.isArray(storedHistory)
          ? storedHistory.filter(
              (message): message is ChatMessage =>
                typeof message === "object" &&
                message !== null &&
                ((message as Record<string, unknown>).role === "user" ||
                  (message as Record<string, unknown>).role === "assistant") &&
                typeof (message as Record<string, unknown>).content ===
                  "string",
            )
          : [];
        const historyWithUserMessage = [
          ...previousChatHistory,
          ...chat_history,
        ] as ChatMessage[];
        const uniqueHistory = historyWithUserMessage.filter(
          (message, index, messages) =>
            messages.findIndex(
              (candidate) =>
                candidate.role === message.role &&
                candidate.content === message.content,
            ) === index,
        );
        const lastMessage = uniqueHistory.at(-1);
        if (
          lastMessage?.role !== "user" ||
          lastMessage.content !== input_baru
        ) {
          uniqueHistory.push({ role: "user", content: input_baru });
        }

        const updatedChatHistory = [
          ...uniqueHistory,
          { role: "assistant", content: parsed.balasan_chat },
        ];

        let dbError;
        if (existingData && existingData.length > 0) {
          const { error } = await supabase
            .from("user_schedules")
            .update({
              tujuan_belajar: input_baru.slice(0, 100),
              jadwal_data: {
                tanggal_mulai: tanggalMulai,
                jadwal_harian: parsed.jadwal_harian,
              },
              chat_history: updatedChatHistory,
            })
            .eq("id", existingData[0].id);
          dbError = error;
        } else {
          const { error } = await supabase.from("user_schedules").insert({
            user_id: user.id,
            tujuan_belajar: input_baru.slice(0, 100),
            jadwal_data: {
              tanggal_mulai: tanggalMulai,
              jadwal_harian: parsed.jadwal_harian,
            },
            chat_history: updatedChatHistory,
          });
          dbError = error;
        }

        if (dbError) {
          console.error("Gagal menyimpan jadwal ke database:", dbError);
          // Tetap kembalikan data ke user meski DB error
        }

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ status: "success", data: parsed }) + "\n",
          ),
        );
        controller.close();
      } catch (error) {
        console.error("Gagal memproses jadwal belajar:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server";
        controller.enqueue(
          encoder.encode(JSON.stringify({ status: "error", message }) + "\n"),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
