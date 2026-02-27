import React from "react";
import { R } from "../styles/rosterTokens";

export function RosterSection({ title, accent, children, action }) {
  return (
    <div style={{
      background: R.bg,
      border: R.border,
      borderRadius: R.rXL,
      padding: "14px 14px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
      }}>
        <span style={{
          color: accent,
          fontSize: R.fontSm,
          fontWeight: 700,
          letterSpacing: R.trackingWide,
          textTransform: "uppercase",
        }}>
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusPip({ used, usedLabel, freeLabel }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 6px",
      borderRadius: 4,
      fontSize: "8px",
      letterSpacing: R.tracking,
      textTransform: "uppercase",
      background: used ? "#1a0a0a" : "#0a1a0e",
      color: used ? R.statusUsed : R.statusOk,
      border: `1px solid ${used ? "#2a1010" : "#102a16"}`,
    }}>
      {used ? (usedLabel || "in use") : (freeLabel || "available")}
    </span>
  );
}

export function RosterItem({ dimmed, children }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "7px 8px",
      borderRadius: R.r,
      background: R.bgItem,
      border: R.borderSub,
      opacity: dimmed ? 0.45 : 1,
      transition: "opacity 0.15s",
    }}>
      {children}
    </div>
  );
}

export function ActionButton({ onClick, disabled, variant = "default", size = "sm", children }) {
  const variants = {
    default: { bg: R.bgAction,   color: R.textSecondary,  border: "1px solid #222" },
    primary: { bg: "#163020",    color: R.statusOk,        border: "1px solid #1e4028" },
    danger:  { bg: "#1a0e0e",    color: R.statusBad,       border: "1px solid #2a1010" },
    accent:  { bg: "#0e1828",    color: R.accentBrain,     border: "1px solid #1a2a3a" },
  };
  const sizes = {
    sm:  { padding: "3px 10px",  fontSize: R.fontSm  },
    md:  { padding: "6px 14px",  fontSize: R.fontBase },
    full:{ padding: "7px 0",     fontSize: R.fontBase, width: "100%" },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v, ...s,
        borderRadius: R.r,
        fontWeight: 600,
        letterSpacing: R.tracking,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.12s, opacity 0.12s",
        fontFamily: "inherit",
        textTransform: "uppercase",
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(0.96)")}
      onMouseUp={e =>   e.currentTarget.style.transform = "scale(1)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {children}
    </button>
  );
}
