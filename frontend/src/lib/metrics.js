// Baseline predictor (heuristic) + metrics
export function predictLabel(row, thresholds = { creditScore: 650, dti: 0.4 }) {
  const income = Number(row.Income) || 0;
  const loan   = Number(row.LoanAmount) || 0;
  const cs     = Number(row.CreditScore) || 0;
  const dti    = loan / Math.max(income, 1);

  if (cs < thresholds.creditScore && dti > thresholds.dti) return 1;
  return 0;
}

export function logisticProb(row) {
  const age = Number(row.Age) || 0;
  const income = Number(row.Income) || 0;
  const loan = Number(row.LoanAmount) || 0;
  const cs = Number(row.CreditScore) || 0;
  const dti = loan / Math.max(income, 1);

  // Toy coefficients (replace later with trained ones)
  const beta0 = -3.5, bAge = 0.01, bDTI = 4.2, bCS = -0.005;
  const z = beta0 + bAge*age + bDTI*dti + bCS*cs;
  return 1 / (1 + Math.exp(-z));
}

export function computeMetrics(rows, thresholds) {
  let tp=0, tn=0, fp=0, fn=0;
  for (const r of rows) {
    const y = Number(r.Default) || 0;
    const yhat = predictLabel(r, thresholds);
    if (y===1 && yhat===1) tp++;
    else if (y===0 && yhat===0) tn++;
    else if (y===0 && yhat===1) fp++;
    else if (y===1 && yhat===0) fn++;
  }
  const total = tp+tn+fp+fn || 1;
  const accuracy  = (tp+tn)/total;
  const precision = tp/(tp+fp || 1);
  const recall    = tp/(tp+fn || 1);
  const f1        = (2*precision*recall)/((precision+recall) || 1);
  return { tp, tn, fp, fn, accuracy, precision, recall, f1 };
}
