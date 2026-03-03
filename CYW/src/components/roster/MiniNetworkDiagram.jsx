// MiniNetworkDiagram.jsx
import React from "react";
import { BRAIN_TYPES } from "../../data/brainTypes.js";

export function MiniNetworkDiagram({ layers, accentColor, active }) {
  const W = 70, H = 44;
  const layerCount = layers.length;
  const maxNodes = Math.max(...layers);
  const neuronSpacingX = 12;
  // Define input/output colors (match main NetworkViz)
  const inputColors = ["#f87171", "#34d399", "#60a5fa"];
  const outputColors = ["#f87171", "#34d399", "#60a5fa"];
  return (
    <svg width={W} height={H} style={{ display: "block", position: "relative", zIndex: 1 }}>
      {layers.map((nodeCount, li) => {
        const x = (li / (layerCount - 1)) * (W - 20) + neuronSpacingX;
        return Array.from({ length: nodeCount }).map((_, ni) => {
          const y = (ni / (Math.max(nodeCount - 1, 1))) * (H - 12) + 6;
          // Connections to next layer
          const connections = li < layers.length - 1
            ? Array.from({ length: layers[li + 1] }).map((_, nni) => {
                const nx = ((li + 1) / (layerCount - 1)) * (W - 20) + neuronSpacingX;
                const ny = (nni / (Math.max(layers[li + 1] - 1, 1))) * (H - 12) + 6;
                return (
                  <line key={`${li}-${ni}-${nni}`}
                    x1={x} y1={y} x2={nx} y2={ny}
                    stroke={active ? accentColor : "#1a1a2a"}
                    strokeWidth={0.5}
                    opacity={active ? 0.25 : 0.15}
                  />
                );
              })
            : null;
          // Color input/output neurons
          let fill = active ? accentColor : "#1a1a2a";
          let opacity = active ? 0.7 : 0.4;
          if (li === 0) fill = inputColors[ni % inputColors.length];
          if (li === layers.length - 1) fill = outputColors[ni % outputColors.length];
          return (
            <g key={`${li}-${ni}`}>
              {connections}
              <circle cx={x} cy={y} r={li === 0 || li === layers.length - 1 ? 4 : 3}
                fill={fill}
                opacity={opacity}
              />
            </g>
          );
        });
      })}
    </svg>
  );
}
