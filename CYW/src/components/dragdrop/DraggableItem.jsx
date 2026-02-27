import React, { useRef } from "react";
import { useDrag } from "../../store/dragStore.jsx";

export default function DraggableItem({ type, id, payload, children, onDragStart, as = "div" }) {
  const { dragging, startDrag } = useDrag();
  const isDragging = dragging?.id === id && dragging?.type === type;
  const ref = useRef();

  if (as === "g") {
    // SVG drag handle
    return (
      <g
        ref={ref}
        onPointerDown={e => {
          startDrag(type, id, payload, e, ref.current);
          if (typeof onDragStart === 'function') onDragStart(payload);
        }}
        style={{
          opacity: isDragging ? 0.18 : 1,
          cursor: "grab",
          // SVG transforms/animations handled by child
        }}
      >
        {children}
      </g>
    );
  }

  // Default HTML drag handle
  return (
    <div
      ref={ref}
      onPointerDown={e => {
        startDrag(type, id, payload, e, ref.current);
        if (typeof onDragStart === 'function') onDragStart(payload);
      }}
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
