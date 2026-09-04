import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import LoginUI from "./LoginUI";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-12">
      <Link href="/" className="absolute top-5 left-5">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="size-4" />
          Kembali ke Beranda
        </Button>
      </Link>
      <Suspense fallback={<div className="h-10 w-full max-w-md" />}>
        <LoginUI user={null} />
      </Suspense>
    </main>
  );
}
