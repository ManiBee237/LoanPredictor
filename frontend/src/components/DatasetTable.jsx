export default function DatasetTable({ rows }) {
  if (!rows?.length) return <div className="text-slate-400">No data loaded.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900 text-slate-300">
          <tr>
            {["Age","Income","LoanAmount","CreditScore","Default"].map(h => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((r, i) => (
            <tr key={i} className="odd:bg-slate-950 even:bg-slate-900">
              <td className="px-3 py-2">{r.Age}</td>
              <td className="px-3 py-2">{r.Income}</td>
              <td className="px-3 py-2">{r.LoanAmount}</td>
              <td className="px-3 py-2">{r.CreditScore}</td>
              <td className="px-3 py-2">{r.Default}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 100 && (
        <div className="p-2 text-xs text-slate-400">Showing first 100 of {rows.length} rows…</div>
      )}
    </div>
  );
}
