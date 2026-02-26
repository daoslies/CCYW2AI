import React from "react";
import { useGibbets } from "../store/gibbetStore.jsx";
import { NETWORK_CONFIG_T1, NETWORK_CONFIG_T2 } from "../data/networkConfig";
import Gibbet from "./Gibbet.jsx";

const SLOT_LABELS = { t1: "T1", t2: "T2" };

function safeNum(val, fallback = 0) {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

export default function GibbetRoster() {
  const {
    gibbets,
    assignments,
    assignGibbet,
    unassignGibbet,
    activeTrainerId,
    setActiveTrainerId,
    addGibbet
  } = useGibbets();

  // Helper: find which slots (if any) a gibbet is assigned to
  function getSlotsForGibbet(gibbetId) {
    return Object.entries(assignments)
      .filter(([, arr]) => Array.isArray(arr) && arr.includes(gibbetId))
      .map(([slot]) => slot);
  }

  function handleAssign(gibbetId, slot) {
    assignGibbet(slot, gibbetId);
  }

  function handleUnassign(gibbetId, slot) {
    unassignGibbet(slot, gibbetId);
  }

  function handleAcquire() {
    // Alternate configs for demo
    const name = `Gibbet ${String.fromCharCode(65 + gibbets.length)}`;
    const config = gibbets.length % 2 === 0 ? NETWORK_CONFIG_T1 : NETWORK_CONFIG_T2;
    addGibbet(name, config);
  }

  return (
    <div style={{
      background: "#0a0a13",
      border: "1px solid #1a1a2a",
      borderRadius: 16,
      padding: 18,
      margin: 12,
      minWidth: 260,
      maxWidth: 320,
      color: "#e0e0f0",
      fontFamily: "inherit"
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, letterSpacing: 1 }}>GIBBET ROSTER</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {gibbets.map(gibbet => {
          const assignedSlots = getSlotsForGibbet(gibbet.id);
          return (
            <div key={gibbet.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 0",
              borderRadius: 8,
              background: activeTrainerId === gibbet.id ? "#1a1a2a" : "transparent"
            }}>
              <svg width={32} height={32} viewBox="-20 -10 40 40" style={{ marginRight: 6, flexShrink: 0 }}>
                <Gibbet x={safeNum(0)} y={safeNum(0)} angle={safeNum(0)} state="idle" poisoned={false} poisonAge={safeNum(0)} />
              </svg>
              <span style={{ flex: 1 }}>{gibbet.name}</span>
              {/* Multi-assign checkboxes for each slot */}
              {Object.keys(SLOT_LABELS).map(slotKey => (
                <label key={slotKey} style={{ marginRight: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={assignedSlots.includes(slotKey)}
                    onChange={e => {
                      if (e.target.checked) handleAssign(gibbet.id, slotKey);
                      else handleUnassign(gibbet.id, slotKey);
                    }}
                  />
                  {SLOT_LABELS[slotKey]}
                </label>
              ))}
              <button
                onClick={() => setActiveTrainerId(gibbet.id)}
                style={{
                  marginLeft: 8,
                  borderRadius: 6,
                  border: "none",
                  background: activeTrainerId === gibbet.id ? "#4ade80" : "#222240",
                  color: activeTrainerId === gibbet.id ? "#181828" : "#e0e0f0",
                  fontWeight: 600,
                  padding: "3px 10px",
                  cursor: "pointer"
                }}
              >
                {activeTrainerId === gibbet.id ? "Training" : "Train"}
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={handleAcquire}
        style={{
          marginTop: 18,
          width: "100%",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "8px 0",
          cursor: "pointer"
        }}
      >
        + Acquire new gibbet
      </button>
    </div>
  );
}
