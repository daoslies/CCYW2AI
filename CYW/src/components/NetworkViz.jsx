import { useMemo, useEffect, useState, useRef } from "react";
import { COLORS } from "../data/colors";
import { NETWORK_LAYERS } from "../data/networkConfig";

// ─────────────────────────────────────────────────────────────────────────────
// NetworkViz — live visualisation of the composed network
//
// Props:
//   network      the compose(...) object from nn.js (via networkRef.current)
//   inputValue   the scalar fed to the network right now (0.0 / 0.5 / 1.0)
//   animTrigger  any value whose identity change fires the activation wave
//                (pass trainCount from App.jsx)
//
// The component is a drop-in SVG panel. Add it to App.jsx like:
//   <NetworkViz network={networkRef.current} inputValue={indicator.value} animTrigger={trainCount} />
// ─────────────────────────────────────────────────────────────────────────────

// ML team: Updated for multiclass output (3 neurons, softmax). Output neurons colored by class, opacity by probability, winner highlighted.
// Uses NETWORK_LAYERS from networkConfig.js for architecture.
const DISPLAY_LAYERS  = NETWORK_LAYERS;
const LAYER_LABELS    = ["input", "hidden 1", "hidden 2", "output"]; // output: 3 classes
const DENSE_LAYER_IDX = [0, 2, 4];

const SVG_W   = 440;
const SVG_H   = 280;
const NODE_R  = 6;
const PAD_X   = 52;
const PAD_Y   = 28;
const LABEL_Y = SVG_H - 6;

// Pre-compute (x, y) for every neuron in the 4 display columns.
function buildPositions() {
  return DISPLAY_LAYERS.map((n, li) => {
    const x = PAD_X + (li / (DISPLAY_LAYERS.length - 1)) * (SVG_W - PAD_X * 2);
    return Array.from({ length: n }, (_, ni) => ({
      x,
      y: n === 1
        ? SVG_H / 2
        : PAD_Y + (ni / (n - 1)) * (SVG_H - PAD_Y * 2 - 16),
    }));
  });
}
const NODE_POS = buildPositions();

function getNetworkState(network, input) {
  const raw = [[...input]];
  let cur = input;
  for (const layer of network.layers) {
    const { output } = layer.forward(cur);
    raw.push([...output]);
    cur = output;
  }
  // ML team: activations[3] is now a 3-vector (softmax probabilities)
  return {
    activations: [raw[0], raw[2], raw[4], raw[6]],
    weights: DENSE_LAYER_IDX.map(i => network.layers[i].params.W),
  };
}

function nodeColor(activation) {
  const v = Math.max(0, Math.min(1, activation));
  const r = Math.round(20  + v * 80);
  const g = Math.round(20  + v * 200);
  const b = Math.round(30  + v * 225);
  return { fill: `rgb(${r},${g},${b})`, glow: `rgba(${r},${g},${b},0.35)` };
}

function edgeColor(w, maxW) {
  const norm  = Math.min(Math.abs(w) / (maxW + 1e-9), 1);
  const alpha = norm * 0.55;
  return w >= 0
    ? `rgba(96, 165, 250, ${alpha})`
    : `rgba(248, 113, 113, ${alpha})`;
}

function edgeWidth(w, maxW) {
  return 0.5 + (Math.abs(w) / (maxW + 1e-9)) * 0.8;
}

function outputNodeColor(idx, probs) {
  // ML team: Color output nodes by class, opacity by probability
  const base = COLORS[idx];
  const opacity = probs[idx];
  return { fill: base.hex, opacity };
}

const WAVE_STEP_MS = 110;

function safeNum(val, fallback = 0) {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

export default function NetworkViz({ network, inputValue, animTrigger }) {
  const [waveLayer, setWaveLayer] = useState(-1);
  const waveRef = useRef(null);

  useEffect(() => {
    if (animTrigger === undefined || animTrigger === null) return;
    if (waveRef.current) clearTimeout(waveRef.current);
    let li = 0;
    const tick = () => {
      setWaveLayer(li);
      li++;
      if (li < DISPLAY_LAYERS.length) {
        waveRef.current = setTimeout(tick, WAVE_STEP_MS);
      } else {
        waveRef.current = setTimeout(() => setWaveLayer(-1), WAVE_STEP_MS);
      }
    };
    tick();
    return () => { if (waveRef.current) clearTimeout(waveRef.current); };
  }, [animTrigger]);

  const { activations, weights } = useMemo(
    () => getNetworkState(network, inputValue ?? [0,0,0]),
    [network, inputValue, animTrigger]
  );

  const maxWeights = weights.map(W =>
    Math.max(...W.flat().map(Math.abs), 1e-9)
  );

  return (
    <div style={{
      background: "#0d0d14",
      border: "1px solid #1a1a26",
      borderRadius: 16,
      padding: "16px 8px 10px",
      position: "relative",
    }}>
      <style>{`
        @keyframes nodeRing {
          0%   { r: ${NODE_R + 2}; opacity: 0.8; }
          100% { r: ${NODE_R + 10}; opacity: 0; }
        }
        .wave-ring { animation: nodeRing 0.35s ease-out forwards; }
      `}</style>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Edges */}
        {weights.map((W, wi) => {
          const fromNodes = NODE_POS[wi];
          const toNodes   = NODE_POS[wi + 1];
          const maxW      = maxWeights[wi];
          return W.map((row, toIdx) =>
            row.map((w, fromIdx) => (
              <line
                key={`e-${wi}-${toIdx}-${fromIdx}`}
                x1={safeNum(fromNodes[fromIdx]?.x)}
                y1={safeNum(fromNodes[fromIdx]?.y)}
                x2={safeNum(toNodes[toIdx]?.x)}
                y2={safeNum(toNodes[toIdx]?.y)}
                stroke={edgeColor(w, maxW)}
                strokeWidth={edgeWidth(w, maxW)}
              />
            ))
          );
        })}
        {/* Nodes */}
        {DISPLAY_LAYERS.map((n, li) =>
          Array.from({ length: n }, (_, ni) => {
            const pos = NODE_POS[li]?.[ni] || { x: 0, y: 0 };
            const x = safeNum(pos.x);
            const y = safeNum(pos.y);
            const act = activations[li]?.[ni] ?? 0;
            // Output layer: color by class, opacity by probability, highlight winner
            if (li === DISPLAY_LAYERS.length - 1) {
              const probs = activations[li];
              const winner = probs.indexOf(Math.max(...probs));
              let { fill, opacity } = outputNodeColor(ni, probs);
              // Clamp and default opacity
              opacity = typeof opacity === "number" && isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0;
              return (
                <g key={`n-${li}-${ni}`}>
                  <circle
                    cx={x} cy={y}
                    r={NODE_R + 3}
                    fill={fill}
                    opacity={opacity * 0.7 + 0.2}
                    style={{ filter: "blur(3px)" }}
                  />
                  <circle
                    cx={x} cy={y}
                    r={NODE_R}
                    fill={fill}
                    opacity={opacity * 0.8 + 0.15}
                    stroke={winner === ni ? "#fff" : fill}
                    strokeWidth={winner === ni ? 2.2 : 0.8}
                  />
                  <text
                    x={x + NODE_R + 5}
                    y={y + 4}
                    fill="#555"
                    fontSize={7.5}
                    fontFamily="DM Mono, monospace"
                  >
                    {(probs[ni] * 100).toFixed(1)}%
                  </text>
                </g>
              );
            }
            // Hidden/input: color input neurons by their class color, dim if not active
            const isInputLayer = li === 0;
            let fill, glow;
            if (isInputLayer) {
              if (act === 1) {
                fill = COLORS[ni].hex;
                glow = COLORS[ni].glow;
              } else {
                // Dimmed color for inactive input
                fill = COLORS[ni].hex + '33';
                glow = COLORS[ni].glow + '22';
              }
            } else {
              ({ fill, glow } = nodeColor(act));
            }
            const isWave     = waveLayer === li;
            return (
              <g key={`n-${li}-${ni}`}>
                {isWave && (
                  <circle
                    className="wave-ring"
                    cx={x} cy={y}
                    r={NODE_R + 2}
                    fill="none"
                    stroke={glow}
                    strokeWidth={1.2}
                  />
                )}
                <circle
                  cx={x} cy={y}
                  r={NODE_R + 3}
                  fill={glow}
                  style={{ filter: "blur(3px)" }}
                />
                <circle
                  cx={x} cy={y}
                  r={NODE_R}
                  fill={fill}
                  stroke={glow}
                  strokeWidth={0.8}
                />
                {n <= 4 && (
                  <text
                    x={x + NODE_R + 5}
                    y={y + 4}
                    fill="#555"
                    fontSize={7.5}
                    fontFamily="DM Mono, monospace"
                  >
                    {typeof act === "number"
                      ? act.toFixed(2)
                      : Array.isArray(act) && typeof act[ni] === "number"
                        ? act[ni].toFixed(2)
                        : String(act)}
                  </text>
                )}
              </g>
            );
          })
        )}
        {/* Layer labels */}
        {LAYER_LABELS.map((label, li) => (
          <text
            key={`lbl-${li}`}
            x={safeNum(NODE_POS[li][0]?.x)}
            y={LABEL_Y}
            textAnchor="middle"
            fill="#333"
            fontSize={8}
            letterSpacing="0.12em"
            fontFamily="DM Mono, monospace"
          >
            {label.toUpperCase()}
          </text>
        ))}
        {/* Legend */}
        <g transform={`translate(${SVG_W - 90}, 10)`}>
          <line x1={0} y1={5} x2={16} y2={5} stroke="rgba(96,165,250,0.6)"  strokeWidth={1.5} />
          <text x={20} y={9}  fill="#333" fontSize={7.5} fontFamily="DM Mono, monospace">+weight</text>
          <line x1={0} y1={16} x2={16} y2={16} stroke="rgba(248,113,113,0.6)" strokeWidth={1.5} />
          <text x={20} y={20} fill="#333" fontSize={7.5} fontFamily="DM Mono, monospace">−weight</text>
        </g>
      </svg>
    </div>
  );
}
