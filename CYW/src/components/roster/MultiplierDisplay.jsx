// MultiplierDisplay.jsx
import React from "react";
import { COLORS } from "../../data/colors.js";

export function MultiplierDisplay({ multipliers, accentColor, active }) {
  const COLORS_ORDER = ["red", "green", "blue"];
  const max = Math.max(...COLORS_ORDER.map(c => multipliers[c] ?? 0), 1);
  return (
    <div style={{ display: "flex", gap: 6, position: "relative", zIndex: 1 }}>
      {COLORS_ORDER.map(colorId => {
        const color = COLORS.find(c => c.id === colorId);
        const val = multipliers[colorId] ?? 0;
        const barHeight = Math.max(2, (val / max) * 36);
        const isBoost = val > 1;
        const isDead  = val === 0;
        return (
          <div key={colorId} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: isDead  ? "#2a2a35"
                   : isBoost ? color.hex
                   : "#555",
              letterSpacing: "0.05em",
            }}>
              ×{val.toFixed(1)}
            </span>
            <div style={{
              width: "100%",
              height: 36,
              background: "#0a0a12",
              borderRadius: 4,
              border: "1px solid #111118",
              display: "flex",
              alignItems: "flex-end",
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                width: "100%",
                height: barHeight,
                background: isDead
                  ? "#111118"
                  : `linear-gradient(to top, ${color.hex}, ${color.hex}88)`,
                borderRadius: "0 0 3px 3px",
                boxShadow: !isDead && active
                  ? `0 0 8px ${color.glow}` : "none",
                transition: "height 0.3s ease, box-shadow 0.2s",
              }} />
            </div>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isDead ? "#222" : color.hex,
              opacity: isDead ? 0.3 : 0.7,
              boxShadow: !isDead ? `0 0 4px ${color.glow}` : "none",
            }} />
          </div>
        );
      })}
    </div>
  );
}
