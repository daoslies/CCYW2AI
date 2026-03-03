import { useState } from "react";
import { useSelection } from "../../store/selectionStore";
import { useWorld } from "../../store/worldStore";
import PredictionRing from "../roster/PredictionRing.jsx";
import GibbetVisual from "../gibbet/GibbetVisual.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import { BRAIN_TYPES } from "../../data/brainTypes.js";
import { BODY_TYPES } from "../../data/bodyTypes.js";

const TABS = [
  { id: "live",  label: "Live",  color: "#4ade80" },
  { id: "brain", label: "Brain", color: "#7dd3fc" },
  { id: "body",  label: "Body",  color: "#a78bfa" },
];

export default function SelectedEntityPanel() {
  const { selected } = useSelection();
  const [detailTab, setDetailTab] = useState("live");
  const { brains, bodies, gibbets, assignments, getNetwork, simStates } = useWorld();

  if (!selected) return <EmptyState />;

  // --- Gibbet: tabbed detail ---
  if (selected.type === "gibbet") {
    const gibbet = gibbets.find(g => g.id === selected.id);
    if (!gibbet) return null;
    const brain = brains.find(b => b.id === gibbet.brainId);
    const body  = bodies.find(b => b.id === gibbet.bodyId);
    const network = brain ? getNetwork(brain.id) : null;
    const simState = simStates?.[gibbet.id];
    const assignedSlots = Object.entries(assignments)
      .filter(([, ids]) => ids.includes(gibbet.id))
      .map(([slot]) => slot);
    // Default to LIVE tab on selection change
    // (If you want to reset tab on selection, add a useEffect here)
    return (
      <div style={{
        margin: "0 0 16px 0", // remove horizontal margin for full width
        background: "#0a0a13",
        border: "1px solid #1a1a2a",
        borderRadius: 12,
        overflow: "hidden",
        flexShrink: 0,
        minWidth: 0,
        width: "100%", // ensure full width of parent
        boxSizing: "border-box"
      }}>
        <EntityHeader selected={selected} brain={brain} body={body} gibbet={gibbet} simState={simState} assignedSlots={assignedSlots} network={network} />
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a2a" }}>
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              style={{
                flex: tab.id === "brain" ? 1.4 : 1,
                padding: "6px 0",
                border: "none",
                background: detailTab === tab.id ? "#0e0e1a" : "none",
                borderBottom: detailTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                color: detailTab === tab.id ? tab.color : "#333",
                fontSize: 9,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.12s, background 0.12s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{
          height: 140,
          overflowY: detailTab === "brain" ? "auto" : "hidden",
          padding: "10px 12px",
          boxSizing: "border-box",
        }}>
          {detailTab === "live"  && <GibbetLiveTab gibbet={gibbet} simState={simState} network={network} />}
          {detailTab === "brain" && <GibbetBrainTab brain={brain} network={network} />}
          {detailTab === "body"  && <GibbetBodyTab body={body} />}
        </div>
      </div>
    );
  }

  // --- Brain: simple detail ---
  if (selected.type === "brain") {
    const brain = brains.find(b => b.id === selected.id);
    if (!brain) return null;
    const network = getNetwork(brain.id);
    return (
      <div style={{
        margin: "0 0 16px 0", // remove horizontal margin for full width
        background: "#0a0a13",
        border: "1px solid #1a1a2a",
        borderRadius: 12,
        overflow: "hidden",
        flexShrink: 0,
        minWidth: 0,
        width: "100%", // ensure full width of parent
        boxSizing: "border-box"
      }}>
        <EntityHeader selected={selected} brain={brain} network={network} />
        <BrainDetail brain={brain} network={network} />
      </div>
    );
  }

  // --- Body: simple detail ---
  if (selected.type === "body") {
    const body = bodies.find(b => b.id === selected.id);
    if (!body) return null;
    return (
      <div style={{
        margin: "0 0 16px 0", // remove horizontal margin for full width
        background: "#0a0a13",
        border: "1px solid #1a1a2a",
        borderRadius: 12,
        overflow: "hidden",
        flexShrink: 0,
        minWidth: 0,
        width: "100%", // ensure full width of parent
        boxSizing: "border-box"
      }}>
        <EntityHeader selected={selected} body={body} />
        <BodyDetail body={body} />
      </div>
    );
  }

  // --- Terrarium: stub ---
  if (selected.type === "terrarium") {
    return <TerrariumPanel slotId={selected.id} />;
  }

  return null;
}

function EntityHeader({ selected, brain, body, gibbet, simState, assignedSlots, network }) {
  // Visual: show entity type visual (see design)
  let visual = null, name = "", subtitle = "", liveState = null;
  if (selected.type === "gibbet") {
    // Prefer body, but fallback to gibbet.color if body is missing
    let fallbackColor = "#7dd3fc";
    if (!body) {
      fallbackColor = gibbet?.color || fallbackColor;
      console.warn("Gibbet selected but body is missing:", gibbet);
    }
    visual = <GibbetVisual simState={simState} body={body} size={24} fallbackColor={fallbackColor} />;
    name = gibbet?.name ?? "Unknown";
    subtitle = assignedSlots?.length ? `in ${assignedSlots.join(", ")}` : "unassigned";
    liveState = simState?.state;
  } else if (selected.type === "brain") {
    visual = <PredictionRing network={network} size={24} animTrigger={brain.trainCount} />;
    name = brain?.name ?? "Unknown";
    subtitle = `${brain?.trainCount ?? 0}× trained`;
  } else if (selected.type === "body") {
    visual = (
      <svg width={24} height={24} viewBox="-20 -10 40 42">
        <Gibbet x={0} y={0} angle={0} state="idle" poisoned={false} gainPopups={[]} />
      </svg>
    );
    name = body?.name ?? "Unknown";
    subtitle = body?.breedId ?? "classic";
  }
  return (
    <div style={{
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: "1px solid #111118",
    }}>
      {visual}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: "#e0e0f0", fontSize: 13, fontWeight: 600,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{name}</div>
        <div style={{ color: "#444", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>
          {subtitle}
          {liveState && (
            <span style={{ marginLeft: 6, color: liveState === "poisoned" ? "#f87171" : liveState === "harvesting" ? "#4ade80" : "#555" }}>
              · {liveState}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GibbetLiveTab({ gibbet, simState, network }) {
  // Show brain/body type info and compatibility insight
  const { brains, bodies } = useWorld();
  const brain = brains.find(b => b.id === gibbet.brainId);
  const body = bodies.find(b => b.id === gibbet.bodyId);
  const brainType = brain ? BRAIN_TYPES[brain.typeId] || BRAIN_TYPES["standard"] : null;
  const bodyType = body ? BODY_TYPES.find(bd => bd.id === body.typeId) || BODY_TYPES[0] : null;

  // Simple compatibility logic: e.g., weather-aware brains are best with inverter bodies
  let compatibility = "Normal";
  let compatColor = "#aaa";
  if (brainType && bodyType) {
    if (brainType.weatherAware && bodyType.id === "inverter") {
      compatibility = "Synergy: Weather brain + Inverter body";
      compatColor = "#38bdf8";
    } else if (brainType.id === "standard" && bodyType.id !== "balanced") {
      compatibility = "Suboptimal: Standard brain with specialist body";
      compatColor = "#f87171";
    } else {
      compatibility = "Normal";
      compatColor = "#aaa";
    }
  }

  return (
    <div style={{ color: "#4ade80", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {brainType && (
          <span title={brainType.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 18 }}>{brainType.icon === "weather" ? "🧠" : "🧠"}</span>
            <span style={{ color: brainType.accentColor, fontWeight: 600 }}>{brainType.label}</span>
          </span>
        )}
        {bodyType && (
          <span title={bodyType.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 18 }}>🫀</span>
            <span style={{ color: bodyType.accentColor, fontWeight: 600 }}>{bodyType.label}</span>
          </span>
        )}
      </div>
      <div style={{ color: compatColor, fontSize: 12, fontWeight: 500 }}>{compatibility}</div>
      {/* ...existing or future live stats... */}
    </div>
  );
}

function GibbetBrainTab({ brain, network }) {
  // TODO: Fill in with brain stats, prediction ring, etc.
  return <div style={{ color: "#7dd3fc" }}>Brain info for {brain?.name}</div>;
}
function GibbetBodyTab({ body }) {
  // TODO: Fill in with body stats, etc.
  return <div style={{ color: "#a78bfa" }}>Body info for {body?.name}</div>;
}
function BrainDetail({ brain, network }) {
  // TODO: Fill in with brain stats, prediction ring, etc.
  return <div style={{ color: "#7dd3fc" }}>Brain info for {brain?.name}</div>;
}
function BodyDetail({ body }) {
  // TODO: Fill in with body stats, etc.
  return <div style={{ color: "#a78bfa" }}>Body info for {body?.name}</div>;
}
function TerrariumPanel({ slotId }) {
  return <div style={{ padding: 16, color: "#60a5fa" }}>Terrarium: {slotId}</div>;
}
function EmptyState() {
  return (
    <div style={{ padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4 }}>
      <div style={{ color: "#333", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center" }}>
        select a gibbet,<br />brain, or body<br />to inspect
      </div>
    </div>
  );
}
