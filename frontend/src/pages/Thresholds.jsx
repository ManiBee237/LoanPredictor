import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import { useApp } from "../store/AppContext.jsx";
import { computeMetrics } from "../lib/metrics.js";

/* ——— slider ——— */
function Slider({ label, min, max, step, value, onChange, suffix }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
        <span className="text-xs font-medium">{value}{suffix || ""}</span>
      </div>
      <input
        type="range"
        className="w-full accent-[var(--brand)]"
        min={min} max={max} step={step} value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ——— diff pill ——— */
function Diff({ oldV, newV, fmt = (v)=>v.toFixed(3) }) {
  const delta = (newV ?? 0) - (oldV ?? 0);
  const txt = `${fmt(newV ?? 0)} (${delta>=0?"+":""}${fmt(delta)})`;
  const bg = delta>0 ? "rgba(16,185,129,.08)" : delta<0 ? "rgba(239,68,68,.08)" : "rgba(0,0,0,0)";
  const col = delta>0 ? "#10b981" : delta<0 ? "#ef4444" : "var(--muted)";
  return (
    <div className="pill" style={{ background:bg, borderColor:"var(--border)" }}>
      <label>new (Δ)</label>
      <strong style={{ color: col }}>{txt}</strong>
    </div>
  );
}

export default function Thresholds() {
  const { rows, thresholds, setThresholds } = useApp();
  const [draft, setDraft] = useState(thresholds);
  const [api, setApi] = useState({ saving:false, last:null, error:null });
  const fileRef = useRef(null);

  /* live preview metrics with draft thresholds */
  const currentMetrics = useMemo(() => computeMetrics(rows, thresholds), [rows, thresholds]);
  const previewMetrics = useMemo(() => computeMetrics(rows, draft), [rows, draft]);

  useEffect(()=>{ setDraft(thresholds); }, [thresholds]);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const resetDefaults = () => setDraft({ creditScore: 650, dti: 0.4 });

  const applyDraft = () => setThresholds(draft);

  const savePreset = async () => {
    setApi({ saving:true, last:null, error:null });
    try {
      // Replace with real API call if needed:
      // await fetch("/api/thresholds", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(draft) });
      await new Promise(r=>setTimeout(r,200));
      setApi({ saving:false, last:new Date().toISOString(), error:null });
      setThresholds(draft);
    } catch (e) {
      setApi({ saving:false, last:null, error:e?.message||"Failed to save" });
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ thresholds: draft }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "thresholds.json"; a.click(); URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const j = JSON.parse(reader.result);
        if (j?.thresholds) setDraft({
          creditScore: Number(j.thresholds.creditScore) || 0,
          dti: Number(j.thresholds.dti) || 0,
        });
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <>
      <h2 className="text-lg font-semibold">Thresholds</h2>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="pill">
          <label>Credit Score (min)</label>
          <strong>{draft.creditScore}</strong>
        </div>
        <div className="pill">
          <label>Max DTI</label>
          <strong>{draft.dti.toFixed(2)}</strong>
        </div>
        <div className="pill">
          <label>Rows</label>
          <strong>{rows.length}</strong>
        </div>
        <div className="pill">
          <label>Status</label>
          <strong style={{ color: "var(--brand)" }}>Previewing</strong>
        </div>
      </div>

      {/* Controls */}
      <Card title="Heuristic Controls" footer="These thresholds drive the client-side baseline (CreditScore + DTI). Replace with server model cutoffs later.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <div>
              <label className="text-xs block mb-1" style={{ color:"var(--muted)" }}>Credit Score Threshold</label>
              <input className="input" type="number" value={draft.creditScore} onChange={(e)=>set("creditScore", Number(e.target.value)||0)} />
              <div className="mt-3"><Slider label="Credit Score" min={300} max={850} step={1} value={draft.creditScore} onChange={(v)=>set("creditScore", v)} /></div>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color:"var(--muted)" }}>Max DTI (Loan/Income)</label>
              <input className="input" type="number" step="0.01" value={draft.dti} onChange={(e)=>set("dti", Number(e.target.value)||0)} />
              <div className="mt-3"><Slider label="DTI" min={0.1} max={1.0} step={0.01} value={draft.dti} onChange={(v)=>set("dti", v)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-brand" onClick={applyDraft}>Apply</button>
              <button className="btn-quiet" onClick={resetDefaults}>Reset Defaults</button>
              <button className="btn-quiet" onClick={exportJSON}>Export JSON</button>
              <button className="btn-quiet" onClick={()=>fileRef.current?.click()}>Import JSON</button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e)=>importJSON(e.target.files?.[0])}/>
              <button className="btn-quiet" onClick={savePreset} disabled={api.saving}>
                {api.saving ? "Saving…" : "Save Preset (API)"}
              </button>
            </div>
            {api.error && <div className="text-xs mt-1" style={{ color:"#b91c1c" }}>Error: {api.error}</div>}
            {api.last && <div className="text-xs mt-1" style={{ color:"var(--muted)" }}>Saved {new Date(api.last).toLocaleString()}</div>}
          </div>

          {/* Live metric preview */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="pill">
                <label>Accuracy (current)</label>
                <strong>{(currentMetrics.accuracy ?? 0).toFixed(3)}</strong>
              </div>
              <Diff oldV={currentMetrics.accuracy ?? 0} newV={previewMetrics.accuracy ?? 0} />
              <div className="pill">
                <label>Precision (current)</label>
                <strong>{(currentMetrics.precision ?? 0).toFixed(3)}</strong>
              </div>
              <Diff oldV={currentMetrics.precision ?? 0} newV={previewMetrics.precision ?? 0} />
              <div className="pill">
                <label>Recall (current)</label>
                <strong>{(currentMetrics.recall ?? 0).toFixed(3)}</strong>
              </div>
              <Diff oldV={currentMetrics.recall ?? 0} newV={previewMetrics.recall ?? 0} />
              <div className="pill">
                <label>F1 (current)</label>
                <strong>{(currentMetrics.f1 ?? 0).toFixed(3)}</strong>
              </div>
              <Diff oldV={currentMetrics.f1 ?? 0} newV={previewMetrics.f1 ?? 0} />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="pill"><label>TP</label><strong>{currentMetrics.tp}</strong></div>
              <div className="pill"><label>TN</label><strong>{currentMetrics.tn}</strong></div>
              <div className="pill"><label>FP</label><strong>{currentMetrics.fp}</strong></div>
              <div className="pill"><label>FN</label><strong>{currentMetrics.fn}</strong></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="pill" style={{ background:"rgba(16,185,129,.06)" }}>
                <label>TP (preview)</label><strong>{previewMetrics.tp}</strong>
              </div>
              <div className="pill" style={{ background:"rgba(16,185,129,.06)" }}>
                <label>TN (preview)</label><strong>{previewMetrics.tn}</strong>
              </div>
              <div className="pill" style={{ background:"rgba(239,68,68,.06)" }}>
                <label>FP (preview)</label><strong>{previewMetrics.fp}</strong>
              </div>
              <div className="pill" style={{ background:"rgba(239,68,68,.06)" }}>
                <label>FN (preview)</label><strong>{previewMetrics.fn}</strong>
              </div>
            </div>

            <div className="text-xs" style={{ color:"var(--muted)" }}>
              Preview is computed locally from the uploaded dataset. Hook <code>/api/thresholds</code> to persist and score on server.
            </div>
          </div>
        </div>
      </Card>

      {/* Suggestions */}
      <Card title="Guidance">
        <ul className="list-disc ml-5 text-sm" style={{ color:"var(--muted)" }}>
          <li>Lower <strong>Credit Score</strong> threshold → flags more applicants as risky (↑ recall, possible ↓ precision).</li>
          <li>Lower <strong>DTI</strong> limit → stricter affordability (↑ defaults caught, but ↑ false positives).</li>
          <li>Use <strong>Export/Import</strong> to version control threshold packs per portfolio or geography.</li>
        </ul>
      </Card>
    </>
  );
}
