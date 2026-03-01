import { COLORS } from "../../data/colors.js";
import { TW, TH, GROUND_Y, GRASS, PEBBLES, DUST, isCorrectCollection } from "../../engine/terrariumEngine";
import { useRef, useEffect, useState } from "react";
import { useWorld } from "../../store/worldStore.jsx";
import { useSelection } from "../../store/selectionStore";
import Gibbet from "../gibbet/Gibbet.jsx";
import Resource from "./Resource";
import Sparkle from "./Sparkle";
import DraggableItem from "../dragdrop/DraggableItem.jsx";

// NOTE: Attempted to wrap each gibbet in <DraggableItem as="g"> for SVG drag logic, but this broke terrarium rendering and assignment. Reverting to previous version for further debugging.

export function TerrariumScene({ snap, draggingIds = [], renderGibbet, ...rest }) {
  const { now, gibbets, resources, sparkles, indicator, config, weather } = snap;
  const { gibbets: rosterGibbets, bodies } = useWorld();
  const { selected } = useSelection(); // <-- Always at top level

  // Floating resource gain popups per gibbet
  const [gainPopupsMap, setGainPopupsMap] = useState({});
  const lastGainRef = useRef({});
  useEffect(() => {
    // Detect new resource gain for each gibbet
    if (gibbets) {
      setGainPopupsMap(prev => {
        const next = { ...prev };
        for (const g of gibbets) {
          if (g.gainEvent && g.gainEvent !== lastGainRef.current[g.id]) {
            next[g.id] = [
              ...(next[g.id] || []),
              {
                id: `${now}-${g.gainEvent.colorId}`,
                amount: g.gainEvent.amount,
                time: now,
                hex: g.gainEvent.hex,
                crit: g.gainEvent.crit, // Pass crit flag to popup
              },
            ];
            lastGainRef.current[g.id] = g.gainEvent;
          }
        }
        return next;
      });
    }
  }, [gibbets, now]);
  useEffect(() => {
    // Remove old popups for each gibbet
    const t = setInterval(() => {
      setGainPopupsMap(prev => {
        const next = { ...prev };
        for (const id in next) {
          next[id] = next[id].filter(p => now - p.time < 900);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(t);
  }, [now]);

  return (
    <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" style={{ display: "block" }} {...rest}>
      <defs>
        <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#060812" />
          <stop offset="100%" stopColor="#0c1020" />
        </linearGradient>
        <linearGradient id="gGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e3312" />
          <stop offset="55%"  stopColor="#11200a" />
          <stop offset="100%" stopColor="#070c04" />
        </linearGradient>
        <radialGradient id="gVignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
        <filter id="fGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="indicatorSun" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={indicator.hex} stopOpacity="0.22" />
          <stop offset="60%" stopColor={indicator.hex} stopOpacity="0.10" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
        </radialGradient>
        {gibbets && gibbets.some(g => g.poisonedUntil && now < g.poisonedUntil) && (
          <radialGradient id="poisonBurst" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </radialGradient>
        )}
      </defs>
      <rect x={0} y={0} width={TW} height={TH} fill="url(#gSky)" />
      <ellipse cx={TW / 2} cy={0} rx={TW * 0.32} ry={55}
        fill="rgba(200,220,255,0.05)"
        style={{ filter: "blur(18px)" }} />
      <ellipse cx={85}  cy={GROUND_Y + 14} rx={90} ry={28} fill="#f8717122" style={{ filter: "blur(10px)" }} />
      <ellipse cx={240} cy={GROUND_Y + 14} rx={95} ry={28} fill="#4ade8022" style={{ filter: "blur(10px)" }} />
      <ellipse cx={395} cy={GROUND_Y + 14} rx={90} ry={28} fill="#60a5fa22" style={{ filter: "blur(10px)" }} />
      <rect x={0} y={GROUND_Y} width={TW} height={TH - GROUND_Y} fill="url(#gGround)" />
      <rect x={0} y={GROUND_Y} width={TW} height={14}
        fill="rgba(110,62,20,0.45)" style={{ filter: "blur(2px)" }} />
      {PEBBLES.map((p, i) => (
        <ellipse key={`soil-${i}`}
          cx={p.x} cy={GROUND_Y + 4 + (i % 3) * 3}
          rx={p.rx * 2.2} ry={p.rx * 0.6}
          fill="rgba(140,80,30,0.12)" />
      ))}
      {PEBBLES.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx * 1.6} ry={p.rx * 0.85}
          fill="rgba(255,255,255,0.025)" />
      ))}
      {GRASS.map((g, i) => (
        <g key={i}>
          <line x1={g.x}     y1={GROUND_Y} x2={g.x - 2}   y2={GROUND_Y - g.h1}
            stroke={g.col1} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={g.x + 4} y1={GROUND_Y} x2={g.x + 2.5} y2={GROUND_Y - g.h2}
            stroke={g.col2} strokeWidth={1.3} strokeLinecap="round" />
        </g>
      ))}
      {DUST.map((d, i) => {
        const t = now * d.speed + d.phase;
        const x = d.baseX + Math.sin(t) * 14;
        const y = d.baseY + Math.cos(t * 0.7) * 18;
        const op = 0.04 + 0.04 * Math.sin(t * 1.3);
        return <circle key={i} cx={x} cy={y} r={1.2} fill="white" opacity={op} />;
      })}
      <ellipse
        cx={TW/2}
        cy={GROUND_Y - 40}
        rx={TW * 0.48}
        ry={TH * 0.44}
        fill="url(#indicatorSun)"
        style={{ mixBlendMode: "lighter" }}
      />
      {resources.map(r => (
        <Resource
          key={r.id} r={r} now={now}
          harvestProgress={snap.harvestTarget === r.id ? snap.harvestProgress : 0}
          isCorrect={
            config?.hasWeather
              ? isCorrectCollection(r.colorId, indicator.id, config, weather)
              : r.colorId === indicator.id
          }
          claimedBy={r.claimedBy}
        />
      ))}
      {sparkles.map(s => <Sparkle key={s.id} s={s} now={now} />)}
      {gibbets && gibbets.map(g => {
        if (draggingIds.includes(g.id)) return null; // Hide gibbet while dragging
        // Find roster gibbet and body for color
        const rosterGibbet = rosterGibbets.find(rg => rg.id === g.id);
        const body = rosterGibbet ? bodies.find(b => b.id === rosterGibbet.bodyId) : null;
        // Selection highlight: orbiting glow if selected
        const isSelected = selected?.type === "gibbet" && selected?.id === g.id;
        return (
          <g key={g.id} style={{ pointerEvents: "auto" }}>
            {/* Selection glow removed as per user request */}
            <Gibbet
              x={g.x}
              y={g.y}
              angle={g.angle}
              state={g.state}
              poisoned={g.poisonedUntil && now < g.poisonedUntil}
              poisonAge={g.poisonedUntil ? Math.max(0, 1 - (now - (g.poisonedUntil - 700)) / 700) : 0}
              gainPopups={gainPopupsMap[g.id] || []}
              color={body?.color || rosterGibbet?.color || "#7dd3fc"}
            />
          </g>
        );
      })}
      <rect x={0} y={0} width={TW} height={TH} fill="url(#gVignette)" />
      <path d={`M 55 9 Q ${TW * 0.42} 3 ${TW - 65} 10`}
        stroke="rgba(200,230,255,0.045)" strokeWidth={1.8} fill="none" />
      <path d={`M 80 7 Q ${TW * 0.38} 2 ${TW * 0.7} 8`}
        stroke="rgba(255,255,255,0.02)" strokeWidth={0.8} fill="none" />
    </svg>
  );
}
