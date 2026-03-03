// CornerTick.jsx
// Shared corner tick mark for panel cards
import React from "react";

export function CornerTick({ corner, color, active }) {
  const size = 8;
  const thickness = 1.5;
  const positions = {
    topLeft:     { top: 6,    left: 6,  borderTop: `${thickness}px solid`, borderLeft:   `${thickness}px solid`, borderRight: "none", borderBottom: "none" },
    topRight:    { top: 6,    right: 6, borderTop: `${thickness}px solid`, borderRight:  `${thickness}px solid`, borderLeft:  "none", borderBottom: "none" },
    bottomLeft:  { bottom: 6, left: 6,  borderBottom: `${thickness}px solid`, borderLeft:  `${thickness}px solid`, borderRight: "none", borderTop: "none" },
    bottomRight: { bottom: 6, right: 6, borderBottom: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderLeft:  "none", borderTop: "none"  },
  };
  return (
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderColor: active ? color : "#252530",
      transition: "border-color 0.2s",
      ...positions[corner],
    }} />
  );
}
