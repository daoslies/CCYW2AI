import { createContext, useContext, useState, useCallback, useRef } from "react";
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
  };
}

export const GibbetContext = createContext(null);

export function GibbetProvider({ children }) {
  const [gibbets, setGibbets] = useState(() => {
    // Only create a single starter gibbet
    const g1 = createGibbet("Gibbet I", NETWORK_CONFIG_T1);
    return [g1];
  });

  const networkMapRef = useRef(new Map());
  const getNetwork = useCallback((id) => {
    if (!networkMapRef.current.has(id)) {
      const gibbet = gibbets.find(g => g.id === id);
      const config = gibbet?.config ?? NETWORK_CONFIG_T1;
      networkMapRef.current.set(id, makeNetwork(config.layers));
    }
    return networkMapRef.current.get(id);
  }, [gibbets]);

  const [assignments, setAssignments] = useState({ t1: 0, t2: null });
  const [activeTrainerId, setActiveTrainerId] = useState(0);

  const addGibbet = useCallback((name, config) => {
    const g = createGibbet(name, config);
    networkMapRef.current.set(g.id, makeNetwork(config.layers));
    setGibbets(prev => [...prev, g]);
    return g.id;
  }, []);

  const updateGibbetMeta = useCallback((id, patch) => {
    setGibbets(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  const assignGibbet = useCallback((slot, gibbetId) => {
    setAssignments(prev => ({ ...prev, [slot]: gibbetId }));
  }, []);

  const resetGibbet = useCallback((id) => {
    const gibbet = gibbets.find(g => g.id === id);
    const config = gibbet?.config ?? NETWORK_CONFIG_T1;
    networkMapRef.current.set(id, makeNetwork(config.layers));
    updateGibbetMeta(id, { trainCount: 0, lossHistory: [] });
  }, [gibbets, updateGibbetMeta]);

  return (
    <GibbetContext.Provider value={{
      gibbets,
      assignments,
      activeTrainerId,
      getNetwork,
      addGibbet,
      updateGibbetMeta,
      assignGibbet,
      resetGibbet,
      setActiveTrainerId,
    }}>
      {children}
    </GibbetContext.Provider>
  );
}

export function useGibbets() {
  return useContext(GibbetContext);
}
