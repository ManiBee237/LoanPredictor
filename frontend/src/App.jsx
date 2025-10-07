import React, { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Dataset from "./pages/Dataset.jsx";
import Predict from "./pages/Predict.jsx";
import Reports from "./pages/Reports.jsx";
import Thresholds from "./pages/Thresholds.jsx";
import Settings from "./pages/Settings.jsx";
import About from "./pages/About.jsx";
import { AppProvider } from "./store/AppContext.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard", component: <Dashboard /> },
  { id: "dataset",   label: "Dataset",   component: <Dataset /> },
  { id: "predict",   label: "Predict",   component: <Predict /> },
  { id: "reports",   label: "Reports",   component: <Reports /> },
  { id: "thresholds",label: "Thresholds",component: <Thresholds /> },
  { id: "settings",  label: "Settings",  component: <Settings /> },
  { id: "about",     label: "About",     component: <About /> },
];

export default function App() {
  const [active, setActive] = useState("dashboard");

  return (
    <AppProvider>
      {/* Topbar */}
      <header className="sticky top-0 z-50 border-b bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-5 rounded-md" style={{ background: `linear-gradient(135deg, var(--brand), var(--brand-2))` }} />
              <div className="truncate">
                <h1 className="truncate text-base font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
                  Loan Default Predictor
                </h1>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>Banking · Risk Scoring Suite</p>
              </div>
            </div>

            {/* Primary nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {PAGES.map(p => (
                <button
                  key={p.id}
                  onClick={()=>setActive(p.id)}
                  className="btn-quiet"
                  style={active===p.id
                    ? { boxShadow:"0 0 0 3px rgba(42,91,132,.10)", borderColor:"#CBD6E4", color:"var(--brand)" }
                    : {}}
                >
                  {p.label}
                </button>
              ))}
            </nav>

            {/* Compact nav (mobile) */}
            <div className="flex items-center gap-2 lg:hidden">
              <select
                value={active}
                onChange={(e)=>setActive(e.target.value)}
                className="input"
                aria-label="Navigation"
              >
                {PAGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <div className="grid size-8 place-items-center rounded-full text-xs font-semibold text-white shadow-sm"
                   style={{ background: `linear-gradient(135deg, var(--brand), var(--brand-2))` }}>
                MB
              </div>
            </div>
          </div>
        </div>

        {/* Secondary bar (context actions) */}
        <div className="border-t" style={{ borderColor:"var(--border)", background:"var(--surface-2)" }}>
          <div className="mx-auto max-w-6xl px-4 py-2 text-xs" style={{ color:"var(--muted)" }}>
            {PAGES.find(p=>p.id===active)?.label} · Secure workspace
          </div>
        </div>
      </header>

      {/* Content (no sidebar) */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-5">
        {PAGES.find(p => p.id === active)?.component}
      </main>

      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor:"var(--border)", background:"var(--surface-2)" }}>
        <div className="mx-auto max-w-6xl px-4 text-xs" style={{ color:"var(--muted)" }}>
          © {new Date().getFullYear()} Loan Default Predictor · Internal Demo UI
        </div>
      </footer>
    </AppProvider>
  );
}
