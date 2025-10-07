import React from "react";
import Card from "../components/Card.jsx";

export default function About() {
  const Feature = ({ title, desc }) => (
    <div className="rounded-2xl border p-4" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
      <div className="text-sm font-semibold" style={{ color:"var(--brand)" }}>{title}</div>
      <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>{desc}</div>
    </div>
  );

  return (
    <>
      <h2 className="text-lg font-semibold">About</h2>

      <Card title="Overview">
        <p className="text-sm" style={{ color:"var(--muted)" }}>
          <strong>Loan Default Predictor</strong> is a professional, banking-style interface to demonstrate end-to-end
          credit risk scoring. It supports dataset upload, heuristic threshold tuning, live prediction with
          probability preview, dashboards, and exportable reports. The UI is framework-light and uses only React,
          Tailwind, and a few small utilities—no heavy chart libraries.
        </p>
      </Card>

      <Card title="Capabilities">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Feature title="Dataset Intake" desc="Upload CSV (Age, Income, LoanAmount, CreditScore, Default). Automatic data quality stats and preview." />
          <Feature title="Threshold Tuning" desc="Adjust credit score & DTI limits; preview metrics before applying. Export/Import presets." />
          <Feature title="Prediction" desc="Interactive sliders & form; probability-of-default gauge; save scenarios; API-ready hook." />
          <Feature title="Dashboard" desc="KPIs, confusion bars, sparklines, and recent records—all computed from your uploaded dataset." />
          <Feature title="Reports" desc="Download metrics as CSV/JSON/HTML. Print-friendly layout for submissions and audits." />
          <Feature title="Settings" desc="Themes, density, API base URL, dataset import/export, and developer utilities." />
        </div>
      </Card>

      <Card title="Architecture">
        <ul className="list-disc ml-5 text-sm" style={{ color:"var(--muted)" }}>
          <li>Frontend: React (functional components), Tailwind v4 via <code>@tailwindcss/vite</code>.</li>
          <li>State: Lightweight Context (<code>AppContext</code>)—no external state library.</li>
          <li>Charts: Inline SVG (sparklines, gauges, donuts) to avoid heavy dependencies.</li>
          <li>API: Pluggable via <code>localStorage.getItem("api-base")</code> (default <code>/api</code>).</li>
        </ul>
      </Card>

      <Card title="Model Roadmap">
        <ul className="list-disc ml-5 text-sm" style={{ color:"var(--muted)" }}>
          <li>Swap heuristic with Logistic Regression / Decision Tree served from <code>/api/predict</code>.</li>
          <li>Add calibration plot, ROC/AUC, and SHAP summaries on the Reports/Dashboard pages.</li>
          <li>Portfolio segmentation (student loans, auto, SME) with threshold packs per segment.</li>
        </ul>
      </Card>

      <Card title="Acknowledgments & Use">
        <p className="text-sm" style={{ color:"var(--muted)" }}>
          This project is intended for educational demonstration. Ensure you comply with institutional
          guidelines when presenting risk models and avoid using personally identifiable information.
        </p>
      </Card>
    </>
  );
}
