// terrariumEngine.js
// Pure, parameterised game logic engine for all terrarium variants
import { COLORS } from "../data/colors";
import { nnForward, nnTrainStep } from "./nn";
import { BRAIN_TYPES } from "../data/brainTypes";
import { BODY_TYPES } from "../data/bodyTypes";

export const TW = 480, TH = 270;
export const GROUND_Y = 205;
const BASE_GIBBET_SPEED = 88;
const NN_TICK_MS = 1600;
export const INDICATOR_MS = 3000;
const COLLECT_DIST = 26;

export const ZONES = {
  red:   { x0: 28,  x1: 142, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
  green: { x0: 168, x1: 312, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
  blue:  { x0: 338, x1: 452, y0: GROUND_Y - 130, y1: GROUND_Y - 28 },
};
export const CZONE = {
  x0: 55, x1: TW - 55, y0: GROUND_Y - 125, y1: GROUND_Y - 22
};

export const GRASS = Array.from({ length: 26 }, (_, i) => ({
  x:  4 + i * (TW / 26) + Math.sin(i * 5.7) * 5,
  h1: 7 + Math.abs(Math.sin(i * 2.3)) * 10,
  h2: 5 + Math.abs(Math.cos(i * 1.8)) * 8,
  col1: i % 3 === 0 ? "#2a5512" : "#335e18",
  col2: i % 3 === 1 ? "#3d7020" : "#285010",
}));
export const PEBBLES = Array.from({ length: 16 }, (_, i) => ({
  x: 16 + i * 28 + Math.sin(i * 11.3) * 7,
  y: GROUND_Y + 7 + Math.cos(i * 7.1) * 4,
  rx: 1.8 + Math.abs(Math.sin(i * 3.7)),
}));
export const DUST = Array.from({ length: 8 }, (_, i) => ({
  baseX: 40 + i * 52 + Math.sin(i * 9.1) * 20,
  baseY: 60 + Math.cos(i * 5.3) * 50,
  speed: 0.0004 + i * 0.00007,
  phase: i * 1.3,
}));

// Pre-generate rain drops (static positions, animated via now)
export const RAINDROPS = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 37 + 13) % TW,
  speed: 180 + (i * 23) % 80,
  phase: (i * 0.31) % 1.0,
  len: 6 + (i % 5) * 2,
}));

let _rid = 0;
export function spawnResource(colorId) {
  // Interspersed placement: allow overlap between color zones
  // Pick a random zone (any color) for each resource, not just its own
  const zoneIds = Object.keys(ZONES);
  const randomZoneId = zoneIds[Math.floor(Math.random() * zoneIds.length)];
  const z = ZONES[randomZoneId];
  // Gaussian-ish cluster: bias toward zone center with occasional outliers
  const rx = Math.random() + Math.random() - 1; // triangular distribution, -1 to 1
  const ry = Math.random() + Math.random() - 1;
  const cx = (z.x0 + z.x1) / 2;
  const cy = (z.y0 + z.y1) / 2;
  const halfW = (z.x1 - z.x0) / 2;
  const halfH = (z.y1 - z.y0) / 2;
  return {
    id: _rid++, colorId,
    x: Math.max(z.x0, Math.min(z.x1, cx + rx * halfW)),
    y: Math.max(z.y0, Math.min(z.y1, cy + ry * halfH)),
    state: "active", stateAt: 0,
    scale: 0.75 + Math.random() * 0.5,
    claimedBy: null,
    health: 1.0, // 0.0 → 1.0, depleted when reaches 0
    maxHealth: 1.0,
  };
}
export function makeResources(gs) {
  // Use gs._resourceFieldBonus to determine resource count per color
  const baseCount = 1;
  const bonus = gs?._resourceFieldBonus || 0;
  const count = baseCount + bonus;
  return COLORS.flatMap(c => Array.from({ length: count }, () => spawnResource(c.id)));
}

let _sparkId = 0;
export function makeSparkle(x, y, hex, now) {
  return Array.from({ length: 8 }, (_, i) => ({
    id: _sparkId++, x, y,
    angle: (i / 8) * Math.PI * 2,
    hex, born: now,
  }));
}

// Apply upgrades to gs
export function applyAllUpgrades(gs, upgradeLevels, UPGRADES) {
  gs._speedBonus = 0;
  gs._respawnBonus = 0;
  gs._redGatherBonus = 0;
  gs._greenGatherBonus = 0;
  gs._blueGatherBonus = 0;
  gs._resourceFieldBonus = 0;
  gs._criticalGather = 0;
  for (const upg of UPGRADES) {
    const lvl = upgradeLevels[upg.id] || 0;
    if (lvl > 0) upg.apply(gs, lvl);
  }
  gs.gibbetSpeed = BASE_GIBBET_SPEED * (1 + (gs._speedBonus || 0));
  gs.resourceRespawnMs = 650 * (1 - (gs._respawnBonus || 0));

  // If resourceFieldBonus changed, spawn only the new additional resources
  if (gs._resourceFieldBonus !== undefined && gs.resources && gs.resources.length > 0) {
    const baseCount = 1;
    const bonus = gs._resourceFieldBonus || 0;
    const expectedCount = COLORS.length * (baseCount + bonus);
    if (gs.resources.length < expectedCount) {
      // Calculate how many new resources to add per color
      const countPerColor = baseCount + bonus;
      const colorCounts = {};
      for (const c of COLORS) colorCounts[c.id] = 0;
      for (const r of gs.resources) colorCounts[r.colorId]++;
      for (const c of COLORS) {
        const toAdd = countPerColor - colorCounts[c.id];
        for (let i = 0; i < toAdd; ++i) {
          const newRes = spawnResource(c.id);
          newRes.state = "spawning";
          newRes.stateAt = Date.now();
          gs.resources.push(newRes);
        }
      }
    } else if (gs.resources.length > expectedCount) {
      // If for some reason there are too many, trim extras (shouldn't happen in normal upgrade flow)
      // Remove oldest resources of each color first
      for (const c of COLORS) {
        let extras = gs.resources.filter(r => r.colorId === c.id);
        while (extras.length > countPerColor) {
          const idx = gs.resources.findIndex(r => r.colorId === c.id);
          if (idx !== -1) {
            gs.resources.splice(idx, 1);
            extras = gs.resources.filter(r => r.colorId === c.id);
          } else {
            break;
          }
        }
      }
    }
  }
}

// GibbetState: per-gibbet state managed by engine
function makeGibbetState(meta = {}) {
  return {
    x: TW / 2, y: GROUND_Y - 68, angle: 0, state: "idle", happyUntil: 0,
    target: null, harvestTarget: null, harvestStarted: null,
    sniffingUntil: null, lastNNTick: 0, poisonedUntil: null,
    harvestProgress: 0,
    meta,
  };
}

// Updated makeGS: no gs.gibbet, instead gs.gibbetStates: Map
export function makeGS(upgradeLevels = {}, UPGRADES = [], config = {}) {
  const gs = {
    gibbetStates: new Map(), // gibbetId -> GibbetState
    resources: [],
    indicator: COLORS[Math.floor(Math.random() * 3)],
    target: null, // legacy, not used
    collections: { red: 0, green: 0, blue: 0 },
    collectionHistory: { red: [], green: [], blue: [] },
    correct: 0, total: 0,
    trainCount: 0, lastLoss: null, lossHistory: [],
    sparkles: [],
    lastIndicatorChange: Date.now(),
    lastFrame: Date.now(),
    upgradeLevels: { ...upgradeLevels },
    gibbetSpeed: BASE_GIBBET_SPEED,
    resourceRespawnMs: 650,
    weather: 0,
    weatherPhase: Math.random() * Math.PI * 2,
    config,
    collectionRateEMA: { red: 0, green: 0, blue: 0 },
    collectionRateLastTick: Date.now(),
  };
  applyAllUpgrades(gs, upgradeLevels, UPGRADES);
  gs.resources = makeResources(gs);
  return gs;
}

// Extracted per-gibbet logic
function tickGibbet(gs, g, gibbetId, network, now, dt) {
  if (!network) return;

  // --- Confidence multiplier logic ---
  // Determine target color for movement/mining
  const targetColorId = g.harvestTarget != null
    ? gs.resources.find(r => r.id === g.harvestTarget)?.colorId
    : gs.indicator?.id;
  const confMult = confidenceMultiplier(network, targetColorId);
  g.lastConfMult = confMult;

  // NN re-evaluation
  if (now - g.lastNNTick > NN_TICK_MS) {
    g.lastNNTick = now;
    // Use brainTypeId from meta if available
    const brainTypeId = g.meta?.brainTypeId || "standard";
    evalNN(gs, g, gibbetId, network, brainTypeId);
  }
  // Move gibbet and handle collection
  if (g.target) {
    if (g.sniffingUntil && now < g.sniffingUntil) {
      g.angle += Math.sin(now * 0.018) * 0.08;
      g.state = "sniffing";
    } else {
      const dx = g.target.x - g.x;
      const dy = g.target.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d < COLLECT_DIST) {
        if (g.harvestTarget !== g.target.resourceId) {
          g.harvestTarget = g.target.resourceId;
          g.state = "harvesting";
        }
        // New health-based harvesting logic
        const res = gs.resources.find(r => r.id === g.target.resourceId);
        if (res && res.state === "active") {
          // Mining speed per gibbet (can be upgraded)
          // Use a slower default mining rate and dt in ms
          const mineRate = (gs.mineSpeed ?? 0.001) * confMult; // health per ms (slower)
          const dtMs = Math.max(1, now - (g._lastHarvestTick || now));
          g._lastHarvestTick = now;
          res.health -= mineRate * dtMs;
          g.harvestProgress = 1 - res.health / res.maxHealth;
          if (res.health <= 0) {
            res.health = 0;
            // Collection logic (same as before, but now respawn at new location)
            res.state = "fading"; res.stateAt = now;
            const col = COLORS.find(col => col.id === res.colorId);
            gs.sparkles.push(...makeSparkle(res.x, res.y, col.hex, now));
            const correct = isCorrectCollection(
              g.target.colorId, gs.indicator.id, gs.config, gs.weather
            );
            if (correct) {
              let bonus = 0;
              if (g.target.colorId === "red")   bonus = gs._redGatherBonus || 0;
              if (g.target.colorId === "green") bonus = gs._greenGatherBonus || 0;
              if (g.target.colorId === "blue")  bonus = gs._blueGatherBonus || 0;
              // Use bodyTypeId from meta if available
              const bodyTypeId = g.meta?.bodyTypeId || "balanced";
              const multiplier = getCollectionMultiplier(bodyTypeId, g.target.colorId, gs.indicator.id);
              let amount = (1 + bonus) * multiplier;
              let crit = false;
              if (gs._criticalGather && Math.random() < gs._criticalGather) {
                crit = true;
                amount = Math.round(amount * 1.5);
              }
              gs.collections[g.target.colorId] += amount;
              gs.collectionHistory[g.target.colorId].push({ time: now, amount });
              gs.total++; gs.correct++;
              g.state = "happy"; g.happyUntil = now + 750;
              g._lastGain = {
                colorId: g.target.colorId,
                amount,
                time: now,
                hex: col.hex,
                crit,
              };
            } else {
              g.poisonedUntil = now + 700;
              g.state = "poisoned"; g.happyUntil = now + 700;
              gs.sparkles.push(...makeSparkle(res.x, res.y, "#ef4444", now));
            }
            // Respawn: reset health, state, and position
            const newPos = spawnResource(res.colorId);
            res.x = newPos.x;
            res.y = newPos.y;
            res.health = res.maxHealth;
            res.state = "active";
            g.harvestTarget = null;
            g.target = null;
            g.harvestProgress = 0;
            g._lastHarvestTick = null;
          }
        }
      } else {
        g.harvestTarget = null;
        g.harvestProgress = 0;
        g._lastHarvestTick = null;
        const perpX = -dy / d;
        const perpY = dx / d;
        const driftAmp = Math.min(d * 0.15, 12);
        const drift = driftAmp * Math.sin(now * 0.004 + g.x * 0.05);
        const targetSpeed = (gs.gibbetSpeed ?? 0.04) * confMult * (g.speedVariance ?? 1.0);
        const distFactor = Math.min(1, d / 60);
        const nearFactor = Math.min(1, d / COLLECT_DIST / 1.5);
        const speed = targetSpeed * 0.3 + targetSpeed * 0.7 * distFactor * nearFactor;
        const step = Math.min(speed * dt, d);
        const moveX = (dx / d) * step + perpX * drift * dt;
        const moveY = (dy / d) * step + perpY * drift * dt;
        g.x += moveX;
        g.y += moveY;
        g.angle = Math.atan2(moveY, moveX);
        if (g.state !== "happy" && g.state !== "poisoned") g.state = "moving";
      }
    }
  } else {
    if (Math.random() < 0.014) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      g.x = Math.max(CZONE.x0, Math.min(CZONE.x1, g.x + Math.cos(a) * r));
      g.y = Math.max(CZONE.y0, Math.min(CZONE.y1, g.y + Math.sin(a) * r));
    }
    if (g.state !== "happy" && g.state !== "poisoned") g.state = "idle";
    g.harvestTarget = null;
    g.harvestProgress = 0;
  }
  if (g.state === "happy"   && now >= g.happyUntil)  g.state = "idle";
  if (g.state === "poisoned" && now >= (g.poisonedUntil || 0)) g.state = "idle";
}

// Updated evalNN: per-gibbet
function evalNN(gs, g, gibbetId, network, brainTypeId = "standard") {
  const inputVec = buildInputVec(gs, brainTypeId);
  const probs = nnForward(network, inputVec);
  if (!Array.isArray(probs) || probs.length !== 3 || probs.some(v => !isFinite(v))) {
    g.target = null; return;
  }
  const idx = probs.indexOf(Math.max(...probs));
  if (idx === -1 || !COLORS[idx]) { g.target = null; return; }
  const colorId = COLORS[idx].id;
  // Remove claimedBy logic: allow any gibbet to target any resource
  const candidates = gs.resources.filter(r => r.colorId === colorId && r.state === "active");
  if (!candidates.length) { g.target = null; return; }
  const nearest = candidates.reduce((best, r) =>
    Math.hypot(r.x - g.x, r.y - g.y) < Math.hypot(best.x - g.x, best.y - g.y) ? r : best);
  g.target = { resourceId: nearest.id, x: nearest.x, y: nearest.y, colorId };
  g.sniffingUntil = Date.now() + 300 + Math.random() * 400;
}

// Updated gameTick: accepts gibbetEntries [{id, network, meta}]
export function gameTick(gs, gibbetEntries, UPGRADES_LIST) {
  const now = Date.now();
  const dt = Math.min((now - gs.lastFrame) / 1000, 0.08);
  gs.lastFrame = now;
  // Weather update
  if (gs.config.hasWeather) {
    gs.weatherPhase += dt * 0.18;
    gs.weather = Math.max(0, Math.min(1,
      0.5 + 0.38 * Math.sin(gs.weatherPhase) + 0.14 * Math.sin(gs.weatherPhase * 2.7)
    ));
  }
  // Rotate indicator
  if (now - gs.lastIndicatorChange > INDICATOR_MS) {
    gs.lastIndicatorChange = now;
    const pool = COLORS.filter(col => col.id !== gs.indicator.id);
    gs.indicator = pool[Math.floor(Math.random() * pool.length)];
    // Reset all gibbets' lastNNTick
    for (const g of gs.gibbetStates.values()) g.lastNNTick = 0;
  }
  // Tick all assigned gibbets
  for (const { id, network, meta } of gibbetEntries) {
    // Defensive: only process real gibbet IDs (numbers)
    if (typeof id !== 'number') continue;
    let g = gs.gibbetStates.get(id);
    if (!g) {
      g = makeGibbetState(meta);
      gs.gibbetStates.set(id, g);
    }
    tickGibbet(gs, g, id, network, now, dt);
  }
  // Remove unassigned gibbets from state
  const assignedIds = new Set(gibbetEntries.map(e => e.id));
  for (const id of Array.from(gs.gibbetStates.keys())) {
    if (!assignedIds.has(id)) gs.gibbetStates.delete(id);
  }
  // Sparkles cleanup
  gs.sparkles = gs.sparkles.filter(s => now - s.born < 600);
  // Prune collection history to last 60s
  for (const col of COLORS) {
    gs.collectionHistory[col.id] = gs.collectionHistory[col.id].filter(e => now - e.time < 60000);
  }
}

// Updated snapshot: emit gibbets[]
export function snapshot(gs) {
  const now = Date.now();
  const t = now * 0.002;
  const breathPhase = (Math.sin(t) + 1) / 2;
  const breath = Math.pow(breathPhase, 1.7);
  // Add gainEvent to snapshot if resource was just collected (per gibbet)
  let gainEvents = [];
  for (const [id, g] of gs.gibbetStates.entries()) {
    if (g._lastGain && now - g._lastGain.time < 120) {
      gainEvents.push({ ...g._lastGain, id });
    }
  }
  const snap = {
    now,
    gibbets: Array.from(gs.gibbetStates.entries()).map(([id, g]) => ({
      id,
      x: g.x,
      y: g.y + (g.state === "idle" ? -4.5 * breath : 0),
      angle: g.angle,
      state: g.state,
      harvestProgress: g.harvestProgress,
      poisonedUntil: g.poisonedUntil || 0,
      gainEvent: gainEvents.find(e => e.id === id) || null,
      confMult: g.lastConfMult ?? 1.0,
    })),
    resources: gs.resources.map(r => ({
      ...r,
      health: r.health,
      maxHealth: r.maxHealth,
    })),
    sparkles: gs.sparkles.map(s => ({ ...s })),
    indicator: gs.indicator,
    collections: { ...gs.collections },
    correct: gs.correct, total: gs.total,
    trainCount: gs.trainCount, lastLoss: gs.lastLoss,
    lossHistory: gs.lossHistory.slice(),
    weather: gs.weather ?? 0,
    config: gs.config,
  };

  return snap;
}

// Build input vector for the network given current gs state and brain type
export function buildInputVec(gs, brainTypeId = "standard") {
  const brainType = BRAIN_TYPES[brainTypeId] || BRAIN_TYPES["standard"];
  if (brainType.weatherAware) {
    return [...gs.indicator.oneHot, gs.weather];
  }
  return gs.indicator.oneHot;
}

// Get collection multiplier for a body type
export function getCollectionMultiplier(bodyTypeId, collectedColorId, indicatorColorId) {
  const bodyType = BODY_TYPES.find(b => b.id === bodyTypeId);
  if (!bodyType) return 1.0;
  const isCorrect = collectedColorId === indicatorColorId;
  if (!isCorrect && bodyType.multipliers.wrong != null) {
    return bodyType.multipliers.wrong;
  }
  return bodyType.multipliers[collectedColorId] ?? 1.0;
}

// Helper to update and get resource rate per second for each color (EMA smoothing)
export function updateAndGetResourceRate(gs) {
  const now = Date.now();
  const dt = Math.min((now - (gs.collectionRateLastTick ?? now)) / 1000, 0.5);
  gs.collectionRateLastTick = now;

  const WINDOW_MS = 10000; // 10s look-back for instantaneous rate sample
  const α = 1 - Math.exp(-dt / 8); // 8s smoothing constant — tweak to taste

  const rates = {};
  for (const col of COLORS) {
    const recent = (gs.collectionHistory[col.id] || [])
      .filter(e => now - e.time < WINDOW_MS);
    const totalAmount = recent.reduce((sum, e) => sum + (e.amount ?? 1), 0);
    const instantaneous = totalAmount / (WINDOW_MS / 1000);

    gs.collectionRateEMA[col.id] = α * instantaneous + (1 - α) * gs.collectionRateEMA[col.id];
    rates[col.id] = gs.collectionRateEMA[col.id];
  }
  return rates;
}

// Is this collection a "correct" (safe) one given weather inversion?
export function isCorrectCollection(colorId, indicatorId, config, weather) {
  const inverted = config.hasWeather &&
    weather > (config.weatherInvertThreshold ?? 0.6);
  const matchesIndicator = colorId === indicatorId;
  // Normal: correct = matches indicator
  // Inverted: correct = does NOT match indicator
  return inverted ? !matchesIndicator : matchesIndicator;
}

/**
 * Given a network and a target colour ID, returns a speed multiplier
 * based on the network's softmax confidence for that class.
 *
 * Confidence of 0.33 (random chance) → 1.0x
 * Confidence of 1.0 (certain) → 2.0x
 * Confidence below 0.33 → below 1.0x (gibbet is actively confused)
 *
 * Formula: multiplier = confidence / 0.33
 * Clamped to [0.4, 2.5] so gibbets never fully stop or become absurdly fast.
 */
export function confidenceMultiplier(network, colorId) {
  if (!network) return 1.0;
  const color = COLORS.find(c => c.id === colorId);
  if (!color) return 1.0;
  const probs = nnForward(network, color.oneHot);
  const colorIndex = COLORS.findIndex(c => c.id === colorId);
  const confidence = probs[colorIndex] ?? (1 / COLORS.length);
  const raw = confidence / (1 / COLORS.length);
  return Math.max(0.4, Math.min(2.5, raw));
}
