// BodyTypeCard.jsx
import React from "react";
import { CornerTick } from "../shared/CornerTick.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import { MultiplierDisplay } from "./MultiplierDisplay.jsx";

export function BodyTypeCard({ bodyType, selected, onSelect }) {
  const isSelected = selected?.id === bodyType.id;
  const isLocked = !bodyType.unlocked;
  return (
    <button
      onClick={() => !isLocked && onSelect(bodyType)}
      style={{ width: "100%", padding: 0, border: "none",
        background: "none", cursor: isLocked ? "not-allowed" : "pointer",
        fontFamily: "inherit", opacity: isLocked ? 0.4 : 1 }}
    >
      <div style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        background: isSelected
          ? `radial-gradient(ellipse at 70% 30%, ${bodyType.accentColor}14 0%, #020204 65%)`
          : "#020204",
        boxShadow: [
          "inset 0 2px 12px rgba(0,0,0,0.9)",
          "inset 0 0 0 1px rgba(0,0,0,0.8)",
          isSelected
            ? `0 0 0 1px ${bodyType.accentColor}55, 0 0 20px ${bodyType.accentColor}18`
            : "0 0 0 1px #111118",
        ].join(", "),
        transition: "all 0.2s ease",
        padding: "14px 14px 12px",
      }}>
        {["topLeft","topRight","bottomLeft","bottomRight"].map(corner => (
          <CornerTick key={corner} corner={corner}
            color={bodyType.accentColor} active={isSelected} />
        ))}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center",
          gap: 8, marginBottom: 12, position: "relative", zIndex: 1 }}>
          <svg width={22} height={22} viewBox="-20 -10 40 42">
            <Gibbet x={0} y={0} angle={0} state="idle"
              poisoned={false} gainPopups={[]}
              color={bodyType.accentColor} />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{
              color: isSelected ? bodyType.accentColor : "#e0e0f0",
              fontSize: 12, fontWeight: 600, transition: "color 0.2s",
            }}>
              {bodyType.label}
            </div>
            <div style={{ color: "#444", fontSize: 8,
              letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {bodyType.id}
            </div>
          </div>
        </div>
        {/* Multiplier display */}
        <MultiplierDisplay multipliers={bodyType.multipliers}
          accentColor={bodyType.accentColor} active={isSelected} />
        <p style={{
          color: "#555", fontSize: 9, letterSpacing: "0.08em",
          lineHeight: 1.5, margin: "10px 0 0",
          position: "relative", zIndex: 1,
        }}>
          {bodyType.description}
        </p>
      </div>
    </button>
  );
}
