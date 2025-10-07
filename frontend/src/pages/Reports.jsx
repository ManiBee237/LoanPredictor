import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { useApp } from "../store/AppContext.jsx";

/* ——— tiny sparkline (no deps) ——— */
function Sparkline({ data = [] }) {
  if (!data.length) return <div className="h-8" />;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 100;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-8 w-full text-[var(--brand)]">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.9" />
    </svg>
  );
}

/* ——— tiny donut (no deps) ——— */
function Donut({ value = 0, total = 1, size = 140, label = "Rate" }) {
  const percent = total ? Math.min(1, Math.max(0, value / total)) : 0;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * percent;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--brand)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${arc} ${circ - arc}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x="50%" y="44%" textAnchor="middle" fontSize="12" fill="var(--muted)">{label}</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--ink)">
        {(percent * 100).toFixed(1)}%
      </text>
    </svg>
  );
}

export default function Reports() {
  const { rows, metrics } = useApp();
  const [api, setApi] = useState({ lastUpdated: null, summary: null, loading: false, error: null });

  /* ——— Local summaries from dataset ——— */
  const summary = useMemo(() => {
    const n = rows.length;
    const defaults = rows.filter(r => Number(r.Default) === 1).length;
    const nonDefaults = n - defaults;

    const credit = rows.map(r => Number(r.CreditScore) || 0);
    const dti = rows.map(r => {
      const inc = Number(r.Income) || 0;
      const loa = Number(r.LoanAmount) || 0;
      return inc ? +(loa / inc).toFixed(3) : 0;
    });

    const avg = (arr) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0);

    return {
      rows: n,
      defaults,
      nonDefaults,
      defaultRate: n ? defaults/n : 0,
      creditAvg: avg(credit),
      dtiAvg: avg(dti),
      series: {
        credit: credit.slice(-24),
        dti: dti.slice(-24),
        defaultsRolling: rollingSum(rows.map(r=>Number(r.Default)||0), 6).slice(-24),
      },
      confusion: { tp: metrics.tp, tn: metrics.tn, fp: metrics.fp, fn: metrics.fn },
      scores: {
        accuracy: metrics.accuracy ?? 0,
        precision: metrics.precision ?? 0,
        recall: metrics.recall ?? 0,
        f1: metrics.f1 ?? 0,
      }
    };
  }, [rows, metrics]);

  /* ——— API wiring (placeholder) ——— */
  useEffect(() => {
    async function loadServerSummary() {
      setApi(s => ({ ...s, loading: true, error: null }));
      try {
        // const res = await fetch("/api/reports/summary");
        // const j = await res.json();
        // setApi({ lastUpdated: new Date().toISOString(), summary: j, loading: false, error: null });

        // mirror local for now
        await new Promise(r=>setTimeout(r, 200));
        setApi({ lastUpdated: new Date().toISOString(), summary: null, loading: false, error: null });
      } catch (e) {
        setApi({ lastUpdated: null, summary: null, loading: false, error: e?.message || "Failed to fetch" });
      }
    }
    loadServerSummary();
  }, [rows, metrics]);

  /* ——— Export helpers ——— */
  const downloadCSV = () => {
    const lines = [
      "metric,value",
      `rows,${summary.rows}`,
      `defaults,${summary.defaults}`,
      `nonDefaults,${summary.nonDefaults}`,
      `defaultRate,${summary.defaultRate}`,
      `accuracy,${summary.scores.accuracy}`,
      `precision,${summary.scores.precision}`,
      `recall,${summary.scores.recall}`,
      `f1,${summary.scores.f1}`,
      `tp,${summary.confusion.tp}`,
      `tn,${summary.confusion.tn}`,
      `fp,${summary.confusion.fp}`,
      `fn,${summary.confusion.fn}`,
      `creditAvg,${summary.creditAvg}`,
      `dtiAvg,${summary.dtiAvg}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, "loan-default-metrics.csv");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    triggerDownload(blob, "loan-default-summary.json");
  };

  const downloadHTML = () => {
    const html = buildHTMLReport(summary);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    triggerDownload(blob, "loan-default-report.html");
  };

  return (
    <>
      <h2 className="text-lg font-semibold">Reports</h2>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-title">Total Rows</div>
          <div className="text-2xl font-semibold">{summary.rows}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {api.loading ? "Syncing server…" : api.lastUpdated ? `Synced · ${new Date(api.lastUpdated).toLocaleString()}` : "Local only"}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Default Rate</div>
          <div className="text-2xl font-semibold">{(summary.defaultRate*100).toFixed(1)}%</div>
          <div className="mt-2">
            <Donut value={summary.defaults} total={summary.rows || 1} label="Default Rate" />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Avg Credit Score</div>
          <div className="text-2xl font-semibold">{summary.creditAvg.toFixed(0)}</div>
          <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>Last 24</div>
          <Sparkline data={summary.series.credit} />
        </div>
        <div className="card">
          <div className="card-title">Avg DTI</div>
          <div className="text-2xl font-semibold">{summary.dtiAvg.toFixed(2)}</div>
          <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>Last 24</div>
          <Sparkline data={summary.series.dti} />
        </div>
      </div>

      {/* Model Scores */}
      <Card title="Model Scores (current session)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="pill"><label>Accuracy</label><strong>{summary.scores.accuracy.toFixed(3)}</strong></div>
          <div className="pill"><label>Precision</label><strong>{summary.scores.precision.toFixed(3)}</strong></div>
          <div className="pill"><label>Recall</label><strong>{summary.scores.recall.toFixed(3)}</strong></div>
          <div className="pill"><label>F1 Score</label><strong>{summary.scores.f1.toFixed(3)}</strong></div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <div className="pill"><label>TP</label><strong>{summary.confusion.tp}</strong></div>
          <div className="pill"><label>TN</label><strong>{summary.confusion.tn}</strong></div>
          <div className="pill"><label>FP</label><strong>{summary.confusion.fp}</strong></div>
          <div className="pill"><label>FN</label><strong>{summary.confusion.fn}</strong></div>
        </div>
      </Card>

      {/* Trend of Defaults */}
      <Card title="Defaults Trend (rolling 6)">
        <Sparkline data={summary.series.defaultsRolling} />
        <div className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          Replace with server cohort chart once <code>/api/reports/summary</code> is live.
        </div>
      </Card>

      {/* Exports */}
      <Card title="Exports & Printing">
        <div className="flex flex-wrap gap-2">
          <button className="btn-brand" onClick={downloadCSV}>Download Metrics (CSV)</button>
          <button className="btn-quiet" onClick={downloadJSON}>Download Summary (JSON)</button>
          <button className="btn-quiet" onClick={downloadHTML}>Download Full Report (HTML)</button>
          <button className="btn-quiet" onClick={()=>window.print()}>Print Page</button>
        </div>
      </Card>

      {api.error && (
        <div className="text-xs" style={{ color: "#b91c1c" }}>
          Server error: {api.error}
        </div>
      )}
    </>
  );
}

/* ——— utils ——— */
function rollingSum(arr, windowSize = 6) {
  const out = [];
  let sum = 0;
  for (let i=0;i<arr.length;i++) {
    sum += arr[i];
    if (i >= windowSize) sum -= arr[i-windowSize];
    out.push(sum);
  }
  return out;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildHTMLReport(summary) {
  const style = `
    body{font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#0f172a;margin:24px;}
    h1{font-size:20px;margin:0 0 8px}
    h2{font-size:16px;margin:20px 0 8px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left}
    thead th{background:#f3f4f6}
    .kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .tile{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff}
    .muted{color:#6b7280;font-size:12px}
  `;
  const rows = `
    <tr><th>Rows</th><td>${summary.rows}</td></tr>
    <tr><th>Defaults</th><td>${summary.defaults}</td></tr>
    <tr><th>Non-Defaults</th><td>${summary.nonDefaults}</td></tr>
    <tr><th>Default Rate</th><td>${(summary.defaultRate*100).toFixed(1)}%</td></tr>
    <tr><th>Accuracy</th><td>${summary.scores.accuracy.toFixed(3)}</td></tr>
    <tr><th>Precision</th><td>${summary.scores.precision.toFixed(3)}</td></tr>
    <tr><th>Recall</th><td>${summary.scores.recall.toFixed(3)}</td></tr>
    <tr><th>F1</th><td>${summary.scores.f1.toFixed(3)}</td></tr>
    <tr><th>TP/TN/FP/FN</th><td>${summary.confusion.tp}/${summary.confusion.tn}/${summary.confusion.fp}/${summary.confusion.fn}</td></tr>
    <tr><th>Avg Credit</th><td>${summary.creditAvg.toFixed(0)}</td></tr>
    <tr><th>Avg DTI</th><td>${summary.dtiAvg.toFixed(2)}</td></tr>
  `;
  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>Loan Default Report</title><style>${style}</style></head>
<body>
  <h1>Loan Default Prediction — Report</h1>
  <div class="muted">Generated: ${new Date().toLocaleString()}</div>

  <h2>Key Metrics</h2>
  <div class="kpi">
    <div class="tile"><div class="muted">Rows</div><div style="font-size:22px;font-weight:700">${summary.rows}</div></div>
    <div class="tile"><div class="muted">Default Rate</div><div style="font-size:22px;font-weight:700">${(summary.defaultRate*100).toFixed(1)}%</div></div>
    <div class="tile"><div class="muted">Avg Credit</div><div style="font-size:22px;font-weight:700">${summary.creditAvg.toFixed(0)}</div></div>
    <div class="tile"><div class="muted">Avg DTI</div><div style="font-size:22px;font-weight:700">${summary.dtiAvg.toFixed(2)}</div></div>
  </div>

  <h2>Details</h2>
  <table><tbody>${rows}</tbody></table>

  <h2>Notes</h2>
  <div class="muted">This HTML report reflects the current in-browser dataset and heuristic scoring. Replace with server-side exports when the API is available.</div>
</body></html>`;
}
