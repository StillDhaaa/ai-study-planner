"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, TrashIcon } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PomodoroTimer } from "@/components/ui/PomodoroTimer";
import { TimelineView } from "@/components/ui/TimelineView";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import ShinyText from "@/components/ShinyText";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

type ClientPageProps = {
  displayName: string;
  initialJadwal: Record<string, ScheduleItem[]>;
  initialChatHistory: ChatMessage[];
  tanggalMulai: string;
};

export default function ChatPomodoroPage({
  displayName,
  initialJadwal,
  initialChatHistory,
  tanggalMulai,
}: ClientPageProps) {
  const [durasi, setDurasi] = useState("1");
  const [chatHistory, setChatHistory] =
    useState<ChatMessage[]>(initialChatHistory);
  const [inputValue, setInputValue] = useState("");
  const [jadwal, setJadwal] =
    useState<Record<string, ScheduleItem[]>>(initialJadwal);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [activeDay, setActiveDay] = useState("hari_1");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auto-scroll hanya pada container chat, bukan seluruh halaman.
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Calculate realCurrentDay based on tanggalMulai
  const calculateRealCurrentDay = () => {
    const startDate = new Date(tanggalMulai);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayKey = `hari_${diffDays + 1}`;
    return dayKey in jadwal ? dayKey : "hari_1";
  };

  const realCurrentDay = calculateRealCurrentDay();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      // Hapus cookie displayname
      document.cookie =
        "displayname=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.replace("/login");
    } catch {
      toast.error("Gagal logout, coba lagi.");
      setIsLoggingOut(false);
    }
  }

  async function handleReset() {
    try {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(
          "Tidak dapat mereset: Sesi tidak ditemukan. Harap login kembali.",
        );
        return;
      }

      // Hapus permanen seluruh jadwal user di database
      const { error } = await supabase
        .from("user_schedules")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Bersihkan state di UI (chat, jadwal, timer)
      setChatHistory([]);
      setJadwal({});
      setActiveDay("hari_1");
      setScheduleVersion((version) => version + 1);
      setInputValue("");
      setShowResetDialog(false);

      toast.success(
        "Jadwal dan riwayat berhasil dihapus. Silakan mulai yang baru.",
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal menghapus jadwal dari database: ${message}`);
    }
  }

  async function handleSendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: inputValue };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setInputValue("");

    setIsLoading(true);
    const toastId = toast.loading("Memulai proses...");
    const loadingTimeout = window.setTimeout(() => {
      toast.loading(
        "AI sedang memproses permintaanmu, mohon tunggu sebentar ya...",
        { id: toastId },
      );
    }, 12000);

    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durasi,
          chat_history: updatedHistory,
          input_baru: inputValue,
        }),
      });

      if (!res.body) {
        toast.error("Tidak ada respons dari server", { id: toastId });
        setChatHistory((prev) => prev.slice(0, -1));
        return;
      }

      // Auth/validasi masih mengembalikan JSON biasa (bukan stream)
      if (!res.ok) {
        try {
          const result = await res.json();
          toast.error(result.message || "Gagal membuat jadwal", {
            id: toastId,
          });
        } catch {
          toast.error("Gagal membuat jadwal", { id: toastId });
        }
        setChatHistory((prev) => prev.slice(0, -1));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let finalData: ScheduleResponse | null = null;
      let buffer = "";
      let hadStreamError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.status === "progress") {
              toast.loading(parsed.message, { id: toastId });
            } else if (parsed.status === "success") {
              toast.success("Permintaan berhasil diproses!", { id: toastId });
              finalData = parsed.data;
            } else if (parsed.status === "error") {
              hadStreamError = true;
              toast.error(parsed.message || "Gagal membuat jadwal", {
                id: toastId,
              });
            }
          } catch (e) {
            console.error("Stream parse error", e);
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.status === "progress") {
            toast.loading(parsed.message, { id: toastId });
          } else if (parsed.status === "success") {
            toast.success("Jadwal berhasil dibuat!", { id: toastId });
            finalData = parsed.data;
          } else if (parsed.status === "error") {
            hadStreamError = true;
            toast.error(parsed.message || "Gagal membuat jadwal", {
              id: toastId,
            });
          }
        } catch (e) {
          console.error("Stream parse error", e);
        }
      }

      if (finalData) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: finalData.balasan_chat },
        ]);
        const hasNewSchedule = Object.keys(finalData.jadwal_harian).length > 0;
        if (hasNewSchedule) {
          setJadwal(finalData.jadwal_harian);
          setActiveDay("hari_1");
          setScheduleVersion((version) => version + 1);
        }
      } else {
        setChatHistory((prev) => prev.slice(0, -1));
        if (!hadStreamError) {
          toast.error("Gagal membuat jadwal", { id: toastId });
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan",
        { id: toastId },
      );
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      window.clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }

  return (
    <main className="text-foreground z-2 min-h-screen p-6 transition-colors duration-300 md:p-8">
      {/* Header */}
      <div className="-mt-2 flex w-full items-center justify-center">
        <Link href="/" className="absolute top-7 left-9 max-md:hidden">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali ke Beranda
          </Button>
        </Link>
        <Link href={"/"}>
          <ShinyText
            text="AI Study Planner"
            speed={5}
            delay={4}
            color="#1a88ff"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
            disabled={false}
            className="text-2xl font-black"
          />
        </Link>
      </div>
      <div className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">
            Semangat belajar, {displayName}! 🔥
          </h1>
          <p className="text-muted-foreground mt-2">
            Ceritakan keperluanmu, AI akan menyusun jadwal belajarmu secara
            real-time.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-1 shrink-0 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10"
        >
          {isLoggingOut ? "Keluar..." : "Keluar"}
        </Button>
      </div>

      {/* Main layout: 2 Kolom */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* KOLOM KIRI: Chat Panel */}
        <div className="flex flex-col gap-4">
          {/* Durasi Selector */}
          <GlassCard className="backdrop-blur-xl">
            <Label className="block text-sm font-semibold">Durasi Target</Label>
            <Select
              value={`${durasi} Hari`}
              onValueChange={(val) => val && setDurasi(val)}
              disabled={isLoading}
            >
              <SelectTrigger className="text-foreground focus:ring-primary w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="dark:text-white">
                  1 Hari
                </SelectItem>
                <SelectItem value="7" className="dark:text-white">
                  7 Hari (1 Minggu)
                </SelectItem>
                <SelectItem value="30" className="dark:text-white">
                  30 Hari (1 Bulan)
                </SelectItem>
              </SelectContent>
            </Select>
          </GlassCard>

          {/* Chat History Area */}
          <GlassCard className="flex h-150 flex-col overflow-hidden">
            <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-2 dark:border-white/10">
              <span className="text-muted-foreground text-sm font-semibold">
                Riwayat Chat
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowResetDialog(true)}
                disabled={isLoading || !chatHistory || chatHistory.length === 0}
                className="text-destructive border-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 border"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat messages */}
            <div
              ref={chatContainerRef}
              className="flex flex-1 flex-col justify-start gap-4 overflow-y-auto pr-2"
            >
              {chatHistory.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Belum ada percakapan. Mulai dengan memberitahu tujuan
                      belajarmu!
                    </p>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground self-end rounded-tr-sm"
                          : "bg-secondary text-secondary-foreground self-start rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat input */}
            <form
              onSubmit={handleSendMessage}
              className="mt-auto flex shrink-0 gap-2 border-t border-black/10 pt-4 pb-2 dark:border-white/10"
            >
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ketik pesan atau ubah jadwalmu..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    AI Sedang Berpikir...
                  </>
                ) : (
                  "Kirim"
                )}
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* KOLOM KANAN: Pomodoro + Timeline */}
        <div className="flex flex-col gap-6">
          {/* Day Selector */}
          {Object.keys(jadwal).length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Object.keys(jadwal).map((dayKey) => {
                const dayNumber = dayKey.replace("hari_", "");
                return (
                  <button
                    key={dayKey}
                    onClick={() => setActiveDay(dayKey)}
                    className={`"border-foreground/20 rounded-full border bg-[hsl(var(--glass-bg)/var(--glass-opacity))] p-6 px-4 py-1.5 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 ${
                      activeDay === dayKey
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground border border-white/10 bg-white/5 hover:bg-white/15"
                    }`}
                  >
                    Hari {dayNumber}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pomodoro Timer — tunggu mount agar tanggal klien tidak mismatch dengan SSR */}
          {!mounted ? (
            <div className="text-muted-foreground flex min-h-50 flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold">📅 Jadwal</p>
            </div>
          ) : activeDay === realCurrentDay ? (
            <PomodoroTimer
              key={scheduleVersion}
              schedule={jadwal[activeDay]}
              realCurrentDay={realCurrentDay}
              activeDay={activeDay}
              tanggalMulai={tanggalMulai}
            />
          ) : (
            <div className="text-muted-foreground flex min-h-50 flex-col items-center justify-center py-10 text-center">
              <p>Timer dan mode fokus hanya tersedia untuk jadwal hari ini.</p>
            </div>
          )}

          {/* Timeline Jadwal */}
          <GlassCard>
            <div className="border-foreground/10 mb-4 border-b pb-4">
              <p className="text-sm font-semibold">
                📅 Jadwal {activeDay.replace("hari_", "Hari ")}
              </p>
            </div>
            <TimelineView items={jadwal[activeDay] || []} />
          </GlassCard>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="from-background/90 to-background/50 rounded-[2rem] border border-white/10 bg-linear-to-br p-6 backdrop-blur-2xl sm:max-w-md sm:p-8">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-2xl font-bold">
              Reset Jadwal?
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Apakah Anda yakin ingin mereset semua jadwal dan percakapan?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 space-x-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              className="rounded-full"
            >
              Ya, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
