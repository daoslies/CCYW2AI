import React from "react";
import { useWorld } from "../store/worldStore.jsx";
import TrainerPanel from "./TrainerPanel";

const App = () => {
  const {
    brains,
    bodies,
    gibbets,
    assignments,
    activeTrainerId,
    setActiveTrainerId,
    // Add other actions as needed
  } = useWorld();

  // Defensive: If no trainer gibbet or brain, show placeholder
  const view = "trainer"; // TODO: wire up view switching if needed
  const trainerGibbet = gibbets.find(g => g.brainId === activeTrainerId);
  const trainerBrain = trainerGibbet ? brains.find(b => b.id === trainerGibbet.brainId) : null;

  if (view === "trainer" && (!trainerGibbet || !trainerBrain)) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0c16", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#7dd3fc", fontSize: 18, fontWeight: 600, textAlign: "center" }}>
          No gibbet assigned to trainer.<br />
          Create and combine a brain + body, then assign to trainer.
        </div>
      </div>
    );
  }

  return (
    <div>
      {view === "trainer" && <TrainerPanel />}
      {/* Other views can be added here */}
    </div>
  );
};

function GibbetBioPanel() {
  const { gibbets, brains, bodies, activeTrainerId } = useWorld();
  // Defensive: If no gibbet assigned to trainer's brain, show placeholder
  const trainerGibbet = gibbets.find(g => g.brainId === activeTrainerId);
  if (!trainerGibbet) {
    return (
      <div style={{ background: "#181a22", borderRadius: 12, padding: "16px 12px", margin: "0 0 18px 0", width: "100%", boxSizing: "border-box", minHeight: 80, color: "#7dd3fc", textAlign: "center" }}>
        No gibbet assigned to trainer.<br />
        Create and combine a brain + body, then assign to trainer.
      </div>
    );
  }
  // ...existing code...
}

export default App;