"use client";

import { useEffect, useState } from "react";

type GlowMode = "entry" | "protect" | "verify";

type GlowEvent = CustomEvent<{ mode?: GlowMode }>;

export function triggerScreenEdgeGlow(mode: GlowMode = "entry") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kvs:edge-glow", { detail: { mode } }));
}

export default function ScreenEdgeGlow() {
  const [activeMode, setActiveMode] = useState<GlowMode | null>(null);
  const [pulseId, setPulseId] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const showGlow = (mode: GlowMode) => {
      setActiveMode(mode);
      setPulseId((current) => current + 1);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setActiveMode(null), mode === "entry" ? 3600 : 3000);
    };

    const onGlow = (event: Event) => {
      const mode = (event as GlowEvent).detail?.mode || "entry";
      showGlow(mode);
    };

    window.addEventListener("kvs:edge-glow", onGlow);
    showGlow("entry");

    return () => {
      window.removeEventListener("kvs:edge-glow", onGlow);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!activeMode) return null;

  return (
    <div
      key={pulseId}
      className={`screen-edge-glow screen-edge-glow--${activeMode}`}
      aria-hidden
    >
      <span className="screen-edge-glow__aurora screen-edge-glow__aurora--wide" />
      <span className="screen-edge-glow__aurora screen-edge-glow__aurora--soft" />
      <span className="screen-edge-glow__line" />
    </div>
  );
}
