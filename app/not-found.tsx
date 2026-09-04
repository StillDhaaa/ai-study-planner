import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-lg items-center text-center">
        <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
          Study Planner AI
        </p>
        <h1 className="text-3xl font-bold md:text-4xl">
          404 - Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Waduh, sepertinya kamu tersesat dari jadwal belajarmu. Mari kembali ke
          halaman utama.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="size-4" />
            Kembali ke Halaman Utama
          </Button>
        </Link>
      </GlassCard>
    </main>
  );
}
