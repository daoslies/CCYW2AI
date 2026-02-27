import React from "react";
import Gibbet from "../gibbet/Gibbet.jsx";
import { useWorld } from "../../store/worldStore.jsx";
import { R } from "../../styles/rosterTokens.js";
import { COLORS } from "../../data/colors.js";

export default function AccuracyRing({ value, color, size = 28 }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = value * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="#1a1a2a" strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={2.5}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        opacity={0.8} />
    </svg>
  );
}
