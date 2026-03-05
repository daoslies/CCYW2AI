import React, { useRef } from "react";
import { useDrag } from "../../store/dragStore.jsx";
import { useSelection } from "../../store/selectionStore";

export default function DraggableItem({ type, id, payload, children, onDragStart, as = "div", className }) {
  const { dragging, startDrag, wasDragRef } = useDrag(); // Use shared wasDragRef from dragStore
  const { select } = useSelection();
  const isDragging = dragging?.id === id && dragging?.type === type;
  const ref = useRef();
  const didDragRef = useRef(false); // Local drag commit flag

  const computedClass = !isDragging
    ? (className || "wiggle wiggle-hover")
    : undefined;

  if (as === "g") {
    // SVG drag handle
    return (
      <g
        ref={ref}
        onPointerDown={e => {
          console.log('[DraggableItem] onPointerDown');
          e.stopPropagation();
          didDragRef.current = false;
          startDrag(type, id, payload, e, () => {
            console.log('[DraggableItem] drag commit, setting didDragRef.current = true');
            didDragRef.current = true;
            wasDragRef.current = true; // Set shared flag for parent suppression
            select(type, id, { force: true });
            if (typeof onDragStart === 'function') onDragStart(payload);
          });
        }}
        onClick={e => {
          console.log('[DraggableItem] onClick, didDragRef.current:', didDragRef.current);
          if (didDragRef.current) {
            e.stopPropagation();
            if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
            didDragRef.current = false;
          }
        }}
        className={computedClass}
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
        console.log('[DraggableItem] onPointerDown');
        e.stopPropagation();
        didDragRef.current = false;
        startDrag(type, id, payload, e, () => {
          console.log('[DraggableItem] drag commit, setting didDragRef.current = true');
          didDragRef.current = true;
          wasDragRef.current = true; // Set shared flag for parent suppression
          select(type, id, { force: true });
          if (typeof onDragStart === 'function') onDragStart(payload);
        });
      }}
      onClick={e => {
        console.log('[DraggableItem] onClick, didDragRef.current:', didDragRef.current);
        if (didDragRef.current) {
          e.stopPropagation();
          if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
            e.nativeEvent.stopImmediatePropagation();
          }
          didDragRef.current = false;
        }
      }}
      className={computedClass}
      style={{
        opacity:   isDragging ? 0.18 : 1,
        transform: isDragging ? "scale(0.92)" : "scale(1)",
        transition: isDragging ? "none" : "opacity 0.15s, transform 0.15s",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        background: "transparent", // Ensure no default background leaks through
      }}
    >
      {children}
    </div>
  );
}
