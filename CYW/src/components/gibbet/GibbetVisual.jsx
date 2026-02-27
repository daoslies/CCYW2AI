import React from "react";

// GibbetVisual renders a gibbet icon based on body/template info and simState
// Future-proof: can swap SVG for GIF/PNG assets easily
export default function GibbetVisual({ body, simState, size = 44 }) {
  // Example: SVG rendering, can be replaced with <img src={...} />
  // Animate/dim based on simState (e.g. poisoned, idle, active)
  const { state, poisonedUntil, now } = simState || {};
  const isPoisoned = poisonedUntil && now < poisonedUntil;
  const opacity = isPoisoned ? 0.4 : 1;
  const pulse = state === "active" ? "gibbetPulse 1.2s infinite" : "none";

  // Example SVG: circle with color and pulse
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity, animation: pulse }}>
      <circle cx={size/2} cy={size/2} r={size/2 - 4} fill={body?.color || "#7dd3fc"} stroke="#222" strokeWidth={2} />
      {/* Add more SVG elements based on body.template */}
    </svg>
  );
}

// Add keyframes for gibbetPulse if not present
if (typeof document !== "undefined" && !document.getElementById("gibbetPulseKeyframes")) {
  const style = document.createElement("style");
  style.id = "gibbetPulseKeyframes";
  style.innerHTML = `@keyframes gibbetPulse { 0% { filter: brightness(1); } 50% { filter: brightness(1.3); } 100% { filter: brightness(1); } }`;
  document.head.appendChild(style);
}
