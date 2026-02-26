import { COLORS } from "./colors";

export default function Critter({ x, y, angle, state, poisoned, poisonAge }) {
  const happy = state === "happy";
  const scaleX = happy ? 1.14 : poisoned ? 0.88 : 1;
  const scaleY = happy ? 0.91 : poisoned ? 1.18 : 1;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx={0} cy={19} rx={15} ry={5} fill="rgba(0,0,0,0.28)" />
      <g transform={`scale(${scaleX}, ${scaleY})`}>
        <ellipse cx={0} cy={0} rx={15} ry={14} fill="#b8814a" />
        <ellipse cx={0} cy={0} rx={14} ry={13} fill="#cc9660" />
        <ellipse cx={0} cy={5} rx={9} ry={8} fill="#e8c49e" opacity={poisoned ? 0.18 + 0.3 * poisonAge : 0.48} />
        {!poisoned && (
          <>
            <circle cx={-6} cy={-4} r={4.8} fill="white" />
            <circle cx={ 6} cy={-4} r={4.8} fill="white" />
            <circle cx={-6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            <circle cx={ 6 + Math.cos(angle) * 4} cy={-4 + Math.sin(angle) * 4} r={2.6} fill="#10102a" />
            <circle cx={-4.5} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            <circle cx={ 7.4} cy={-5.5} r={0.95} fill="rgba(255,255,255,0.9)" />
            {state === "idle" && (
              <>
                <ellipse cx={-6} cy={-5.5} rx={4.8} ry={2.2} fill="#cc9660" opacity={0.7} />
                <ellipse cx={ 6} cy={-5.5} rx={4.8} ry={2.2} fill="#cc9660" opacity={0.7} />
              </>
            )}
          </>
        )}
        {poisoned && (
          <>
            <line x1={-9} y1={-7} x2={-3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={-3} y1={-7} x2={-9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 3} y1={-7} x2={ 9} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
            <line x1={ 9} y1={-7} x2={ 3} y2={-1} stroke="#1a0a0a" strokeWidth={1.8} strokeLinecap="round" opacity={poisonAge} />
          </>
        )}
        {happy && (
          <path d="M -5 5.5 Q 0 10 5 5.5" stroke="#8a5e38" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        )}
        {poisoned && (
          <path d="M -5 8 Q 0 3 5 8" stroke="#ef4444" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={poisonAge} />
        )}
        <circle cx={-11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />
        <circle cx={ 11} cy={3} r={3.8} fill={poisoned ? `rgba(239,68,68,${0.32 * poisonAge})` : "rgba(255,120,120,0.32)"} />
        <ellipse cx={-7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        <ellipse cx={ 7.5} cy={15} rx={5.8} ry={3.6} fill="#a87048" />
        {[-11, -7.5, -4].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
        {[4, 7.5, 11].map((ox, i) => (
          <circle key={i} cx={ox} cy={16.5 + (i === 1 ? 1.5 : 0)} r={1.5} fill="#956038" />
        ))}
      </g>
    </g>
  );
}
