import Card from "../components/Card.jsx";
import MetricPill from "../components/MetricPill.jsx";
import ConfusionMatrixChart from "../charts/ConfusionMatrixChart.jsx";
import ROCPlaceholder from "../charts/ROCPlaceholder.jsx";
import { useDataStore } from "../store/useDataStore.js";
import { computeMetrics } from "../lib/baseline.js";
import { useEffect } from "react";

export default function Dashboard() {
  const rows = useDataStore(s => s.rows);
  const thresholds = useDataStore(s => s.thresholds);
  const metrics = useDataStore(s => s.metrics);
  const setMetrics = useDataStore(s => s.setMetrics);

  useEffect(() => {
    if (rows.length) {
      setMetrics(computeMetrics(rows, thresholds));
    }
  }, [rows, thresholds, setMetrics]);

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Dashboard</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricPill label="Accuracy" value={metrics.accuracy ?? 0} />
        <MetricPill label="Precision" value={metrics.precision ?? 0} />
        <MetricPill label="Recall" value={metrics.recall ?? 0} />
        <MetricPill label="F1 Score" value={metrics.f1 ?? 0} />
      </div>

      <Card title="Confusion Matrix">
        <ConfusionMatrixChart
          tn={metrics.tn} fp={metrics.fp} fn={metrics.fn} tp={metrics.tp}
        />
        <div className="text-xs text-slate-400 mt-2">
          Current engine: <span className="font-semibold">Baseline heuristic</span> (CreditScore+DTI).
          Replace with backend ML predictions later.
        </div>
      </Card>

      <Card title="ROC Curve">
        <ROCPlaceholder />
      </Card>
    </div>
  );
}
