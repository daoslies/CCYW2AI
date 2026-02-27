import { createContext, useContext, useState, useRef, useCallback } from "react";
import { makeNetwork } from "../engine/nn";
import { NETWORK_CONFIG_T1, NETWORK_CONFIG_T2 } from "../data/networkConfig";

let _gibbetId = 0;
let _brainId = 0;

function createBrain(config = NETWORK_CONFIG_T1) {
  return {
    id: _brainId++,
    config,
    network: makeNetwork(config.layers),
    trainCount: 0,
    lossHistory: [],
    createdAt: Date.now(),
  };
}

export function createGibbet(name, config = NETWORK_CONFIG_T1, brainId = null) {
  return {
    id: _gibbetId++,
    name,
    config,
    brainId,
    createdAt: Date.now(),
    bio: `This is ${name}, a mysterious gibbet with untold potential.`,
    picture: null,
  };
}

export const GibbetContext = createContext(null);

export function GibbetProvider({ children }) {
  const [brains, setBrains] = useState(() => {
    const b1 = createBrain(NETWORK_CONFIG_T1);
    return [b1];
  });

  const [gibbets, setGibbets] = useState(() => {
    const b1 = brains[0];
    const g1 = createGibbet("Gibbet I", NETWORK_CONFIG_T1, b1.id);
    return [g1];
  });

  const networkMapRef = useRef(new Map());
  const getNetwork = (id) => {

    if (!networkMapRef.current.has(id)) {
      const gibbet = gibbets.find(g => g.id === id);
      const config = gibbet?.config ?? NETWORK_CONFIG_T1;

      networkMapRef.current.set(id, makeNetwork(config.layers));
    } else {

    }
    return networkMapRef.current.get(id);
  };

  const getBrain = useCallback((id) => brains.find(b => b.id === id), [brains]);

  const addBrain = useCallback((config = NETWORK_CONFIG_T1) => {
    const b = createBrain(config);
    setBrains(prev => [...prev, b]);
    return b.id;
  }, []);

  const addGibbet = useCallback((name, config, brainId = null) => {
    let bId = brainId;
    if (!bId) bId = addBrain(config);
    const g = createGibbet(name, config, bId);
    setGibbets(prev => [...prev, g]);
    return g.id;
  }, [addBrain]);

  const updateBrainMeta = useCallback((id, patch) => {
    setBrains(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const updateGibbetMeta = useCallback((id, patch) => {
    setGibbets(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  const [assignments, setAssignments] = useState({ t1: [], t2: [] });
  const [activeTrainerId, setActiveTrainerId] = useState(0);
  const [selectedGibbetId, setSelectedGibbetId] = useState(0);

  const assignGibbet = useCallback((slot, gibbetId) => {
    if (gibbetId != null) {
      const net = getNetwork(gibbetId);

    }
    setAssignments(prev => {
      const arr = prev[slot] || [];
      if (arr.includes(gibbetId)) return prev;
      return { ...prev, [slot]: [...arr, gibbetId] };
    });
  }, [getNetwork]);

  const unassignGibbet = useCallback((slot, gibbetId) => {
    setAssignments(prev => {
      const arr = prev[slot] || [];
      return { ...prev, [slot]: arr.filter(id => id !== gibbetId) };
    });
  }, []);

  const resetGibbet = useCallback((id) => {
    const gibbet = gibbets.find(g => g.id === id);
    const config = gibbet?.config ?? NETWORK_CONFIG_T1;
    // Reset brain network and metadata
    if (gibbet && gibbet.brainId != null) {
      setBrains(prev => prev.map(b =>
        b.id === gibbet.brainId
          ? { ...b, network: makeNetwork(config.layers), trainCount: 0, lossHistory: [] }
          : b
      ));
    }
  }, [gibbets]);

  const selectGibbet = useCallback((id) => setSelectedGibbetId(id), []);

  const ensureTerrariumAssignment = useCallback((slot) => {
    setAssignments(prev => {
      if (Array.isArray(prev[slot])) return prev;
      return { ...prev, [slot]: [] };
    });
  }, [gibbets]);

  return (
    <GibbetContext.Provider value={{
      gibbets,
      brains,
      assignments,
      activeTrainerId,
      getNetwork,
      getBrain,
      addBrain,
      addGibbet,
      updateBrainMeta,
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
