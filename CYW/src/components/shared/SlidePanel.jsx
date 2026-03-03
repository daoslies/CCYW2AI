// SlidePanel.jsx
// Shared sliding panel shell for right-side panels (combine, brain type, body type)
import React from "react";
import { UI_ZOOM } from '../../constants.js';

export function SlidePanel({ isActive, children, width = 300, rightOffset = 280 }) {
  return (
    <div style={{
      position: "fixed",
      right: rightOffset,
      top: 0,
      width,
      height: `${100 / UI_ZOOM}vh`, // Compensate for zoom so scroll area matches visible viewport
      zIndex: 30,
      transform: isActive ? "translateX(0)" : "translateX(calc(100% + 340px))",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: isActive ? "auto" : "none",
      background: "#0d0d16",
      borderLeft: "1px solid #1a1e2a",
      boxShadow: isActive ? "-4px 0 32px rgba(0,0,0,0.6)" : "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflowY: "auto",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 260,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: "auto",
        marginBottom: "auto",
        padding: "24px 0",
        boxSizing: "border-box",
      }}>
        {children}
      </div>
    </div>
  );
}

export function PanelHeader({ label }) {
  return (
    <p style={{
      color: "#333",
      fontSize: 9,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      margin: "0 0 4px",
    }}>
      {label}
    </p>
  );
}
