import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ClientPage from "./ClientPage";

type ScheduleItem = {
  waktu: string;
  kegiatan: string;
  tipe: string;
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = await createClient();

  // Verifikasi user dengan getUser() (aman, terverifikasi ke Supabase Auth server)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Baca displayname dari cookie
  const displayNameRaw = cookieStore.get("displayname")?.value ?? "";
  const displayName = displayNameRaw
    ? decodeURIComponent(displayNameRaw)
    : user.user_metadata?.display_name || user.email?.split("@")[0] || "Sobat";

  // Ambil jadwal terakhir user dari database
  const { data: savedSchedules } = await supabase
    .from("user_schedules")
    .select("chat_history, jadwal_data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  let initialJadwal: Record<string, ScheduleItem[]> = {};
  let initialChatHistory: { role: "user" | "assistant"; content: string }[] =
    [];
  let tanggalMulai = new Date().toISOString();

  if (savedSchedules && savedSchedules.length > 0) {
    const last = savedSchedules[0];
    initialChatHistory = last.chat_history || [];

    if (last.jadwal_data) {
      // Format baru: { tanggal_mulai, jadwal_harian }
      if (last.jadwal_data.jadwal_harian) {
        initialJadwal = last.jadwal_data.jadwal_harian;
        // Prioritaskan tanggal_mulai yang tersimpan di dalam jadwal_data
        if (last.jadwal_data.tanggal_mulai) {
          tanggalMulai = last.jadwal_data.tanggal_mulai;
        } else {
          tanggalMulai = last.created_at || tanggalMulai;
        }
      } else {
        // Format lama: langsung Record<string, ScheduleItem[]>
        initialJadwal = last.jadwal_data;
        tanggalMulai = last.created_at || tanggalMulai;
      }
    }
  }

  return (
    <ClientPage
      displayName={displayName}
      initialJadwal={initialJadwal}
      initialChatHistory={initialChatHistory}
      tanggalMulai={tanggalMulai}
    />
  );
}
