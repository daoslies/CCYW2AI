import React, { useRef } from "react";
import { useDrag } from "../store/dragStore";

export default function DraggableItem({ type, id, payload, children }) {
  const { dragging, startDrag } = useDrag();
  const isDragging = dragging?.id === id && dragging?.type === type;
  const ref = useRef();

  return (
    <div
      ref={ref}
      onPointerDown={e => startDrag(type, id, payload, e, ref.current)}
      style={{
        opacity:   isDragging ? 0.18 : 1,
        transform: isDragging ? "scale(0.92)" : "scale(1)",
        transition: isDragging ? "none" : "opacity 0.15s, transform 0.15s",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {children}
    </div>
  );
}
