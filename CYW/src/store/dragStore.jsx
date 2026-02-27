import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { UI_ZOOM } from "../constants.js";

const DragContext = createContext(null);

export function DragProvider({ children }) {
  const [dragging, setDragging] = useState(null);
  // dragging: { type, id, payload, origin: {x, y}, current: {x, y}, offset: {x, y} }

  const dragRef = useRef(null);

  const startDrag = useCallback((type, id, payload, pointerEvent, dragElement) => {
    pointerEvent.preventDefault();
    const item = {
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
    };
    dragRef.current = item;
    setDragging({ ...item });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(null);
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current) return;
      dragRef.current.current = {
        x: e.clientX / UI_ZOOM,
        y: e.clientY / UI_ZOOM,
      };
      setDragging({ ...dragRef.current }); // shallow copy triggers re-render
    }
    function onUp() {
      if (!dragRef.current) return;
      endDrag();
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
    <DragContext.Provider value={{ dragging, startDrag, endDrag, setDraggingItem }}>
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
