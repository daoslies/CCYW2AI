import { React, useState } from "react";
import BrainsRoster from "../roster/BrainsRoster.jsx";
import BodiesRoster from "../roster/BodiesRoster.jsx";
import GibbetRoster from "../roster/GibbetRoster.jsx";
import { useWorld } from "../../store/worldStore.jsx";
import DropZone from "../dragdrop/DropZone.jsx";
import DragLayer from "../dragdrop/DragLayer.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import { useDragStore } from "../../store/dragStore.jsx";

export default function RightPanel({
  rightTab,
  setRightTab,
  upgradesSidebar,
  combineBrain,
  combineBody,
  onDropBrain,
  onDropBody,
  onCombine,
  onCancel,
  draggingBrain,
  draggingBody,
  brainsBuyMenuPanel,
  bodiesBuyMenuPanel,
}) {

  const { assignments, unassignGibbet } = useWorld();
  const { dragging } = useDragStore(); // was draggingItem

  console.log("RightPanel render - dragging:", dragging);

  const draggingBrainItem = dragging?.type === "brain" ? dragging.payload : null;
  const draggingBodyItem = dragging?.type === "body" ? dragging.payload : null;

  return (
    <>
      <div style={{
        width: 280,
        minWidth: 180,
        maxWidth: 340,
        background: "#0a0e1a",
        borderLeft: "1px solid #1a1e2a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        padding: "32px 0 0 0",
        maxHeight: "100vh",
        overflowY: "auto"
      }}>
        {/* Tab buttons */}
        <div style={{ display: "flex", gap: 0, width: "100%", marginBottom: 18 }}>
          <button
            onClick={() => setRightTab("upgrades")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderBottom: rightTab === "upgrades" ? "3px solid #60a5fa" : "1px solid #222",
              background: rightTab === "upgrades" ? "#181a22" : "#10101a",
              color: rightTab === "upgrades" ? "#60a5fa" : "#aaa",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 0
            }}
          >
            Upgrades
          </button>
          <button
            onClick={() => setRightTab("gibbets")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderBottom: rightTab === "gibbets" ? "3px solid #4ade80" : "1px solid #222",
              background: rightTab === "gibbets" ? "#181a22" : "#10101a",
              color: rightTab === "gibbets" ? "#4ade80" : "#aaa",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 12
            }}
          >
            Grow Gibbets
          </button>
        </div>
        {/* Tab content */}
        <div style={{ width: "100%" }}>
          {rightTab === "upgrades" && (
            <div style={{ padding: "0 20px 32px 20px" }}>
              {upgradesSidebar}
            </div>
          )}
          {rightTab === "gibbets" && (
            <div style={{ padding: "0 12px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              {brainsBuyMenuPanel}
              {bodiesBuyMenuPanel}
              <GibbetRoster />
            </div>
          )}
        </div>
      </div>
      {/* Remove CombinePanel from the scrollable content and render it as a fixed overlay */}
      <CombinePanel
        draggingBrain={draggingBrainItem}
        draggingBody={draggingBodyItem}
        combineBrain={combineBrain}
        combineBody={combineBody}
        onDropBrain={onDropBrain}
        onDropBody={onDropBody}
        onCombine={onCombine}
        onCancel={onCancel}
        isActive={!!draggingBrainItem || !!draggingBodyItem || !!combineBrain || !!combineBody}
      />
      <DragLayer renderItem={({ type, payload }) => {
        if (type === "brain") return (
          <span role="img" aria-label="brain" style={{ fontSize: 28, filter: "drop-shadow(0 4px 12px #7dd3fc88)" }}>🧠</span>
        );
        if (type === "body") return (
          <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #a78bfa88)" }}>
            <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={payload.color} />
          </svg>
        );
        if (type === "gibbet") return (
          <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #4ade8088)" }}>
            <Gibbet x={16} y={16} angle={0} state={"idle"} poisoned={false} gainPopups={[]} showEyes={true} color={payload.color} />
          </svg>
        );
        return null;
      }} />
      <DropZone
        accepts={["gibbet"]}
        onDrop={item => {
          const slot = Object.keys(assignments).find(slotId => (assignments[slotId] || []).includes(item.id));
          if (slot) {
            unassignGibbet(slot, item.id);
          }
        }}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 1,
          pointerEvents: "none",
        }}
        activeStyle={{
          pointerEvents: "auto",
          border: "2px dashed #f87171",
          background: "rgba(248,113,113,0.08)",
          zIndex: 1000,
        }}
      />
    </>
  );
}

function CornerTick({ corner, color, active }) {
  const size = 8;
  const thickness = 1.5;
  const positions = {
    topLeft:     { top: 6,    left: 6,  borderTop: `${thickness}px solid`, borderLeft:   `${thickness}px solid`, borderRight: "none", borderBottom: "none" },
    topRight:    { top: 6,    right: 6, borderTop: `${thickness}px solid`, borderRight:  `${thickness}px solid`, borderLeft:  "none", borderBottom: "none" },
    bottomLeft:  { bottom: 6, left: 6,  borderBottom: `${thickness}px solid`, borderLeft:  `${thickness}px solid`, borderRight: "none", borderTop: "none" },
    bottomRight: { bottom: 6, right: 6, borderBottom: `${thickness}px solid`, borderRight: `${thickness}px solid`, borderLeft:  "none", borderTop: "none"  },
  };
  return (
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderColor: active ? color : "#252530",
      transition: "border-color 0.2s",
      ...positions[corner],
    }} />
  );
}

function CombineSlot({ label, item, isDraggingCompatible, accentColor, icon, style }) {
  const isEmpty = !item;
  const isInvited = isEmpty && isDraggingCompatible;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 90,
      borderRadius: 10,
      background: isInvited
        ? `radial-gradient(ellipse at center, ${accentColor}18 0%, #020204 60%)`
        : "#020204",
      boxShadow: [
        "inset 0 2px 12px rgba(0,0,0,0.9)",
        "inset 0 0 0 1px rgba(0,0,0,0.8)",
        isInvited
          ? `0 0 0 1px ${accentColor}66, 0 0 20px ${accentColor}22`
          : "0 0 0 1px #111118",
      ].join(", "),
      transition: "box-shadow 0.2s ease, background 0.2s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      overflow: "hidden",
      ...style,
    }}>
      { ["topLeft", "topRight", "bottomLeft", "bottomRight"].map(corner => (
        <CornerTick key={corner} corner={corner} color={accentColor} active={isInvited} />
      )) }
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none",
        borderRadius: 10,
      }} />
      {item ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          zIndex: 1,
        }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{
            color: accentColor,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {item.name}
          </span>
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
          zIndex: 1,
          opacity: isInvited ? 1 : 0.35,
          transition: "opacity 0.2s",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: `2px dashed ${isInvited ? accentColor : "#333"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.2s",
            animation: isInvited ? "slotPulse 1.2s ease-in-out infinite" : "none",
          }}>
            <span style={{
              color: isInvited ? accentColor : "#333",
              fontSize: 18,
              lineHeight: 1,
              transition: "color 0.2s",
            }}>
              +
            </span>
          </div>
          <span style={{
            color: isInvited ? accentColor : "#444",
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            transition: "color 0.2s",
          }}>
            {isInvited ? "drop here" : label}
          </span>
        </div>
      )}
    </div>
  );
}

function CombinePanel({
  draggingBrain,
  draggingBody,
  combineBrain,
  combineBody,
  onDropBrain,
  onDropBody,
  onCombine,
  onCancel,
  isActive: isActiveProp,
}) {
  // Use isActive prop if provided, else fallback to old logic for safety
  const isActive = typeof isActiveProp === 'boolean'
    ? isActiveProp
    : !!(draggingBrain || draggingBody || combineBrain || combineBody);

  const canCombine = !!(combineBrain && combineBody);

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: "50%",
      width: 160,
      height: "auto",
      zIndex: 100,
      transform: isActive ? "translateY(-50%) translateX(0)" : "translateY(-50%) translateX(100%)",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: isActive ? "auto" : "none",
      background: "#0d0d16",
      borderLeft: "1px solid #1a1e2a",
      boxShadow: "-4px 0 32px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      borderRadius: 12,
      padding: 12,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 140,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ marginBottom: 6 }}>
          <p style={{
            color: "#333",
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: 0,
          }}>
            Combine Chamber
          </p>
        </div>
        <DropZone accepts={["brain"]} onDrop={onDropBrain}>
          <CombineSlot
            label="brain slot"
            item={combineBrain}
            isDraggingCompatible={!!draggingBrain}
            accentColor="#7dd3fc"
            icon="🧠"
            style={{ aspectRatio: "1 / 1", width: "100%", minHeight: 64, minWidth: 64, maxWidth: 96, maxHeight: 96 }}
          />
        </DropZone>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 4px",
          opacity: canCombine ? 1 : 0.3,
          transition: "opacity 0.3s",
        }}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #1a1a2a)" }} />
          <span style={{
            color: canCombine ? "#4ade80" : "#333",
            fontSize: 11,
            letterSpacing: "0.1em",
            transition: "color 0.3s",
          }}>
            +
          </span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #1a1a2a)" }} />
        </div>
        <DropZone accepts={["body"]} onDrop={onDropBody}>
          <CombineSlot
            label="body slot"
            item={combineBody}
            isDraggingCompatible={!!draggingBody}
            accentColor="#a78bfa"
            icon="🫀"
            style={{ aspectRatio: "1 / 1", width: "100%", minHeight: 64, minWidth: 64, maxWidth: 96, maxHeight: 96 }}
          />
        </DropZone>
        <div style={{
          height: canCombine ? 48 : 0,
          overflow: "hidden",
          transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <div style={{
            marginTop: 4,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#0a1a0e",
            border: "1px solid #1e4028",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <span style={{ color: "#4ade80", fontSize: 11, letterSpacing: "0.12em" }}>
              {combineBrain?.name} + {combineBody?.name}
            </span>
          </div>
        </div>
        <button
          disabled={!canCombine}
          onClick={() => canCombine && onCombine(combineBrain, combineBody)}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: canCombine
              ? "linear-gradient(135deg, #163020 0%, #0e2018 100%)"
              : "#0a0a12",
            color: canCombine ? "#4ade80" : "#2a2a35",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: canCombine ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            boxShadow: canCombine ? "0 0 0 1px #1e4028" : "0 0 0 1px #111118",
            fontFamily: "inherit",
          }}
          onMouseDown={e => canCombine && (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e =>   e.currentTarget.style.transform = "scale(1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {canCombine ? "Combine →" : "Fill both slots"}
        </button>
        {(combineBrain || combineBody) && (
          <button
            onClick={onCancel}
            style={{
              width: "100%",
              padding: "6px 0",
              borderRadius: 8,
              border: "none",
              background: "none",
              color: "#333",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={e => e.currentTarget.style.color = "#333"}
          >
            clear
          </button>
        )}
      </div>
    </div>
  );
}

export { CombinePanel };
