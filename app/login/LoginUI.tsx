"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type LoginProps = {
  user: User | null;
};

function LoginUI({ user }: LoginProps) {
  void user;
  const [isSignup, setIsSignup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  async function ensureOrientationSchedule(userId: string) {
    const { data: existingSchedules, error: fetchError } = await supabase
      .from("user_schedules")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) throw new Error(fetchError.message);
    if (existingSchedules && existingSchedules.length > 0) return;

    const todayDate = new Date().toISOString().split("T")[0];
    const initialSchedule = {
      user_id: userId,
      tujuan_belajar: "Pengenalan",
      tanggal_mulai: todayDate,
      jadwal_data: {
        tanggal_mulai: todayDate,
        jadwal_harian: {
          hari_1: [
            {
              waktu: "Sekarang",
              kegiatan: "Selamat datang! Ketik target belajarmu di chat.",
              tipe: "fokus",
            },
          ],
        },
      },
    };

    const { error: insertError } = await supabase
      .from("user_schedules")
      .insert([initialSchedule] as unknown as never);
    if (insertError) throw new Error(insertError.message);
  }
  const searchParams = useSearchParams();

  // Tampilkan pesan error jika ada parameter error dari proxy/middleware
  useEffect(() => {
    const errorMsg = searchParams?.get("error");
    if (errorMsg === "unauthorized") {
      toast.error("Harap login terlebih dahulu", { id: "auth-error-toast" });
      // Opsional: Hapus query parameter setelah ditampilkan agar tidak muncul lagi saat refresh
      router.replace("/login");
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const login = async () => {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
          },
        });
        if (error) {
          throw new Error(error.message);
        } else {
          toast.dismiss("auth-error-toast");
          const displayNameToSave =
            data.user?.user_metadata?.display_name ||
            displayName ||
            email.split("@")[0];

          // Set displayname cookie dengan max-age 1 hari (86400 detik)
          document.cookie = `displayname=${encodeURIComponent(displayNameToSave)}; path=/; max-age=86400`;

          // Create initial orientation schedule di Supabase jika belum ada
          try {
            if (data.user?.id) await ensureOrientationSchedule(data.user.id);
          } catch (scheduleError) {
            console.warn(
              "Gagal membuat jadwal orientasi, user tetap lanjut:",
              scheduleError,
            );
          }

          window.setTimeout(() => {
            window.location.replace("/belajar");
          }, 1500);
          return `Akun berhasil dibuat, selamat datang ${displayNameToSave}!`;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw new Error(error.message);
        } else {
          toast.dismiss("auth-error-toast");
          const displayNameToSave =
            data.user?.user_metadata?.display_name || email.split("@")[0];

          // Set displayname cookie dengan max-age 1 hari (86400 detik)
          document.cookie = `displayname=${encodeURIComponent(displayNameToSave)}; path=/; max-age=86400`;

          try {
            if (data.user?.id) await ensureOrientationSchedule(data.user.id);
          } catch (scheduleError) {
            console.warn(
              "Gagal memastikan jadwal orientasi, user tetap lanjut:",
              scheduleError,
            );
          }

          window.setTimeout(() => {
            window.location.replace("/belajar");
          }, 1500);
          return `Selamat datang kembali ${displayNameToSave}!`;
        }
      }
    };

    try {
      await toast.promise(login(), {
        loading: "Loading...",
        success: (text) => text,
        error: (error) =>
          error instanceof Error ? error.message : "Autentikasi gagal",
      });
    } catch {
      // Pesan kegagalan sudah ditampilkan oleh toast.promise.
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="text-foreground flex w-3xl items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md gap-6">
        <div className="text-center">
          <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
            AI Study Planner
          </p>
          <h1 className="text-3xl font-bold">
            {isSignup ? "Daftar Akun" : "Selamat Datang Kembali"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSignup
              ? "Buat akun baru untuk mulai menyusun ritme belajarmu. Sudah punya akun? Gunakan tautan Masuk di bawah."
              : "Masuk untuk melanjutkan rencana belajarmu. Belum punya akun? Gunakan tautan Daftar di bawah."}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{"Email"}</Label>
            <Input
              id="email"
              type={"email"}
              required
              autoComplete={"email"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={"nama@email.com"}
              className={""}
            />
          </div>
          {isSignup && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                type="text"
                required
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Contoh: Dhaaa"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="h-10">
            {isLoading
              ? isSignup
                ? "Mendaftarkan..."
                : "Memasukkan..."
              : isSignup
                ? "Daftar Akun"
                : "Masuk"}
          </Button>
        </form>

        <div className="border-border/70 border-t pt-5 text-center">
          <button
            type="button"
            className="text-primary text-sm font-medium hover:underline"
            onClick={() => {
              setIsSignup((current) => !current);
              setPassword("");
            }}
          >
            {isSignup ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
          </button>
        </div>
      </GlassCard>
    </main>
  );
}

export default LoginUI;
