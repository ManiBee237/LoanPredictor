import React from "react";
export default function MetricPill({ label, value }) {
  const v = value ?? 0;
  return (
    <div className="pill">
      <label>{label}</label>
      <strong>{Number.isFinite(v) ? v.toFixed(3) : "0.000"}</strong>
    </div>
  );
}
