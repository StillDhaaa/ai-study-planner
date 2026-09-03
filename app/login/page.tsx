import { Suspense } from "react";

import LoginUI from "./LoginUI";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-10 w-full max-w-md" />}>
        <LoginUI user={null} />
      </Suspense>
    </main>
  );
}
