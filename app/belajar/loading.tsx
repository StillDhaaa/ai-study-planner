export default function Loading() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center p-6 transition-colors duration-300 md:p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          Memuat data...
        </p>
      </div>
    </main>
  );
}
