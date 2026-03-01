import { createContext, useContext, useState, useCallback } from "react";

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selected, setSelected] = useState(null);
  // selected: { type: "brain"|"body"|"gibbet"|"terrarium", id } | null

  const select = useCallback((type, id) => {
    setSelected(prev =>
      prev?.type === type && prev?.id === id ? null : { type, id }
    );
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
