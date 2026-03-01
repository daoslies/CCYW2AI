import React from "react";
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

function brainAccuracy(brain) {
  // Dummy: returns 0-1 based on trainCount (replace with real logic)
  if (!brain || !brain.trainCount) return 0;
  return Math.min(1, brain.trainCount / 30);
}

export default function BrainsRoster({ onDragStart }) {
  const { brains, addBrain, usedBrainIds, activeTrainerId, setActiveTrainerId, getNetwork } = useWorld();
  const { setDraggingItem } = useDragStore();
  const { selected, select } = useSelection();

  const handleDragStart = (brain) => {
    setDraggingItem({ type: "brain", payload: brain });
    if (onDragStart) onDragStart(brain);
  };

  return (
    <RosterSection
      title="Brains"
      accent={R.accentBrain}
      action={
        <ActionButton
          variant="accent"
          size="sm"
          onClick={() => addBrain(NETWORK_CONFIG_T1, `Brain ${brains.length + 1}`)}
        >
          + New
        </ActionButton>
      }
    >
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
        return (
          <div key={brain.id} className={"roster-item" + (isSelected ? " selected" : "")}
            onClick={() => { select("brain", brain.id); setActiveTrainerId(brain.id); }}
            style={{ cursor: "pointer", background: isSelected ? "#23234a" : undefined }}>
            {/* Brain icon only is draggable */}
            <div style={{ width: 32, height: 32, display: "inline-block", verticalAlign: "middle", position: "relative" }}>
              <DraggableItem
                type="brain"
                id={brain.id}
                payload={brain}
                onDragStart={() => handleDragStart(brain)}
              >
                <span role="img" aria-label="brain" style={{ fontSize: 28, margin: 0, padding: 0, display: "block" }}>
                  🧠
                </span>
              </DraggableItem>
            </div>
            {/* Render rest of brain UI here, not draggable */}
            <RosterItem key={brain.id} dimmed={used && !isTraining}>
              <PredictionRing network={getNetwork(brain.id)} size={28} animTrigger={brain.trainCount} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: R.textPrimary,
                  fontSize: R.fontMd,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {brain.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
                    {brain.trainCount}× trained
                  </span>
                  <StatusPip used={used} usedLabel="in gibbet" />
                </div>
              </div>
              <ActionButton
                variant={isTraining ? "primary" : "default"}
                size="sm"
                disabled={used && !isTraining}
                onClick={() => setActiveTrainerId(brain.id)}
              >
                {isTraining ? "Training" : "Train"}
              </ActionButton>
            </RosterItem>
          </div>
        );
      })}
    </RosterSection>
  );
}
