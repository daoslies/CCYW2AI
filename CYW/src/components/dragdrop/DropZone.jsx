import { useRef, useState } from "react";
import { useDrag } from "../../store/dragStore.jsx";

export default function DropZone({ accepts = [], onDrop, children, style, activeStyle }) {
  const { dragging, endDrag } = useDrag();
  const [isOver, setIsOver] = useState(false);
  const ref = useRef();

  const canAccept = dragging && accepts.includes(dragging.type);

  return (
    <div
      ref={ref}
      onPointerEnter={() => canAccept && setIsOver(true)}
      onPointerLeave={() => setIsOver(false)}
      onPointerUp={() => {
        if (canAccept && isOver) {
          onDrop(dragging);
          endDrag();
        }
        setIsOver(false);
      }}
      style={{
        ...style,
        ...(isOver && canAccept && activeStyle ? activeStyle : {}),
        outline: isOver && canAccept && !activeStyle
          ? "2px solid #4ade80"
          : style?.outline || "2px solid transparent",
        background: isOver && canAccept && !activeStyle
          ? "rgba(74,222,128,0.06)"
          : style?.background,
        borderRadius: 12,
        transition: "outline 0.1s, background 0.1s",
      }}
    >
      {children}
    </div>
  );
}
