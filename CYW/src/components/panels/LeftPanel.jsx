import React from "react";
import GibbetBioPanel from "./App.jsx"; // If GibbetBioPanel is a subcomponent, import from App.jsx
import NetworkViz from "../shared/NetworkViz.jsx";
import { useWorld } from "../../store/worldStore.jsx";

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
      alignItems: "center",
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
      <GibbetBioPanel />
      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto 18px auto" }}>
        {trainerBrain && (
          <NetworkViz
            brain={trainerBrain}
            network={trainerNetwork}
            inputValue={view === "trainer" ? indicator.oneHot : indicator.oneHot}
            animTrigger={networkUpdateTick}
            style={{ width: "100%", height: "auto", maxWidth: 400, aspectRatio: "1.06" }}
          />
        )}
      </div>
      {terrariumResourceCounters}
    </div>
  );
}
