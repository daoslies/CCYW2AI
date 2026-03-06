import React, { useState } from "react";
import { useWorld } from '../../store/worldStore.jsx';
import { RosterSection, RosterItem, ActionButton } from "./RosterSection.jsx";
import { R } from "../../styles/rosterTokens.js";
import GibbetVisual from "../gibbet/GibbetVisual.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import { COLORS } from "../../data/colors.js";
import Gibbet from "../gibbet/Gibbet.jsx";
import { confidenceMultiplier } from '../../engine/terrariumEngine.js';
import { nnForward } from '../../engine/nn.js';
import { useSelection } from "../../store/selectionStore";
import { useDrag } from "../../store/dragStore.jsx";
import { generateGibbetName } from '../../data/gibbetNames.js';
import "../../styles/roster-actions.css";

const SLOT_LABELS = { t1: "T1", t2: "T2" };

export default function GibbetRoster() {
  const { gibbets, brains, bodies, assignments, assignGibbet, unassignGibbet, dissolveGibbet, simStates, getNetwork, setActiveTrainerId, updateGibbetMeta } = useWorld();
  const [confirmingDissolve, setConfirmingDissolve] = useState(null);
  const { selected, select } = useSelection();
  const { wasDragRef } = useDrag();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  function getSlotsForGibbet(gibbetId) {
    return Object.entries(assignments)
      .filter(([, arr]) => Array.isArray(arr) && arr.includes(gibbetId))
      .map(([slot]) => slot);
  }

  function updateName() {
    if (editingId != null && editValue.trim()) {
      updateGibbetMeta(editingId, { name: editValue.trim() });
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function regenerateName(id) {
    const newName = generateGibbetName();
    updateGibbetMeta(id, { name: newName });
    if (editingId === id) setEditValue(newName);
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
        const isSelected = selected?.type === "gibbet" && selected?.id === gibbet.id;
        const isConfirming = confirmingDissolve === gibbet.id;

        return (
          <div key={gibbet.id} className={"roster-item" + (isSelected ? " selected" : "")}
            onClick={(e) => {
              if (wasDragRef.current || !e.isTrusted || e.defaultPrevented) return;
              select("gibbet", gibbet.id);
              if (brain) setActiveTrainerId(brain.id);
            }}
            style={{ cursor: "pointer", background: isSelected ? "#23234a" : undefined, display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <DraggableItem
              payload={gibbet}
              type="gibbet"
              id={gibbet.id}
              disabled={false}
              className="wiggle-gibbet wiggle-gibbet-hover"
              style={{ display: "inline-block", marginRight: 0 }}
              onDragStart={() => {
                select("gibbet", gibbet.id);
                if (setActiveTrainerId) setActiveTrainerId(brain?.id);
              }}
            >
              <svg width={32} height={36} viewBox="0 0 40 44" style={{ verticalAlign: "middle" }}>
                <Gibbet x={20} y={22} angle={0} state={simState.state} poisoned={!!(simState.poisonedUntil && simState.now < simState.poisonedUntil)} gainPopups={[]} color={body?.color || gibbet.color} />
              </svg>
            </DraggableItem>
            <span style={{ color: R.textPrimary, fontSize: R.fontMd, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative', paddingRight: 60 }}>
              {editingId === gibbet.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => { updateName(); }}
                  onKeyDown={e => { if (e.key === 'Enter') updateName(); if (e.key === 'Escape') cancelEdit(); }}
                  style={{ fontSize: R.fontMd, fontWeight: 500, width: 90, borderRadius: 4, border: '1px solid #444', padding: '2px 6px' }}
                />
              ) : (
                <span
                  style={{ cursor: 'pointer', userSelect: 'text' }}
                  title={gibbet.name}
                >
                  {gibbet.name}
                </span>
              )}
            </span>
            <span className="roster-actions" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                tabIndex={-1}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginLeft: 2 }}
                title="Edit name"
                onClick={e => { e.stopPropagation(); setEditingId(gibbet.id); setEditValue(gibbet.name); }}
              >
                ✏️
              </button>
              <button
                tabIndex={-1}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginLeft: 2 }}
                title="Regenerate name"
                onClick={e => { e.stopPropagation(); regenerateName(gibbet.id); }}
              >
                🎲
              </button>
              <ActionButton
                variant="danger"
                size="sm"
                onClick={e => { e.stopPropagation(); setConfirmingDissolve(gibbet.id); }}
                style={{ marginLeft: 4 }}
              >
                ✕
              </ActionButton>
            </span>
            {isConfirming && (
              <div style={{
                position: 'absolute',
                right: 8,
                top: 36,
                zIndex: 10,
                background: '#181825',
                border: '1px solid #333',
                borderRadius: 6,
                padding: '6px 10px',
                boxShadow: '0 2px 8px #0008',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}>
                <span style={{ color: R.statusWarn, fontSize: 11 }}>Confirm?</span>
                <ActionButton variant="danger" size="sm"
                  onClick={() => { dissolveGibbet(gibbet.id); setConfirmingDissolve(null); }}>
                  confirm
                </ActionButton>
                <ActionButton size="sm"
                  onClick={() => setConfirmingDissolve(null)}>
                  cancel
                </ActionButton>
              </div>
            )}
          </div>
        );
      })}
    </RosterSection>
  );
}
