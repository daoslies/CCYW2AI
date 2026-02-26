import { createContext, useContext, useState, useRef, useCallback } from "react";
import { makeNetwork } from "../engine/nn";
import { NETWORK_CONFIG_T1, NETWORK_CONFIG_T2 } from "../data/networkConfig";

let _gibbetId = 0;
export function createGibbet(name, config = NETWORK_CONFIG_T1) {
  return {
    id: _gibbetId++,
    name,
    config,
    trainCount: 0,
    lossHistory: [],
    createdAt: Date.now(),
    bio: `This is ${name}, a mysterious gibbet with untold potential.`,
    picture: null, // can be a URL or null for now
  };
}

export const GibbetContext = createContext(null);

export function GibbetProvider({ children }) {
  const [gibbets, setGibbets] = useState(() => {
    const g1 = createGibbet("Gibbet I",  NETWORK_CONFIG_T1);
    return [g1];
  });

  const networkMapRef = useRef(new Map());
  const getNetwork = (id) => {
    console.log('[getNetwork] called for id:', id, 'current gibbets:', gibbets);
    if (!networkMapRef.current.has(id)) {
      const gibbet = gibbets.find(g => g.id === id);
      const config = gibbet?.config ?? NETWORK_CONFIG_T1;
      console.log(`[getNetwork] Creating network for gibbet ${id} with config`, config);
      networkMapRef.current.set(id, makeNetwork(config.layers));
    } else {
      console.log(`[getNetwork] Fetched existing network for gibbet ${id}`);
    }
    return networkMapRef.current.get(id);
  };

  // Assignments now use arrays for multi-gibbet support
  const [assignments, setAssignments] = useState({ t1: [], t2: [] });
  const [activeTrainerId, setActiveTrainerId] = useState(0);
  const [selectedGibbetId, setSelectedGibbetId] = useState(0); // default to first gibbet

  const addGibbet = useCallback((name, config) => {
    const g = createGibbet(name, config);
    networkMapRef.current.set(g.id, makeNetwork(config.layers));
    setGibbets(prev => [...prev, g]);
    return g.id;
  }, []);

  const updateGibbetMeta = useCallback((id, patch) => {
    setGibbets(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  // Assign a gibbet to a slot (add to array, no duplicates)
  const assignGibbet = useCallback((slot, gibbetId) => {
    if (gibbetId != null) {
      const net = getNetwork(gibbetId); // Ensure network exists
      console.log(`[assignGibbet] Assigning gibbet ${gibbetId} to slot ${slot}. Network exists:`, !!net);
    }
    setAssignments(prev => {
      const arr = prev[slot] || [];
      if (arr.includes(gibbetId)) return prev; // already assigned
      return { ...prev, [slot]: [...arr, gibbetId] };
    });
  }, [getNetwork]);

  // Unassign a gibbet from a slot
  const unassignGibbet = useCallback((slot, gibbetId) => {
    setAssignments(prev => {
      const arr = prev[slot] || [];
      return { ...prev, [slot]: arr.filter(id => id !== gibbetId) };
    });
  }, []);

  const resetGibbet = useCallback((id) => {
    const gibbet = gibbets.find(g => g.id === id);
    const config = gibbet?.config ?? NETWORK_CONFIG_T1;
    networkMapRef.current.set(id, makeNetwork(config.layers));
    updateGibbetMeta(id, { trainCount: 0, lossHistory: [] });
  }, [gibbets, updateGibbetMeta]);

  const selectGibbet = useCallback((id) => setSelectedGibbetId(id), []);

  // No more auto-assignment: just ensure slot is initialized as empty array
  const ensureTerrariumAssignment = useCallback((slot) => {
    setAssignments(prev => {
      if (Array.isArray(prev[slot])) return prev;
      return { ...prev, [slot]: [] };
    });
  }, [gibbets]);

  return (
    <GibbetContext.Provider value={{
      gibbets,
      assignments,
      activeTrainerId,
      getNetwork,
      addGibbet,
      updateGibbetMeta,
      assignGibbet,
      unassignGibbet,
      resetGibbet,
      setActiveTrainerId,
      selectedGibbetId,
      selectGibbet,
      ensureTerrariumAssignment,
    }}>
      {children}
    </GibbetContext.Provider>
  );
}

export function useGibbets() {
  return useContext(GibbetContext);
}
