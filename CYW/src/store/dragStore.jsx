import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { UI_ZOOM } from "../constants.js";

const DragContext = createContext(null);

const DRAG_THRESHOLD = 5; // px — below this, treat as click

export function DragProvider({ children }) {
  const [dragging, setDragging] = useState(null);
  // dragging: { type, id, payload, origin: {x, y}, current: {x, y}, offset: {x, y} }

  const dragRef = useRef(null);
  const pendingDragRef = useRef(null); // holds intent before threshold crossed
  const holdTimerRef = useRef(null); // NEW
  const wasDragRef = useRef(false); // NEW

  const startDrag = useCallback((type, id, payload, pointerEvent, onDragStart) => {
    // Don't preventDefault yet — let clicks through if pointer never moves
    pendingDragRef.current = {
      type, id, payload,
      origin:  {
        x: pointerEvent.clientX / UI_ZOOM,
        y: pointerEvent.clientY / UI_ZOOM,
      },
      current: {
        x: pointerEvent.clientX / UI_ZOOM,
        y: pointerEvent.clientY / UI_ZOOM,
      },
      offset: { x: 0, y: 0 },
      onDragStart, // stored so both commit paths can call it
    };
    // NEW: commit drag after hold duration even without movement
    holdTimerRef.current = setTimeout(() => {
      if (pendingDragRef.current) {
        wasDragRef.current = true; // SET HERE TOO
        const item = { ...pendingDragRef.current };
        dragRef.current = item;
        pendingDragRef.current = null;
        item.onDragStart?.();
        setDragging({ ...item });
      }
    }, 250);
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
  }, []);

  useEffect(() => {
    function onMove(e) {
      // If drag already committed, update position normally
      if (dragRef.current) {
        dragRef.current.current = {
          x: e.clientX / UI_ZOOM,
          y: e.clientY / UI_ZOOM,
        };
        setDragging({ ...dragRef.current });
        return;
      }
      // If we have a pending drag intent, check threshold
      if (pendingDragRef.current) {
        const dx = e.clientX / UI_ZOOM - pendingDragRef.current.origin.x;
        const dy = e.clientY / UI_ZOOM - pendingDragRef.current.origin.y;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
          }
          // Threshold crossed — commit the drag and suppress further clicks
          e.preventDefault();
          wasDragRef.current = true; // SET HERE — well before pointerup/click
          const item = {
            ...pendingDragRef.current,
            current: {
              x: e.clientX / UI_ZOOM,
              y: e.clientY / UI_ZOOM,
            },
          };
          dragRef.current = item;
          pendingDragRef.current = null;
          item.onDragStart?.(); // NEW — select the item as drag commits
          setDragging({ ...item });
        }
      }
    }
    function onUp() {
      // Clear hold timer — if it hasn't fired, this was a click not a hold
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      // If threshold was never crossed, discard pending intent — click fires naturally
      pendingDragRef.current = null;
      // If a drag was committed, set wasDragRef and reset after click is handled
      const wasDrag = dragRef.current != null;
      wasDragRef.current = wasDrag;
      if (dragRef.current) endDrag();
      if (wasDrag) {
        // Reset after click event is handled at DraggableItem level
        requestAnimationFrame(() => { wasDragRef.current = false; });
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, [endDrag]);

  // Provide setDraggingItem for compatibility
  const setDraggingItem = (item) => setDragging(item);

  return (
    <DragContext.Provider value={{ dragging, startDrag, endDrag, setDraggingItem, wasDragRef }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  return useContext(DragContext);
}

export function useDragStore() {
  return useContext(DragContext);
}
