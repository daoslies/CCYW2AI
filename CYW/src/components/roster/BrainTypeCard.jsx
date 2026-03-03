// BrainTypeCard.jsx
import React from "react";
import { BrainIcon } from "./BrainsRoster.jsx";
import { MiniNetworkDiagram } from "./MiniNetworkDiagram.jsx";
import { CornerTick } from "../shared/CornerTick.jsx";

export function BrainTypeCard({ brainType, selected, onSelect }) {
  const isLocked = !brainType.unlocked;
  const isSelected = selected?.id === brainType.id;
  // For now, cost is hardcoded in worldStore.jsx (1 red for brain)
  const cost = brainType.cost || { red: 1, green: 0, blue: 0 };
  return (
    <button
      onClick={() => !isLocked && onSelect(brainType)}
      style={{
        width: "100%",
        padding: 0,
        border: "none",
        background: "none",
        cursor: isLocked ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: isLocked ? 0.4 : 1,
      }}
    >
      <div style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        background: isSelected
          ? `radial-gradient(ellipse at 30% 40%, ${brainType.accentColor}14 0%, #020204 65%)`
          : "#020204",
        boxShadow: [
          "inset 0 2px 12px rgba(0,0,0,0.9)",
          "inset 0 0 0 1px rgba(0,0,0,0.8)",
          isSelected
            ? `0 0 0 1px ${brainType.accentColor}55, 0 0 20px ${brainType.accentColor}18`
            : "0 0 0 1px #111118",
        ].join(", "),
        transition: "all 0.2s ease",
        padding: "14px 14px 12px",
      }}>
        {/* Corner ticks */}
        {["topLeft","topRight","bottomLeft","bottomRight"].map(corner => (
          <CornerTick key={corner} corner={corner}
            color={brainType.accentColor} active={isSelected} />
        ))}
        {/* Scanline texture */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }} />
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center",
          gap: 8, marginBottom: 10, position: "relative", zIndex: 1 }}>
          <BrainIcon typeId={brainType.id} size={22} />
          <div style={{ flex: 1 }}>
            <div style={{
              color: isSelected ? brainType.accentColor : "#e0e0f0",
              fontSize: 12, fontWeight: 600,
              transition: "color 0.2s",
            }}>
              {brainType.label}
            </div>
            <div style={{ color: "#444", fontSize: 8,
              letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {brainType.inputLabels.length} inputs
            </div>
          </div>
          {isLocked && (
            <span style={{ color: "#333", fontSize: 9,
              letterSpacing: "0.1em", textTransform: "uppercase" }}>
              locked
            </span>
          )}
        </div>
        {/* Mini architecture diagram */}
        <div style={{ width: 72, margin: '0 auto' }}>
          <MiniNetworkDiagram
            layers={brainType.config.layers}
            accentColor={brainType.accentColor}
            active={isSelected}
            width={72}
            height={28}
          />
        </div>
        {/* Cost */}
        <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 11, color: isLocked ? "#555" : "#7dd3fc", fontWeight: 500 }}>
          <span>Cost:</span>
          {cost.red > 0 && (
            <span style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 2 }}>
              {cost.red}
              <svg width={16} height={16} viewBox="-12 -12 24 24" style={{ verticalAlign: "middle" }}>
                {/* Red resource icon */}
                <g><polygon points="0,-7 6,-1 0,6 -6,-1" fill="#ef4444" /></g>
              </svg>
            </span>
          )}
          {cost.green > 0 && (
            <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: 2 }}>
              {cost.green}
              <svg width={16} height={16} viewBox="-12 -12 24 24" style={{ verticalAlign: "middle" }}>
                {/* Green resource icon */}
                <g>
                  <ellipse cx={-2} cy={-3} rx={4.5} ry={7.5} fill="#22c55e" opacity={0.92} transform="rotate(-22)" />
                  <ellipse cx={3}  cy={-2} rx={3.5}   ry={6.5} fill="#22c55e" opacity={0.80} transform="rotate(28)" />
                  <ellipse cx={1}  cy={-7} rx={2.5} ry={3.5} fill="#86efac" opacity={0.50} transform="rotate(5)" />
                </g>
              </svg>
            </span>
          )}
          {cost.blue > 0 && (
            <span style={{ color: "#7dd3fc", display: "flex", alignItems: "center", gap: 2 }}>
              {cost.blue}
              <svg width={16} height={16} viewBox="-12 -12 24 24" style={{ verticalAlign: "middle" }}>
                {/* Blue resource icon */}
                <g>
                  <path d="M0,-8 C6,-3 8,2 0,8 C-8,2 -6,-3 0,-8" fill="#3b82f6" opacity={0.88} />
                </g>
              </svg>
            </span>
          )}
        </div>
        {/* Description */}
        <p style={{
          color: "#555", fontSize: 9, letterSpacing: "0.08em",
          lineHeight: 1.5, margin: "10px 0 0",
          position: "relative", zIndex: 1,
        }}>
          {brainType.description}
        </p>
      </div>
    </button>
  );
}
