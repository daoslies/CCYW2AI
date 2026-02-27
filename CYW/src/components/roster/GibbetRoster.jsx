import React, { useState } from "react";
import { useWorld } from '../../store/worldStore.jsx';
import { RosterSection, RosterItem, ActionButton } from "./RosterSection.jsx";
import { R } from "../../styles/rosterTokens.js";
import GibbetVisual from "../gibbet/GibbetVisual.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import { COLORS } from "../../data/colors.js";
import Gibbet from "../gibbet/Gibbet.jsx";

const SLOT_LABELS = { t1: "T1", t2: "T2" };

export default function GibbetRoster() {
  const { gibbets, brains, bodies, assignments, assignGibbet, unassignGibbet, dissolveGibbet, simStates } = useWorld();
  const [confirmingDissolve, setConfirmingDissolve] = useState(null);

  function getSlotsForGibbet(gibbetId) {
    return Object.entries(assignments)
      .filter(([, arr]) => Array.isArray(arr) && arr.includes(gibbetId))
      .map(([slot]) => slot);
  }

  return (
    <RosterSection title="Gibbets" accent={R.accentGibbet}>
      {gibbets.length === 0 && (
        <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
          Combine a brain + body to create a gibbet
        </span>
      )}
      {gibbets.map(gibbet => {
        const assignedSlots = getSlotsForGibbet(gibbet.id);
        const brain = brains.find(b => b.id === gibbet.brainId);
        const body  = bodies.find(b => b.id === gibbet.bodyId);
        const simState = simStates[gibbet.id] || { state: gibbet.state || "idle", poisonedUntil: gibbet.poisoned ? Date.now() + 10000 : 0, now: Date.now() };
        const isConfirming = confirmingDissolve === gibbet.id;
        const isAssigned = assignedSlots.length > 0;
        return (
          <div key={gibbet.id} className="roster-item">
            <DraggableItem
              payload={gibbet}
              type="gibbet"
              id={gibbet.id}
              disabled={false}
              className="draggable-icon"
              style={{ display: "inline-block", marginRight: 12 }}
            >
              <svg width={40} height={44} viewBox="0 0 40 44" style={{ verticalAlign: "middle" }}>
                <Gibbet x={20} y={22} angle={0} state={simState.state} poisoned={!!(simState.poisonedUntil && simState.now < simState.poisonedUntil)} gainPopups={[]} color={body?.color || gibbet.color} />
              </svg>
            </DraggableItem>
            <RosterItem key={gibbet.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: R.textPrimary, fontSize: R.fontMd, fontWeight: 500 }}>
                  {gibbet.name}
                </div>
                <div style={{ color: R.textMuted, fontSize: R.fontSm, marginTop: 1 }}>
                  {brain?.name ?? "?"} · {body?.name ?? "?"}
                </div>
                {/* Slot assignment row */}
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  {Object.keys(SLOT_LABELS).map(slot => {
                    const assigned = assignedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => assigned
                          ? unassignGibbet(slot, gibbet.id)
                          : assignGibbet(slot, gibbet.id)}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontSize: "9px",
                          letterSpacing: R.tracking,
                          fontWeight: 600,
                          border: assigned
                            ? `1px solid ${R.accentGibbet}66`
                            : "1px solid #1a1a2a",
                          background: assigned ? "#0e2018" : R.bgAction,
                          color: assigned ? R.accentGibbet : R.textMuted,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textTransform: "uppercase",
                          transition: "all 0.12s",
                        }}
                      >
                        {SLOT_LABELS[slot]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Dissolve — inline confirmation */}
              {!isConfirming ? (
                <ActionButton
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmingDissolve(gibbet.id)}
                >
                  ✕
                </ActionButton>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                  {isAssigned && (
                    <span style={{ color: R.statusWarn, fontSize: "8px", letterSpacing: R.tracking }}>
                      will unassign
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 4 }}>
                    <ActionButton variant="danger" size="sm"
                      onClick={() => { dissolveGibbet(gibbet.id); setConfirmingDissolve(null); }}>
                      confirm
                    </ActionButton>
                    <ActionButton size="sm"
                      onClick={() => setConfirmingDissolve(null)}>
                      cancel
                    </ActionButton>
                  </div>
                </div>
              )}
            </RosterItem>
          </div>
        );
      })}
    </RosterSection>
  );
}
