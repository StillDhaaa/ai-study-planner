import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Fast-path: jika tidak ada cookie Supabase sama sekali, langsung redirect tanpa panggil API
  const hasCookies = request.cookies.getAll().some((c) =>
    c.name.startsWith("sb-"),
  );

  if (!hasCookies && pathname.startsWith("/belajar")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "Silahkan login terlebih dahulu.");
    return NextResponse.redirect(loginUrl);
  }

  // Ada cookie — verifikasi sesi ke Supabase (hanya untuk rute yang memerlukan auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belum login dan mencoba akses /belajar
  if (!user && pathname.startsWith("/belajar")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "Silahkan login terlebih dahulu.");
    return NextResponse.redirect(loginUrl);
  }

  // Sudah login dan mencoba akses /login
  if (user && pathname === "/login") {
    const belajarUrl = request.nextUrl.clone();
    belajarUrl.pathname = "/belajar";
    return NextResponse.redirect(belajarUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/belajar/:path*", "/login"],
};
