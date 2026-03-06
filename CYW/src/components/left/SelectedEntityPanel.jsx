import { useState } from "react";
import { useSelection } from "../../store/selectionStore";
import { useWorld } from "../../store/worldStore";
import PredictionRing from "../roster/PredictionRing.jsx";
import GibbetVisual from "../gibbet/GibbetVisual.jsx";
import Gibbet from "../gibbet/Gibbet.jsx";
import { BRAIN_TYPES } from "../../data/brainTypes.js";
import { BODY_TYPES } from "../../data/bodyTypes.js";
import { COLORS } from "../../data/colors.js";
import { confidenceMultiplier } from '../../engine/terrariumEngine.js';
import { nnForward } from '../../engine/nn.js';
import ResourceIcon from "../shared/ResourceIcon.jsx";

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
    if (!body) {
      // Defensive: body missing, show fallback or warning
      return (
        <div style={{ color: '#f87171', padding: 16 }}>
          Body not found for this gibbet.
        </div>
      );
    }
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
          // height: 140, // REMOVE fixed height to allow content to grow
          overflowY: detailTab === "brain" ? "auto" : "hidden",
          padding: "10px 12px",
          boxSizing: "border-box",
        }}>
          {detailTab === "live"  && <GibbetLiveTab gibbet={gibbet} simState={simState} network={network} />}
          {detailTab === "brain" && <GibbetBrainTab brain={brain} network={network} gibbet={gibbet} body={body} />}
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

  // Lifetime stats
  const collections = gibbet.lifetimeCollections || { red: 0, green: 0, blue: 0 };
  const createdAt = gibbet.createdAt;
  const now = Date.now();
  const ageMs = now - createdAt;
  const ageSec = Math.floor(ageMs / 1000) % 60;
  const ageMin = Math.floor(ageMs / 60000);
  const ageStr = `${ageMin}m ${ageSec}s`;

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
      <div style={{ color: '#e0e0f0', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <b>Lifetime Collection:</b>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ResourceIcon colorId="red" size={16} style={{ marginRight: 2 }} />
          <span style={{ color: '#f87171', minWidth: 18, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{collections.red}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ResourceIcon colorId="green" size={16} style={{ marginRight: 2 }} />
          <span style={{ color: '#4ade80', minWidth: 18, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{collections.green}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ResourceIcon colorId="blue" size={16} style={{ marginRight: 2 }} />
          <span style={{ color: '#60a5fa', minWidth: 18, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{collections.blue}</span>
        </span>
      </div>
      <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>
        <b>Age:</b> {ageStr}
      </div>
    </div>
  );
}

function GibbetBrainTab({ brain, network, gibbet, body }) {
  if (!brain || !network) return <div style={{ color: "#7dd3fc" }}>No brain info available.</div>;
  return (
    <div style={{ color: "#7dd3fc" }}>
      <div style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>
        {brain?.name ?? "?"} · {body?.name ?? "?"}
      </div>
      {/* Prediction ring (if available) */}
      <div style={{ marginBottom: 10 }}>
        <PredictionRing network={network} size={48} animTrigger={brain.trainCount} />
      </div>
      {/* Input→Output mapping with confidence and multiplier */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
        {COLORS.map(inputColor => {
          const probs = nnForward(network, inputColor.oneHot);
          const maxIdx = probs.indexOf(Math.max(...probs));
          const outputColor = COLORS[maxIdx];
          const confidence = probs[maxIdx];
          const mult = confidenceMultiplier(network, inputColor.id);
          const isCorrect = outputColor.id === inputColor.id;
          return (
            <div key={inputColor.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {/* Input dot */}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: inputColor.hex, flexShrink: 0, boxShadow: `0 0 4px ${inputColor.glow}` }} />
              {/* Arrow */}
              <span style={{ color: "#333", fontSize: 9 }}>→</span>
              {/* Output dot */}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: outputColor.hex, flexShrink: 0, boxShadow: `0 0 4px ${outputColor.glow}`, opacity: 0.4 + confidence * 0.6 }} />
              {/* Multiplier — coloured by correctness */}
              <span style={{ fontSize: 9, letterSpacing: "0.08em", color: isCorrect ? "#4ade80" : "#f87171", fontWeight: 600, minWidth: 28 }}>
                ×{mult.toFixed(2)}
              </span>
              {/* Confidence bar */}
              <div style={{ flex: 1, height: 2, borderRadius: 1, background: "#1a1a2a", overflow: "hidden" }}>
                <div style={{ width: `${confidence * 100}%`, height: "100%", background: isCorrect ? "#4ade80" : "#f87171", transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GibbetBodyTab({ body }) {
  // TODO: Fill in with body stats, etc.
  return <div style={{ color: "#a78bfa" }}>Body info for {body?.name}</div>;
}

function BrainDetail({ brain, network }) {
  // For standalone brain selection (not via gibbet)
  return <GibbetBrainTab brain={brain} network={network} />;
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
        no creature selected<br />pick a gibbet, brain, or body<br />to inspect
      </div>
    </div>
  );
}
