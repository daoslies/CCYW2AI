import { useState, useEffect, useRef, useCallback } from "react";
import { makeNetwork, nnTrainStep, nnForward } from "../engine/nn";
import { COLORS, decodeOutput } from "../data/colors";
import NetworkViz from "./NetworkViz";
import Terrarium from "./Terrarium";
import { UPGRADES } from "../data/upgrades";
import { QUOTES } from "../data/quotes";
import { useWorld } from "../store/worldStore.jsx";
import GibbetRoster from "./GibbetRoster.jsx";
import Gibbet from "./Gibbet.jsx";
import { NETWORK_CONFIG_T1, NETWORK_CONFIG_T2 } from "../data/networkConfig.js";
import BrainsRoster from "./BrainsRoster.jsx";
import BodiesRoster from "./BodiesRoster";
import DropZone from "./DropZone.jsx";
import DragLayer from "./DragLayer.jsx";
import { DragProvider } from "../store/dragStore.jsx";

// CombinePanel: always visible for testing
function CombinePanel({
  draggingBrain,
  draggingBody,
  combineBrain,
  combineBody,
  onDropBrain,
  onDropBody,
  onCombine,
  onCancel,
  isActive
}) {
  // Visual feedback: highlight slot if dragging
  const brainSlotGlow = draggingBrain ? "0 0 16px #7dd3fc, 0 0 32px #7dd3fc80" : "none";
  const bodySlotGlow = draggingBody ? "0 0 16px #4ade80, 0 0 32px #4ade8080" : "none";

  return (
    <div style={{
      position: "fixed",
      right: 340,
      top: 0,
      width: 340,
      height: "100vh",
      background: "#181a22",
      boxShadow: "-4px 0 24px #0006",
      borderLeft: "1px solid #1a1e2a",
      zIndex: 30,
      transition: "right 0.32s cubic-bezier(.7,.2,.2,1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "auto"
    }}>
      <div style={{ width: "100%", maxWidth: 320, background: "#09090f", border: "1px solid #111120", borderRadius: 16, padding: "24px 18px 18px", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ color: "#7dd3fc", fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Combine Panel</div>
        <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>
          Debug: draggingBrain={draggingBrain ? draggingBrain.name : "null"}, draggingBody={draggingBody ? draggingBody.name : "null"}, combineBrain={combineBrain ? combineBrain.name : "null"}, combineBody={combineBody ? combineBody.name : "null"}
        </div>
        <DropZone
          accepts={["brain"]}
          type="brain"
          id="combine-brain-slot"
          onDrop={onDropBrain}
          className="combine-dropzone brain-slot"
          tooltip="Drop a brain here to combine"
          isCompatible={!!draggingBrain}
          style={{ boxShadow: brainSlotGlow, border: draggingBrain ? "2px solid #7dd3fc" : "1px solid #222" }}
        >
          {combineBrain ? (
            <div style={{ color: "#b6e3ff", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Brain: {combineBrain.name || `Brain #${combineBrain.id}`}</div>
          ) : (
            <div style={{ color: draggingBrain ? "#7dd3fc" : "#aaa", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
              {draggingBrain ? "Drop to assign" : "No brain assigned"}
            </div>
          )}
        </DropZone>
        <DropZone
          accepts={["body"]}
          type="body"
          id="combine-body-slot"
          onDrop={onDropBody}
          className="combine-dropzone body-slot"
          tooltip="Drop a body here to combine"
          isCompatible={!!draggingBody}
          style={{ boxShadow: bodySlotGlow, border: draggingBody ? "2px solid #4ade80" : "1px solid #222" }}
        >
          {combineBody ? (
            <div style={{ color: "#b6e3ff", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Body: {combineBody.name || `Body #${combineBody.id}`}</div>
          ) : (
            <div style={{ color: draggingBody ? "#4ade80" : "#aaa", fontWeight: 500, fontSize: 15, marginBottom: 8 }}>
              {draggingBody ? "Drop to assign" : "No body assigned"}
            </div>
          )}
        </DropZone>
        <button
          style={{ background: "#222", color: "#7dd3fc", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 18, opacity: combineBrain && combineBody ? 1 : 0.5 }}
          disabled={!combineBrain || !combineBody}
          onClick={() => combineBrain && combineBody && onCombine(combineBrain, combineBody)}
        >
          Combine to Create Gibbet
        </button>
        <button style={{ marginTop: 12, background: "#222", color: "#aaa", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 14, cursor: "pointer" }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function safeNum(val, fallback = 0) {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

function GibbetBioPanel() {
  const { gibbets, brains, bodies, activeTrainerId } = useWorld();
  // Find the gibbet assigned to the trainer's brain
  const trainerGibbet = gibbets.find(g => g.brainId === activeTrainerId);
  if (!trainerGibbet) return null;
  return (
    <div style={{
      background: "#181a22",
      borderRadius: 12,
      padding: "16px 12px",
      margin: "0 0 18px 0",
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      gap: 16,
      minHeight: 80,
    }}>
      {/* Gibbet SVG avatar */}
      <svg width={56} height={56} viewBox="-20 -10 40 40" style={{ borderRadius: "50%", background: "#222", border: "2px solid #333" }}>
        {/* TODO: pass body/brain info to Gibbet */}
        {/* <Gibbet ... /> */}
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#7dd3fc", fontWeight: 600, fontSize: 16 }}>{trainerGibbet.name}</div>
        <div style={{ color: "#aaa", fontSize: 13, marginTop: 2, whiteSpace: "pre-line" }}>{trainerGibbet.bio}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. The training loop in handlePress
// -----------------------------------------------------------------------------
// The key flow to keep in your head is: indicator shown → encoded as scalar → fed into network → output decoded back to colour → user presses a button → that becomes the target → 20 backprop steps run → weights update → predictions panel reflects the new state. Everything else is UI around that loop.

// EntityPicker: inline selector for brains/bodies
function EntityPicker({ label, items, selectedId, onSelect, renderItem }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", maxHeight: 120, overflowX: "auto" }}>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            border: selectedId === item.id ? "2px solid #3b82f6" : "1px solid #222",
            background: selectedId === item.id ? "#181a22" : "#10101a",
            color: selectedId === item.id ? "#7dd3fc" : "#aaa",
            borderRadius: 10,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 500,
            minWidth: 60,
            boxShadow: selectedId === item.id ? "0 0 8px #3b82f6aa" : "none",
            marginRight: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const {
    brains,
    bodies,
    gibbets,
    assignments,
    activeTrainerId,
    getNetwork,
    updateBrainMeta,
    combineGibbet,
    dissolveGibbet,
    assignGibbet,
    unassignGibbet,
    setActiveTrainerId,
    usedBrainIds,
    usedBodyIds,
  } = useWorld();

  // Get assigned gibbet IDs (now arrays)
  const trainerGibbetId = activeTrainerId;
  const terrarium1GibbetIds = assignments.t1 || [];
  const terrarium2GibbetIds = assignments.t2 || [];

  // Get gibbet objects
  const trainerGibbet = gibbets.find(g => g.brainId === activeTrainerId);
  // For terrariums, get all assigned gibbets
  const terrarium1Gibbets = gibbets.filter(g => terrarium1GibbetIds.includes(g.id));
  const terrarium2Gibbets = gibbets.filter(g => terrarium2GibbetIds.includes(g.id));

  // Get brain object
  const trainerBrain = brains.find(b => b.id === activeTrainerId);

  // Use brain meta for trainCount, lossHistory, etc.
  const trainCount = trainerBrain?.trainCount || 0;
  const lossHistory = trainerBrain?.lossHistory || [];

  // Get networks
  const trainerNetwork = getNetwork(activeTrainerId);
  // For terrariums, get all assigned networks
  const terrarium1Networks = terrarium1Gibbets.map(g => getNetwork(g.brainId));
  const terrarium2Networks = terrarium2Gibbets.map(g => getNetwork(g.brainId));

  const [indicator, setIndicator] = useState(COLORS[Math.floor(Math.random() * 3)]);
  const [terrariumIndicator, setTerrariumIndicator] = useState(COLORS[0]);
  const [terrarium2Indicator, setTerrarium2Indicator] = useState(COLORS[0]);
  const [lastLoss, setLastLoss] = useState(null);
  const [predictions, setPredictions] = useState(null);   // {red, green, blue} → predicted color
  const [lastPressed, setLastPressed] = useState(null);
  const [flash, setFlash] = useState(null);               // "correct" | "wrong"
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

  // Add quote state for terrarium view
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [activeQuoteLineIdx, setActiveQuoteLineIdx] = useState(0);
  const [quoteLineTimer, setQuoteLineTimer] = useState(null);

  // Add state for drag and combine panel
  const [draggingBrain, setDraggingBrain] = useState(null);
  const [draggingBody, setDraggingBody] = useState(null);
  const [combinePanelLocked, setCombinePanelLocked] = useState(false);
  // New: state for dropped items
  const [combineBrain, setCombineBrain] = useState(null);
  const [combineBody, setCombineBody] = useState(null);

  // Handler for drag start (from roster)
  const handleBrainDragStart = (brain) => {
    setDraggingBrain(brain);
  };
  const handleBodyDragStart = (body) => {
    setDraggingBody(body);
  };

  // Handler for drop into combine panel slots
  const handleDropBrain = (item) => {
    setCombineBrain(item);
    setDraggingBrain(null);
  };
  const handleDropBody = (item) => {
    setCombineBody(item);
    setDraggingBody(null);
  };

  // Handler for combine action
  const handleCombine = (brain, body) => {
    combineGibbet(brain.id, body.id, `Gibbet ${gibbets.length + 1}`);
    setCombineBrain(null);
    setCombineBody(null);
    setDraggingBrain(null);
    setDraggingBody(null);
    setCombinePanelLocked(false);
  };

  // Handler for cancel
  const handleCombineCancel = () => {
    setCombineBrain(null);
    setCombineBody(null);
    setDraggingBrain(null);
    setDraggingBody(null);
    setCombinePanelLocked(false);
  };

  // Add a dummy state to force re-render after training
  const [networkUpdateTick, setNetworkUpdateTick] = useState(0);

  // Rotate quote lines every 10 seconds
  useEffect(() => {
    if (view !== "terrarium") return;
    if (quoteLineTimer) clearTimeout(quoteLineTimer);
    const lines = QUOTES[activeQuoteIdx].text.split("\n");
    const timer = setTimeout(() => {
      if (activeQuoteLineIdx < lines.length - 1) {
        setActiveQuoteLineIdx(idx => idx + 1);
      } else {
        // Move to next quote and reset line
        setActiveQuoteIdx(idx => (idx + 1) % QUOTES.length);
        setActiveQuoteLineIdx(0);
      }
    }, 10000); // 10 seconds
    setQuoteLineTimer(timer);
    return () => clearTimeout(timer);
  }, [view, activeQuoteIdx, activeQuoteLineIdx]);

  // Reset line index when quote changes
  useEffect(() => {
    setActiveQuoteLineIdx(0);
  }, [activeQuoteIdx]);

  // Remove auto-assignment of gibbet to t2 on unlock
  // useEffect(() => {
  //   if (terrariumUpgradeLevels.secondTerrarium >= 1) {
  //     ensureTerrariumAssignment("t2");
  //   }
  // }, [terrariumUpgradeLevels.secondTerrarium, ensureTerrariumAssignment]);

  const UI_ZOOM = 1.4; // must match index.css html { zoom }

  const updatePredictions = useCallback(() => {
    if (!trainerNetwork) {
      setPredictions(null);
      return;
    }
    const preds = {};
    for (const c of COLORS) {
      const out = nnForward(trainerNetwork, c.oneHot);
      preds[c.id] = decodeOutput(out); // decodeOutput uses argmax
    }
    setPredictions(preds);
  }, [trainerNetwork]);

  useEffect(() => { updatePredictions(); }, []);

  // Update predictions and reset UI when trainerNetwork, trainerBrain, or view changes
  useEffect(() => {
    updatePredictions();
    setLastLoss(null);
    setLastPressed(null);
    setFlash(null);
  }, [trainerNetwork, trainerBrain, view]);

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

  // Merge upgrade levels from any terrarium
  const handleTerrariumUpgradeLevelsChange = useCallback((levels) => {
    setTerrariumUpgradeLevels(prev => {
      // Always use the highest value for each upgrade
      const merged = { ...prev };
      for (const key in levels) {
        merged[key] = Math.max(levels[key] || 0, prev[key] || 0);
      }
      return merged;
    });
  }, []);

  const handlePress = (pressedColor) => {
    if (!trainerBrain) return; // Defensive: prevent null error
    const net = trainerNetwork;
    const inputVec = indicator.oneHot;
    const targetVal = pressedColor.oneHot;

    const trainstepsPerDatapoint = 1;

    // Train several steps per click for faster convergence
    let loss = 0;
    for (let i = 0; i < trainstepsPerDatapoint; i++) {
      loss = nnTrainStep(net, inputVec, targetVal, 0.4);
    }

    updateBrainMeta(trainerBrain.id, {
      trainCount: trainCount + 1,
      lossHistory: [...lossHistory.slice(-39), loss],
    });

    setLastLoss(loss);
    setLastPressed(pressedColor);
    updatePredictions();
    setNetworkUpdateTick(tick => tick + 1); // force re-render

    // Flash feedback
    setFlash(pressedColor.id === indicator.id ? "correct" : "wrong");
    setTimeout(() => setFlash(null), 600);

    // New random indicator
    setIndicator(COLORS[Math.floor(Math.random() * 3)]);
  };

  const handleReset = () => {
    dissolveGibbet(trainerGibbetId);
    setLastLoss(null);
    setLastPressed(null);
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

  const [rightTab, setRightTab] = useState("upgrades"); // "upgrades" or "gibbets"

  // --- Center column fixed container ---
  return (
    <DragProvider>
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
          <GibbetBioPanel />
          <div style={{ width: "100%", maxWidth: 400, margin: "0 auto 18px auto" }}>
            {trainerBrain && (
              <NetworkViz
                brain={trainerBrain}
                network={trainerNetwork}
                inputValue={view === "trainer" ? indicator.oneHot : terrariumIndicator.oneHot}
                animTrigger={networkUpdateTick}
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
          {/* Tab switch, always visible, fixed at top */}
          <div style={{
            position: "fixed",
            left: 340,
            right: 280,
            top: 0,
            zIndex: 20,
            background: "#0a0c16",
            padding: "0px 0 0px 0", // Increased top padding for trainer view
            display: "flex",
            gap: 8,
            justifyContent: "center",
            boxShadow: "0 2px 12px #0004"
          }}>
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
          {/* Spacer for fixed tab bar height */}
          <div style={{ height: 66 }} />
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
              paddingTop: 40,                // breathing room at top
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
                    Gibbet brain X · Psionic training
                    <br />
                    <span style={{ color: '#7dd3fc', fontWeight: 500 }}>
                      {(() => {
                        // Check how many color matches the model gets right
                        let nCorrect = 0;
                        if (predictions) {
                          nCorrect = ["red", "green", "blue"].reduce((acc, id) => {
                            const pred = predictions[id];
                            return acc + (pred && pred.id === id ? 1 : 0);
                          }, 0);
                        }
                        if (nCorrect === 3) return "Model training successful – Ready for Release!";
                        if (nCorrect === 2) {
                          if (trainCount < 10) return "Model is nearly there! Just a bit more training.";
                          if (trainCount < 20) return "Model is showing strong recognition. Almost perfect!";
                          if (trainCount < 40) return "Model is close, but something feels uncertain. Keep going—success is within reach.";
                          return "Model hesitates at the threshold of mastery. Hope lingers—one last push might do it.";
                        }
                        if (nCorrect === 1) {
                          if (trainCount < 10) return "Model is picking up on one color. Keep going!";
                          if (trainCount < 20) return "Model recognises only one color. More training needed.";
                          if (trainCount < 40) return "Model seems stuck, struggling to break through. Progress feels distant. \n It may be worth SCRAMBLING this one's brains to start fresh. \n Sometimes they become locked in their ways and there's just no reasoning with them.";
                          return "Model is lost in confusion. Perhaps a fresh start is needed.";
                        }
                        if (trainCount === 0) return "Model ready to commence training";
                        if (trainCount > 0 && trainCount < 5) return "Model warming up...";
                        if (trainCount >= 5 && trainCount < 10) return "Model showing initial progress";
                        return null;
                      })()}
                    </span>
                  </p>
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
                  <button className="reset-btn" onClick={handleReset}>SCRAMBLE</button>
                </div>

              </div>
            </div>
            {/* Terrarium view (always mounted, only visible when active) */}
            <div style={{ display: view === "terrarium" ? "flex" : "none", width: "100%", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {/* Quote display at top of terrarium panel */}
                <div style={{
                  marginBottom: 28,
                  marginTop: 5,
                  textAlign: "center",
                }}>
                  <p style={{
                    color: "#444",
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: "0 0 4px 0",
                    lineHeight: 1.5,
                    whiteSpace: "pre-line",
                    maxWidth: 420,
                  }}>
                    {QUOTES[activeQuoteIdx].text.split("\n")[activeQuoteLineIdx]}
                  </p>
                  <p style={{
                    color: "#7dd3fc",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    margin: 0,
                    textTransform: "uppercase",
                  }}>
                    {QUOTES[activeQuoteIdx].author}
                  </p>
                </div>
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
                    slot="t1"
                    config={NETWORK_CONFIG_T1}
                    onIndicatorChange={setTerrariumIndicator}
                    onResourceCounters={setTerrariumResourceCounters}
                    onTrainingPanel={setTerrariumTrainingPanel}
                    onUpgradesSidebar={setUpgradesSidebar}
                    onUpgradeLevelsChange={handleTerrariumUpgradeLevelsChange}
                    parentUpgradeLevels={terrariumUpgradeLevels}
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
                      <Terrarium
                        slot="t2"
                        config={NETWORK_CONFIG_T2}
                        onIndicatorChange={setTerrarium2Indicator}
                        onResourceCounters={setTerrariumResourceCounters}
                        onTrainingPanel={setTerrarium2TrainingPanel}
                        onUpgradesSidebar={setUpgradesSidebar}
                        onUpgradeLevelsChange={handleTerrariumUpgradeLevelsChange}
                        parentUpgradeLevels={terrariumUpgradeLevels}
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

        {/* Right: Upgrades/Gibbet Roster sidebar (fixed) */}
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
          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 0, width: "100%", marginBottom: 18 }}>
            <button
              onClick={() => setRightTab("upgrades")}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderBottom: rightTab === "upgrades" ? "3px solid #60a5fa" : "1px solid #222",
                background: rightTab === "upgrades" ? "#181a22" : "#10101a",
                color: rightTab === "upgrades" ? "#60a5fa" : "#aaa",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 0
              }}
            >
              Upgrades
            </button>
            <button
              onClick={() => setRightTab("gibbets")}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderBottom: rightTab === "gibbets" ? "3px solid #4ade80" : "1px solid #222",
                background: rightTab === "gibbets" ? "#181a22" : "#10101a",
                color: rightTab === "gibbets" ? "#4ade80" : "#aaa",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 12
              }}
            >
              Grow Gibbets
            </button>
          </div>
          {/* Tab content */}
          <div style={{ width: "100%" }}>
            {rightTab === "upgrades" && (
              <div style={{ padding: "0 20px 32px 20px" }}>
                {upgradesSidebar}
              </div>
            )}

            {rightTab === "gibbets" && (
              <div style={{ padding: "0 12px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
                <BrainsRoster onDragStart={setDraggingBrain} />
                <BodiesRoster onDragStart={setDraggingBody} />
                <GibbetRoster />
              </div>
            )}
          </div>
        </div>

        {/* CombinePanel outside sidebar, fixed right */}
        <CombinePanel
          draggingBrain={draggingBrain}
          draggingBody={draggingBody}
          combineBrain={combineBrain}
          combineBody={combineBody}
          onDropBrain={handleDropBrain}
          onDropBody={handleDropBody}
          onCombine={handleCombine}
          onCancel={handleCombineCancel}
          isActive={!!draggingBrain || !!draggingBody || combinePanelLocked}
        />
        {/* DragLayer overlays everything, renders the in-hand item */}
        <DragLayer renderItem={({ type, payload }) => {
          // Render only the icon/image for each type
          if (type === "brain") return (
            <span role="img" aria-label="brain" style={{ fontSize: 28, filter: "drop-shadow(0 4px 12px #7dd3fc88)" }}>🧠</span>
          );
          if (type === "body") return (
            <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #a78bfa88)" }}>
              <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={payload.color} />
            </svg>
          );
          if (type === "gibbet") return (
            <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #4ade8088)" }}>
              <Gibbet x={16} y={16} angle={0} state={"idle"} poisoned={false} gainPopups={[]} showEyes={true} color={payload.color} />
            </svg>
          );
          return null;
        }} />
      </div>
    </DragProvider>
  );
}
