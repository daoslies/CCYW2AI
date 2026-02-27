import React from "react";
import { useWorld } from "../../store/worldStore.jsx";
import { RosterSection, RosterItem, StatusPip, ActionButton } from "./RosterSection.jsx";
import { R } from "../../styles/rosterTokens.js";
import Gibbet from "../gibbet/Gibbet.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import { COLORS } from "../../data/colors.js";

export default function BodiesRoster({ onDragStart, setDraggingBody }) {
  const { bodies, addBody, usedBodyIds } = useWorld();

  const handleDragStart = (body) => {
    if (setDraggingBody) setDraggingBody(body);
    if (onDragStart) onDragStart(body);
  };

  return (
    <RosterSection
      title="Bodies"
      accent={R.accentBody}
      action={
        <ActionButton
          variant="accent"
          size="sm"
          onClick={() => addBody("classic", `Body ${bodies.length + 1}`)}
        >
          + Acquire
        </ActionButton>
      }
    >
      {bodies.length === 0 && (
        <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
          No bodies — acquire one to house a brain
        </span>
      )}
      {bodies.map((body) => {
        const used = usedBodyIds.has(body.id);
        return (
          <div key={body.id} className="roster-item">
            <div style={{ width: 32, height: 32, display: "inline-block", verticalAlign: "middle", position: "relative" }}>
              <DraggableItem
                type="body"
                id={body.id}
                payload={body}
                onDragStart={() => handleDragStart(body)}
              >
                <svg width={32} height={32} style={{ display: "block", margin: 0, padding: 0 }}>
                  <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={body.color} />
                </svg>
              </DraggableItem>
            </div>
            <RosterItem key={body.id} dimmed={used}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: R.textPrimary, fontSize: R.fontMd, fontWeight: 500 }}>
                  {body.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
                    {body.breedId || body.template}
                  </span>
                  <StatusPip used={used} usedLabel="in gibbet" />
                </div>
              </div>
            </RosterItem>
          </div>
        );
      })}
    </RosterSection>
  );
}
