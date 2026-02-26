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
  TW, TH, GROUND_Y, GRASS, PEBBLES, DUST
} from "./terrariumEngine";
import { NETWORK_CONFIG_T2 } from "./networkConfig";
import { TerrariumScene } from "./TerrariumScene";
import TrainingButtons from "./TrainingButtons";

export default function Terrarium2({
  network,
  config = NETWORK_CONFIG_T2,
  onIndicatorChange,
  onResourceCounters,
  onTrainingPanel,
  onUpgradesSidebar,
  onTrainCountChange // <-- add this prop
}) {
  const [upgradeLevels, setUpgradeLevels] = useState({});
  const gsRef = useRef(null);
  if (!gsRef.current) {
    gsRef.current = makeGS(network, upgradeLevels, UPGRADES, config);
  }
  const [snap, setSnap] = useState(() => snapshot(gsRef.current));

  useEffect(() => {
    const id = setInterval(() => {
      gameTick(gsRef.current, UPGRADES, config);
      setSnap(snapshot(gsRef.current));
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [config]);

  useEffect(() => {
    if (onIndicatorChange) onIndicatorChange(snap.indicator);
  }, [snap.indicator, onIndicatorChange]);

  useEffect(() => {
    if (onTrainCountChange) onTrainCountChange(snap.trainCount);
  }, [snap.trainCount, onTrainCountChange]);

  useEffect(() => {
    if (onTrainingPanel) {
      onTrainingPanel(
        <div style={{ width: "100%", maxWidth: 320, background: "#09090f", border: "1px solid #111120", borderRadius: 16, padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
          {/* Indicator */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ color: "#1c1c2e", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              wanted
            </span>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: snap.indicator.hex, "--glow": snap.indicator.glow, boxShadow: `0 0 16px ${snap.indicator.glow}`, animation: "indPulse 1.6s ease-in-out infinite" }} />
            <span style={{ color: snap.indicator.hex, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {snap.indicator.label}
            </span>
          </div>
          <span style={{ color: "#16162a", fontSize: 13, flexShrink: 0 }}>→</span>
          {/* Training buttons */}
          <TrainingButtons onClick={handleTrain} />
          {/* Stats */}
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {snap.lastLoss !== null && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ color: "#1c1c2c", fontSize: 8, letterSpacing: "0.1em" }}>LOSS</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: snap.lastLoss < 0.15 ? "#4ade80" : snap.lastLoss < 0.5 ? "#facc15" : "#f87171" }}>{snap.lastLoss.toFixed(3)}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "#18182a", fontSize: 8, letterSpacing: "0.1em" }}>TRAINED</span>
              <span style={{ color: "#555570", fontSize: 13 }}>{snap.trainCount}×</span>
            </div>
            {snap.lossHistory && snap.lossHistory.length >= 2 && (() => {
              const W = 80, H = 22;
              const mx = Math.max(...snap.lossHistory, 0.01);
              const pts = snap.lossHistory
                .map((v, i) => `${(i / (snap.lossHistory.length - 1)) * W},${H - (v / mx) * H}`)
                .join(" ");
              return (
                <svg width={W} height={H}>
                  <polyline points={pts} fill="none" stroke="#60a5fa" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" />
                </svg>
              );
            })()}
          </div>
        </div>
      );
    }
  }, [snap, onTrainingPanel]);

  function handleReset() {
    gsRef.current = makeGS(network, upgradeLevels, UPGRADES, config);
    setSnap(snapshot(gsRef.current));
  }

  function handleTrain(color) {
    const gs = gsRef.current;
    const inputVec = gs.indicator.oneHot;
    const targetVal = color.oneHot;
    let loss = 0;
    for (let i = 0; i < 1; i++) {
      loss = nnTrainStep(gs.network, inputVec, targetVal, 0.4);
    }
    gs.trainCount++;
    gs.lastLoss = loss;
    gs.lossHistory.push(loss);
    setSnap(snapshot(gs));
    // onTrainCountChange will be triggered by useEffect above
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
      background: "#060811",
      position: "relative",
      marginTop: 32
    }}>
      <TerrariumScene snap={snap} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 20, background: "radial-gradient(ellipse at 28% 12%, rgba(255,255,255,0.018) 0%, transparent 55%)" }} />
    </div>
  );
}

// TODO: Extract TerrariumScene and shared primitives for both terrariums.
// For now, import from Terrarium.jsx or duplicate as needed.
