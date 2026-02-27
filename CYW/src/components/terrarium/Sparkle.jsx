import { useWorld } from "../../store/worldStore.jsx";

export default function Sparkle({ s, now }) {
  const age  = (now - s.born) / 600;
  const dist = age * 28;
  const x = s.x + Math.cos(s.angle) * dist;
  const y = s.y + Math.sin(s.angle) * dist;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - age}>
      <circle cx={0} cy={0} r={2.5 * (1 - age * 0.5)} fill={s.hex} />
      <circle cx={0} cy={0} r={1}                     fill="white" opacity={0.7} />
    </g>
  );
}
