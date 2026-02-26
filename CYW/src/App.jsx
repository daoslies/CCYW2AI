import { useState, useEffect, useRef, useCallback } from "react";
import { makeNetwork, nnTrainStep, nnForward } from "./nn";
import { COLORS, decodeOutput } from "./colors";
import NetworkViz from "./NetworkViz";
import Terrarium from "./Terrarium";
import Terrarium2 from "./Terrarium2";
import { UPGRADES } from "./upgrades";

// ─────────────────────────────────────────────────────────────────────────────
// 8. The training loop in handlePress
// -----------------------------------------------------------------------------
// The key flow to keep in your head is: indicator shown → encoded as scalar → fed into network → output decoded back to colour → user presses a button → that becomes the target → 20 backprop steps run → weights update → predictions panel reflects the new state. Everything else is UI around that loop.

export default function App() {
  const networkRef = useRef(makeNetwork());
  const terrarium2NetworkRef = useRef(makeNetwork());
  const [indicator, setIndicator] = useState(COLORS[Math.floor(Math.random() * 3)]);
  const [terrariumIndicator, setTerrariumIndicator] = useState(COLORS[0]);
  const [terrarium2Indicator, setTerrarium2Indicator] = useState(COLORS[0]);
  const [trainCount, setTrainCount] = useState(0);
  const [terrarium2TrainCount, setTerrarium2TrainCount] = useState(0);
  const [lastLoss, setLastLoss] = useState(null);
  const [predictions, setPredictions] = useState(null);   // {red, green, blue} → predicted color
  const [lastPressed, setLastPressed] = useState(null);
  const [flash, setFlash] = useState(null);               // "correct" | "wrong"
  const [lossHistory, setLossHistory] = useState([]);
  const [view, setView] = useState("trainer");
  const [terrariumResourceCounters, setTerrariumResourceCounters] = useState(null);
  const [terrariumTrainingPanel, setTerrariumTrainingPanel] = useState(null);
  const [terrarium2TrainingPanel, setTerrarium2TrainingPanel] = useState(null);
  const [upgradesSidebar, setUpgradesSidebar] = useState(null);
  const [secondTerrariumUnlocked, setSecondTerrariumUnlocked] = useState(false);
  // Track upgrade levels from the main terrarium
  const [terrariumUpgradeLevels, setTerrariumUpgradeLevels] = useState({});
  // State for Terrarium2's training panel
  const [activeTerrarium, setActiveTerrarium] = useState(1); // 1 or 2

  const UI_ZOOM = 1.4; // must match index.css html { zoom }

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

  useEffect(() => {
    // If upgradesSidebar contains the unlock, check if it's been purchased
    // (This is a simple approach; you may want to persist this in localStorage)
    if (upgradesSidebar && upgradesSidebar.props) {
      // Find the upgrade level for 'secondTerrarium'
      const upg = upgradesSidebar.props.children?.find?.(u => u?.key === "secondTerrarium");
      if (upg && upg.props && upg.props.children) {
        // If maxed, unlock
        setSecondTerrariumUnlocked(true);
      }
    }
  }, [upgradesSidebar]);

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

  // --- Terrarium persistent mounting ---
  const [terrariumMounted] = useState(true); // always true, for clarity
  const terrariumRef = useRef();
  const terrarium2Ref = useRef();

  // --- Center column fixed container ---
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0c16", // slightly lighter than the side panels
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "center",
      fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
      padding: 0,
    }}>
      {/* Left: Network/training sidebar (fixed) */}
      <div style={{
        width: 340,
        minWidth: 240,
        maxWidth: 420,
        background: "#0a0e1a",
        borderRight: "1px solid #1a1e2a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        padding: "32px 0 0 0",
        maxHeight: `${100 / UI_ZOOM}vh`,
        overflowY: "auto"
      }}>
        <div style={{ width: "100%", maxWidth: 400, margin: "0 auto 18px auto" }}>
          {/* Show network viz for active terrarium only */}
          {view === "terrarium" && terrariumUpgradeLevels.secondTerrarium >= 1 && activeTerrarium === 2 ? (
            <NetworkViz
              network={terrarium2NetworkRef.current}
              inputValue={terrarium2Indicator.oneHot}
              animTrigger={terrarium2TrainCount}
              style={{ width: "100%", height: "auto", maxWidth: 400, aspectRatio: "1.06" }}
            />
          ) : (
            <NetworkViz
              network={networkRef.current}
              inputValue={view === "trainer" ? indicator.oneHot : terrariumIndicator.oneHot}
              animTrigger={trainCount}
              style={{ width: "100%", height: "auto", maxWidth: 400, aspectRatio: "1.06" }}
            />
          )}
        </div>
        {/* Resource counters for terrarium mode */}
        {terrariumResourceCounters}
      </div>

      {/* Center: Main content (fixed-size container) */}
      <div style={{
        position: "absolute",
        left: 340, // Offset for fixed left sidebar width
        right: 280, // Offset for fixed right sidebar width
        top: 0,
        bottom: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 0,
        height: `${100 / UI_ZOOM}vh`,
        maxHeight: `${100 / UI_ZOOM}vh`,
        minHeight: 0,
        boxSizing: "border-box",
        background: "#0a0c16", // slightly lighter than the side panels
        zIndex: 1
      }}>
        {/* Tab switch, always visible */}
        <div style={{ marginBottom: 24, marginTop: 8, display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("trainer")}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: view === "trainer" ? "2px solid #3b82f6" : "1px solid #222",
              background: view === "trainer" ? "#1e293b" : "#18181b",
              color: view === "trainer" ? "#60a5fa" : "#aaa",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Trainer
          </button>
          <button
            onClick={() => setView("terrarium")}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: view === "terrarium" ? "2px solid #22c55e" : "1px solid #222",
              background: view === "terrarium" ? "#052e16" : "#18181b",
              color: view === "terrarium" ? "#4ade80" : "#aaa",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Terrarium
          </button>
        </div>
        {/* Fixed content area below tab bar */}
        <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
          {/* Trainer view */}
          <div style={{ 
            display: view === "trainer" ? "flex" : "none", 
            width: "100%", 
            height: "100%",       // fill the available space
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "flex-start",  // was "center", now flex-start
            overflowY: "auto",             // scroll within this panel only
            overflowX: "hidden",
            paddingTop: 16,                // breathing room at top
            boxSizing: "border-box",
            minHeight: 0,                  // allow flexbox to shrink
            paddingBottom: 32              // extra breathing room at bottom
          }}>
            <div style={{ 
              width: "100%", 
              maxWidth: 540,
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              minHeight: "min-content",  // don't compress children
              paddingBottom: 24           // breathing room at bottom of scroll
            }}>
              {/* Header */}
              <div style={{ marginBottom: 32, textAlign: "center" }}>
                <p style={{ color: "#444", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>
                  categorical · nn · trainer
                </p>
                <h1 style={{ color: "#e2e2e2", fontSize: 22, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
                  Color Predictor
                </h1>
              </div>

              {/* Main card */}
              <div
                className={flash === "correct" ? "flash-correct" : flash === "wrong" ? "flash-wrong" : ""}
                style={{
                  background: "#111117",
                  border: "1px solid #1e1e28",
                  borderRadius: 20,
                  padding: "32px 28px 28px",
                  transition: "background 0.3s",
                  width: "100%",
                  maxWidth: 420,
                  margin: "0 auto"
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
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
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
          {/* Terrarium view (always mounted, only visible when active) */}
          <div style={{ display: view === "terrarium" ? "flex" : "none", width: "100%", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {/* Terrarium 1 clickable wrapper */}
              <div
                onClick={() => setActiveTerrarium(1)}
                style={{
                  cursor: "pointer",
                  outline: activeTerrarium === 1 ? "3px solid #3b82f6" : "none",
                  boxShadow: activeTerrarium === 1 ? "0 0 16px #3b82f6aa" : "none",
                  borderRadius: 24,
                  transition: "outline 0.2s, box-shadow 0.2s",
                  marginBottom: 24,
                  width: "100%"
                }}
              >
                <Terrarium
                  ref={terrariumRef}
                  network={networkRef.current}
                  onIndicatorChange={setTerrariumIndicator}
                  onResourceCounters={setTerrariumResourceCounters}
                  onTrainingPanel={setTerrariumTrainingPanel}
                  onUpgradesSidebar={setUpgradesSidebar}
                  onUpgradeLevelsChange={setTerrariumUpgradeLevels}
                />
                {/* Terrarium 1 training panel, only if active */}
                {activeTerrarium === 1 && terrariumTrainingPanel}
              </div>
              {/* Weather terrarium, unlocked by upgrade */}
              {terrariumUpgradeLevels.secondTerrarium >= 1 && (
                <>
                  <div
                    onClick={() => setActiveTerrarium(2)}
                    style={{
                      marginTop: 0,
                      width: "100%",
                      maxWidth: 540,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      outline: activeTerrarium === 2 ? "3px solid #38bdf8" : "none",
                      boxShadow: activeTerrarium === 2 ? "0 0 16px #38bdf8aa" : "none",
                      borderRadius: 24,
                      transition: "outline 0.2s, box-shadow 0.2s",
                      marginBottom: 24
                    }}
                  >
                    <Terrarium2
                      ref={terrarium2Ref}
                      network={terrarium2NetworkRef.current}
                      onIndicatorChange={setTerrarium2Indicator}
                      onTrainingPanel={setTerrarium2TrainingPanel}
                      onTrainCountChange={setTerrarium2TrainCount}
                    />
                    {/* Terrarium 2 training panel, only if active */}
                    {activeTerrarium === 2 && terrarium2TrainingPanel}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Upgrades sidebar (fixed) */}
      <div style={{
        width: 280,
        minWidth: 180,
        maxWidth: 340,
        background: "#0a0e1a",
        borderLeft: "1px solid #1a1e2a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        padding: "32px 0 0 0",
        maxHeight: `${100 / UI_ZOOM}vh`,
        overflowY: "auto"
      }}>
        {upgradesSidebar}
      </div>
    </div>
  );
}
