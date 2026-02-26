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
    activeTrainerId,
    setActiveTrainerId,
    addGibbet
  } = useGibbets();

  // Helper: find which slot (if any) a gibbet is assigned to
  function getSlotForGibbet(gibbetId) {
    return Object.entries(assignments).find(([, id]) => id === gibbetId)?.[0] || null;
  }

  function handleAssign(gibbetId, slot) {
    assignGibbet(slot, gibbetId);
  }

  function handleUnassign(gibbetId) {
    // Unassign from all slots
    Object.entries(assignments).forEach(([slot, id]) => {
      if (id === gibbetId) assignGibbet(slot, null);
    });
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
          const slot = getSlotForGibbet(gibbet.id);
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
              <select
                value={slot || ""}
                onChange={e => {
                  const newSlot = e.target.value;
                  if (newSlot) handleAssign(gibbet.id, newSlot);
                  else handleUnassign(gibbet.id);
                }}
                style={{ borderRadius: 6, padding: "2px 6px", background: "#181828", color: "#e0e0f0" }}
              >
                <option value="">──</option>
                {Object.keys(SLOT_LABELS).map(slotKey => (
                  <option key={slotKey} value={slotKey}>{SLOT_LABELS[slotKey]}</option>
                ))}
              </select>
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
