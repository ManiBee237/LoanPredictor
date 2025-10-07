import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../store/AppContext.jsx";
import Card from "../components/Card.jsx";
import FileDrop from "../components/FileDrop.jsx";
import DatasetTable from "../components/DatasetTable.jsx";

/* --- tiny inline bar (no deps) --- */
function SparkBar({ pct = 0, label = "" }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-2 rounded-full bg-[var(--surface-2)] relative overflow-hidden" title={`${label}: ${p.toFixed(1)}%`}>
      <div className="h-full bg-[var(--brand)]" style={{ width: `${p}%` }} />
    </div>
  );
}

export default function Dataset() {
  const { rows, setRows, thresholds, setThresholds } = useApp();
  const [apiInfo, setApiInfo] = useState({ uploaded: false, serverSummary: null, lastUpdated: null });

  /* --- derived stats from local CSV --- */
  const stats = useMemo(() => {
    const n = rows.length;
    const headers = ["Age", "Income", "LoanAmount", "CreditScore", "Default"];
    const missing = Object.fromEntries(headers.map(h => [h, 0]));
    let sumCS = 0, sumDTI = 0, defaults = 0;

    rows.forEach(r => {
      headers.forEach(h => { if (r[h] === undefined || r[h] === null || Number.isNaN(r[h])) missing[h]++; });
      const cs = Number(r.CreditScore) || 0;
      const inc = Number(r.Income) || 0;
      const loa = Number(r.LoanAmount) || 0;
      const dti = inc ? loa / inc : 0;
      sumCS += cs;
      sumDTI += dti;
      if (Number(r.Default) === 1) defaults++;
    });

    return {
      rows: n,
      columns: headers.length,
      defaults,
      nonDefaults: Math.max(0, n - defaults),
      defaultRate: n ? (defaults / n) * 100 : 0,
      avgCredit: n ? sumCS / n : 0,
      avgDTI: n ? sumDTI / n : 0,
      missing,
      headers,
    };
  }, [rows]);

  /* --- API wiring placeholder (send preview of dataset) --- */
  useEffect(() => {
    async function sendPreview() {
      if (!rows.length) return;
      try {
        // Example: POST first 50 rows for server-side profiling
        // const res = await fetch("/api/dataset/preview", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ sample: rows.slice(0, 50) }),
        // });
        // const data = await res.json();
        // setApiInfo({ uploaded: true, serverSummary: data.summary, lastUpdated: new Date().toISOString() });

        // Local mirror (until API exists)
        setApiInfo({ uploaded: true, serverSummary: { received: Math.min(50, rows.length) }, lastUpdated: new Date().toISOString() });
      } catch (e) {
        setApiInfo(x => ({ ...x, uploaded: false }));
      }
    }
    sendPreview();
  }, [rows]);

  /* --- handlers --- */
  const onCreditScore = (v) => setThresholds(t => ({ ...t, creditScore: Number(v) || 0 }));
  const onDti = (v) => setThresholds(t => ({ ...t, dti: Number(v) || 0 }));

  const loadExample = () => {
    const demo = [
      { Age:30, Income:40000, LoanAmount:15000, CreditScore:720, Default:0 },
      { Age:42, Income:30000, LoanAmount:20000, CreditScore:580, Default:1 },
      { Age:25, Income:35000, LoanAmount:12000, CreditScore:690, Default:0 },
      { Age:52, Income:28000, LoanAmount:22000, CreditScore:560, Default:1 },
      { Age:36, Income:40000, LoanAmount:19000, CreditScore:610, Default:1 },
    ];
    setRows(demo);
  };

  const clearData = () => setRows([]);

  return (
    <>
      <h2 className="text-lg font-semibold">Dataset</h2>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-title">Rows</div>
          <div className="text-2xl font-semibold">{stats.rows}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{stats.columns} columns</div>
        </div>
        <div className="card">
          <div className="card-title">Default Rate</div>
          <div className="text-2xl font-semibold">{stats.defaultRate.toFixed(1)}%</div>
          <div className="mt-2"><SparkBar pct={stats.defaultRate} label="Default Rate" /></div>
        </div>
        <div className="card">
          <div className="card-title">Avg Credit Score</div>
          <div className="text-2xl font-semibold">{stats.avgCredit.toFixed(0)}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Higher is better</div>
        </div>
        <div className="card">
          <div className="card-title">Avg DTI</div>
          <div className="text-2xl font-semibold">{stats.avgDTI.toFixed(2)}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>Loan / Income</div>
        </div>
      </div>

      {/* Upload & thresholds */}
      <Card title="Upload CSV" footer="Required columns: Age, Income, LoanAmount, CreditScore, Default">
        <div className="grid md:grid-cols-2 gap-4">
          <FileDrop onRows={setRows} />
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs" style={{ color:"var(--muted)" }}>Credit Score Threshold</label>
              <input className="input" type="number" value={thresholds.creditScore} onChange={(e)=>onCreditScore(e.target.value)} />
            </div>
            <div>
              <label className="text-xs" style={{ color:"var(--muted)" }}>Max DTI (Loan/Income)</label>
              <input className="input" type="number" step="0.01" value={thresholds.dti} onChange={(e)=>onDti(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-quiet" onClick={loadExample}>Load Example</button>
              <button className="btn-quiet" onClick={clearData}>Clear</button>
            </div>
            <div className="text-xs" style={{ color:"var(--muted)" }}>
              API: {apiInfo.uploaded ? "preview sent" : "not sent"} {apiInfo.lastUpdated && `· ${new Date(apiInfo.lastUpdated).toLocaleString()}`}
            </div>
          </div>
        </div>
      </Card>

      {/* Data quality */}
      <Card title="Data Quality">
        <div className="grid md:grid-cols-5 gap-3">
          {stats.headers.map(h => (
            <div key={h} className="pill">
              <label>{h} missing</label>
              <strong>{stats.missing[h]}</strong>
            </div>
          ))}
        </div>
      </Card>

      {/* Preview table */}
      <Card title="Preview (first 100 rows)">
        <DatasetTable rows={rows} />
      </Card>
    </>
  );
}
