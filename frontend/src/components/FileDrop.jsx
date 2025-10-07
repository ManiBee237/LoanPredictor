import React from "react";
import Papa from "papaparse";

export default function FileDrop({ onRows }) {
  const parse = (file) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const rows = res.data
          .filter(r => r && r.Age !== undefined && r.Income !== undefined)
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
    <label className="card" style={{textAlign:"center", cursor:"pointer"}}>
      <div>Drop CSV here or click to upload</div>
      <div className="help">Required: Age, Income, LoanAmount, CreditScore, Default</div>
      <input type="file" accept=".csv" onChange={(e)=>parse(e.target.files?.[0])} style={{display:"none"}} />
    </label>
  );
}
