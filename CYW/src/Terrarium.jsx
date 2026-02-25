import { useEffect, useRef, useState } from "react";
import { COLORS } from "./colors";
import { makeNetwork, nnForward, nnTrainStep } from "./nn";
import NetworkViz from "./NetworkViz";
import { UPGRADES } from "./upgrades";

// Terrarium constants (copied from idle.text)
const TW = 480, TH = 270;
const GROUND_Y = 205;
const CREATURE_SPEED = 88;
const NN_TICK_MS = 1600;
const INDICATOR_MS = 3000;
const COLLECT_DIST = 26;
const FPS = 30;

const ZONES = {
  red:   { x0: 28,  x1: 142, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
  green: { x0: 168, x1: 312, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
  blue:  { x0: 338, x1: 452, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
};
const CZONE = { x0: 55, x1: TW - 55, y0: GROUND_Y - 125, y1: GROUND_Y - 22 };

// Pre-compute static scene decorations so renders stay deterministic
const GRASS = Array.from({ length: 26 }, (_, i) => ({
  x:  4 + i * (TW / 26) + Math.sin(i * 5.7) * 5,
  h1: 7 + Math.abs(Math.sin(i * 2.3)) * 10,
  h2: 5 + Math.abs(Math.cos(i * 1.8)) * 8,
  col1: i % 3 === 0 ? "#2a5512" : "#335e18",
  col2: i % 3 === 1 ? "#3d7020" : "#285010",
}));
const PEBBLES = Array.from({ length: 16 }, (_, i) => ({
  x: 16 + i * 28 + Math.sin(i * 11.3) * 7,
  y: GROUND_Y + 7 + Math.cos(i * 7.1) * 4,
  rx: 1.8 + Math.abs(Math.sin(i * 3.7)),
}));
const DUST = Array.from({ length: 8 }, (_, i) => ({
  baseX: 40 + i * 52 + Math.sin(i * 9.1) * 20,
  baseY: 60 + Math.cos(i * 5.3) * 50,
  speed: 0.0004 + i * 0.00007,
  phase: i * 1.3,
}));

let _rid = 0;
function spawnResource(colorId) {
  const z = ZONES[colorId];
  return {
    id: _rid++,
    colorId,
    x: z.x0 + Math.random() * (z.x1 - z.x0),
    y: z.y0 + Math.random() * (z.y0 - z.y0),
    state: "active",   // active | fading | respawning
    stateAt: 0,
  };
}
function makeResources() {
  return COLORS.flatMap(c => [spawnResource(c.id), spawnResource(c.id)]);
}

let _sparkId = 0;
function makeGS(network, upgradeLevels = {}) {
  const gs = {
    creature: { x: TW / 2, y: GROUND_Y - 68, angle: 0, state: "idle", happyUntil: 0 },
    resources: makeResources(),
    indicator: COLORS[Math.floor(Math.random() * 3)],
    target: null,
    network,
    collections: { red: 0, green: 0, blue: 0 },
    correct: 0, total: 0,
    trainCount: 0, lastLoss: null, lossHistory: [],
    sparkles: [],
    lastNNTick: 0,
    lastIndicatorChange: Date.now(),
    lastFrame: Date.now(),
    upgradeLevels: { ...upgradeLevels },
    creatureSpeed: CREATURE_SPEED,
    resourceRespawnMs: 650,
  };
  applyAllUpgrades(gs, gs.upgradeLevels);
  return gs;
}

// Helper: apply all upgrades to game state
function applyAllUpgrades(gs, upgradeLevels) {
  // Reset bonuses
  gs._speedBonus = 0;
  gs._respawnBonus = 0;
  // Apply each upgrade
  for (const upg of UPGRADES) {
    const lvl = upgradeLevels[upg.id] || 0;
    if (lvl > 0) upg.apply(gs, lvl);
  }
  // Apply to actual parameters
  gs.creatureSpeed = CREATURE_SPEED * (1 + (gs._speedBonus || 0));
  gs.resourceRespawnMs = 650 * (1 - (gs._respawnBonus || 0));
}

function snapshot(gs) {
  const now = Date.now();
  // Creature bob: asymmetric breathing feel
  const t = now * 0.002;
  // Asymmetric ease: slow rise, quick settle — mimics a breath
  const breathPhase = (Math.sin(t) + 1) / 2;           // 0→1
  const breath = Math.pow(breathPhase, 1.7);             // ease-in bias
  const bob = gs.creature.state === "idle" ? -4.5 * breath : 0;
  return {
    now,
    cx: gs.creature.x, cy: gs.creature.y + bob,
    cAngle: gs.creature.angle, cState: gs.creature.state,
    resources: gs.resources.map(r => ({ ...r })),
    sparkles: gs.sparkles.map(s => ({ ...s })),
    indicator: gs.indicator,
    target: gs.target ? { ...gs.target } : null,
    collections: { ...gs.collections },
    correct: gs.correct, total: gs.total,
    trainCount: gs.trainCount, lastLoss: gs.lastLoss,
    lossHistory: gs.lossHistory.slice(),
    poisonedUntil: gs.poisonedUntil || 0,
  };
}

function evalNN(gs) {
  const probs = nnForward(gs.network, gs.indicator.oneHot); // FIX: use oneHot input
  // Defensive: check for NaN or malformed output
  if (!Array.isArray(probs) || probs.length !== 3 || probs.some(v => !isFinite(v))) {
    console.warn("Network output invalid (NaN or wrong shape):", probs);
    gs.target = null;
    return;
  }
  const idx = probs.indexOf(Math.max(...probs));
  if (idx === -1 || !COLORS[idx]) {
    console.warn("Network output could not be mapped to color:", probs);
    gs.target = null;
    return;
  }
  const colorId = COLORS[idx].id;
  const c = gs.creature;
  const candidates = gs.resources.filter(r => r.colorId === colorId && r.state === "active");
  if (!candidates.length) { gs.target = null; return; }
  const nearest = candidates.reduce((best, r) =>
    Math.hypot(r.x - c.x, r.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? r : best);
  gs.target = { resourceId: nearest.id, x: nearest.x, y: nearest.y, colorId };
}

function gameTick(gs) {
  const now = Date.now();
  const dt  = Math.min((now - gs.lastFrame) / 1000, 0.08);
  gs.lastFrame = now;
  const c = gs.creature;

  // Rotate indicator
  if (now - gs.lastIndicatorChange > INDICATOR_MS) {
    gs.lastIndicatorChange = now;
    const pool = COLORS.filter(col => col.id !== gs.indicator.id);
    gs.indicator = pool[Math.floor(Math.random() * pool.length)];
    gs.lastNNTick = 0;
  }

  // NN re-evaluation
  if (now - gs.lastNNTick > NN_TICK_MS) {
    gs.lastNNTick = now;
    evalNN(gs);
  }

  // Move creature
  if (gs.target) {
    const dx = gs.target.x - c.x;
    const dy = gs.target.y - c.y;
    const d  = Math.hypot(dx, dy);

    if (d < COLLECT_DIST) {
      // Collect
      const res = gs.resources.find(r => r.id === gs.target.resourceId);
      if (res && res.state === "active") {
        res.state = "fading"; res.stateAt = now;
        // Sparkle burst
        const col = COLORS.find(col => col.id === res.colorId);
        for (let i = 0; i < 8; i++) gs.sparkles.push({
          id: _sparkId++, x: res.x, y: res.y,
          angle: (i / 8) * Math.PI * 2,
          hex: col.hex, born: now,
        });
        // Poison logic: wrong color
        if (gs.target.colorId === gs.indicator.id) {
          gs.collections[gs.target.colorId]++;
          gs.total++;
          gs.correct++;
          c.state = "happy"; c.happyUntil = now + 750;
        } else {
          // Negative feedback: poison burst
          gs.poisonedUntil = now + 700;
          c.state = "poisoned"; c.happyUntil = now + 700;
          // Add a red sparkle burst
          for (let i = 0; i < 8; i++) gs.sparkles.push({
            id: _sparkId++, x: res.x, y: res.y,
            angle: (i / 8) * Math.PI * 2,
            hex: "#ef4444", born: now,
          });
        }
        // Respawn after fade
        const cid = res.colorId;
        setTimeout(() => {
          const z = ZONES[cid];
          res.x = z.x0 + Math.random() * (z.x1 - z.x0);
          res.y = z.y0 + Math.random() * (z.y0 - z.y0);
          res.state = "respawning"; res.stateAt = Date.now();
          setTimeout(() => { res.state = "active"; }, gs.resourceRespawnMs);
        }, 650);
      }
      gs.target = null;
      gs.lastNNTick = 0;
    } else {
      // Move toward target
      const step = Math.min(gs.creatureSpeed * dt, d);
      c.x += (dx / d) * step;
      c.y += (dy / d) * step;
      c.angle = Math.atan2(dy, dx);
      if (c.state !== "happy" && c.state !== "poisoned") c.state = "moving";
    }
  } else {
    // Idle micro-wander
    if (Math.random() < 0.014) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      c.x = Math.max(CZONE.x0, Math.min(CZONE.x1, c.x + Math.cos(a) * r));
      c.y = Math.max(CZONE.y0, Math.min(CZONE.y1, c.y + Math.sin(a) * r));
    }
    if (c.state !== "happy" && c.state !== "poisoned") c.state = "idle";
  }

  if (c.state === "happy" && now >= c.happyUntil) c.state = "idle";
  if (c.state === "poisoned" && (!gs.poisonedUntil || now >= gs.poisonedUntil)) c.state = "idle";
  gs.sparkles = gs.sparkles.filter(s => now - s.born < 600);
}

export default function Terrarium({ network, onIndicatorChange, onResourceCounters, onTrainingPanel, onUpgradesSidebar }) {
  // Upgrades state
  const [upgradeLevels, setUpgradeLevels] = useState({});
  // Game state lives in a ref
  const gsRef = useRef(null);
  if (!gsRef.current) {
    gsRef.current = makeGS(network, upgradeLevels);
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
      gameTick(gsRef.current);
      setSnap(snapshot(gsRef.current));
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, []);

  function handleReset() {
    gsRef.current = makeGS(network);
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
      onResourceCounters(
        <div style={{ width: "100%", maxWidth: 320, display: "flex", justifyContent: "space-between", padding: "10px 6px 6px", marginTop: 18 }}>
          {COLORS.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.hex, boxShadow: `0 0 5px ${c.hex}`, flexShrink: 0 }} />
              <span style={{ color: "#1e1e30", fontSize: 9, letterSpacing: "0.1em" }}>{c.label.toUpperCase()}</span>
              <span style={{ color: "#ccd0e8", fontSize: 15, fontWeight: 500 }}>{snap.collections[c.id]}</span>
            </div>
          ))}
          {efficiency !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#1a1a28", fontSize: 9, letterSpacing: "0.1em" }}>ACCURACY</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: efficiency > 78 ? "#4ade80" : efficiency > 48 ? "#facc15" : "#f87171" }}>{efficiency}%</span>
            </div>
          )}
        </div>
      );
    }
  }, [snap.collections, efficiency, onResourceCounters]);

  // Training panel UI (for below terrarium visualisation)
  useEffect(() => {
    if (onTrainingPanel) {
      onTrainingPanel(
        <div style={{ width: "100%", maxWidth: 320, background: "#09090f", border: "1px solid #111120", borderRadius: 16, padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
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
          <div style={{ display: "flex", gap: 9 }}>
            {COLORS.map(c => (
              <button key={c.id} className="tbtn"
                onClick={() => handleTrain(c)}
                style={{ background: c.hex, boxShadow: `0 4px 16px ${c.glow}` }}
                title={`Train: when indicator is ${indicator.label}, pick ${c.label}`}
              />
            ))}
          </div>
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
            return (
              <div key={upg.id} style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: "#101624", boxShadow: "0 1px 4px #0002" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#e0eaff", fontSize: 12, fontWeight: 500 }}>{upg.label}</span>
                  <button
                    disabled={maxed}
                    onClick={() => handleUpgrade(upg.id)}
                    style={{
                      background: maxed ? "#222c" : "#2563eb",
                      color: maxed ? "#888" : "#fff",
                      border: "none", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                      cursor: maxed ? "not-allowed" : "pointer", marginLeft: 8
                    }}>
                    {maxed ? "MAX" : `+1 (${upg.cost})`}
                  </button>
                </div>
                <div style={{ color: "#b6c2e0", fontSize: 11, margin: "4px 0 0" }}>{upg.description}</div>
                <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 2 }}>Level: {lvl}{upg.maxLevel ? `/${upg.maxLevel}` : ""}</div>
              </div>
            );
          })}
        </div>
      );
    }
  }, [upgradeLevels, onUpgradesSidebar]);

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
      {/* Glass edge radial vignette overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 20, background: "radial-gradient(ellipse at 28% 12%, rgba(255,255,255,0.018) 0%, transparent 55%)" }} />
    </div>
  );
}

function TerrariumScene({ snap }) {
  const { now, cx, cy, cAngle, cState, resources, sparkles, target } = snap;

  // Poisoned effect: fade value
  const poisonAge = snap.poisonedUntil
    ? Math.max(0, 1 - (now - (snap.poisonedUntil - 700)) / 700)
    : 0;
  const poisoned = poisonAge > 0.01;

  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#060812" />
          <stop offset="100%" stopColor="#0c1020" />
        </linearGradient>
        <linearGradient id="gGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e3312" />
          <stop offset="55%"  stopColor="#11200a" />
          <stop offset="100%" stopColor="#070c04" />
        </linearGradient>
        <radialGradient id="gVignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
        <filter id="fGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Indicator sun/overlay behind the creature */}
        <radialGradient id="indicatorSun" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={snap.indicator.hex} stopOpacity="0.22" />
          <stop offset="60%" stopColor={snap.indicator.hex} stopOpacity="0.10" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
        </radialGradient>
        {/* Poisoned radial burst — centred on creature, not full screen */}
        {poisoned && (
          <radialGradient id="poisonBurst" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.45 * poisonAge} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </radialGradient>
        )}
      </defs>

      {/* Sky */}
      <rect x={0} y={0} width={TW} height={TH} fill="url(#gSky)" />

      {/* Ceiling light cone — soft top-down ambient */}
      <ellipse cx={TW / 2} cy={0} rx={TW * 0.32} ry={55}
        fill="rgba(200,220,255,0.05)"
        style={{ filter: "blur(18px)" }} />

      {/* Zone ambient glow on floor — stronger than before */}
      <ellipse cx={85}  cy={GROUND_Y + 14} rx={90} ry={28} fill="#f8717122" style={{ filter: "blur(10px)" }} />
      <ellipse cx={240} cy={GROUND_Y + 14} rx={95} ry={28} fill="#4ade8022" style={{ filter: "blur(10px)" }} />
      <ellipse cx={395} cy={GROUND_Y + 14} rx={90} ry={28} fill="#60a5fa22" style={{ filter: "blur(10px)" }} />

      {/* Deep soil base */}
      <rect x={0} y={GROUND_Y} width={TW} height={TH - GROUND_Y} fill="url(#gGround)" />
      {/* Sienna topsoil band */}
      <rect x={0} y={GROUND_Y} width={TW} height={14}
        fill="rgba(110,62,20,0.45)" style={{ filter: "blur(2px)" }} />
      {/* Subtle soil texture flecks */}
      {PEBBLES.map((p, i) => (
        <ellipse key={`soil-${i}`}
          cx={p.x} cy={GROUND_Y + 4 + (i % 3) * 3}
          rx={p.rx * 2.2} ry={p.rx * 0.6}
          fill="rgba(140,80,30,0.12)" />
      ))}

      {/* Pebbles */}
      {PEBBLES.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx * 1.6} ry={p.rx * 0.85}
          fill="rgba(255,255,255,0.025)" />
      ))}

      {/* Grass tufts */}
      {GRASS.map((g, i) => (
        <g key={i}>
          <line x1={g.x}     y1={GROUND_Y} x2={g.x - 2}   y2={GROUND_Y - g.h1}
            stroke={g.col1} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={g.x + 4} y1={GROUND_Y} x2={g.x + 2.5} y2={GROUND_Y - g.h2}
            stroke={g.col2} strokeWidth={1.3} strokeLinecap="round" />
        </g>
      ))}

      {/* Floating dust motes */}
      {DUST.map((d, i) => {
        const t = now * d.speed + d.phase;
        const x = d.baseX + Math.sin(t) * 14;
        const y = d.baseY + Math.cos(t * 0.7) * 18;
        const op = 0.04 + 0.04 * Math.sin(t * 1.3);
        return <circle key={i} cx={x} cy={y} r={1.2} fill="white" opacity={op} />;
      })}

      {/* Indicator sun/overlay */}
      <ellipse
        cx={TW/2}
        cy={GROUND_Y - 40}
        rx={TW * 0.48}
        ry={TH * 0.44}
        fill="url(#indicatorSun)"
        style={{ mixBlendMode: "lighter" }}
      />

      {/* Subtle dashed line to current target */}
      {target && (() => {
        const col = COLORS.find(c => c.id === target.colorId);
        return (
          <line x1={cx} y1={cy} x2={target.x} y2={target.y}
            stroke={col.hex} strokeWidth={0.7}
            strokeDasharray="4 6" opacity={0.12} />
        );
      })()}

      {/* Resources */}
      {resources.map(r => <Resource key={r.id} r={r} now={now} />)}

      {/* Sparkle bursts */}
      {sparkles.map(s => <Sparkle key={s.id} s={s} now={now} />)}

      {/* Poisoned radial burst */}
      {poisoned && (
        <ellipse cx={cx} cy={cy} rx={60} ry={50}
          fill="url(#poisonBurst)" opacity={0.8 * poisonAge} />
      )}

      {/* The creature */}
      <Critter x={cx} y={cy} angle={cAngle} state={cState} poisoned={poisoned} poisonAge={poisonAge} />

      {/* Vignette overlay — keeps edges dark like looking through glass */}
      <rect x={0} y={0} width={TW} height={TH} fill="url(#gVignette)" />

      {/* Glass specular streak */}
      <path d={`M 55 9 Q ${TW * 0.42} 3 ${TW - 65} 10`}
        stroke="rgba(200,230,255,0.045)" strokeWidth={1.8} fill="none" />
      <path d={`M 80 7 Q ${TW * 0.38} 2 ${TW * 0.7} 8`}
        stroke="rgba(255,255,255,0.02)" strokeWidth={0.8} fill="none" />
    </svg>
  );
}

function Resource({ r, now }) {
  const col = COLORS.find(c => c.id === r.colorId);
  let opacity = 1;
  if (r.state === "fading")     opacity = Math.max(0, 1 - (now - r.stateAt) / 480);
  if (r.state === "respawning") opacity = Math.min(1, (now - r.stateAt) / 520);
  const scale = r.state === "respawning" ? 0.3 + 0.7 * Math.min(1, (now - r.stateAt) / 520) : 1;
  const floatY = 2.8 * Math.sin(now * 0.00095 + r.x * 0.035);

  return (
    <g transform={`translate(${r.x}, ${r.y + floatY})`} opacity={opacity}>
      {/* Soft pool of light beneath */}
      <ellipse cx={0} cy={16} rx={14} ry={5} fill={col.glow}
        style={{ filter: "blur(5px)" }} opacity={0.6} />
      {/* Glow halo */}
      <circle cx={0} cy={0} r={20} fill={col.glow}
        style={{ filter: "blur(8px)" }} opacity={0.5} />

      <g transform={`scale(${scale})`}>
        {r.colorId === "red" && (
          <g>
            <polygon points="0,-13 11,-2 0,11 -11,-2" fill={col.hex} />
            <polygon points="0,-13 11,-2 0,-1"  fill="rgba(255,255,255,0.22)" />
            <polygon points="0,-13 -11,-2 0,-1" fill="rgba(0,0,0,0.12)" />
            <polygon points="-4,-7 0,-1 -2,3"  fill="rgba(255,255,255,0.08)" />
          </g>
        )}
        {r.colorId === "green" && (
          <g>
            {/* Main leaf — left, tilted */}
            <ellipse cx={-4} cy={-6} rx={6.5} ry={10.5}
              fill={col.hex} opacity={0.92} transform="rotate(-22)" />
            {/* Second leaf — right, different tilt */}
            <ellipse cx={5}  cy={-4} rx={5}   ry={8.5}
              fill={col.hex} opacity={0.80} transform="rotate(28)" />
            {/* Small back leaf for depth */}
            <ellipse cx={1}  cy={-11} rx={3.5} ry={5.5}
              fill="#86efac" opacity={0.50} transform="rotate(5)" />
            {/* Leaf vein highlights */}
            <line x1={-4} y1={-14} x2={-3} y2={2}
              stroke="#bbf7d0" strokeWidth={0.7} strokeLinecap="round" opacity={0.4}
              transform="rotate(-22)" />
            {/* Stem fork */}
            <line x1={0} y1={7}  x2={-2} y2={13}
              stroke={col.hex} strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />
            <line x1={0} y1={10} x2={2}  y2={13}
              stroke={col.hex} strokeWidth={1.0} strokeLinecap="round" opacity={0.5} />
          </g>
        )}
        {r.colorId === "blue" && (
          <g>
            <path d="M0,-14 C9,-6 12,3 0,14 C-12,3 -9,-6 0,-14" fill={col.hex} opacity={0.88} />
            <path d="M0,-14 C6,-7 7,1 0,10"   fill="rgba(255,255,255,0.2)" />
            <path d="M-2,-8 C-1,-4 -1,0 -3,4" fill="rgba(255,255,255,0.08)"
              strokeWidth={0} />
          </g>
        )}
      </g>
    </g>
  );
}

function Sparkle({ s, now }) {
  const age  = (now - s.born) / 600;
  const dist = age * 28;
  const x = s.x + Math.cos(s.angle) * dist;
  const y = s.y + Math.sin(s.angle) * dist;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - age}>
      <circle cx={0} cy={0} r={2.5 * (1 - age * 0.5)} fill={s.hex} />
      <circle cx={0} cy={0} r={1}                     fill="white" opacity={0.7} />
    </g>
  );
}

function Critter({ x, y, angle, state, poisoned, poisonAge }) {
  // Pupils track movement direction
  const happy = state === "happy";
  // Squish/stretch: happy or poisoned
  const scaleX = happy ? 1.14 : poisoned ? 0.88 : 1;
  const scaleY = happy ? 0.91 : poisoned ? 1.18 : 1;

  // Debug print for poisoned state
  if (poisoned) {
    console.log("Creature is poisoned! poisonAge:", poisonAge);
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Ground shadow */}
      <ellipse cx={0} cy={19} rx={15} ry={5} fill="rgba(0,0,0,0.28)" />

      <g transform={`scale(${scaleX}, ${scaleY})`}>
        {/* Body */}
        <ellipse cx={0} cy={0} rx={15} ry={14} fill="#b8814a" />
        <ellipse cx={0} cy={0} rx={14} ry={13} fill="#cc9660" />
        {/* Belly */}
        <ellipse cx={0} cy={5} rx={9} ry={8} fill="#e8c49e" opacity={poisoned ? 0.18 + 0.3 * poisonAge : 0.48} />

        {/* Eyes — normal or X-eyes */}
        {!poisoned && (
          <>
            {/* Eyes — whites */}
            <circle cx={-6} cy={-4} r={4.8} fill="white" />
            <circle cx={ 6} cy={-4} r={4.8} fill="white" />
            {/* Pupils — wider tracking range */}
            <circle cx={-6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            <circle cx={ 6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            {/* Eye highlights */}
            <circle cx={-4.5} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            <circle cx={ 7.4} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            {/* Idle eyelid — half-closed droopy look when not moving */}
            {state === "idle" && (
              <>
                <ellipse cx={-6} cy={-5.5} rx={4.8} ry={2.2}
                  fill="#cc9660" opacity={0.7} />
                <ellipse cx={ 6} cy={-5.5} rx={4.8} ry={2.2}
                  fill="#cc9660" opacity={0.7} />
              </>
            )}
          </>
        )}
        {/* X-eyes when poisoned */}
        {poisoned && (
          <>
            <line x1={-9} y1={-7} x2={-3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={-3} y1={-7} x2={-9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 3} y1={-7} x2={ 9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 9} y1={-7} x2={ 3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
          </>
        )}

        {/* Happy smile */}
        {happy && (
          <path d="M -5 5.5 Q 0 10 5 5.5"
            stroke="#8a5e38" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        )}

        {/* Poisoned frown */}
        {poisoned && (
          <path d="M -5 8 Q 0 3 5 8"
            stroke="#ef4444" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={poisonAge} />
        )}

        {/* Blush */}
        <circle cx={-11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />
        <circle cx={ 11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />

        {/* Feet */}
        <ellipse cx={-7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        <ellipse cx={ 7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        {/* Toe nubs */}
        {[-11, -7.5, -4].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
        {[4, 7.5, 11].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
      </g>
    </g>
  );
}
