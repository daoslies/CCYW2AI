import React, { useState, useEffect } from "react";
import { useWorld } from "../../store/worldStore.jsx";
import { RosterSection, RosterItem, StatusPip, ActionButton } from "./RosterSection.jsx";
import { R } from "../../styles/rosterTokens.js";
import Gibbet from "../gibbet/Gibbet.jsx";
import DraggableItem from "../dragdrop/DraggableItem.jsx";
import { COLORS } from "../../data/colors.js";
import { useSelection } from "../../store/selectionStore";
import { BODY_TYPES } from "../../data/bodyTypes.js";
import { SlidePanel, PanelHeader } from "../shared/SlidePanel.jsx";
import { BodyTypeCard } from "./BodyTypeCard.jsx";
import { UI_ZOOM } from "../../constants.js";
import { useDrag } from "../../store/dragStore.jsx";

function MultiplierBars({ multipliers }) {
  const COLORS_ORDER = ["red", "green", "blue"];
  const max = Math.max(...COLORS_ORDER.map(c => multipliers[c] ?? 0), 1);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 22, marginTop: 4 }}>
      {COLORS_ORDER.map(colorId => {
        const color = COLORS.find(c => c.id === colorId);
        const val = multipliers[colorId] ?? 0;
        const heightPct = (val / max) * 100;
        return (
          <div key={colorId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{
              width: 8,
              height: `${Math.max(4, heightPct * 0.18)}px`,
              background: val >= 1 ? color.hex : "#333",
              borderRadius: 3,
              opacity: val === 0 ? 0.2 : 0.85,
              boxShadow: val >= 1 ? `0 0 4px ${color.hex}66` : undefined,
              transition: "height 0.2s, box-shadow 0.2s",
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function BodiesRoster({ onDragStart, setDraggingBody, onResourceDeduct, injectPanel }) {
  const { bodies, addBody, usedBodyIds, gibbets, unlockedBodyTypes } = useWorld();
  const { selected, select } = useSelection();
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("balanced");
  const { wasDragRef } = useDrag();

  // Always re-render when unlock state changes
  useEffect(() => {
    if (injectPanel) {
      injectPanel(
        <BodiesRoster
          onDragStart={onDragStart}
          setDraggingBody={setDraggingBody}
          onResourceDeduct={onResourceDeduct}
        />
      );
    }
    // eslint-disable-next-line
  }, [bodies, unlockedBodyTypes]);

  const handleDragStart = (body) => {
    if (setDraggingBody) setDraggingBody(body);
    if (onDragStart) onDragStart(body);
  };

  const getUnlocked = (typeId) => unlockedBodyTypes.includes(typeId);

  // Type selection panel using SlidePanel and BodyTypeCard
  const typeSelectPanel = (
    <div
      onMouseLeave={() => setShowTypeSelect(false)}
      style={{ width: 'fit-content', margin: '0 auto' }}
    >
      <SlidePanel isActive={showTypeSelect} width={160} rightOffset={0}>
        <PanelHeader label="Select Body Type" />
        <div style={{ width: "100%", maxWidth: 140, display: "flex", flexDirection: "column", gap: 8, overflowY: 'auto', minHeight: 0, boxSizing: 'border-box', paddingTop: 8, paddingBottom: 8 }}>
          {BODY_TYPES.map((type, i) => (
            <BodyTypeCard
              key={type.id}
              bodyType={type}
              selected={BODY_TYPES.find(b => b.id === selectedTypeId)}
              isUnlocked={getUnlocked(type.id)}
              onSelect={bt => {
                if (getUnlocked(bt.id)) {
                  addBody(bt.id, `Body ${bodies.length + 1}`, onResourceDeduct);
                  setShowTypeSelect(false);
                } else {
                  setSelectedTypeId(bt.id);
                }
              }}
              style={{}}
            />
          ))}
        </div>
        {/* Remove buy button, keep only Cancel */}
        <div style={{ flex: '0 0 auto', marginTop: 12, padding: '0 0 18px 0' }}>
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
      title="Bodies"
      accent={R.accentBody}
      action={
        <ActionButton
          variant="accent"
          size="sm"
          onClick={() => setShowTypeSelect(true)}
        >
          + Acquire
        </ActionButton>
      }
    >
      {typeSelectPanel}
      {bodies.length === 0 && (
        <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
          No bodies — acquire one to house a brain
        </span>
      )}
      {bodies.map((body) => {
        const used = usedBodyIds.has(body.id);
        const isSelected = selected?.type === "body" && selected?.id === body.id;
        const usingGibbet = used ? gibbets.find(g => g.bodyId === body.id) : null;
        const bodyType = BODY_TYPES.find(b => b.id === body.typeId) || BODY_TYPES[0];
        // Use store unlock state for this type
        const unlocked = getUnlocked(bodyType.id);
        return (
          <div
            key={body.id}
            className={"roster-item" + (isSelected ? " selected" : "")}
            onClick={used ? undefined : (e) => {
              if (wasDragRef.current || !e.isTrusted || e.defaultPrevented) return; // Only handle real clicks, not drag
              select("body", body.id);
            }}
            style={{
              cursor: "pointer",
              background: isSelected ? "#23234a" : undefined,
              opacity: used ? 0.5 : unlocked ? 1 : 0.4,
              filter: unlocked ? "none" : "grayscale(0.8)",
              pointerEvents: "auto",
              position: "relative",
              border: `2px solid ${bodyType.accentColor}`,
              boxShadow: used ? `0 0 0 2px #222` : `0 0 0 2px ${bodyType.accentColor}44`,
              transition: "border-color 0.2s, box-shadow 0.2s"
            }}
            title={unlocked ? (used ? `This body is already in use${usingGibbet ? ` (in ${usingGibbet.name})` : ''}` : undefined) : "Locked: Unlock via upgrades"}
          >
            <div style={{ width: 32, height: 32, display: "inline-block", verticalAlign: "middle", position: "relative" }}>
              {used ? (
                <svg width={32} height={32} style={{ display: "block", margin: 0, padding: 0 }}>
                  <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={body.color} />
                </svg>
              ) : (
                <DraggableItem
                  type="body"
                  id={body.id}
                  payload={body}
                  onDragStart={() => select("body", body.id)}
                  className="wiggle-brainbody wiggle-brainbody-hover"
                >
                  <svg width={32} height={32} style={{ display: "block", margin: 0, padding: 0 }}>
                    <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={body.color} />
                  </svg>
                </DraggableItem>
              )}
            </div>
            <RosterItem key={body.id} dimmed={used}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: bodyType.accentColor, fontSize: R.fontMd, fontWeight: 600 }}>
                  {body.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
                    {bodyType.label}
                  </span>
                  <StatusPip used={used} usedLabel="in gibbet" />
                </div>
                <div style={{ color: R.textMuted, fontSize: 10, marginTop: 2 }}>
                  {bodyType.description}
                </div>
                <MultiplierBars multipliers={bodyType.multipliers} />
                {used && usingGibbet && (
                  <div style={{ color: '#7dd3fc', fontSize: 10, marginTop: 2 }}>
                    In: <span style={{ fontWeight: 600 }}>{usingGibbet.name}</span>
                  </div>
                )}
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
