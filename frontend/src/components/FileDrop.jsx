import Papa from "papaparse";

export default function FileDrop({ onRows }) {
  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        // normalize keys
        const rows = res.data
          .filter(r => r.Age !== undefined && r.Income !== undefined)
          .map(r => ({
            Age: Number(r.Age),
            Income: Number(r.Income),
            LoanAmount: Number(r.LoanAmount),
            CreditScore: Number(r.CreditScore),
            Default: Number(r.Default),
          }));
        onRows(rows);
      }
    });
  };

  return (
    <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-700 p-6 text-center hover:bg-slate-900">
      <div className="text-slate-300">Drop CSV here or click to upload</div>
      <div className="text-xs text-slate-500 mt-1">Required columns: Age, Income, LoanAmount, CreditScore, Default</div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </label>
  );
}
