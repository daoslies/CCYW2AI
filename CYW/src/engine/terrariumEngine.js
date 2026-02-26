// terrariumEngine.js
// Pure, parameterised game logic engine for all terrarium variants
import { COLORS } from "../data/colors";
import { nnForward, nnTrainStep } from "./nn";

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
  for (const upg of UPGRADES) {
    const lvl = upgradeLevels[upg.id] || 0;
    if (lvl > 0) upg.apply(gs, lvl);
  }
  gs.gibbetSpeed = BASE_GIBBET_SPEED * (1 + (gs._speedBonus || 0));
  gs.resourceRespawnMs = 650 * (1 - (gs._respawnBonus || 0));
}

// Add resource collection history and rate calculation to gs
export function makeGS(network, upgradeLevels = {}, UPGRADES = [], config = {}) {
  const gs = {
    gibbet: { x: TW / 2, y: GROUND_Y - 68, angle: 0, state: "idle", happyUntil: 0 },
    resources: [], // will be set below
    indicator: COLORS[Math.floor(Math.random() * 3)],
    target: null,
    network,
    collections: { red: 0, green: 0, blue: 0 },
    collectionHistory: { red: [], green: [], blue: [] }, // timestamps of collections
    correct: 0, total: 0,
    trainCount: 0, lastLoss: null, lossHistory: [],
    sparkles: [],
    lastNNTick: 0,
    lastIndicatorChange: Date.now(),
    lastFrame: Date.now(),
    upgradeLevels: { ...upgradeLevels },
    gibbetSpeed: BASE_GIBBET_SPEED,
    resourceRespawnMs: 650,
    // Weather
    weather: 0,
    weatherPhase: Math.random() * Math.PI * 2,
    config,
  };
  applyAllUpgrades(gs, upgradeLevels, UPGRADES);
  gs.resources = makeResources(gs);
  return gs;
}

// Build input vector for the network given current gs state
export function buildInputVec(gs) {
  if (gs.config.hasWeather) {
    // 4-element: one-hot(indicator) + weather scalar
    return [...gs.indicator.oneHot, gs.weather];
  }
  return gs.indicator.oneHot;
}

export function snapshot(gs) {
  const now = Date.now();
  const t = now * 0.002;
  const breathPhase = (Math.sin(t) + 1) / 2;
  const breath = Math.pow(breathPhase, 1.7);
  const bob = gs.gibbet.state === "idle" ? -4.5 * breath : 0;
  // Add gainEvent to snapshot if resource was just collected
  let gainEvent = null;
  if (gs._lastGain && now - gs._lastGain.time < 120) {
    gainEvent = { ...gs._lastGain };
  }
  return {
    now,
    cx: gs.gibbet.x, cy: gs.gibbet.y + bob,
    cAngle: gs.gibbet.angle, cState: gs.gibbet.state,
    resources: gs.resources.map(r => ({ ...r })),
    sparkles: gs.sparkles.map(s => ({ ...s })),
    indicator: gs.indicator,
    target: gs.target ? { ...gs.target } : null,
    collections: { ...gs.collections },
    correct: gs.correct, total: gs.total,
    trainCount: gs.trainCount, lastLoss: gs.lastLoss,
    lossHistory: gs.lossHistory.slice(),
    poisonedUntil: gs.poisonedUntil || 0,
    weather: gs.weather ?? 0,
    config: gs.config,
    gainEvent,
  };
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

export function evalNN(gs, gibbetId = 0) {
  const inputVec = buildInputVec(gs);
  const probs = nnForward(gs.network, inputVec);
  if (!Array.isArray(probs) || probs.length !== 3 || probs.some(v => !isFinite(v))) {
    gs.target = null; return;
  }
  const idx = probs.indexOf(Math.max(...probs));
  if (idx === -1 || !COLORS[idx]) { gs.target = null; return; }
  const colorId = COLORS[idx].id;
  const g = gs.gibbet;
  // Filter out resources claimed by other gibbets
  const candidates = gs.resources.filter(r => r.colorId === colorId && r.state === "active" && (r.claimedBy === null || r.claimedBy === gibbetId));
  if (!candidates.length) { gs.target = null; return; }
  const nearest = candidates.reduce((best, r) =>
    Math.hypot(r.x - g.x, r.y - g.y) < Math.hypot(best.x - g.x, best.y - g.y) ? r : best);
  nearest.claimedBy = gibbetId;
  gs.target = { resourceId: nearest.id, x: nearest.x, y: nearest.y, colorId };
  gs.sniffingUntil = Date.now() + 300 + Math.random() * 400;
}

export function gameTick(gs, UPGRADES_LIST) {
  const now = Date.now();
  const dt = Math.min((now - gs.lastFrame) / 1000, 0.08);
  gs.lastFrame = now;
  const g = gs.gibbet;

  // Weather update — slow organic drift
  if (gs.config.hasWeather) {
    gs.weatherPhase += dt * 0.18;
    // Layered sines for organic feel, clamped 0-1
    gs.weather = Math.max(0, Math.min(1,
      0.5 + 0.38 * Math.sin(gs.weatherPhase) + 0.14 * Math.sin(gs.weatherPhase * 2.7)
    ));
  }

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

  // Move gibbet
  if (gs.target) {
    // Sniffing pause before moving
    if (gs.sniffingUntil && now < gs.sniffingUntil) {
      g.angle += Math.sin(now * 0.018) * 0.08;
      g.state = "sniffing";
    } else {
      const dx = gs.target.x - g.x;
      const dy = gs.target.y - g.y;
      const d = Math.hypot(dx, dy);
      // Harvesting duration
      if (d < COLLECT_DIST) {
        // Start harvesting if not already
        if (g.harvestTarget !== gs.target.resourceId) {
          g.harvestTarget = gs.target.resourceId;
          g.harvestStarted = now;
          g.state = "harvesting";
        }
        const HARVEST_MS = 800;
        const harvestProgress = (now - g.harvestStarted) / HARVEST_MS;
        gs.harvestTarget = g.harvestTarget;
        gs.harvestProgress = Math.min(1, harvestProgress);
        if (harvestProgress >= 1) {
          const res = gs.resources.find(r => r.id === gs.target.resourceId);
          if (res && res.state === "active") {
            res.state = "fading"; res.stateAt = now;
            res.claimedBy = null;
            const col = COLORS.find(col => col.id === res.colorId);
            gs.sparkles.push(...makeSparkle(res.x, res.y, col.hex, now));
            const correct = isCorrectCollection(
              gs.target.colorId, gs.indicator.id, gs.config, gs.weather
            );
            if (correct) {
              let bonus = 0;
              if (gs.target.colorId === "red")   bonus = gs._redGatherBonus || 0;
              if (gs.target.colorId === "green") bonus = gs._greenGatherBonus || 0;
              if (gs.target.colorId === "blue")  bonus = gs._blueGatherBonus || 0;
              let crit = false;
              let amount = 1 + bonus;
              // Check for critical gathering (50% bonus)
              if (gs._criticalGather && Math.random() < gs._criticalGather) {
                crit = true;
                amount = Math.round(amount * 1.5);
              }
              gs.collections[gs.target.colorId] += amount;
              gs.collectionHistory[gs.target.colorId].push(now);
              gs.total++; gs.correct++;
              g.state = "happy"; g.happyUntil = now + 750;
              gs.lastNNTick = now + 600;
              // Track last gain for popup, include crit
              gs._lastGain = {
                colorId: gs.target.colorId,
                amount,
                time: now,
                hex: col.hex,
                crit,
              };
            } else {
              gs.poisonedUntil = now + 700;
              g.state = "poisoned"; g.happyUntil = now + 700;
              gs.sparkles.push(...makeSparkle(res.x, res.y, "#ef4444", now));
            }
            const cid = res.colorId;
            setTimeout(() => {
              // Use spawnResource for respawn placement (interspersed)
              const newPos = spawnResource(res.colorId);
              res.x = newPos.x;
              res.y = newPos.y;
              // If resource field bonus increased, add new resources
              if (gs._resourceFieldBonus && gs.resources.length < COLORS.length * (1 + gs._resourceFieldBonus)) {
                gs.resources.push(spawnResource(res.colorId));
              }
              res.state = "respawning"; res.stateAt = Date.now();
              setTimeout(() => { res.state = "active"; }, gs.resourceRespawnMs);
            }, 650);
          }
          g.harvestTarget = null;
          gs.target = null;
          gs.harvestTarget = null;
          gs.harvestProgress = 0;
        }
        // else: stay in place, keep harvesting
      } else {
        g.harvestTarget = null; // moved away, cancel harvest
        gs.harvestTarget = null;
        gs.harvestProgress = 0;
        // Path wandering
        const perpX = -dy / d;
        const perpY = dx / d;
        const driftAmp = Math.min(d * 0.15, 12);
        const drift = driftAmp * Math.sin(now * 0.004 + g.x * 0.05);
        // Speed variation
        const targetSpeed = gs.gibbetSpeed;
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
    gs.harvestTarget = null;
    gs.harvestProgress = 0;
  }

  if (g.state === "happy"   && now >= g.happyUntil)  g.state = "idle";
  if (g.state === "poisoned" && now >= (gs.poisonedUntil || 0)) g.state = "idle";
  gs.sparkles = gs.sparkles.filter(s => now - s.born < 600);

  // Prune collection history to last 60s
  for (const col of COLORS) {
    gs.collectionHistory[col.id] = gs.collectionHistory[col.id].filter(ts => now - ts < 60000);
  }
}

// Helper to get resource rate per second for each color
export function getResourceRate(gs) {
  const now = Date.now();
  const rates = {};
  for (const col of COLORS) {
    const arr = gs.collectionHistory[col.id] || [];
    rates[col.id] = arr.length / 60;
  }
  return rates;
}
