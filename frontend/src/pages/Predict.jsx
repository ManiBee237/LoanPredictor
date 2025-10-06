import Card from "../components/Card.jsx";
import { useState } from "react";
import { useDataStore } from "../store/useDataStore.js";
import { predictLabel } from "../lib/baseline.js";

export default function Predict() {
  const thresholds = useDataStore(s => s.thresholds);
  const [form, setForm] = useState({
    Age: 30, Income: 40000, LoanAmount: 15000, CreditScore: 650
  });
  const yhat = predictLabel(form, thresholds);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Predict</div>
      <Card title="Loan Application">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input label="Age" value={form.Age} onChange={v=>set("Age", Number(v))} />
          <Input label="Income" value={form.Income} onChange={v=>set("Income", Number(v))} />
          <Input label="LoanAmount" value={form.LoanAmount} onChange={v=>set("LoanAmount", Number(v))} />
          <Input label="CreditScore" value={form.CreditScore} onChange={v=>set("CreditScore", Number(v))} />
        </div>
        <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900">
          <div className="text-sm text-slate-300">Prediction (baseline):</div>
          <div className={`mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm 
              ${yhat===1 ? "bg-red-500/15 text-red-300 border border-red-700/40" 
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-700/40"}`}>
            {yhat===1 ? "Likely Default (1)" : "Likely Non-Default (0)"}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            This is a heuristic for demo. Replace with real ML API later.
          </div>
        </div>
      </Card>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
        value={value}
        onChange={e=>onChange(e.target.value)}
        type="number"
      />
    </div>
  );
}
