import { useState, useEffect, useRef, useCallback } from "react";
import { makeNetwork, nnTrainStep, nnForward } from "./nn";
import { COLORS, decodeOutput } from "./colors";
import NetworkViz from "./NetworkViz";

// ─────────────────────────────────────────────────────────────────────────────
// 8. The training loop in handlePress
// -----------------------------------------------------------------------------
// The key flow to keep in your head is: indicator shown → encoded as scalar → fed into network → output decoded back to colour → user presses a button → that becomes the target → 20 backprop steps run → weights update → predictions panel reflects the new state. Everything else is UI around that loop.

export default function App() {
  const networkRef = useRef(makeNetwork());
  const [indicator, setIndicator] = useState(COLORS[Math.floor(Math.random() * 3)]);
  const [trainCount, setTrainCount] = useState(0);
  const [lastLoss, setLastLoss] = useState(null);
  const [predictions, setPredictions] = useState(null);   // {red, green, blue} → predicted color
  const [lastPressed, setLastPressed] = useState(null);
  const [flash, setFlash] = useState(null);               // "correct" | "wrong"
  const [lossHistory, setLossHistory] = useState([]);

  const updatePredictions = useCallback(() => {
    const preds = {};
    for (const c of COLORS) {
      // ML team: nnForward now takes one-hot input (categorical)
      const out = nnForward(networkRef.current, c.oneHot);
      preds[c.id] = decodeOutput(out); // decodeOutput uses argmax
    }
    setPredictions(preds);
  }, []);

  useEffect(() => { updatePredictions(); }, []);

  const handlePress = (pressedColor) => {
    const net = networkRef.current;
    // ML team: Use one-hot encoding as input and as target for cross-entropy
    const inputVec = indicator.oneHot;
    const targetVal = pressedColor.oneHot;

    const trainstepsPerDatapoint = 1;

    // Train several steps per click for faster convergence
    let loss = 0;
    for (let i = 0; i < trainstepsPerDatapoint; i++) {
      loss = nnTrainStep(net, inputVec, targetVal, 0.4);
    }

    const newCount = trainCount + 1;
    setTrainCount(newCount);
    setLastLoss(loss);
    setLastPressed(pressedColor);
    setLossHistory(h => [...h.slice(-39), loss]);
    updatePredictions();

    // Flash feedback
    setFlash(pressedColor.id === indicator.id ? "correct" : "wrong");
    setTimeout(() => setFlash(null), 600);

    // New random indicator
    setIndicator(COLORS[Math.floor(Math.random() * 3)]);
  };

  const handleReset = () => {
    networkRef.current = makeNetwork();
    setTrainCount(0);
    setLastLoss(null);
    setLastPressed(null);
    setLossHistory([]);
    setFlash(null);
    setIndicator(COLORS[Math.floor(Math.random() * 3)]);
    updatePredictions();
  };

  // Mini sparkline for loss history
  const sparkline = (() => {
    if (lossHistory.length < 2) return null;
    const W = 120, H = 32;
    const max = Math.max(...lossHistory, 0.01);
    const pts = lossHistory.map((v, i) => {
      const x = (i / (lossHistory.length - 1)) * W;
      const y = H - (v / max) * H;
      return `${x},${y}`;
    }).join(" ");
    return { pts, W, H };
  })();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;600&display=swap');

        * { box-sizing: border-box; }

        .color-btn {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
          position: relative;
          outline: none;
        }
        .color-btn:hover {
          transform: scale(1.08);
        }
        .color-btn:active {
          transform: scale(0.94);
        }

        .indicator-pulse {
          animation: pulseRing 1.4s ease-in-out infinite;
        }

        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0px var(--glow); }
          60%  { box-shadow: 0 0 0 14px transparent; }
          100% { box-shadow: 0 0 0 0px transparent; }
        }

        .flash-correct { animation: flashGreen 0.5s ease; }
        .flash-wrong   { animation: flashRed   0.5s ease; }
        @keyframes flashGreen {
          0%  { background: rgba(34,197,94,0.15); }
          100%{ background: transparent; }
        }
        @keyframes flashRed {
          0%  { background: rgba(239,68,68,0.15); }
          100%{ background: transparent; }
        }

        .pred-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .reset-btn {
          background: none;
          border: 1px solid #333;
          color: #666;
          font-family: inherit;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          letter-spacing: 0.08em;
        }
        .reset-btn:hover { border-color: #666; color: #aaa; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <p style={{ color: "#444", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>
            categorical · nn · trainer
          </p>
          <h1 style={{ color: "#e2e2e2", fontSize: 22, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
            Color Predictor
          </h1>
        </div>

        {/* Network visualisation */}
        <NetworkViz network={networkRef.current} inputValue={indicator.oneHot} animTrigger={trainCount} />

        {/* Main card */}
        <div
          className={flash === "correct" ? "flash-correct" : flash === "wrong" ? "flash-wrong" : ""}
          style={{
            background: "#111117",
            border: "1px solid #1e1e28",
            borderRadius: 20,
            padding: "32px 28px 28px",
            transition: "background 0.3s",
          }}
        >

          {/* Indicator */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ color: "#555", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 16px" }}>
              press this
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <div
                className="indicator-pulse"
                style={{
                  "--glow": indicator.glow,
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: indicator.hex,
                  boxShadow: `0 0 24px ${indicator.glow}, 0 0 48px ${indicator.glow}40`,
                }}
              />
            </div>
            <p style={{ color: indicator.hex, fontSize: 13, letterSpacing: "0.12em", margin: "12px 0 0", textTransform: "uppercase", fontWeight: 500 }}>
              {indicator.label}
            </p>
          </div>

          {/* Color buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 32 }}>
            {COLORS.map(color => (
              <button
                key={color.id}
                className="color-btn"
                onClick={() => handlePress(color)}
                style={{
                  background: color.hex,
                  boxShadow: `0 4px 20px ${color.glow}`,
                }}
                aria-label={color.label}
              />
            ))}
          </div>

          {/* Color labels */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 28 }}>
            {COLORS.map(color => (
              <span key={color.id} style={{ width: 88, textAlign: "center", color: "#444", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {color.label}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #1a1a22", marginBottom: 20 }} />

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>

            {/* Left: training stats */}
            <div style={{ flex: 1 }}>
              <p style={{ color: "#444", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>Training</p>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <p style={{ color: "#666", fontSize: 10, margin: "0 0 2px", letterSpacing: "0.1em" }}>STEPS</p>
                  <p style={{ color: "#e2e2e2", fontSize: 20, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>{trainCount}</p>
                </div>
                {lastLoss !== null && (
                  <div>
                    <p style={{ color: "#666", fontSize: 10, margin: "0 0 2px", letterSpacing: "0.1em" }}>LOSS</p>
                    <p style={{ color: lastLoss < 0.01 ? "#22c55e" : lastLoss < 0.1 ? "#eab308" : "#ef4444", fontSize: 20, fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>
                      {lastLoss.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              {/* Sparkline */}
              {sparkline && (
                <div style={{ marginTop: 10 }}>
                  <svg width={sparkline.W} height={sparkline.H} style={{ overflow: "visible" }}>
                    <polyline
                      points={sparkline.pts}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Right: predictions */}
            {predictions && (
              <div style={{ flex: 1 }}>
                <p style={{ color: "#444", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>NN Predicts</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {COLORS.map(c => {
                    const pred = predictions[c.id];
                    const isRight = pred.id === c.id;
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="pred-dot" style={{ background: c.hex }} />
                        <span style={{ color: "#555", fontSize: 11, width: 42 }}>{c.label}</span>
                        <span style={{ color: "#333", fontSize: 11 }}>→</span>
                        <span className="pred-dot" style={{ background: pred.hex }} />
                        <span style={{ color: isRight ? "#22c55e" : "#666", fontSize: 11 }}>
                          {pred.label}
                          {isRight && <span style={{ marginLeft: 4, opacity: 0.6 }}>✓</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#333", fontSize: 10, letterSpacing: "0.1em", margin: 0 }}>
            {trainCount === 0
              ? "press any coloured button"
              : lastPressed
                ? `last pressed · ${lastPressed.label.toLowerCase()}`
                : ""}
          </p>
          <button className="reset-btn" onClick={handleReset}>RESET</button>
        </div>

      </div>
    </div>
  );
}
