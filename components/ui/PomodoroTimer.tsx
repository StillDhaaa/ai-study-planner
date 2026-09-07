"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type ScheduleItem = {
  waktu: string;
  kegiatan: string;
  tipe: string;
};

export function PomodoroTimer({
  schedule = [],
  realCurrentDay = "hari_1",
  activeDay = "hari_1",
  tanggalMulai,
}: {
  schedule?: ScheduleItem[];
  realCurrentDay?: string;
  activeDay?: string;
  tanggalMulai?: string;
}) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());
  const todayDate = new Date().toISOString().split("T")[0];
  const scheduleDate = tanggalMulai?.slice(0, 10);
  const isScheduleToday = scheduleDate === todayDate;
  const isSchedulePast = Boolean(scheduleDate && scheduleDate < todayDate);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const initialUpdate = window.setTimeout(() => {
      setCurrentTime(new Date());
    }, 0);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      window.clearTimeout(initialUpdate);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (
      !currentTime ||
      !schedule.length ||
      !isScheduleToday ||
      activeDay !== realCurrentDay
    ) {
      return;
    }

    for (const item of schedule) {
      const times = item.waktu.split("-").map((value) => value.trim());
      if (times.length !== 2) continue;

      const [hours, minutes] = times[1].split(":").map(Number);
      const endTime = new Date(currentTime);
      endTime.setHours(hours, minutes, 0, 0);
      const diffSeconds = Math.floor(
        (currentTime.getTime() - endTime.getTime()) / 1000,
      );
      if (diffSeconds !== 0) continue;

      const notifKey = `active-end-${item.waktu}`;
      if (
        notifiedRef.current.has(notifKey) ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        continue;
      }

      notifiedRef.current.add(notifKey);
      const message = `Sesi selesai: ${item.kegiatan}`;
      new Notification("Study Planner AI", {
        body: message,
        icon: "/favicon.ico",
      });
      toast.success(message);
    }
  }, [activeDay, currentTime, isScheduleToday, realCurrentDay, schedule]);

  // Placeholder saat hydrating
  if (!currentTime) {
    return (
      <div className="border-foreground/20 mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 rounded-[2rem] border-2 bg-white/5 px-6 py-12 text-center shadow-lg backdrop-blur-md">
        <p className="text-foreground/60 text-xs font-semibold tracking-widest uppercase">
          📅 Jadwal
        </p>
        <span className="text-foreground text-7xl font-bold tabular-nums">
          --:--
        </span>
        <p className="text-foreground/50 text-xs">Memuat timer...</p>
      </div>
    );
  }

  // Tidak ada jadwal
  if (!schedule || schedule.length === 0) {
    return (
      <div className="border-foreground/20 mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 rounded-[2rem] border-2 bg-white/5 px-6 py-12 text-center shadow-lg backdrop-blur-md">
        <p className="text-foreground/60 text-xs font-semibold tracking-widest uppercase">
          📅 Jadwal
        </p>
        <span className="text-foreground text-7xl font-bold tabular-nums">
          --:--
        </span>
        <p className="text-foreground/70 text-sm">
          Belum ada jadwal untuk hari ini
        </p>
      </div>
    );
  }

  if (!isScheduleToday) {
    return (
      <div className="border-foreground/20 mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-4 rounded-[2rem] border-2 bg-white/5 px-6 py-12 text-center shadow-lg backdrop-blur-md">
        <p className="text-foreground/60 text-xs font-semibold tracking-widest uppercase">
          📅 Jadwal
        </p>
        <span className="text-foreground text-6xl font-bold tabular-nums">
          --:--
        </span>
        <p className="text-foreground/70 text-sm">
          {isSchedulePast
            ? "Jadwal ini sudah berlalu."
            : "Timer aktif saat tanggal jadwal tiba."}
        </p>
      </div>
    );
  }

  function parseTimeToDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.trim().split(":").map(Number);
    const date = new Date(currentTime!);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  let status: "waiting" | "active" | "finished" = "finished";
  let activeItem: ScheduleItem | null = null;
  let nextItem: ScheduleItem | null = null;
  let targetTime: Date | null = null;
  let progress = 100;

  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    const times = item.waktu.split("-").map((s) => s.trim());
    if (times.length !== 2) continue;

    const sTime = parseTimeToDate(times[0]);
    const eTime = parseTimeToDate(times[1]);

    if (currentTime >= sTime && currentTime < eTime) {
      status = "active";
      activeItem = item;
      targetTime = eTime;
      const totalDuration = eTime.getTime() - sTime.getTime();
      const elapsed = currentTime.getTime() - sTime.getTime();
      progress = Math.min(100, (elapsed / totalDuration) * 100);
      break;
    } else if (currentTime < sTime) {
      status = "waiting";
      nextItem = item;
      targetTime = sTime;
      progress = 0;
      break;
    }
  }

  // Hitung countdown
  let displayTime = (
    <div>
      00<span>:</span>00
    </div>
  );
  if (status !== "finished" && targetTime) {
    const diffSeconds = Math.floor(
      (targetTime.getTime() - currentTime.getTime()) / 1000,
    );
    if (diffSeconds >= 0) {
      const h = Math.floor(diffSeconds / 3600);
      const m = Math.floor((diffSeconds % 3600) / 60);
      const s = diffSeconds % 60;
      displayTime =
        h > 0 ? (
          <>
            {String(h).padStart(2, "0")}
            {<span className="relative -top-3 mx-1">:</span>}
            {String(m).padStart(2, "0")}
            {<span className="relative -top-3 mx-1">:</span>}
            {String(s).padStart(2, "0")}
          </>
        ) : (
          <>
            {String(m).padStart(2, "0")}
            {<span className="relative -top-3 mx-1">:</span>}
            {String(s).padStart(2, "0")}
          </>
        );
    }
  }

  const isFocus = activeItem?.tipe?.toLowerCase().includes("fokus") ?? true;

  const phaseLabel =
    status === "waiting"
      ? "⏳ Bersiaplah"
      : status === "finished"
        ? "✅ Selesai"
        : isFocus
          ? "🎯 Waktu Fokus"
          : "☕ Waktu Istirahat";

  return (
    <div
      key={realCurrentDay}
      className="border-foreground/20 mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-5 rounded-[2rem] border-2 bg-white/5 px-6 py-10 text-center shadow-lg backdrop-blur-md"
    >
      {/* Phase label */}
      <p className="text-foreground/60 text-xs font-semibold tracking-widest uppercase">
        {phaseLabel}
      </p>

      {/* Jam digital raksasa */}
      <span className="text-foreground font-clock mx-2 text-6xl tabular-nums md:text-8xl">
        {status === "finished" ? "00:00" : displayTime}
      </span>

      {/* Progress bar */}
      <div className="w-full px-2">
        <Progress value={progress} className="bg-foreground/10 h-2" />
      </div>

      {/* Keterangan sesi */}
      <div className="text-foreground/70 max-w-xs text-sm leading-relaxed">
        {status === "waiting" && nextItem && (
          <>
            Sesi berikutnya:{" "}
            <strong className="text-foreground">{nextItem.kegiatan}</strong>
          </>
        )}
        {status === "active" && activeItem && (
          <>
            Sedang berlangsung:{" "}
            <strong className="text-foreground">{activeItem.kegiatan}</strong>
          </>
        )}
        {status === "finished" && (
          <span>Jadwal hari ini selesai. Selamat beristirahat! 🎉</span>
        )}
      </div>

      {/* Info hari */}
      <p className="text-foreground/40 text-xs">
        {activeDay === realCurrentDay
          ? "Hari ini"
          : `Menampilkan ${activeDay.replace("hari_", "Hari ")}`}
      </p>
    </div>
  );
}
