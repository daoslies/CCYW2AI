import { useRef, useState } from "react";
import { useDrag } from "../store/dragStore";

export default function DropZone({ accepts, onDrop, children, style }) {
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
        outline: isOver && canAccept
          ? "2px solid #4ade80"
          : "2px solid transparent",
        background: isOver && canAccept
          ? "rgba(74,222,128,0.06)"
          : undefined,
        borderRadius: 12,
        transition: "outline 0.1s, background 0.1s",
      }}
    >
      {children}
    </div>
  );
}
