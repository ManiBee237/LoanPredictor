// A simple *baseline* rule-based predictor you'll demo today.
// Later, replace with API predictions.
export function predictLabel(row, thresholds = { creditScore: 650, dti: 0.4 }) {
  // Debt-to-Income (rough proxy) ≈ LoanAmount / max(Income,1)
  const dti = (Number(row.LoanAmount) || 0) / Math.max(Number(row.Income) || 0, 1);
  const cs = Number(row.CreditScore) || 0;

  // Heuristic:
  // If credit score < threshold and DTI high => default (1)
  if (cs < thresholds.creditScore && dti > thresholds.dti) return 1;
  // Otherwise non-default
  return 0;
}

export function computeMetrics(rows, thresholds) {
  let tp=0, tn=0, fp=0, fn=0;
  rows.forEach(r => {
    const y = Number(r.Default) || 0;
    const yhat = predictLabel(r, thresholds);
    if (y === 1 && yhat === 1) tp++;
    else if (y === 0 && yhat === 0) tn++;
    else if (y === 0 && yhat === 1) fp++;
    else if (y === 1 && yhat === 0) fn++;
  });

  const accuracy  = (tp+tn)/(tp+tn+fp+fn || 1);
  const precision = tp/(tp+fp || 1);
  const recall    = tp/(tp+fn || 1);
  const f1        = (2*precision*recall)/((precision+recall) || 1);
  return { tp, tn, fp, fn, accuracy, precision, recall, f1 };
}
