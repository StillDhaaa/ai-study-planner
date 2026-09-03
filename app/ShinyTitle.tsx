"use client";

import ShinyText from "@/components/ShinyText";

function ShinyTitle() {
  return (
    <ShinyText
      text="AI Study Planner"
      speed={7}
      delay={0}
      color="#006fe6"
      shineColor="#ffffff"
      spread={120}
      direction="left"
      yoyo={false}
      pauseOnHover={false}
      disabled={false}
      className="text-xl font-black"
    />
  );
}

export default ShinyTitle;
