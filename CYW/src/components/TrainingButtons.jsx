import { COLORS } from "../data/colors";

export default function TrainingButtons({ onClick }) {
  return (
    <div style={{ display: "flex", gap: 9 }}>
      {COLORS.map(c => (
        <button key={c.id}
          className="tbtn"
          onClick={() => onClick(c)}
          style={{
            width: 38,
            height: 22,
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.18)",
            background: c.hex,
            boxShadow: `0 0 8px ${c.glow}`,
            cursor: "pointer",
            position: "relative",
            transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease",
            outline: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${c.hex}22`}
          onMouseLeave={e => e.currentTarget.style.background = c.hex}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {/* Pill shape, no text, just fills the space */}
          {/* Inner highlight ring */}
          <span style={{
            content: "''",
            position: "absolute",
            inset: 2,
            borderRadius: 14,
            background: "linear-gradient(160deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
            pointerEvents: "none"
          }} />
        </button>
      ))}
    </div>
  );
}
