import React from "react";
import { useWorld } from "../store/worldStore.jsx";
import { RosterSection, RosterItem, StatusPip, ActionButton } from "./RosterSection.jsx";
import { R } from "../styles/rosterTokens.js";
import Gibbet from "./Gibbet.jsx";

export default function BodiesRoster() {
  const { bodies, addBody, usedBodyIds } = useWorld();

  return (
    <RosterSection
      title="Bodies"
      accent={R.accentBody}
      action={
        <ActionButton
          variant="accent"
          size="sm"
          onClick={() => addBody("classic", `Body ${bodies.length + 1}`)}
        >
          + Acquire
        </ActionButton>
      }
    >
      {bodies.length === 0 && (
        <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
          No bodies — acquire one to house a brain
        </span>
      )}
      {bodies.map(body => {
        const used = usedBodyIds.has(body.id);
        return (
          <RosterItem key={body.id} dimmed={used}>
            <svg width={28} height={28} viewBox="-20 -10 40 42" style={{ flexShrink: 0 }}>
              <Gibbet x={0} y={0} angle={0} state="idle" poisoned={false} poisonAge={0} />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: R.textPrimary, fontSize: R.fontMd, fontWeight: 500 }}>
                {body.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ color: R.textMuted, fontSize: R.fontSm }}>
                  {body.breedId || body.template}
                </span>
                <StatusPip used={used} usedLabel="in gibbet" />
              </div>
            </div>
          </RosterItem>
        );
      })}
    </RosterSection>
  );
}
