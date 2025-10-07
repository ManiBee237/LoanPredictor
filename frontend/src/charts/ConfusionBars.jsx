import React from "react";

export default function ConfusionBars({ tn=0, fp=0, fn=0, tp=0 }) {
  const items = [
    { label: "TN", value: tn },
    { label: "FP", value: fp },
    { label: "FN", value: fn },
    { label: "TP", value: tp },
  ];
  const max = Math.max(1, ...items.map(i => i.value));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"12px", alignItems:"end", height: 220 }}>
      {items.map(i => (
        <div key={i.label} style={{ display:"grid", gap:"6px", gridTemplateRows:"1fr auto" }}>
          <div
            title={`${i.label}: ${i.value}`}
            style={{
              height: `${(i.value / max) * 180}px`,
              background: "linear-gradient(180deg, #54aeff, #2b90f5)",
              border: "1px solid #1f2a40",
              borderRadius: "10px"
            }}
          />
          <div style={{ textAlign:"center", fontSize: ".9rem" }}>{i.label}</div>
        </div>
      ))}
    </div>
  );
}
