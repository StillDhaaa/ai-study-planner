import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-foreground/20 flex flex-col gap-4 rounded-2xl border bg-[hsl(var(--glass-bg)/var(--glass-opacity))] p-6 shadow-xl backdrop-blur-xl transition-all duration-300 dark:border-white/10",
        className,
      )}
      {...props}
    />
  );
}

export { GlassCard };
