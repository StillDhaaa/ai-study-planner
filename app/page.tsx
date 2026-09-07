import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";
import { TbWorldWww } from "react-icons/tb";
import { ScrollToSection } from "@/components/ScrollToSection";
import ShinyTitle from "./ShinyTitle";

export default function Home() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <main className="relative z-10 flex h-svh flex-1 flex-col items-center justify-center gap-5 px-4 pt-4 pb-16">
        <GlassCard className="w-full max-w-xl text-center">
          <div className="mx-auto flex flex-col items-center gap-2">
            <ShinyTitle />

            <p className="text-muted-foreground text-base">
              Rencanakan waktu belajarmu dengan cerdas. Teknologi kecerdasan
              buatan kami akan menyusun jadwal terstruktur dengan metode
              Pomodoro yang disesuaikan dengan rutinitas harianmu.
            </p>

            <div className="my-2 flex w-full flex-row justify-around">
              <ScrollToSection targetId="cara-kerja">
                Cara Kerja
              </ScrollToSection>
              <Link href="/belajar" className="w-min">
                <Button className={"font-sans text-lg"}>Mulai Belajar</Button>
              </Link>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-row gap-5">
          <Link href={"https://github.com/StillDhaaa"}>
            <Button className="px-5 py-4 text-xl" variant={"secondary"}>
              <FaGithub /> Github
            </Button>
          </Link>
          <Link href={"https://dhaaa.my.id/"}>
            <Button className="px-5 py-4 text-xl" variant={"secondary"}>
              <TbWorldWww /> Portofolio
            </Button>
          </Link>
        </div>
      </main>

      <section
        id="cara-kerja"
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-8"
      >
        <div className="mb-8 pt-3 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Dari target menjadi progres nyata.
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
            Study Planner AI menyatukan perencanaan, fokus, dan evaluasi dalam
            satu alur belajar yang personal.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <GlassCard className="min-h-64">
            <span className="text-primary text-4xl font-bold">01</span>
            <div>
              <h3 className="text-xl font-semibold">Masuk & Autentikasi</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Masuk ke akun kamu untuk mengamankan data jadwal belajarmu
                secara personal.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="min-h-64">
            <span className="text-primary text-4xl font-bold">02</span>
            <div>
              <h3 className="text-xl font-semibold">Atur Target & Sapa AI</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Ketik tujuan belajarmu, seperti SNBT atau Fisika, di chat
                interaktif. AI akan merancang jadwal otomatis.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="min-h-64">
            <span className="text-primary text-4xl font-bold">03</span>
            <div>
              <h3 className="text-xl font-semibold">Eksekusi Pomodoro</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Ikuti timer real-time berbasis Pomodoro: 25 menit fokus dan 5
                menit istirahat, lengkap dengan notifikasi lintas tab.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-24 md:px-8">
        <div className="mb-8 text-center">
          <p className="text-primary mb-2 text-lg font-semibold tracking-wide uppercase">
            FAQ
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Pertanyaan yang sering muncul.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <GlassCard className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none justify-between gap-4 px-5 py-5 font-semibold marker:hidden">
                Kenapa jadwal diatur maksimal sampai pukul 20.00?
                <span className="text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground border-border/70 border-t px-5 py-5 text-sm leading-relaxed">
                Agar kamu memiliki waktu istirahat malam yang cukup dan tidur
                berkualitas, aplikasi ini mengunci batas akhir belajar pukul
                20.00 WIB.
              </p>
            </details>
          </GlassCard>

          <GlassCard className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none justify-between gap-4 px-5 py-5 font-semibold marker:hidden">
                Bagaimana jika saya membuka web ini sudah larut malam (di atas
                21.30)?
                <span className="text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground border-border/70 border-t px-5 py-5 text-sm leading-relaxed">
                Sistem pintar kami secara otomatis mendeteksi waktu malam dan
                menggeser jadwal hari pertama (Hari 1) menjadi keesokan harinya
                agar waktu belajarmu tidak terbuang sia-sia.
              </p>
            </details>
          </GlassCard>

          <GlassCard className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none justify-between gap-4 px-5 py-5 font-semibold marker:hidden">
                Apakah data jadwal dan riwayat chat saya aman?
                <span className="text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground border-border/70 border-t px-5 py-5 text-sm leading-relaxed">
                Sangat aman. Seluruh data disimpan terenkripsi di database
                Supabase menggunakan tipe data JSONB dengan proteksi Row Level
                Security (RLS).
              </p>
            </details>
          </GlassCard>

          <GlassCard className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none justify-between gap-4 px-5 py-5 font-semibold marker:hidden">
                Apakah web ini menggunakan kamera untuk melacak fokus?
                <span className="text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-muted-foreground border-border/70 border-t px-5 py-5 text-sm leading-relaxed">
                Tidak sama sekali. Kami sangat menghargai privasimu. Pelacakan
                murni menggunakan sistem kejujuran timer Pomodoro dan interaksi
                mandiri.
              </p>
            </details>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
