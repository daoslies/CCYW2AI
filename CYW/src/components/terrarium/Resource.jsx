import { COLORS } from "../../data/colors.js";
import { useWorld } from "../../store/worldStore.jsx";

export default function Resource({ r, now, harvestProgress = 0, claimedBy, isCorrect }) {
  const col = COLORS.find(c => c.id === r.colorId);
  let opacity = 1;
  if (r.state === "fading")     opacity = Math.max(0, 1 - (now - r.stateAt) / 480);
  if (r.state === "respawning") opacity = Math.min(1, (now - r.stateAt) / 520);
  const scale = r.state === "respawning" ? 0.3 + 0.7 * Math.min(1, (now - r.stateAt) / 520) : 1;
  const floatY = 2.8 * Math.sin(now * 0.00095 + r.x * 0.035);

  // Correct resource resonance effects
  const glowPulse = isCorrect
    ? 0.55 + 0.15 * Math.sin(now * 0.0032) // reduced wub amplitude
    : 0.5;
  const haloRadius = isCorrect
    ? 24 + 3.6 * Math.sin(now * 0.0032)   // reduced wub amplitude
    : 20;

  // Progress arc: sweep from top clockwise
  const arcRadius = 22;
  const circumference = 2 * Math.PI * arcRadius;
  // Show progress ring if resource is being mined (health < maxHealth)
  const progress = (r.health < r.maxHealth) ? 1 - (r.health / r.maxHealth) : 0;
  const dash = progress * circumference;

  return (
    <g transform={`translate(${r.x}, ${r.y + floatY})`} opacity={opacity}>
      {/* Harvest progress ring */}
      {progress > 0 && (
        <circle
          cx={0} cy={0} r={arcRadius}
          fill="none"
          stroke={col.hex}
          strokeWidth={2}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          opacity={0.6}
          strokeLinecap="round"
        />
      )}
      {/* Resonance halo */}
      <circle cx={0} cy={0} r={haloRadius}
        fill={col.glow}
        style={{ filter: "blur(8px)" }}
        opacity={glowPulse} />
      {/* Resonance ground pool */}
      <ellipse cx={0} cy={16}
        rx={isCorrect ? 20 : 14}
        ry={isCorrect ? 7 : 5}
        fill={col.glow}
        style={{ filter: "blur(5px)" }}
        opacity={isCorrect ? 0.9 + 0.1 * Math.sin(now * 0.003) : 0.6} />
      {/* Orbiting mote */}
      {isCorrect && (() => {
        const orbitAngle = now * 0.0018;
        const ox = Math.cos(orbitAngle) * 18;
        const oy = Math.sin(orbitAngle) * 10;
        return (
          <g>
            <circle cx={ox} cy={oy} r={2.2}
              fill={col.hex} opacity={0.7}
              style={{ filter: "blur(1px)" }} />
            <circle cx={ox} cy={oy} r={1}
              fill="white" opacity={0.5} />
          </g>
        );
      })()}
      <ellipse cx={0} cy={16} rx={14} ry={5} fill={col.glow}
        style={{ filter: "blur(5px)" }} opacity={0.6} />
      <circle cx={0} cy={0} r={20} fill={col.glow}
        style={{ filter: "blur(8px)" }} opacity={0.5} />
      <g transform={`scale(${scale * (r.scale ?? 1)})`}>
        {r.colorId === "red" && (
          <g>
            <polygon points="0,-13 11,-2 0,11 -11,-2" fill={col.hex} />
            <polygon points="0,-13 11,-2 0,-1"  fill="rgba(255,255,255,0.22)" />
            <polygon points="0,-13 -11,-2 0,-1" fill="rgba(0,0,0,0.12)" />
            <polygon points="-4,-7 0,-1 -2,3"  fill="rgba(255,255,255,0.08)" />
          </g>
        )}
        {r.colorId === "green" && (
          <g>
            <ellipse cx={-4} cy={-6} rx={6.5} ry={10.5}
              fill={col.hex} opacity={0.92} transform="rotate(-22)" />
            <ellipse cx={5}  cy={-4} rx={5}   ry={8.5}
              fill={col.hex} opacity={0.80} transform="rotate(28)" />
            <ellipse cx={1}  cy={-11} rx={3.5} ry={5.5}
              fill="#86efac" opacity={0.50} transform="rotate(5)" />
            <line x1={-4} y1={-14} x2={-3} y2={2}
              stroke="#bbf7d0" strokeWidth={0.7} strokeLinecap="round" opacity={0.4}
              transform="rotate(-22)" />
            <line x1={0} y1={7}  x2={-2} y2={13}
              stroke={col.hex} strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />
            <line x1={0} y1={10} x2={2}  y2={13}
              stroke={col.hex} strokeWidth={1.0} strokeLinecap="round" opacity={0.5} />
          </g>
        )}
        {r.colorId === "blue" && (
          <g>
            <path d="M0,-14 C9,-6 12,3 0,14 C-12,3 -9,-6 0,-14" fill={col.hex} opacity={0.88} />
            <path d="M0,-14 C6,-7 7,1 0,10"   fill="rgba(255,255,255,0.2)" />
            <path d="M-2,-8 C-1,-4 -1,0 -3,4" fill="rgba(255,255,255,0.08)"
              strokeWidth={0} />
          </g>
        )}
      </g>
    </g>
  );
}
