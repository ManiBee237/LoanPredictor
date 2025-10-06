import { create } from "zustand";

// shape of a row: { Age, Income, LoanAmount, CreditScore, Default }
export const useDataStore = create((set, get) => ({
  rows: [],
  setRows: (rows) => set({ rows }),

  metrics: {
    accuracy: null, precision: null, recall: null, f1: null,
    tn: 0, fp: 0, fn: 0, tp: 0
  },
  setMetrics: (metrics) => set({ metrics }),

  // baseline threshold used by client-side heuristic
  thresholds: { creditScore: 650, dti: 0.4 },
  setThresholds: (t) => set({ thresholds: { ...get().thresholds, ...t } }),
}));
