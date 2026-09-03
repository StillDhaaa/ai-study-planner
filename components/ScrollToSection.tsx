"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ScrollToSectionProps = {
  targetId: string;
  children: ReactNode;
};

export function ScrollToSection({ targetId, children }: ScrollToSectionProps) {
  function handleClick() {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", `#${targetId}`);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="font-sans text-lg"
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
