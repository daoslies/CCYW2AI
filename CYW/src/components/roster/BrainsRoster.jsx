import React, { useState } from "react";
import { useWorld } from "../../store/worldStore.jsx";
import { useDragStore } from "../../store/dragStore.jsx";
import { RosterSection, RosterItem, StatusPip, ActionButton } from "./RosterSection.jsx";
import { R } from "../../styles/rosterTokens.js";
import { NETWORK_CONFIG_T1 } from "../../data/networkConfig.js";
import { COLORS } from "../../data/colors.js";
import PredictionRing from "./PredictionRing.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import { useSelection } from "../../store/selectionStore";
import { BRAIN_TYPES } from "../../data/brainTypes.js";
import { SlidePanel, PanelHeader } from "../shared/SlidePanel.jsx";
import { BrainTypeCard } from "./BrainTypeCard.jsx";
import { UI_ZOOM } from "../../constants.js";

function brainAccuracy(brain) {
  // Dummy: returns 0-1 based on trainCount (replace with real logic)
  if (!brain || !brain.trainCount) return 0;
  return Math.min(1, brain.trainCount / 30);
}

export function BrainIcon({ typeId, size = 28 }) {
  if (typeId === "weather") {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28">
        <text x="14" y="19" textAnchor="middle" fontSize="18">🧠</text>
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const r1 = 13, r2 = 16;
          const rad = (angle - 90) * Math.PI / 180;
          return (
            <line key={angle}
              x1={14 + r1 * Math.cos(rad)} y1={14 + r1 * Math.sin(rad)}
              x2={14 + r2 * Math.cos(rad)} y2={14 + r2 * Math.sin(rad)}
              stroke="#38bdf8" strokeWidth={1} opacity={0.7} />
          );
        })}
      </svg>
    );
  }
  return <span style={{ fontSize: size * 0.85 }}>🧠</span>;
}

export default function BrainsRoster({ onDragStart }) {
  const { brains, addBrain, usedBrainIds, activeTrainerId, setActiveTrainerId, getNetwork, weatherBrainUnlocked } = useWorld();
  const { setDraggingItem } = useDragStore();
  const { selected, select } = useSelection();

  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("standard");

  const handleDragStart = (brain) => {
    setDraggingItem({ type: "brain", payload: brain });
    if (onDragStart) onDragStart(brain);
  };

  const getUnlocked = (typeId) => {
    if (typeId === "weather") return weatherBrainUnlocked;
    return BRAIN_TYPES[typeId]?.unlocked;
  };

  // Type selection panel using SlidePanel and BrainTypeCard
  const typeSelectPanel = (
    <div
      onMouseLeave={() => setShowTypeSelect(false)}
      style={{ width: 'fit-content', margin: '0 auto' }}
    >
      <SlidePanel isActive={showTypeSelect} width={160} rightOffset={0}>
        <PanelHeader label="Select Brain Type" />
        <div style={{ width: "100%", maxWidth: 140, display: "flex", flexDirection: "column", gap: 8, overflowY: 'auto', minHeight: 0, boxSizing: 'border-box', paddingTop: 8, paddingBottom: 8 }}>
          {Object.values(BRAIN_TYPES).map(type => (
            <BrainTypeCard
              key={type.id}
              brainType={type}
              selected={BRAIN_TYPES[selectedTypeId]}
              onSelect={bt => setSelectedTypeId(bt.id)}
              style={{}}
            />
          ))}
        </div>
        <div style={{ width: '100%', marginTop: 12 }}>
          <button
            onClick={() => {
              addBrain(selectedTypeId, `Brain ${brains.length + 1}`);
              setShowTypeSelect(false);
            }}
            disabled={!getUnlocked(selectedTypeId)}
            style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: getUnlocked(selectedTypeId) ? "linear-gradient(135deg, #163020 0%, #0e2018 100%)" : "#0a0a12", color: getUnlocked(selectedTypeId) ? "#4ade80" : "#2a2a35", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: getUnlocked(selectedTypeId) ? "pointer" : "not-allowed", transition: "all 0.15s", boxShadow: getUnlocked(selectedTypeId) ? "0 0 0 1px #1e4028" : "0 0 0 1px #111118", fontFamily: "inherit" }}
          >
            Create
          </button>
          <button
            onClick={() => setShowTypeSelect(false)}
            style={{ width: "100%", padding: "6px 0", borderRadius: 8, border: "none", background: "none", color: "#333", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "color 0.15s", marginTop: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={e => e.currentTarget.style.color = "#333"}
          >
            Cancel
          </button>
        </div>
      </SlidePanel>
    </div>
  );

  return (
    <RosterSection
      title="Brains"
      accent={R.accentBrain}
      action={
        <ActionButton
          variant="accent"
          size="sm"
          onClick={() => setShowTypeSelect(true)}
        >
          + New
        </ActionButton>
      }
    >
      {typeSelectPanel}
      {brains.length === 0 && (
        <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
          No brains — create one to begin training
        </span>
      )}
      {brains.map(brain => {
        const used = usedBrainIds.has(brain.id);
        const isTraining = activeTrainerId === brain.id;
        const accuracy = brainAccuracy(brain);
        const isSelected = selected?.type === "brain" && selected?.id === brain.id;
        const brainType = BRAIN_TYPES[brain.typeId] || BRAIN_TYPES["standard"];
        const unlocked = getUnlocked(brainType.id);
        return (
          <div key={brain.id} className={"roster-item" + (isSelected ? " selected" : "")}
            onClick={() => { select("brain", brain.id); setActiveTrainerId(brain.id); }}
            style={{
              cursor: "pointer",
              background: isSelected ? "#23234a" : undefined,
              border: `2px solid ${brainType.accentColor}`,
              boxShadow: used ? `0 0 0 2px #222` : `0 0 0 2px ${brainType.accentColor}44`,
              transition: "border-color 0.2s, box-shadow 0.2s",
              opacity: unlocked ? 1 : 0.4,
              filter: unlocked ? "none" : "grayscale(0.8)",
            }}
            title={unlocked ? undefined : "Locked: Unlock via upgrades"}
          >
            <div style={{ width: 32, height: 32, display: "inline-block", verticalAlign: "middle", position: "relative" }}>
              <DraggableItem
                type="brain"
                id={brain.id}
                payload={brain}
                onDragStart={() => handleDragStart(brain)}
                className="wiggle-brainbody wiggle-brainbody-hover"
              >
                <BrainIcon typeId={brainType.id} size={28} />
              </DraggableItem>
            </div>
            <RosterItem key={brain.id} dimmed={used}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: brainType.accentColor, fontSize: R.fontMd, fontWeight: 600 }}>
                  {brain.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{
                    fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase",
                    color: brainType.accentColor, opacity: 0.7,
                  }}>
                    {brainType.label} · {brainType.inputLabels.length} inputs
                  </span>
                  <StatusPip used={used} usedLabel="in gibbet" />
                </div>
                <div style={{ color: R.textMuted, fontSize: 10, marginTop: 2 }}>
                  {brainType.description}
                </div>
              </div>
            </RosterItem>
            {!unlocked && <div style={{ position: "absolute", top: 4, right: 4, color: "#f87171", fontSize: 16 }}>🔒</div>}
            {used && (
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.08)",
                borderRadius: 8,
                pointerEvents: "none"
              }} />
            )}
          </div>
        );
      })}
    </RosterSection>
  );
}
