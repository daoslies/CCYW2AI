import { useMemo, useEffect, useState, useRef } from "react";
import { COLORS } from "../../data/colors.js";
import { NETWORK_LAYERS } from "../../data/networkConfig.js";
import { useWorld } from "../../store/worldStore.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// NetworkViz — live visualisation of the composed network
//
// Props:
//   brain        the brain object from gibbetStore (contains network, training metadata)
//   inputValue   the scalar fed to the network right now (0.0 / 0.5 / 1.0)
//   animTrigger  any value whose identity change fires the activation wave
//                (pass brain.trainCount)
//
// The component is a drop-in SVG panel. Add it to App.jsx like:
//   <NetworkViz brain={brain} inputValue={indicator.value} animTrigger={trainCount} />
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

// Helper to safely coerce a value to a number, fallback if not valid
function safeNum(val, fallback = 0) {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

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

// --- Pulse animation constants and helpers ---
// Make the pulse even slower for a more pronounced effect
const PULSE_LAYER_DURATION = 220; // ms per layer (was 150)
const PULSE_OVERLAP = 50;         // ms overlap between layers (was 35)
const PULSE_RISE = 80;            // ms rise time (was 50)
const PULSE_FALL = 140;           // ms fall time (was 100)
const PULSE_TOTAL = PULSE_LAYER_DURATION * DISPLAY_LAYERS.length;

// Returns a phase [0,1] for a given layer at time t (ms since pulse start)
function layerPhase(t, layerIndex, layerCount) {
  const layerStart = layerIndex * (PULSE_LAYER_DURATION - PULSE_OVERLAP);
  const localT = t - layerStart;
  if (localT < 0) return 0;
  if (localT < PULSE_RISE) return localT / PULSE_RISE;
  if (localT < PULSE_LAYER_DURATION) return 1 - ((localT - PULSE_RISE) / PULSE_FALL);
  return 0;
}

export default function NetworkViz({ brain, network: networkProp, inputValue, animTrigger }) {
  // Defensive: extract network from prop or brain
  const network = networkProp || brain?.network;
  const [waveLayer, setWaveLayer] = useState(-1);
  const waveRef = useRef(null);

  // Pulse animation state
  const pulseStartRef = useRef(null);
  const [animT, setAnimT] = useState(PULSE_TOTAL + 1); // start idle
  const [loopPulse, setLoopPulse] = useState(false); // controls background looping

  // Looping pulse: runs every second if not actively triggered
  useEffect(() => {
    if (loopPulse) return; // don't double-trigger
    const interval = setInterval(() => {
      setLoopPulse(true); // set flag to trigger below
    }, 1000);
    return () => clearInterval(interval);
  }, [loopPulse]);

  useEffect(() => {
    // On animTrigger, start the pulse
    pulseStartRef.current = performance.now();
    let raf;
    function tick() {
      const t = performance.now() - pulseStartRef.current;
      setAnimT(t);
      if (t < PULSE_TOTAL) {
        raf = requestAnimationFrame(tick);
      } else {
        setLoopPulse(false); // allow background loop to trigger again
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animTrigger, loopPulse]);

  // Defensive: always run all hooks, then conditionally render placeholder
  const isNetworkValid = network && network.layers;

  const { activations, weights } = useMemo(
    () => isNetworkValid ? getNetworkState(network, inputValue ?? [0,0,0]) : { activations: [], weights: [] },
    [network, inputValue, animTrigger, brain?.trainCount, isNetworkValid]
  );

  if (!isNetworkValid) {
    return <div style={{ width: "100%", height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: 15, opacity: 0.7 }}>No network assigned</div>;
  }

  // Optionally display training metadata from brain
  // Example: <div>Trained: {brain?.trainCount ?? 0} times</div>

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
        {/* Edges with pulse */}
        {weights.map((W, wi) => {
          const fromNodes = NODE_POS[wi];
          const toNodes   = NODE_POS[wi + 1];
          const maxW      = maxWeights[wi];
          const connectionPhase = layerPhase(animT, wi, DISPLAY_LAYERS.length);
          return W.map((row, toIdx) =>
            row.map((w, fromIdx) => {
              const x1 = safeNum(fromNodes[fromIdx]?.x);
              const y1 = safeNum(fromNodes[fromIdx]?.y);
              const x2 = safeNum(toNodes[toIdx]?.x);
              const y2 = safeNum(toNodes[toIdx]?.y);
              const weightMag = Math.abs(w) / (maxW + 1e-9);
              const weightSign = w > 0 ? 1 : -1;
              // Base connection
              const baseOpacity = weightMag * 0.4;
              // Pulse spot
              const spotT = connectionPhase; // 0 to 1
              const spotX = x1 + (x2 - x1) * spotT;
              const spotY = y1 + (y2 - y1) * spotT;
              const pulseColor = weightSign > 0 ? "rgba(255,255,240,0.9)" : "rgba(180,220,255,0.9)";
              // Make the connection pulse brightness also depend on the target neuron's activation (stronger for high-activation targets)
              const targetActivation = activations[wi + 1]?.[toIdx] ?? 0;
              const connectionPulseStrength = Math.abs(targetActivation) ** 1.7; // nonlinear scaling for more contrast
              return (
                <g key={`e-${wi}-${toIdx}-${fromIdx}`}> {/* Connection group */}
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#fff"
                    strokeWidth={weightMag * 1.5}
                    opacity={baseOpacity}
                  />
                  {/* Travelling pulse spot */}
                  {connectionPhase > 0.01 && connectionPulseStrength > 0.01 && (
                    <circle
                      cx={spotX} cy={spotY}
                      r={2 + weightMag * 2}
                      fill={pulseColor}
                      opacity={connectionPhase * weightMag * connectionPulseStrength * 0.7}
                      style={{ filter: "blur(1px)" }}
                    />
                  )}
                </g>
              );
            })
          );
        })}
        {/* Nodes with pulse */}
        {DISPLAY_LAYERS.map((n, li) =>
          Array.from({ length: n }, (_, ni) => {
            const pos = NODE_POS[li]?.[ni] || { x: 0, y: 0 };
            const x = safeNum(pos.x);
            const y = safeNum(pos.y);
            const act = activations[li]?.[ni] ?? 0;
            // Pulse phase for this layer
            const phase = layerPhase(animT, li, DISPLAY_LAYERS.length);
            // Base colour from activation
            let fill, glow;
            if (li === 0) {
              if (act === 1) {
                fill = COLORS[ni].hex;
                glow = COLORS[ni].glow;
              } else {
                fill = COLORS[ni].hex + '33';
                glow = COLORS[ni].glow + '22';
              }
            } else {
              ({ fill, glow } = nodeColor(act));
            }
            // Pulse overlay: white glow scaled by phase * activation
            // Make the difference between high and low activation pulses more pronounced
            const pulseOpacity = phase * Math.max(0.15, Math.abs(act) ** 1.7); // nonlinear scaling for more contrast
            const pulseRadius = NODE_R + phase * 4;
            // Output layer: color by class, opacity by probability, highlight winner
            if (li === DISPLAY_LAYERS.length - 1) {
              const probs = activations[li];
              const winner = probs.indexOf(Math.max(...probs));
              let { fill: outFill, opacity: outOpacity } = outputNodeColor(ni, probs);
              outOpacity = typeof outOpacity === "number" && isFinite(outOpacity) ? Math.max(0, Math.min(1, outOpacity)) : 0;
              // Winner burst effect
              const outputPhase = layerPhase(animT, li, DISPLAY_LAYERS.length);
              const burstPhase = Math.max(0, outputPhase - 0.7) / 0.3;
              return (
                <g key={`n-${li}-${ni}`}>  
                  {/* Confidence value above the output neuron, subtle and styled */}
                  <g>
                    <rect
                      x={x - 22}
                      y={y - NODE_R - 28}
                      width={44}
                      height={20}
                      rx={9}
                      fill="#101a2a"
                      opacity={0.82}
                    />
                    <text
                      x={x}
                      y={y - NODE_R - 14}
                      fill="#b6e3ff"
                      fontSize={13}
                      fontWeight={winner === ni ? 600 : 400}
                      textAnchor="middle"
                      fontFamily="DM Mono, monospace"
                      style={{ textShadow: "0 1px 2px #0008" }}
                    >
                      {(probs[ni] * 100).toFixed(1)}%
                    </text>
                  </g>
                  {/* Pulse overlay for output node */}
                  {phase > 0.01 && (
                    <circle
                      cx={x} cy={y}
                      r={pulseRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={1.5}
                      opacity={pulseOpacity}
                      style={{ filter: `blur(${phase * 2}px)` }}
                    />
                  )}
                  {/* Winner burst */}
                  {winner === ni && burstPhase > 0 && (
                    <circle
                      cx={x} cy={y}
                      r={NODE_R + 6 + burstPhase * 16}
                      fill="none"
                      stroke={outFill}
                      strokeWidth={1}
                      opacity={(1 - burstPhase) * 0.8}
                    />
                  )}
                  <circle
                    cx={x} cy={y}
                    r={NODE_R + 3}
                    fill={outFill}
                    opacity={outOpacity * 0.7 + 0.2}
                    style={{ filter: "blur(3px)" }}
                  />
                  <circle
                    cx={x} cy={y}
                    r={NODE_R}
                    fill={outFill}
                    opacity={outOpacity * 0.8 + 0.15}
                    stroke={winner === ni ? "#fff" : outFill}
                    strokeWidth={winner === ni ? 2.2 : 0.8}
                  />
                </g>
              );
            }
            // Hidden/input: color input neurons by their class color, dim if not active
            return (
              <g key={`n-${li}-${ni}`}>
                {/* Pulse overlay for hidden/input node */}
                {phase > 0.01 && (
                  <circle
                    cx={x} cy={y}
                    r={pulseRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={1.5}
                    opacity={pulseOpacity}
                    style={{ filter: `blur(${phase * 2}px)` }}
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
      </svg>
    </div>
  );
}
