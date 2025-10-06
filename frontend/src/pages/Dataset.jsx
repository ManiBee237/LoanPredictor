import Card from "../components/Card.jsx";
import FileDrop from "../components/FileDrop.jsx";
import DatasetTable from "../components/DatasetTable.jsx";
import { useDataStore } from "../store/useDataStore.js";
import { computeMetrics } from "../lib/baseline.js";

export default function Dataset() {
  const rows = useDataStore(s => s.rows);
  const setRows = useDataStore(s => s.setRows);
  const thresholds = useDataStore(s => s.thresholds);
  const setMetrics = useDataStore(s => s.setMetrics);
  const setThresholds = useDataStore(s => s.setThresholds);

  const onRows = (newRows) => {
    setRows(newRows);
    setMetrics(computeMetrics(newRows, thresholds));
  };

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Dataset</div>
      <Card title="Upload CSV">
        <FileDrop onRows={onRows} />
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Credit Score Threshold</label>
            <input
              type="number"
              defaultValue={thresholds.creditScore}
              onChange={(e)=>setThresholds({ creditScore: Number(e.target.value) })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max DTI (Loan/Income)</label>
            <input
              type="number" step="0.01"
              defaultValue={thresholds.dti}
              onChange={(e)=>setThresholds({ dti: Number(e.target.value) })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
            />
          </div>
        </div>
      </Card>

      <Card title="Preview (first 100 rows)">
        <DatasetTable rows={rows} />
      </Card>
    </div>
  );
}
