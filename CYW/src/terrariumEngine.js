// terrariumEngine.js
// Pure, parameterised game logic engine for all terrarium variants
import { COLORS } from "./colors";
import { nnForward, nnTrainStep } from "./nn";

export const TW = 480, TH = 270;
export const GROUND_Y = 205;
const BASE_CREATURE_SPEED = 88;
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
  const z = ZONES[colorId];
  return {
    id: _rid++, colorId,
    x: z.x0 + Math.random() * (z.x1 - z.x0),
    y: z.y0 + Math.random() * (z.y0 - z.y0),
    state: "active", stateAt: 0,
  };
}
export function makeResources() {
  return COLORS.flatMap(c => [spawnResource(c.id), spawnResource(c.id)]);
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
  gs.creatureSpeed = BASE_CREATURE_SPEED * (1 + (gs._speedBonus || 0));
  gs.resourceRespawnMs = 650 * (1 - (gs._respawnBonus || 0));
}

// Add resource collection history and rate calculation to gs
export function makeGS(network, upgradeLevels = {}, UPGRADES = [], config = {}) {
  const gs = {
    creature: { x: TW / 2, y: GROUND_Y - 68, angle: 0, state: "idle", happyUntil: 0 },
    resources: makeResources(),
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
    creatureSpeed: BASE_CREATURE_SPEED,
    resourceRespawnMs: 650,
    // Weather
    weather: 0,
    weatherPhase: Math.random() * Math.PI * 2,
    config,
  };
  applyAllUpgrades(gs, upgradeLevels, UPGRADES);
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
    weather: gs.weather ?? 0,
    config: gs.config,
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

export function evalNN(gs) {
  const inputVec = buildInputVec(gs);
  const probs = nnForward(gs.network, inputVec);
  if (!Array.isArray(probs) || probs.length !== 3 || probs.some(v => !isFinite(v))) {
    gs.target = null; return;
  }
  const idx = probs.indexOf(Math.max(...probs));
  if (idx === -1 || !COLORS[idx]) { gs.target = null; return; }
  const colorId = COLORS[idx].id;
  const c = gs.creature;
  const candidates = gs.resources.filter(r => r.colorId === colorId && r.state === "active");
  if (!candidates.length) { gs.target = null; return; }
  const nearest = candidates.reduce((best, r) =>
    Math.hypot(r.x - c.x, r.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? r : best);
  gs.target = { resourceId: nearest.id, x: nearest.x, y: nearest.y, colorId };
}

export function gameTick(gs, UPGRADES_LIST) {
  const now = Date.now();
  const dt = Math.min((now - gs.lastFrame) / 1000, 0.08);
  gs.lastFrame = now;
  const c = gs.creature;

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

  // Move creature
  if (gs.target) {
    const dx = gs.target.x - c.x;
    const dy = gs.target.y - c.y;
    const d = Math.hypot(dx, dy);

    if (d < COLLECT_DIST) {
      const res = gs.resources.find(r => r.id === gs.target.resourceId);
      if (res && res.state === "active") {
        res.state = "fading"; res.stateAt = now;
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
          gs.collections[gs.target.colorId] += 1 + bonus;
          gs.collectionHistory[gs.target.colorId].push(now); // record collection
          gs.total++; gs.correct++;
          c.state = "happy"; c.happyUntil = now + 750;
        } else {
          gs.poisonedUntil = now + 700;
          c.state = "poisoned"; c.happyUntil = now + 700;
          gs.sparkles.push(...makeSparkle(res.x, res.y, "#ef4444", now));
        }

        const cid = res.colorId;
        setTimeout(() => {
          const z = ZONES[cid];
          res.x = z.x0 + Math.random() * (z.x1 - z.x0);
          res.y = z.y0 + Math.random() * (z.y0 - z.y0);
          res.state = "respawning"; res.stateAt = Date.now();
          setTimeout(() => { res.state = "active"; }, gs.resourceRespawnMs);
        }, 650);
      }
      gs.target = null; gs.lastNNTick = 0;
    } else {
      const step = Math.min(gs.creatureSpeed * dt, d);
      c.x += (dx / d) * step;
      c.y += (dy / d) * step;
      c.angle = Math.atan2(dy, dx);
      if (c.state !== "happy" && c.state !== "poisoned") c.state = "moving";
    }
  } else {
    if (Math.random() < 0.014) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      c.x = Math.max(CZONE.x0, Math.min(CZONE.x1, c.x + Math.cos(a) * r));
      c.y = Math.max(CZONE.y0, Math.min(CZONE.y1, c.y + Math.sin(a) * r));
    }
    if (c.state !== "happy" && c.state !== "poisoned") c.state = "idle";
  }

  if (c.state === "happy"   && now >= c.happyUntil)  c.state = "idle";
  if (c.state === "poisoned" && now >= (gs.poisonedUntil || 0)) c.state = "idle";
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
