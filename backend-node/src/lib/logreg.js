function mean(arr){ return arr.reduce((s,v)=>s+v,0)/(arr.length||1); }
function std(arr){ const m=mean(arr); const v=arr.reduce((s,v)=>s+(v-m)*(v-m),0)/(arr.length||1); return Math.sqrt(v)||1; }

function standardizeMatrix(X){
  const d = X[0]?.length || 0;
  const mu = Array(d).fill(0), sigma = Array(d).fill(1);
  for (let j=0;j<d;j++){ const col = X.map(r=>r[j]||0); mu[j]=mean(col); sigma[j]=std(col); }
  const Z = X.map(r => r.map((v,j)=>(v - mu[j])/(sigma[j]||1)));
  return { Z, mu, sigma };
}

function addBias(X){ return X.map(r => [1, ...r]); }
function sigmoid(z){ return 1/(1+Math.exp(-z)); }

function predictProbaTheta(theta, x){
  let z=0; for (let j=0;j<theta.length;j++) z += theta[j]*(x[j]||0);
  return sigmoid(z);
}

function trainLogReg(X, y, opts={}){
  if (!X.length) throw new Error("No training rows.");
  const { learningRate=0.1, epochs=400 } = opts;

  const { Z, mu, sigma } = standardizeMatrix(X);
  const Xb = addBias(Z);
  const n = Xb.length, d = Xb[0].length;

  let theta = Array(d).fill(0);
  for (let ep=0; ep<epochs; ep++){
    const grad = Array(d).fill(0);
    for (let i=0;i<n;i++){
      const h = predictProbaTheta(theta, Xb[i]);
      const err = h - y[i];
      for (let j=0;j<d;j++) grad[j] += err * Xb[i][j];
    }
    for (let j=0;j<d;j++) theta[j] -= (learningRate/n)*grad[j];
  }
  return { mu, sigma, theta };
}

function predictProbaLogReg(model, rawRow){
  const { mu, sigma, theta } = model;
  const z = rawRow.map((v,j)=>((Number(v||0)-mu[j])/(sigma[j]||1)));
  const xb = [1, ...z];
  return predictProbaTheta(theta, xb);
}

module.exports = { trainLogReg, predictProbaLogReg };
