import React from "react";
import BrainsRoster from "./BrainsRoster.jsx";
import BodiesRoster from "./BodiesRoster";
import GibbetRoster from "./GibbetRoster.jsx";

export default function RightPanel({
  rightTab,
  setRightTab,
  upgradesSidebar
}) {
  return (
    <div style={{
      width: 280,
      minWidth: 180,
      maxWidth: 340,
      background: "#0a0e1a",
      borderLeft: "1px solid #1a1e2a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      position: "fixed",
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 10,
      padding: "32px 0 0 0",
      maxHeight: "100vh",
      overflowY: "auto"
    }}>
      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 0, width: "100%", marginBottom: 18 }}>
        <button
          onClick={() => setRightTab("upgrades")}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: rightTab === "upgrades" ? "3px solid #60a5fa" : "1px solid #222",
            background: rightTab === "upgrades" ? "#181a22" : "#10101a",
            color: rightTab === "upgrades" ? "#60a5fa" : "#aaa",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 0
          }}
        >
          Upgrades
        </button>
        <button
          onClick={() => setRightTab("gibbets")}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderBottom: rightTab === "gibbets" ? "3px solid #4ade80" : "1px solid #222",
            background: rightTab === "gibbets" ? "#181a22" : "#10101a",
            color: rightTab === "gibbets" ? "#4ade80" : "#aaa",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 12
          }}
        >
          Grow Gibbets
        </button>
      </div>
      {/* Tab content */}
      <div style={{ width: "100%" }}>
        {rightTab === "upgrades" && (
          <div style={{ padding: "0 20px 32px 20px" }}>
            {upgradesSidebar}
          </div>
        )}
        {rightTab === "gibbets" && (
          <div style={{ padding: "0 12px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
            <BrainsRoster />
            <BodiesRoster />
            <GibbetRoster />
          </div>
        )}
      </div>
    </div>
  );
}
