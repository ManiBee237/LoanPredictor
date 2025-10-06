export default function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-semibold">{(value ?? 0).toFixed(3)}</div>
    </div>
  );
}
