import React, { createContext, useContext, useMemo, useState } from "react";
import { computeMetrics } from "../lib/metrics.js";

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [rows, setRows] = useState([]); // [{Age,Income,LoanAmount,CreditScore,Default}]
  const [thresholds, setThresholds] = useState({ creditScore: 650, dti: 0.4 });

  const metrics = useMemo(() => computeMetrics(rows, thresholds), [rows, thresholds]);

  const value = { rows, setRows, thresholds, setThresholds, metrics };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used within <AppProvider>");
  return v;
}
