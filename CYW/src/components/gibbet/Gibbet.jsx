// Gibbet.jsx
// Visual component for the gibbet creature
import { COLORS } from "../../data/colors.js";
import { useEffect, useRef, useState } from "react";

export default function Gibbet({ x, y, angle, state, poisoned, poisonAge, gainPopups = [], showEyes = true, color }) {
  const happy = state === "happy";
  const sniffing = state === "sniffing";
  const harvesting = state === "harvesting";
  const sniffScale = sniffing ? 1 + 0.04 * Math.sin(Date.now() * 0.02) : 1;
  const harvestBob = harvesting ? 3 * Math.abs(Math.sin(Date.now() * 0.012)) : 0;
  const scaleX = happy ? 1.14 : poisoned ? 0.88 : sniffing ? sniffScale : 1;
  const scaleY = happy ? 0.91 : poisoned ? 1.18 : 1;
  // Eyes logic: show only if showEyes is true and not poisoned and not state==='body'
  const eyesVisible = showEyes && !poisoned && state !== "body";
  // Use color prop for main body color, fallback to default
  const mainColor = color || "#cc9660";
  return (
    <g transform={`translate(${x}, ${y + harvestBob})`}>
      {/* Resource gain popups */}
      {gainPopups.map((popup, i) => {
        const t = Math.min(1, (Date.now() - popup.time) / 900);
        const fade = 1 - t;
        const dy = -28 - t * 22;
        // If crit, make popup larger, bolder, and with a glow
        const isCrit = popup.crit;
        return (
          <g key={popup.id} style={{ opacity: fade, pointerEvents: "none" }}>
            <text x={0} y={dy} textAnchor="middle"
              fontSize={isCrit ? "28" : "18"}
              fontWeight={isCrit ? "900" : "bold"}
              fill={isCrit ? "#fff700" : (popup.hex || '#fff')}
              stroke={isCrit ? "#ff9800" : "#222"}
              strokeWidth={isCrit ? "2.2" : "0.8"}
              paintOrder="stroke"
              style={isCrit ? { filter: "drop-shadow(0 0 8px #fff700) drop-shadow(0 0 16px #ff9800)" } : {}}>
              {isCrit ? `CRIT +${popup.amount}` : `+${popup.amount}`}
            </text>
          </g>
        );
      })}
      <ellipse cx={0} cy={19} rx={15} ry={5} fill="rgba(0,0,0,0.28)" />
      <g transform={`scale(${scaleX}, ${scaleY})`}>
        <ellipse cx={0} cy={0} rx={15 * sniffScale} ry={14} fill="#b8814a" />
        <ellipse cx={0} cy={0} rx={14} ry={13} fill={mainColor} />
        <ellipse cx={0} cy={5} rx={9} ry={8} fill="#e8c49e" opacity={poisoned ? 0.18 + 0.3 * poisonAge : 0.48} />
        {eyesVisible && (
          <>
            <circle cx={-6} cy={-4} r={4.8} fill="white" />
            <circle cx={ 6} cy={-4} r={4.8} fill="white" />
            <circle cx={-6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            <circle cx={ 6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            <circle cx={-4.5} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            <circle cx={ 7.4} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            {state === "idle" && (
              <>
                <ellipse cx={-6} cy={-5.5} rx={4.8} ry={2.2} fill="#cc9660" opacity={0.7} />
                <ellipse cx={ 6} cy={-5.5} rx={4.8} ry={2.2} fill="#cc9660" opacity={0.7} />
              </>
            )}
            {sniffing && (
              <path d="M -2 2 Q 0 4 2 2"
                stroke="#8a5e38" strokeWidth={1} fill="none" strokeLinecap="round"
                opacity={0.6 + 0.4 * Math.sin(Date.now() * 0.025)} />
            )}
            {harvesting && (
              <>
                <ellipse cx={-6} cy={-5} rx={4.8} ry={1.8} fill="#cc9660" opacity={0.85} />
                <ellipse cx={ 6} cy={-5} rx={4.8} ry={1.8} fill="#cc9660" opacity={0.85} />
                <line x1={-3} y1={7} x2={3} y2={7}
                  stroke="#8a5e38" strokeWidth={1.2} strokeLinecap="round" />
              </>
            )}
          </>
        )}
        {poisoned && (
          <>
            <line x1={-9} y1={-7} x2={-3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={-3} y1={-7} x2={-9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 3} y1={-7} x2={ 9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 9} y1={-7} x2={ 3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
          </>
        )}
        {happy && (
          <path d="M -5 5.5 Q 0 10 5 5.5" stroke="#8a5e38" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        )}
        {poisoned && (
          <path d="M -5 8 Q 0 3 5 8" stroke="#ef4444" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={poisonAge} />
        )}
        <circle cx={-11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />
        <circle cx={ 11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />
        <ellipse cx={-7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        <ellipse cx={ 7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        {[-11, -7.5, -4].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
        {[4, 7.5, 11].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
      </g>
    </g>
  );
}