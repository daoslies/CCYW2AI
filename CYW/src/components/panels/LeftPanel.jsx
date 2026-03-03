import React from "react";
import SelectedEntityPanel from "../left/SelectedEntityPanel.jsx";
import { useWorld } from "../../store/worldStore.jsx";
import NetworkViz from "../shared/NetworkViz.jsx";

export default function LeftPanel({
  trainerBrain,
  trainerNetwork,
  indicator,
  view,
  networkUpdateTick,
  terrariumResourceCounters
}) {
  return (
    <div style={{
      width: 340,
      minWidth: 240,
      maxWidth: 420,
      background: "#0a0e1a",
      borderRight: "1px solid #1a1e2a",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 10,
      padding: "32px 0 0 0",
      maxHeight: "100vh",
      overflowY: "auto"
    }}>
      <SelectedEntityPanel />
      {trainerBrain && (
        <NetworkViz
          brain={trainerBrain}
          network={trainerNetwork}
          inputValue={view === "trainer" ? indicator.oneHot : undefined}
          animTrigger={networkUpdateTick}
          style={{ width: "100%", height: "auto", minWidth: 0, aspectRatio: "1.06", display: "block" }}
        />
      )}
      {terrariumResourceCounters}
    </div>
  );
}
