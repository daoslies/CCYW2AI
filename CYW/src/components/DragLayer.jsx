import { useDrag } from "../store/dragStore";
import Gibbet from "./Gibbet.jsx";
import { createPortal } from "react-dom";

export default function DragLayer({ renderItem }) {
  const { dragging } = useDrag();
  if (!dragging) return null;

  const { current, type, payload } = dragging;

  // Render only the icon/image for each type
  let content = null;
  if (type === "brain") {
    content = (
      <span role="img" aria-label="brain" style={{ fontSize: 28, filter: "drop-shadow(0 4px 12px #7dd3fc88)" }}>🧠</span>
    );
  } else if (type === "body") {
    content = (
      <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #a78bfa88)" }}>
        <Gibbet x={16} y={16} angle={0} state={"body"} poisoned={false} gainPopups={[]} showEyes={false} color={payload.color} />
      </svg>
    );
  } else if (type === "gibbet") {
    content = (
      <svg width={32} height={32} style={{ filter: "drop-shadow(0 4px 12px #4ade8088)" }}>
        <Gibbet x={16} y={16} angle={0} state={"idle"} poisoned={false} gainPopups={[]} showEyes={true} color={payload.color} />
      </svg>
    );
  }

  // Use position: fixed and transform to center the icon
  return createPortal(
    <div style={{
      position: "fixed",
      left: current.x,
      top:  current.y,
      transform: "translate(-50%, -50%) scale(1.08)",
      pointerEvents: "none",
      zIndex: 9999,
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
    }}>
      {content}
    </div>,
    document.body
  );
}
