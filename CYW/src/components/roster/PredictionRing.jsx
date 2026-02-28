import { useMemo, useRef, useEffect, useState } from "react";
import { COLORS } from "../../data/colors";
import { nnForward } from "../../engine/nn";

function ringSegmentPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  // Returns SVG arc path for a ring segment (donut slice)
  const toRad = deg => (deg - 90) * Math.PI / 180;
  const gap = 3; // degrees of gap between segments
  const s = startAngle + gap / 2;
  const e = endAngle   - gap / 2;
  const ox1 = cx + outerR * Math.cos(toRad(s));
  const oy1 = cy + outerR * Math.sin(toRad(s));
  const ox2 = cx + outerR * Math.cos(toRad(e));
  const oy2 = cy + outerR * Math.sin(toRad(e));
  const ix1 = cx + innerR * Math.cos(toRad(e));
  const iy1 = cy + innerR * Math.sin(toRad(e));
  const ix2 = cx + innerR * Math.cos(toRad(s));
  const iy2 = cy + innerR * Math.sin(toRad(s));
  const large = (e - s) > 180 ? 1 : 0;

  return [
    `M ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
    "Z"
  ].join(" ");
}

export default function PredictionRing({ network, size = 44, animTrigger }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR - (size * 0.18);  // outer ring thickness ~18% of size
  const coreR  = innerR - (size * 0.04);  // small gap then inner ring
  const innerSegR = coreR;
  const innerSegInnerR = coreR - (size * 0.16);

  // Pulse animation state
  const [pulse, setPulse] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    let start = null;
    function animate(ts) {
      if (!start) start = ts;
      const t = (ts - start) / 1000; // seconds
      setPulse(Math.sin(t * 2 * Math.PI * 0.5)); // 0.5 Hz = 2s per cycle
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Compute predictions for each colour input
  const predictions = useMemo(() => {
    if (!network) return null;
    return COLORS.map(c => {
      const out = nnForward(network, c.oneHot);
      // out is softmax probabilities [pRed, pGreen, pBlue]
      const maxIdx = out.indexOf(Math.max(...out));
      return {
        input: c,
        predictedColor: COLORS[maxIdx],
        confidence: out[maxIdx],
        probs: out,
      };
    });
  }, [network, animTrigger]);

  if (!predictions) {
    // No network yet — render empty rings
    return (
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1a1a2a" strokeWidth={size * 0.18} />
        <circle cx={cx} cy={cy} r={innerSegR - size * 0.08} fill="none" stroke="#1a1a2a" strokeWidth={size * 0.16} />
      </svg>
    );
  }

  const segmentAngle = 360 / COLORS.length; // 120° each

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {COLORS.map((c, i) => {
        const startAngle = i * segmentAngle;
        const endAngle   = startAngle + segmentAngle;
        const pred = predictions[i];
        // Remap confidence: 0.33 (min) → 0, 1 → 1
        const visualConfidence = Math.max(0, (pred.confidence - 0.33) / 0.67);
        // Pulse amplitude: 0.92 to 1.12, scaled by visual confidence
        const pulseAmp = 1 + 0.12 * visualConfidence * pulse;
        // Pulse brightness/opacity: base + pulse * visual confidence
        const baseOpacity = 0.3 + visualConfidence * 0.7;
        const pulseOpacity = baseOpacity + 0.28 * visualConfidence * pulse; // up to +0.28 at peak
        // Animate outer ring radius
        const animatedOuterR = outerR * pulseAmp;
        return (
          <g key={c.id}>
            {/* Inner ring — input colour, always fixed */}
            <path
              d={ringSegmentPath(cx, cy, innerSegInnerR, innerSegR, startAngle, endAngle)}
              fill={c.hex}
              opacity={0.55}
            />
            {/* Outer ring — predicted output colour, opacity and radius pulsing by confidence */}
            <path
              d={ringSegmentPath(cx, cy, innerR, animatedOuterR, startAngle, endAngle)}
              fill={pred.predictedColor.hex}
              opacity={pulseOpacity}
            />
          </g>
        );
      })}
    </svg>
  );
}
