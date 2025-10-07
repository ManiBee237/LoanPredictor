import React from "react";
export default function DatasetTable({ rows }) {
  if (!rows?.length) return <div className="help">No data loaded.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {["Age","Income","LoanAmount","CreditScore","Default"].map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0,100).map((r,i)=>(
            <tr key={i}>
              <td>{r.Age}</td>
              <td>{r.Income}</td>
              <td>{r.LoanAmount}</td>
              <td>{r.CreditScore}</td>
              <td>{r.Default}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
