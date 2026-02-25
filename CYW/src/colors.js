// src/colors.js
// Color constants and helpers for the color predictor app
//
// ML team: Each color now includes a one-hot encoding for multiclass targets.
//          This is used as the target for cross-entropy loss in nn.js.

export const COLORS = [
  { id: "red",   label: "Red",   value: 0.0, hex: "#ef4444", glow: "#ef444488", ring: "#fca5a5", oneHot: [1,0,0] },
  { id: "green", label: "Green", value: 0.5, hex: "#22c55e", glow: "#22c55e88", ring: "#86efac", oneHot: [0,1,0] },
  { id: "blue",  label: "Blue",  value: 1.0, hex: "#3b82f6", glow: "#3b82f688", ring: "#93c5fd", oneHot: [0,0,1] },
];

// Map a probability vector (softmax output) to the predicted color by argmax.
// ML team: This is the standard way to decode multiclass predictions.
export function decodeOutput(probVec) {
  const idx = probVec.indexOf(Math.max(...probVec));
  return COLORS[idx];
}
