import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { useApp } from "../store/AppContext.jsx";
import { predictLabel, logisticProb } from "../lib/metrics.js";

/* --- radial gauge (no deps) --- */
function Gauge({ value = 0 }) {
  const v = Math.max(0, Math.min(1, value));
  const size = 140, stroke = 12, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - v);
  const color = v > 0.7 ? "#ef4444" : v > 0.4 ? "#f59e0b" : "#10b981";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle
        cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x="50%" y="45%" textAnchor="middle" fontSize="14" fill="var(--muted)">PD</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink)">
        {(v*100).toFixed(1)}%
      </text>
    </svg>
  );
}

/* --- pretty slider --- */
function Slider({ label, min, max, step, value, onChange, unit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
        <span className="text-xs font-medium">{value}{unit || ""}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand)]"
      />
    </div>
  );
}

export default function Predict() {
  const { thresholds } = useApp();

  const [form, setForm] = useState({ Age: 30, Income: 40000, LoanAmount: 15000, CreditScore: 650 });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("predict-history") || "[]"); } catch { return []; }
  });
  const [apiState, setApiState] = useState({ loading: false, last: null, error: null });

  const safe = {
    Age: Number(form.Age) || 0,
    Income: Number(form.Income) || 0,
    LoanAmount: Number(form.LoanAmount) || 0,
    CreditScore: Number(form.CreditScore) || 0,
  };

  const dti = useMemo(() => {
    const inc = safe.Income || 0;
    const loa = safe.LoanAmount || 0;
    return inc ? loa / inc : 0;
  }, [safe.Income, safe.LoanAmount]);

  const prob = useMemo(() => logisticProb(safe), [safe]);
  const label = useMemo(() => predictLabel(safe, thresholds), [safe, thresholds]);

  useEffect(() => {
    localStorage.setItem("predict-history", JSON.stringify(history.slice(-20)));
  }, [history]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const fillPreset = (p) => setForm(p);

  const saveScenario = () => {
    const row = { ...safe, PD: +(prob.toFixed(4)), Label: label, ts: Date.now() };
    setHistory(h => [...h.slice(-19), row]);
  };

  const callApi = async () => {
    setApiState({ loading: true, last: null, error: null });
    try {
      // --- Replace with real endpoint when ready ---
      // const res = await fetch("/api/predict", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(safe),
      // });
      // const j = await res.json(); // expect { prob: number, label: 0|1, explanation?: {...} }
      // setApiState({ loading: false, last: j, error: null });

      // mirror local calc for now
      const j = { prob, label, explanation: { creditScore: safe.CreditScore, dti, age: safe.Age } };
      await new Promise(r => setTimeout(r, 250));
      setApiState({ loading: false, last: j, error: null });
    } catch (e) {
      setApiState({ loading: false, last: null, error: e?.message || "Request failed" });
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold">Predict</h2>

      {/* Scenario Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-title">Debt-to-Income</div>
          <div className="text-2xl font-semibold">{dti.toFixed(2)}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full" style={{
              width: `${Math.min(100, dti*100)}%`,
              background: dti > thresholds.dti ? "#ef4444" : "#10b981"
            }} />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            Threshold: {thresholds.dti}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Credit Score</div>
          <div className="text-2xl font-semibold">{safe.CreditScore}</div>
          <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full" style={{
              width: `${Math.min(100, (safe.CreditScore/850)*100)}%`,
              background: safe.CreditScore < thresholds.creditScore ? "#ef4444" : "#10b981"
            }} />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            Threshold: {thresholds.creditScore}
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <div className="card-title">Probability of Default</div>
            <div className={`inline-flex rounded-xl border px-3 py-1.5 text-sm font-medium mt-1`}
                 style={{
                   borderColor: "var(--border)",
                   background: label===1 ? "rgba(239,68,68,.08)" : "rgba(16,185,129,.08)",
                   color: label===1 ? "#ef4444" : "#10b981"
                 }}>
              {label===1 ? "Likely Default" : "Likely Non-Default"}
            </div>
          </div>
          <Gauge value={prob} />
        </div>

        <div className="card">
          <div className="card-title">Quick Presets</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="btn-quiet" onClick={()=>fillPreset({ Age:26, Income:42000, LoanAmount:11000, CreditScore:720 })}>Young · Good CS</button>
            <button className="btn-quiet" onClick={()=>fillPreset({ Age:45, Income:32000, LoanAmount:20000, CreditScore:590 })}>Mid · High DTI</button>
            <button className="btn-quiet" onClick={()=>fillPreset({ Age:34, Income:56000, LoanAmount:14000, CreditScore:705 })}>Stable · OK</button>
            <button className="btn-quiet" onClick={()=>fillPreset({ Age:52, Income:28000, LoanAmount:23000, CreditScore:560 })}>Older · Risk</button>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn-brand" onClick={saveScenario}>Save Scenario</button>
            <button className="btn-quiet" onClick={callApi} disabled={apiState.loading}>
              {apiState.loading ? "Scoring…" : "Score via API"}
            </button>
          </div>
          {apiState.error && <div className="text-xs mt-2" style={{ color:"#b91c1c" }}>{apiState.error}</div>}
          {apiState.last && (
            <div className="text-xs mt-2" style={{ color:"var(--muted)" }}>
              API (stub) → PD {(apiState.last.prob*100).toFixed(1)}% · Label {apiState.last.label}
            </div>
          )}
        </div>
      </div>

      {/* Inputs */}
      <Card title="Loan Application">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Age</label>
            <input className="input" type="number" value={form.Age} onChange={(e)=>set("Age", Number(e.target.value))} />
            <div className="mt-3"><Slider label="Age" min={18} max={75} step={1} value={form.Age} onChange={(v)=>set("Age", v)} /></div>
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Annual Income</label>
            <input className="input" type="number" value={form.Income} onChange={(e)=>set("Income", Number(e.target.value))} />
            <div className="mt-3"><Slider label="Income" min={10000} max={200000} step={1000} value={form.Income} onChange={(v)=>set("Income", v)} unit="" /></div>
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Loan Amount</label>
            <input className="input" type="number" value={form.LoanAmount} onChange={(e)=>set("LoanAmount", Number(e.target.value))} />
            <div className="mt-3"><Slider label="Loan" min={1000} max={250000} step={1000} value={form.LoanAmount} onChange={(v)=>set("LoanAmount", v)} /></div>
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Credit Score</label>
            <input className="input" type="number" value={form.CreditScore} onChange={(e)=>set("CreditScore", Number(e.target.value))} />
            <div className="mt-3"><Slider label="Credit Score" min={300} max={850} step={1} value={form.CreditScore} onChange={(v)=>set("CreditScore", v)} /></div>
          </div>
        </div>
      </Card>

      {/* Explanation + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Feature Signals (preview)">
          <div className="grid grid-cols-3 gap-3">
            <div className="pill">
              <label>DTI impact</label>
              <strong>{dti > thresholds.dti ? "Risk ↑" : "OK"}</strong>
            </div>
            <div className="pill">
              <label>Credit Score impact</label>
              <strong>{safe.CreditScore < thresholds.creditScore ? "Risk ↑" : "OK"}</strong>
            </div>
            <div className="pill">
              <label>Age (proxy)</label>
              <strong>{safe.Age >= 21 ? "OK" : "Low"}</strong>
            </div>
          </div>
          <div className="text-xs mt-3" style={{ color:"var(--muted)" }}>
            Final explanations come from server-side model (SHAP/feature importances). Replace with API payload when available.
          </div>
        </Card>

        <Card title="Recent Predictions (local)">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Age</th>
                  <th>Income</th>
                  <th>Loan</th>
                  <th>CS</th>
                  <th>DTI</th>
                  <th>PD</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().slice(0,8).map((h, i) => (
                  <tr key={h.ts}>
                    <td>{i+1}</td>
                    <td>{h.Age}</td>
                    <td>{h.Income}</td>
                    <td>{h.LoanAmount}</td>
                    <td>{h.CreditScore}</td>
                    <td>{( (h.LoanAmount||0) / Math.max(h.Income||0,1) ).toFixed(2)}</td>
                    <td>{(h.PD*100).toFixed(1)}%</td>
                    <td>{h.Label===1 ? "Default" : "OK"}</td>
                  </tr>
                ))}
                {!history.length && (
                  <tr>
                    <td colSpan={8} className="text-center text-sm" style={{ color:"var(--muted)" }}>
                      No scenarios saved yet. Click <strong>Save Scenario</strong> after you tweak inputs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
