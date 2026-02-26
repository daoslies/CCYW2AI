import { useEffect, useRef, useState } from "react";
import { COLORS } from "./colors";
import { makeNetwork, nnTrainStep } from "./nn";
import NetworkViz from "./NetworkViz";
import { UPGRADES } from "./upgrades";
import { 
  makeGS, 
  gameTick, 
  snapshot, 
  applyAllUpgrades, 
  TW, TH, GROUND_Y, GRASS, PEBBLES, DUST,
  getResourceRate
} from "./terrariumEngine";
import { NETWORK_CONFIG_T1 } from "./networkConfig";
import { TerrariumScene } from "./TerrariumScene";
import Resource from "./Resource";
import TrainingButtons from "./TrainingButtons";

export default function Terrarium({ 
  network, 
  config = NETWORK_CONFIG_T1, 
  onIndicatorChange, 
  onResourceCounters, 
  onTrainingPanel, 
  onUpgradesSidebar, 
  onUpgradeLevelsChange // <-- new prop
}) {
  // Upgrades state
  const [upgradeLevels, setUpgradeLevels] = useState({});
  // Game state lives in a ref
  const gsRef = useRef(null);
  if (!gsRef.current) {
    gsRef.current = makeGS(network, upgradeLevels, UPGRADES, config);
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
    const id = setInterval(() => {
      gameTick(gsRef.current, UPGRADES, config);
      setSnap(snapshot(gsRef.current));
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [config]);

  function handleReset() {
    gsRef.current = makeGS(network, upgradeLevels, UPGRADES, config);
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
  useEffect(() => {
    if (onUpgradesSidebar) {
      onUpgradesSidebar(
        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ color: "#b6e3ff", fontSize: 13, fontWeight: 600, margin: "24px 0 10px 0", letterSpacing: "0.08em" }}>Upgrades</h3>
          {UPGRADES.map(upg => {
            const lvl = upgradeLevels[upg.id] || 0;
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
                  marginBottom: 8,
                  padding: 8,
                  borderRadius: 8,
                  background: canAfford && !maxed ? "#142c1a" : "#101624",
                  boxShadow: canAfford && !maxed ? "0 0 0 2px #22c55e88, 0 1px 4px #0002" : "0 1px 4px #0002",
                  cursor: maxed ? "not-allowed" : "pointer",
                  opacity: maxed ? 0.6 : 1,
                  transition: "background 0.15s, box-shadow 0.15s, transform 0.08s",
                  border: canAfford && !maxed ? "2px solid #22c55e" : "2px solid transparent"
                }}
                onClick={() => !maxed && canAfford && handleUpgrade(upg.id)}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
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
                <div style={{ color: "#b6c2e0", fontSize: 11, margin: "4px 0 0" }}>
                  {upg.description}
                  {upg.id === "critBonus" && (
                    <>
                      <br />
                      <span style={{ color: "#ffe066", fontWeight: 600 }}>
                        Current crit chance: {((upgradeLevels["critBonus"] || 0) * 10).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
                <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 2 }}>Level: {lvl}{upg.maxLevel ? `/${upg.maxLevel}` : ""}</div>
              </div>
            );
          })}
        </div>
      );
    }
  }, [snap, upgradeLevels, onUpgradesSidebar]);

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
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: 540,
      borderRadius: 20,
      border: "2px solid rgba(140,200,255,0.13)",
      boxShadow: [
        "0 0 0 1px rgba(100,150,255,0.06)",
        "inset 0 0 30px rgba(0,20,60,0.4)",
        "inset 0 -10px 28px rgba(0,0,0,0.55)",
        "inset 2px 0 12px rgba(0,0,0,0.3)",
        "inset -2px 0 12px rgba(0,0,0,0.3)",
        "0 28px 80px rgba(0,0,0,0.75)"
      ].join(", "),
      overflow: "hidden",
      background: "#0a0c16", // slightly lighter than #09090f
      position: "relative",
      marginTop: 32,
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <TerrariumScene snap={snap} />
      {/* Glass edge radial vignette overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 20, background: "radial-gradient(ellipse at 28% 12%, rgba(255,255,255,0.018) 0%, transparent 55%)" }} />
    </div>
  );
}
