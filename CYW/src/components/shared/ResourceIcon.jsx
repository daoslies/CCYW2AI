// ResourceIcon.jsx
// Minimal SVG icon for resource color (red, green, blue)
import React from "react";
import { COLORS } from "../../data/colors.js";

export default function ResourceIcon({ colorId = "red", size = 16, style = {} }) {
  const col = COLORS.find(c => c.id === colorId) || COLORS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={style}>
      <circle cx={10} cy={10} r={8} fill={col.hex} stroke={col.ring} strokeWidth={2} />
      <circle cx={10} cy={10} r={4} fill={col.glow} opacity={0.5} />
    </svg>
  );
}
