import React, { useEffect, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import { useApp } from "../store/AppContext.jsx";

const THEME_KEYS = ["default", "light", "contrast"];

export default function Settings() {
  const { rows, setRows } = useApp();
  const [theme, setTheme] = useState(localStorage.getItem("ui-theme") || "default");
  const [density, setDensity] = useState(localStorage.getItem("ui-density") || "comfortable");
  const [apiBase, setApiBase] = useState(localStorage.getItem("api-base") || "/api");
  const fileCsvRef = useRef(null);
  const fileJsonRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ui-theme", theme);
    document.documentElement.classList.remove("light", "contrast");
    if (theme === "light") document.documentElement.classList.add("light");
    if (theme === "contrast") document.documentElement.classList.add("contrast");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ui-density", density);
    document.body.style.setProperty("--density", density === "compact" ? "0.875" : "1");
  }, [density]);

  useEffect(() => {
    localStorage.setItem("api-base", apiBase);
  }, [apiBase]);

  const clearDataset = () => setRows([]);

  const loadExample = (n = 30) => {
    const rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const arr = Array.from({ length: n }).map(() => {
      const age = rnd(21, 65);
      const income = rnd(25000, 120000);
      const loan = rnd(3000, 40000);
      const cs = clamp(Math.round(500 + (income - loan) / 600 + rnd(-80, 80)), 300, 850);
      const dti = loan / Math.max(income, 1);
      const risk = (cs < 640 ? 1 : 0) + (dti > 0.45 ? 1 : 0);
      const def = Math.random() < (risk === 2 ? 0.65 : risk === 1 ? 0.25 : 0.08) ? 1 : 0;
      return { Age: age, Income: income, LoanAmount: loan, CreditScore: cs, Default: def };
    });
    setRows(arr);
  };

  const exportCSV = () => {
    const header = "Age,Income,LoanAmount,CreditScore,Default";
    const lines = rows.map(r => [r.Age, r.Income, r.LoanAmount, r.CreditScore, r.Default].join(","));
    downloadBlob([header, ...lines].join("\n"), "dataset.csv", "text/csv;charset=utf-8;");
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify({ rows }, null, 2), "dataset.json", "application/json");
  };

  const importCSV = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const [head, ...rest] = text.trim().split(/\r?\n/);
        const cols = head.split(",");
        const needed = ["Age","Income","LoanAmount","CreditScore","Default"];
        const mapIdx = Object.fromEntries(needed.map(k => [k, cols.indexOf(k)]));
        if (needed.some(k => mapIdx[k] === -1)) return;
        const out = rest.filter(Boolean).map(line => {
          const c = line.split(",");
          return {
            Age: Number(c[mapIdx.Age] || 0),
            Income: Number(c[mapIdx.Income] || 0),
            LoanAmount: Number(c[mapIdx.LoanAmount] || 0),
            CreditScore: Number(c[mapIdx.CreditScore] || 0),
            Default: Number(c[mapIdx.Default] || 0),
          };
        });
        setRows(out);
      } catch {}
    };
    reader.readAsText(file);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const j = JSON.parse(reader.result);
        if (Array.isArray(j)) setRows(j);
        else if (Array.isArray(j?.rows)) setRows(j.rows);
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <>
      <h2 className="text-lg font-semibold">Settings</h2>

      <Card title="Appearance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Theme</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEME_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className="btn-quiet text-center"
                  style={theme===k ? { boxShadow:"0 0 0 3px rgba(42,91,132,.10)", borderColor:"#CBD6E4", color:"var(--brand)" } : {}}
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Density</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                className="btn-quiet"
                onClick={() => setDensity("comfortable")}
                style={density==="comfortable" ? { boxShadow:"0 0 0 3px rgba(42,91,132,.10)", borderColor:"#CBD6E4", color:"var(--brand)" } : {}}
              >
                Comfortable
              </button>
              <button
                className="btn-quiet"
                onClick={() => setDensity("compact")}
                style={density==="compact" ? { boxShadow:"0 0 0 3px rgba(42,91,132,.10)", borderColor:"#CBD6E4", color:"var(--brand)" } : {}}
              >
                Compact
              </button>
            </div>
            <div className="text-xs mt-2" style={{ color:"var(--muted)" }}>
              Applies subtle spacing changes across the UI.
            </div>
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>Accent Preview</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <div className="h-8 rounded" style={{ background:"var(--brand)" }} />
              <div className="h-8 rounded" style={{ background:"var(--brand-2)" }} />
              <div className="h-8 rounded" style={{ background:"var(--accent)" }} />
              <div className="h-8 rounded border" style={{ borderColor:"var(--border)", background:"var(--surface-2)" }} />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Data Management">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <button className="btn-quiet" onClick={() => fileCsvRef.current?.click()}>Import CSV</button>
              <button className="btn-quiet" onClick={() => fileJsonRef.current?.click()}>Import JSON</button>
              <input ref={fileCsvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>importCSV(e.target.files?.[0])} />
              <input ref={fileJsonRef} type="file" accept="application/json,.json" className="hidden" onChange={(e)=>importJSON(e.target.files?.[0])} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-brand" onClick={exportCSV}>Export CSV</button>
              <button className="btn-quiet" onClick={exportJSON}>Export JSON</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-quiet" onClick={() => loadExample(30)}>Load Example (30)</button>
              <button className="btn-quiet" onClick={() => loadExample(100)}>Load Example (100)</button>
              <button className="btn-quiet" onClick={clearDataset}>Clear Dataset</button>
            </div>
            <div className="text-xs" style={{ color:"var(--muted)" }}>
              Rows loaded: {rows.length}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs" style={{ color:"var(--muted)" }}>API Base URL</label>
            <input className="input" value={apiBase} onChange={(e)=>setApiBase(e.target.value)} placeholder="/api" />
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-quiet"
                onClick={()=>setApiBase("/api")}
              >
                Use /api (default)
              </button>
              <button
                className="btn-quiet"
                onClick={()=>setApiBase("http://localhost:3000/api")}
              >
                Use http://localhost:3000/api
              </button>
            </div>
            <div className="text-xs" style={{ color:"var(--muted)" }}>
              Stored locally; your fetch calls can read <code>localStorage.getItem("api-base")</code>.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Developer Tools">
        <div className="flex flex-wrap gap-2">
          <button className="btn-quiet" onClick={()=>{ localStorage.clear(); location.reload(); }}>
            Reset All Local Settings
          </button>
          <button className="btn-quiet" onClick={()=>{ console.log({ rows }); alert("Rows logged to console."); }}>
            Log Dataset to Console
          </button>
        </div>
      </Card>
    </>
  );
}

/* helpers */
function downloadBlob(data, filename, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
