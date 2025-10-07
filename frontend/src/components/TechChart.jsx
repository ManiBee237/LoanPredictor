import React from "react";

/**
 * TechChart — dependency-free SVG chart with grid, gradient area, and line.
 * Props:
 *  - data: number[]
 *  - height?: number (default 120)
 *  - strokeWidth?: number (default 2)
 *  - showArea?: boolean (default true)
 *  - color?: string (default var(--brand))
 */
export default function TechChart({
  data = [],
  height = 120,
  strokeWidth = 2,
  showArea = true,
  color = "var(--brand)",
}) {
  const h = Math.max(80, height);
  const w = 320; // responsive via viewBox
  const pad = 8;
  const gridY = 4;
  const gridX = 6;

  if (!data.length) {
    return <div style={{ height: h }} />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y];
  });

  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;

  const gridLinesH = Array.from({ length: gridY + 1 }, (_, i) => {
    const y = pad + (i / gridY) * (h - pad * 2);
    return y;
  });

  const gridLinesV = Array.from({ length: gridX + 1 }, (_, i) => {
    const x = pad + (i / gridX) * (w - pad * 2);
    return x;
  });

  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }}>
      {/* defs */}
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* grid */}
      {gridLinesH.map((y, i) => (
        <line key={`h-${i}`} x1={pad} x2={w - pad} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" opacity={0.7} />
      ))}
      {gridLinesV.map((x, i) => (
        <line key={`v-${i}`} y1={pad} y2={h - pad} x1={x} x2={x} stroke="var(--border)" strokeWidth="1" opacity={0.6} />
      ))}

      {/* area */}
      {showArea && (
        <polygon points={area} fill={`url(#grad-${id})`} opacity="1" />
      )}

      {/* line */}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        filter={`url(#glow-${id})`}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* nodes */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.2 : 2} fill={color} opacity={i === pts.length - 1 ? 1 : 0.75} />
      ))}
    </svg>
  );
}
