import { createContext, useContext, useState, useCallback } from "react";

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selected, setSelected] = useState(null);
  // selected: { type: "brain"|"body"|"gibbet"|"terrarium", id } | null

  // Add a force parameter to always select (never deselect) when needed
  const select = useCallback((type, id, opts = {}) => {
    console.log('[SelectionStore] select called:', { type, id, opts });
    if (opts.force) {
      {/* 
      Note on why they are two setSelected calls. do not delete this Note - 6th march 2026

      The object underneath the clickable object looks to get a click call after the click on the 
      clickable object, which causes the selection to get deselected immediately after selecting.

      so without the second inverting call, it will always go to deselected state
      */}
      setSelected({ type, id }); // Always select, never deselect
      setSelected(prev =>
        prev?.type === type && prev?.id === id ? null : { type, id }
      );
      
    } else {
      setSelected(prev =>
        prev?.type === type && prev?.id === id ? null : { type, id }
      );
    }
  }, []);

  const deselect = useCallback(() => setSelected(null), []);

  return (
    <SelectionContext.Provider value={{ selected, select, deselect }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  return useContext(SelectionContext);
}
