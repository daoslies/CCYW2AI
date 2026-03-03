import { useEffect, useRef, useState } from "react";
import { COLORS } from "../../data/colors.js";
import { makeNetwork, nnTrainStep } from "../../engine/nn";
import NetworkViz from "../shared/NetworkViz.jsx";
import { UPGRADES } from "../../data/upgrades.js";
import { 
  makeGS, 
  gameTick, 
  snapshot, 
  applyAllUpgrades, 
  TW, TH, GROUND_Y, GRASS, PEBBLES, DUST,
  getResourceRate
} from "../../engine/terrariumEngine";
import { NETWORK_CONFIG_T1 } from "../../data/networkConfig.js";
import { TerrariumScene } from "./TerrariumScene";
import Resource from "./Resource";
import TrainingButtons from "../shared/TrainingButtons.jsx";
import { useWorld } from "../../store/worldStore.jsx";
import { useDrag } from "../../store/dragStore.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import DropZone from "../dragdrop/DropZone.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import { useSelection } from "../../store/selectionStore";

export default function Terrarium({
  slot = "t1",
  config = NETWORK_CONFIG_T1,
  onIndicatorChange,
  onResourceCounters,
  onTrainingPanel,
  onUpgradesSidebar,
  onUpgradeLevelsChange,
  parentUpgradeLevels,
  onPurchaseHandler
}) {
  // UseWorld instead of useGibbets
  const { assignments, gibbets, brains, getNetwork, updateGibbetMeta, activeTrainerId, assignGibbet, unassignGibbet, simStates, updateSimState, setWeatherBrainUnlocked, unlockBodyType } = useWorld();
  // Defensive: assignments, gibbets, brains may be empty
  const gibbetIds = assignments?.[slot] || [];
  const gibbetEntriesRef = useRef([]);
  const prevSimStatesRef = useRef({});

  // Update entries ref every render — no effect dependency needed
  gibbetEntriesRef.current = gibbetIds
    .map(id => {
      const gibbet = gibbets.find(g => g.id === id);
      const brain = gibbet?.brainId != null ? brains.find(b => b.id === gibbet.brainId) : null;
      const network = brain ? getNetwork(brain.id) : null;
      return gibbet && brain && network ? { id: gibbet.id, brain, network } : null;
    })
    .filter(Boolean);

  // Upgrades state
  const [upgradeLevels, setUpgradeLevels] = useState({});
  // Use parentUpgradeLevels for upgrade panel counter if provided
  const effectiveUpgradeLevels = parentUpgradeLevels || upgradeLevels;
  // Game state lives in a ref
  const gsRef = useRef(null);
  if (!gsRef.current) {
    gsRef.current = makeGS(upgradeLevels, UPGRADES, config);
  }
  const [snap, setSnap] = useState(() => snapshot(gsRef.current));

  const { indicator, collections, correct, total, trainCount, lastLoss, lossHistory, now } = snap;
  const efficiency = total > 0 ? Math.round((correct / total) * 100) : null;
  const sparkline = lossHistory.length >= 2 ? (() => {
    const W = 80, H = 22;
    const mx = Math.max(...lossHistory, 0.01);
    const pts = lossHistory
      .map((v, i) => `${(i / (lossHistory.length - 1)) * W},${H - (v / mx) * H}`)
      .join(" ");
    return { W, H, pts };
  })() : null;

  // Notify parent of indicator change
  useEffect(() => {
    if (onIndicatorChange && typeof onIndicatorChange === "function") {
      onIndicatorChange(snap.indicator);
    }
  }, [snap.indicator, onIndicatorChange]);

  useEffect(() => {
    let frameId;
    let running = true;

    function tick() {
      if (!running) return;

      gameTick(
        gsRef.current,
        gibbetEntriesRef.current.map(e => ({ id: e.id, network: e.network })),
        UPGRADES,
        config
      );

      const snapNow = snapshot(gsRef.current);
      setSnap(snapNow);

      // Only push to worldStore when gibbet state actually changes
      snapNow.gibbets?.forEach(gs => {
        const prev = prevSimStatesRef.current[gs.id];
        if (!prev || prev.state !== gs.state || prev.poisonedUntil !== gs.poisonedUntil) {
          prevSimStatesRef.current[gs.id] = {
            state: gs.state,
            poisonedUntil: gs.poisonedUntil,
            // do not store 'now' here
          };
          updateSimState(gs.id, {
            state: gs.state,
            poisonedUntil: gs.poisonedUntil,
            now: snapNow.now, // consumers need current time, but we don't diff on it
          });
        }
      });

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  }, [config]); // Only restart on config change

  function handleReset() {
    gsRef.current = makeGS(upgradeLevels, UPGRADES, config);
    setSnap(snapshot(gsRef.current));
  }

  function handleTrain(color) {
    const gs = gsRef.current;
    // Use one-hot encoding for input and target
    const inputVec = gs.indicator.oneHot;
    const targetVal = color.oneHot;
    // Train several steps per click for faster convergence
    let loss = 0;
    for (let i = 0; i < 1; i++) {
      loss = nnTrainStep(gs.network, inputVec, targetVal, 0.4);
    }
    gs.trainCount++;
    gs.lastLoss = loss;
    gs.lossHistory.push(loss);
    // Optionally: flash feedback or update indicator
    // Removed: New random indicator (indicator should only change in gameTick)
    setSnap(snapshot(gs));
  }

  function handlePurchase(cost) {
    const gs = gsRef.current;
    for (const col of COLORS) {
      if ((cost[col.id] || 0) > (gs.collections[col.id] || 0)) return false; // can't afford
    }
    for (const col of COLORS) {
      gs.collections[col.id] -= (cost[col.id] || 0);
    }
    setSnap(snapshot(gs));
    return true;
  }

  useEffect(() => {
    if (onPurchaseHandler) onPurchaseHandler(handlePurchase);
  }, [onPurchaseHandler]);

  // Resource counters UI (for left sidebar)
  useEffect(() => {
    if (onResourceCounters) {
      const rates = gsRef.current ? getResourceRate(gsRef.current) : {};
      // Floating animation CSS
      const floatAnim = {
        animation: "floatIcon 2.2s ease-in-out infinite"
      };
      // Inject keyframes if not present
      if (!document.getElementById("floatIconKeyframes")) {
        const style = document.createElement("style");
        style.id = "floatIconKeyframes";
        style.innerHTML = `@keyframes floatIcon { 0% { transform: translateY(-1px); } 50% { transform: translateY(1px); } 100% { transform: translateY(-1px); } }`;
        document.head.appendChild(style);
      }
      onResourceCounters(
        <div style={{ width: "100%", maxWidth: 320, margin: "0 auto 18px auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {COLORS.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "flex-end", marginRight: 4 }}>
                <span style={{ display: "inline-block", ...floatAnim, animationDelay: `${i * 0.33}s` }}>
                  <svg width={44} height={44} viewBox="-22 -22 44 44" style={{ overflow: "visible", verticalAlign: "middle" }}>
                    <Resource r={{ colorId: c.id, x: 0, y: 0, state: "active" }} />
                  </svg>
                </span>
              </span>
              <span style={{ color: c.hex, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center" }}>{snap.collections[c.id]}</span>
              <span style={{ color: "#7dd3fc", fontSize: 12, fontWeight: 500, marginLeft: 4 }}>{rates[c.id] ? rates[c.id].toFixed(2) : "0.00"}/s</span>
            </div>
          ))}
        </div>
      );
    }
  }, [snap.collections, snap.now, onResourceCounters]);

  // Add centered float animation to document head if not present
  useEffect(() => {
    if (!document.getElementById("floatCenterKeyframes")) {
      const style = document.createElement("style");
      style.id = "floatCenterKeyframes";
      style.innerHTML = `@keyframes floatCenter { 0% { transform: translateY(-6px); } 50% { transform: translateY(6px); } 100% { transform: translateY(-6px); } }`;
      document.head.appendChild(style);
    }
  }, []);

  // Training panel UI (for below terrarium visualisation)
  useEffect(() => {
    if (onTrainingPanel) {
      onTrainingPanel(
        <div style={{ width: "100%", maxWidth: 320, background: "#09090f", border: "1px solid #111120", borderRadius: 16, padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 14, marginTop: 22, marginLeft: "auto", marginRight: "auto" }}>
          {/* Indicator */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ color: "#1c1c2e", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              wanted
            </span>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: indicator.hex, "--glow": indicator.glow, boxShadow: `0 0 16px ${indicator.glow}`, animation: "indPulse 1.6s ease-in-out infinite" }} />
            <span style={{ color: indicator.hex, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {indicator.label}
            </span>
          </div>
          <span style={{ color: "#16162a", fontSize: 13, flexShrink: 0 }}>→</span>
          {/* Training buttons */}
          <TrainingButtons onClick={handleTrain} />
          {/* Stats */}
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {lastLoss !== null && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ color: "#1c1c2c", fontSize: 8, letterSpacing: "0.1em" }}>LOSS</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: lastLoss < 0.15 ? "#4ade80" : lastLoss < 0.5 ? "#facc15" : "#f87171" }}>{lastLoss.toFixed(3)}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "#18182a", fontSize: 8, letterSpacing: "0.1em" }}>TRAINED</span>
              <span style={{ color: "#555570", fontSize: 13 }}>{trainCount}×</span>
            </div>
            {sparkline && (
              <svg width={sparkline.W} height={sparkline.H}>
                <polyline points={sparkline.pts} fill="none" stroke="#60a5fa" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" />
              </svg>
            )}
          </div>
        </div>
      );
    }
  }, [indicator, lastLoss, trainCount, onTrainingPanel]);

  // Upgrades sidebar UI (for right sidebar)
  const [expandedUpgradeId, setExpandedUpgradeId] = useState(null);
  useEffect(() => {
    if (onUpgradesSidebar) {
      onUpgradesSidebar(
        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{ color: "#b6e3ff", fontSize: 13, fontWeight: 600, margin: "24px 0 10px 0", letterSpacing: "0.08em" }}>Upgrades</h3>
          {UPGRADES.map(upg => {
            const lvl = effectiveUpgradeLevels[upg.id] || 0;
            const maxed = upg.maxLevel && lvl >= upg.maxLevel;
            const cost = typeof upg.cost === "function" ? upg.cost(lvl) : upg.cost;
            // Check affordability
            const gs = gsRef.current;
            let canAfford = true;
            for (const col of COLORS) {
              if ((cost[col.id] || 0) > (gs.collections[col.id] || 0)) {
                canAfford = false;
                break;
              }
            }
            return (
              <div key={upg.id}
                style={{
                  marginBottom: 2,
                  padding: 7,
                  borderRadius: 8,
                  background: canAfford && !maxed ? "#142c1a" : "#101624",
                  boxShadow: canAfford && !maxed ? "0 0 0 2px #22c55e88, 0 1px 4px #0002" : "0 1px 4px #0002",
                  cursor: maxed ? "not-allowed" : "pointer",
                  opacity: maxed ? 0.6 : 1,
                  transition: "background 0.15s, box-shadow 0.15s, transform 0.08s",
                  border: canAfford && !maxed ? "2px solid #22c55e" : "2px solid transparent",
                  overflow: 'hidden',
                  minHeight: 28,
                }}
                onClick={() => !maxed && canAfford && handleUpgrade(upg.id)}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; setExpandedUpgradeId(null); }}
                onMouseEnter={() => setExpandedUpgradeId(upg.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#e0eaff", fontSize: 12, fontWeight: 500 }}>{upg.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {COLORS.map(c => cost[c.id] > 0 && (
                      <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, boxShadow: `0 0 6px ${c.glow}`, border: "1px solid #222", marginRight: 2 }} />
                        <span style={{ color: c.hex, fontSize: 12, fontWeight: 600 }}>{cost[c.id]}</span>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Collapsible details */}
                <div style={{
                  maxHeight: expandedUpgradeId === upg.id ? 200 : 0,
                  opacity: expandedUpgradeId === upg.id ? 1 : 0,
                  transition: 'max-height 0.25s cubic-bezier(.4,2,.6,1), opacity 0.18s',
                  overflow: 'hidden',
                  pointerEvents: expandedUpgradeId === upg.id ? 'auto' : 'none',
                  marginTop: expandedUpgradeId === upg.id ? 4 : 0,
                }}>
                  <div style={{ color: "#b6c2e0", fontSize: 11 }}>
                    {upg.description}
                    {upg.id === "critBonus" && (
                      <>
                        <br />
                        <span style={{ color: "#ffe066", fontWeight: 600 }}>
                          Current crit chance: {((effectiveUpgradeLevels["critBonus"] || 0) * 10).toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                  <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 2 }}>Level: {lvl}{upg.maxLevel ? `/${upg.maxLevel}` : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  }, [snap, effectiveUpgradeLevels, onUpgradesSidebar, expandedUpgradeId]);

  // Notify parent of upgrade level changes
  useEffect(() => {
    if (onUpgradeLevelsChange) {
      onUpgradeLevelsChange(upgradeLevels);
    }
  }, [upgradeLevels, onUpgradeLevelsChange]);

  // Update handleUpgrade to use cost function
  function handleUpgrade(upgId) {
    const upg = UPGRADES.find(u => u.id === upgId);
    if (!upg) return;
    const lvl = upgradeLevels[upgId] || 0;
    if (upg.maxLevel && lvl >= upg.maxLevel) return;
    const cost = typeof upg.cost === "function" ? upg.cost(lvl) : upg.cost;
    // Check resource costs
    const gs = gsRef.current;
    let canAfford = true;
    for (const col of COLORS) {
      if ((cost[col.id] || 0) > (gs.collections[col.id] || 0)) {
        canAfford = false;
        break;
      }
    }
    if (!canAfford) return;
    // Deduct resources
    for (const col of COLORS) {
      gs.collections[col.id] -= (cost[col.id] || 0);
    }
    // Apply upgrade
    const newLevels = { ...upgradeLevels, [upgId]: lvl + 1 };
    setUpgradeLevels(newLevels);
    applyAllUpgrades(gs, newLevels, UPGRADES);
    setSnap(snapshot(gs));
    // After applying upgrades, update store unlocks
    if (upgId === "weatherBrain") {
      setWeatherBrainUnlocked(true); // worldStore setter
    }
    if (upgId === "unlockRedBody") {
      unlockBodyType("red-specialist");
    }
    if (upgId === "unlockGreenBody") {
      unlockBodyType("green-specialist");
    }
    if (upgId === "unlockBlueBody") {
      unlockBodyType("blue-specialist");
    }
    if (upgId === "unlockInverterBody") {
      unlockBodyType("inverter");
    }
  }

  // Bodies array and roster UI
  const [bodies, setBodies] = useState(() => [
    // Starter body template
    { id: 0, name: "Basic Body", template: "default", color: "#7dd3fc", createdAt: Date.now() }
  ]);

  // Add body function
  const addBody = (name, template = "default", color = "#7dd3fc") => {
    const id = bodies.length > 0 ? Math.max(...bodies.map(b => b.id)) + 1 : 0;
    const body = { id, name, template, color, createdAt: Date.now() };
    setBodies(prev => [...prev, body]);
    return id;
  };

  // Defensive: selectedGibbetId may not be defined, so default to null
  const selectedGibbetId = null; // TODO: wire up selection logic from context/store if needed

  // Defensive: always render container, even if no gibbets assigned
  const hasGibbets = gibbetEntriesRef.current.length > 0;

  // Use drag state to highlight dropzone when dragging a gibbet
  const { dragging } = useDrag();
  const isGibbetDragging = dragging && dragging.type === "gibbet";
  const draggingGibbetIds = isGibbetDragging ? [dragging.id] : [];

  // Move useSelection to the top level to ensure consistent hook order
  const { selected, select } = useSelection();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 540,
        borderRadius: 20,
        border: "none", // Remove selection border
        boxShadow: "none", // Remove selection boxShadow
        overflow: "hidden",
        background: "#0a0c16",
        position: "relative",
        marginTop: 32,
        marginLeft: "auto",
        marginRight: "auto",
        cursor: "default",
        transition: "border 0.18s, box-shadow 0.18s"
      }}
    >
      {/* Simulation layer — always renders, pointer events off */}
      {hasGibbets && (
        <TerrariumScene snap={snap} draggingIds={draggingGibbetIds} style={{ pointerEvents: "none" }} />
      )}

      {/* Transparent draggable hit areas — positioned over simulation gibbets */}
      {hasGibbets && gibbetEntriesRef.current.map(({ id }) => {
        const gibbet = gibbets.find(g => g.id === id);
        const gibbetSnap = snap.gibbets?.find(gs => gs.id === id);
        if (!gibbet || !gibbetSnap) return null;
        // Convert simulation coordinates to percentage positions within SVG viewport
        const leftPct = (gibbetSnap.x / 480) * 100;
        const topPct = (gibbetSnap.y / 270) * 100;
        const isDraggingThis = draggingGibbetIds.includes(id);
        // Selection logic (now from top-level hook)
        const isSelected = selected?.type === "gibbet" && selected?.id === id;
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 44,
              zIndex: 10,
              background: isSelected ? "transparent" : "transparent", // Remove grey circle for test
              border: "none", // Remove selection border
              borderRadius: "50%",
              opacity: isDraggingThis ? 0 : 1,
              pointerEvents: isDraggingThis ? "none" : "auto",
              boxShadow: "none", // Remove selection boxShadow
              cursor: "pointer"
            }}
            onClick={() => select("gibbet", id)}
          >
            <DraggableItem type="gibbet" id={id} payload={{ ...gibbet }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  cursor: "grab",
                  borderRadius: "50%",
                  transition: "box-shadow 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 0 2px rgba(125,211,252,0.3)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              />
              {isSelected && (
                <svg
                  width={44}
                  height={44}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    zIndex: 11,
                  }}
                >
                  <defs>
                    <mask id={`gibbet-orb-occlude-mask-${id}`}>
                      {/* White ellipse: visible area (gibbet body) */}
                      <ellipse cx={22} cy={22} rx={15} ry={14} fill="white" />
                    </mask>
                  </defs>
                  {/* Orbs behind (angle > π/2 or < -π/2) - masked */}
                  {[0, 1, 2].map(i => {
                    const angle = (now * 0.0018) + (i * (2 * Math.PI / 3));
                    if (Math.cos(angle) < 0) {
                      const ox = 22 + Math.cos(angle) * 20;
                      const oy = 22 + Math.sin(angle) * 10;
                      return (
                        <g key={"back-"+i} mask={`url(#gibbet-orb-occlude-mask-${id})`}>
                          <circle cx={ox} cy={oy} r={2.2} fill="#7dd3fc" opacity={0.7} style={{ filter: "blur(1px)" }} />
                          <circle cx={ox} cy={oy} r={1} fill="white" opacity={0.5} />
                        </g>
                      );
                    }
                    return null;
                  })}
                  {/* Orbs in front (angle between -π/2 and π/2) - unmasked */}
                  {[0, 1, 2].map(i => {
                    const angle = (now * 0.0018) + (i * (2 * Math.PI / 3));
                    if (Math.cos(angle) >= 0) {
                      const ox = 22 + Math.cos(angle) * 20;
                      const oy = 22 + Math.sin(angle) * 10;
                      return (
                        <g key={"front-"+i}>
                          <circle cx={ox} cy={oy} r={2.2} fill="#7dd3fc" opacity={0.7} style={{ filter: "blur(1px)" }} />
                          <circle cx={ox} cy={oy} r={1} fill="white" opacity={0.5} />
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              )}
            </DraggableItem>
          </div>
        );
      })}

      {/* No gibbets assigned message */}
      {!hasGibbets && (
        <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: 16, opacity: 0.7 }}>
          No gibbets assigned
        </div>
      )}

      <DropZone
        accepts={["gibbet"]}
        onDrop={item => {
          if (!gibbetIds.includes(item.id)) {
            assignGibbet(slot, item.id);
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: isGibbetDragging ? "auto" : "none",
          border: isGibbetDragging ? "3px solid #4ade80" : "3px solid transparent",
          background: isGibbetDragging ? "rgba(74,222,128,0.10)" : "none",
          borderRadius: 20,
          boxSizing: "border-box",
          transition: "border 0.12s, background 0.12s",
        }}
      />
      {/* Add a global DropZone for unassignment */}
      <DropZone
        accepts={["gibbet"]}
        onDrop={item => {
          // If gibbet is assigned to this terrarium, unassign it
          if (gibbetIds.includes(item.id)) {
            unassignGibbet(slot, item.id);
          }
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: isGibbetDragging ? "auto" : "none",
          background: "rgba(0,0,0,0.01)", // invisible but active
        }}
      />
      {/* Glass edge radial vignette overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 20, background: "radial-gradient(ellipse at 28% 12%, rgba(255,255,255,0.018) 0%, transparent 55%)" }} />
    </div>
  );
}
