import { createContext, useContext, useState, useRef, useCallback, useMemo } from "react";
import { makeNetwork } from "../engine/nn";
import { NETWORK_CONFIG_T1 } from "../data/networkConfig";
import { GIBBET_BREEDS } from "../data/gibbet_breeds";
import { BRAIN_TYPES } from "../data/brainTypes";
import { BODY_TYPES } from "../data/bodyTypes";
import { generateGibbetName } from '../data/gibbetNames.js';

// Utility to generate random body color with more variety
function randomBodyColor() {
  // Pick a random color from a wide palette (not just skin tones)
  const palettes = [
    // Pastel
    () => `hsl(${Math.floor(Math.random()*360)},${38+Math.random()*22}%,${68+Math.random()*18}%)`,
    // Bright
    () => `hsl(${Math.floor(Math.random()*360)},${60+Math.random()*30}%,${50+Math.random()*30}%)`,
    // Muted
    () => `hsl(${Math.floor(Math.random()*360)},${20+Math.random()*30}%,${40+Math.random()*30}%)`,
    // Blue/green
    () => `hsl(${180+Math.floor(Math.random()*120)},${40+Math.random()*40}%,${40+Math.random()*40}%)`,
    // Pink/purple
    () => `hsl(${270+Math.floor(Math.random()*60)},${40+Math.random()*40}%,${60+Math.random()*30}%)`,
    // Orange/yellow
    () => `hsl(${30+Math.floor(Math.random()*60)},${50+Math.random()*40}%,${60+Math.random()*30}%)`,
  ];
  return palettes[Math.floor(Math.random()*palettes.length)]();
}

function createBrain(typeId = "standard", name = "Brain") {
  const brainType = BRAIN_TYPES[typeId] || BRAIN_TYPES["standard"];
  return {
    id: Math.floor(Math.random() * 1e8),
    type: "brain",
    typeId,
    name,
    config: brainType.config,
    trainCount: 0,
    lossHistory: [],
    createdAt: Date.now(),
  };
}

function createBody(typeId = "balanced", name) {
  const bodyType = BODY_TYPES.find(b => b.id === typeId) || BODY_TYPES[0];
  return {
    id: Math.floor(Math.random() * 1e8),
    type: "body",
    typeId,
    name: name ?? bodyType.label,
    color: randomBodyColor(),
    purchasedAt: Date.now(),
  };
}

function createGibbet(brainId, bodyId, name = "Gibbet", color) {
  return {
    id: Math.floor(Math.random() * 1e8),
    type: "gibbet",
    brainId,
    bodyId,
    name,
    color,
    createdAt: Date.now(),
    lifetimeCollections: { red: 0, green: 0, blue: 0 },
  };
}

export const WorldContext = createContext(null);

export function WorldProvider({ children }) {
  // Brains
  const [brains, setBrains] = useState([createBrain("standard", "Brain I")]);
  const networkMapRef = useRef(new Map()); // brainId → live network
  const getNetwork = useCallback((brainId) => {
    if (!networkMapRef.current.has(brainId)) {
      const brain = brains.find(b => b.id === brainId);
      if (brain) networkMapRef.current.set(brainId, makeNetwork(brain.config.layers));
    }
    return networkMapRef.current.get(brainId);
  }, [brains]);

  // Modified addBrain to use purchase handler from engine
  const addBrain = useCallback((typeId = "standard", name, onResourceDeduct) => {
    const brainType = BRAIN_TYPES[typeId] || BRAIN_TYPES["standard"];
    const cost = brainType.cost || { red: 1, green: 0, blue: 0 };
    if (onResourceDeduct && !onResourceDeduct(cost)) return null;
    const brain = createBrain(typeId, name);
    setBrains(prev => [...prev, brain]);
    return brain.id;
  }, []);

  const updateBrainMeta = useCallback((id, patch) => {
    setBrains(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  // Bodies
  const [bodies, setBodies] = useState([createBody("balanced", "Basic Body")]);

  // Modified addBody to use purchase handler from engine
  const addBody = useCallback((typeId = "balanced", name, onResourceDeduct) => {
    const bodyType = BODY_TYPES.find(b => b.id === typeId) || BODY_TYPES[0];
    const cost = bodyType.cost || { red: 0, green: 1, blue: 0 };
    if (onResourceDeduct && !onResourceDeduct(cost)) return null;
    const body = createBody(typeId, name);
    setBodies(prev => [...prev, body]);
    return body.id;
  }, []);

  // Gibbets
  const [gibbets, setGibbets] = useState([]);
  const usedBrainIds = useMemo(() => new Set(gibbets.map(g => g.brainId)), [gibbets]);
  const usedBodyIds = useMemo(() => new Set(gibbets.map(g => g.bodyId)), [gibbets]);

  const combineGibbet = useCallback((brainId, bodyId, name) => {
    if (usedBodyIds.has(bodyId)) return null; // Only block reused bodies
    const body = bodies.find(b => b.id === bodyId);
    // Use architect's pattern: if no name, generate one
    const gibbetName = name && name.trim() ? name : generateGibbetName();
    const gibbet = createGibbet(brainId, bodyId, gibbetName, body.color);
    setGibbets(prev => [...prev, gibbet]);
    return gibbet.id;
  }, [usedBodyIds, bodies]);

  const dissolveGibbet = useCallback((gibbetId) => {
    setGibbets(prev => prev.filter(g => g.id !== gibbetId));
  }, []);

  const updateGibbetMeta = useCallback((id, patch) => {
    setGibbets(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  // Increments gibbet.lifetimeCollections[colorId] by amount
  const incrementGibbetLifetimeCollection = useCallback((gibbetId, colorId, amount) => {
    setGibbets(prev => prev.map(g => {
      if (g.id !== gibbetId) return g;
      return {
        ...g,
        lifetimeCollections: {
          ...g.lifetimeCollections,
          [colorId]: (g.lifetimeCollections?.[colorId] || 0) + amount
        }
      };
    }));
  }, []);

  // Assignments
  const [assignments, setAssignments] = useState({ t1: [], t2: [] });
  const assignGibbet = useCallback((slotId, gibbetId) => {
    setAssignments(prev => ({
      ...prev,
      [slotId]: prev[slotId].includes(gibbetId) ? prev[slotId] : [...prev[slotId], gibbetId]
    }));
  }, []);
  const unassignGibbet = useCallback((slotId, gibbetId) => {
    setAssignments(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(id => id !== gibbetId)
    }));
  }, []);

  // Trainer
  const [activeTrainerId, setActiveTrainerId] = useState(brains[0]?.id ?? null);

  // Simulation state for gibbets (for roster animation)
  const [simStates, setSimStates] = useState({});
  const updateSimState = useCallback((gibbetId, stateSlice) => {
    setSimStates(prev => ({ ...prev, [gibbetId]: stateSlice }));
  }, []);

  // Unlock state for upgrades
  const [weatherBrainUnlocked, setWeatherBrainUnlocked] = useState(false);
  const [unlockedBodyTypes, setUnlockedBodyTypes] = useState(["balanced"]);
  const unlockBodyType = useCallback((typeId) => {
    setUnlockedBodyTypes(prev => prev.includes(typeId) ? prev : [...prev, typeId]);
  }, []);

  return (
    <WorldContext.Provider value={{
      brains, addBrain, getNetwork, updateBrainMeta, usedBrainIds,
      bodies, addBody, usedBodyIds,
      gibbets, combineGibbet, dissolveGibbet, updateGibbetMeta, incrementGibbetLifetimeCollection,
      assignments, assignGibbet, unassignGibbet,
      activeTrainerId, setActiveTrainerId,
      simStates, updateSimState,
      weatherBrainUnlocked, setWeatherBrainUnlocked,
      unlockedBodyTypes, unlockBodyType,
    }}>
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  return useContext(WorldContext);
}

// Note: getNetwork is only available via useWorld(), not as a named export.
