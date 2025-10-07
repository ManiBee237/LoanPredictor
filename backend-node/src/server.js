const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { parseCsvToObjects, validateColumns } = require("./src/lib/data");
const { computeMetrics, confusionFromArrays } = require("./src/lib/metrics");
const { trainLogReg, predictProbaLogReg } = require("./src/lib/logreg");
const { trainDecisionTree, predictProbaTree } = require("./src/lib/tree");
const { saveJSON, loadJSON, ensureDir } = require("./src/lib/storage");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// CORS for Vite dev
app.use(cors({
  origin: ["http://localhost:5173","http://127.0.0.1:5173","http://0.0.0.0:5173"],
  credentials: true
}));
app.use(express.json());

// ---- Config / Globals ----
const ARTIFACT_DIR = path.join(__dirname, "artifacts");
ensureDir(ARTIFACT_DIR);

const FEATURES = ["Age", "Income", "LoanAmount", "CreditScore"];
const TARGET = "Default";

const paths = {
  logreg: path.join(ARTIFACT_DIR, "logreg.json"),
  tree: path.join(ARTIFACT_DIR, "tree.json"),
  summary: path.join(ARTIFACT_DIR, "summary.json"),
  metrics: path.join(ARTIFACT_DIR, "metrics.json")
};

// Root (nice landing)
app.get("/", (_req, res) => {
  res.type("html").send(`
  <!doctype html><html><head><meta charset="utf-8"/><style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:40px;color:#0f172a}
  .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;max-width:760px}
  a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
  code{background:#f3f4f6;padding:2px 6px;border-radius:6px}
  </style></head><body>
  <div class="card">
    <h1>Loan Default ML API (Node/Express)</h1>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
    </ul>
    <p>Train via <code>POST /api/train</code> (form-data CSV), predict via <code>POST /api/predict</code> (JSON).</p>
  </div></body></html>`);
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    artifacts: ARTIFACT_DIR,
    models: { logreg: fs.existsSync(paths.logreg), tree: fs.existsSync(paths.tree) }
  });
});

// ---- Train (CSV upload) ----
app.post("/api/train", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a CSV under field 'file'." });

    const rows = await parseCsvToObjects(req.file.buffer);
    validateColumns(rows, FEATURES, TARGET);

    // ensure numeric
    for (const r of rows) {
      for (const c of [...FEATURES, TARGET]) r[c] = Number(r[c] ?? 0) || 0;
    }

    // arrays
    const X = rows.map(r => [r.Age, r.Income, r.LoanAmount, r.CreditScore]);
    const y = rows.map(r => Number(r.Default));

    // simple split 80/20
    const idx = X.map((_, i) => i);
    shuffleInPlace(idx, 42);
    const split = Math.floor(0.8 * idx.length);
    const trainIdx = idx.slice(0, split), testIdx = idx.slice(split);
    const Xtr = trainIdx.map(i => X[i]), ytr = trainIdx.map(i => y[i]);
    const Xte = testIdx.map(i => X[i]), yte = testIdx.map(i => y[i]);

    // --- Logistic Regression (std + GD) ---
    const logregModel = trainLogReg(Xtr, ytr, { learningRate: 0.1, epochs: 400 });
    const yprob_lr = Xte.map(row => predictProbaLogReg(logregModel, row));
    const ypred_lr = yprob_lr.map(p => (p >= 0.5 ? 1 : 0));
    const cm_lr = confusionFromArrays(yte, ypred_lr);
    const m_lr = computeMetrics(yte, ypred_lr, cm_lr);
    saveJSON(paths.logreg, logregModel);

    // --- Decision Tree (package) ---
    const treeModel = trainDecisionTree(rows, FEATURES, TARGET);
    const yprob_dt = Xte.map((row, k) => predictProbaTree(treeModel, FEATURES, rows[testIdx[k]]));
    const ypred_dt = yprob_dt.map(p => (p >= 0.5 ? 1 : 0));
    const cm_dt = confusionFromArrays(yte, ypred_dt);
    const m_dt = computeMetrics(yte, ypred_dt, cm_dt);
    saveJSON(paths.tree, treeModel);

    // Summary
    const n = rows.length;
    const defaults = rows.reduce((s, r) => s + (r.Default ? 1 : 0), 0);
    const creditAvg = n ? rows.reduce((s, r) => s + (r.CreditScore || 0), 0) / n : 0;
    const dtiAvg = n ? rows.reduce((s, r) => s + ((r.LoanAmount || 0) / Math.max(r.Income || 1, 1)), 0) / n : 0;
    const summary = { rows: n, defaults, nonDefaults: n - defaults, defaultRate: n ? defaults / n : 0, creditAvg, dtiAvg };
    saveJSON(paths.summary, summary);
    saveJSON(paths.metrics, { logreg: m_lr, tree: m_dt });

    res.json([{ model: "logreg", ...m_lr }, { model: "tree", ...m_dt }]);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: String(e.message || e) });
  }
});

// ---- Predict (JSON) ----
app.post("/api/predict", (req, res) => {
  try {
    const { Age, Income, LoanAmount, CreditScore } = req.body || {};
    const model = (req.query.model || "logreg").toString();
    const threshold = Math.min(0.9, Math.max(0.1, Number(req.query.threshold || 0.5)));

    const features = [
      Number(Age || 0),
      Number(Income || 0),
      Number(LoanAmount || 0),
      Number(CreditScore || 0)
    ];

    if (model === "logreg") {
      if (!fs.existsSync(paths.logreg)) return res.status(404).json({ error: "logreg model not trained yet." });
      const mdl = loadJSON(paths.logreg);
      const prob = predictProbaLogReg(mdl, features);
      const label = prob >= threshold ? 1 : 0;
      return res.json({ model: "logreg", prob, label, explanation: { features: { Age, Income, LoanAmount, CreditScore }, threshold } });
    } else {
      if (!fs.existsSync(paths.tree)) return res.status(404).json({ error: "tree model not trained yet." });
      const mdl = loadJSON(paths.tree);
      const obj = { Age: features[0], Income: features[1], LoanAmount: features[2], CreditScore: features[3] };
      const prob = predictProbaTree(mdl, FEATURES, obj);
      const label = prob >= threshold ? 1 : 0;
      return res.json({ model: "tree", prob, label, explanation: { features: { Age, Income, LoanAmount, CreditScore }, threshold } });
    }
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: String(e.message || e) });
  }
});

// ---- Reports summary ----
app.get("/api/reports/summary", (_req, res) => {
  const summary = (fs.existsSync(paths.summary) ? loadJSON(paths.summary) : { rows:0, defaults:0, nonDefaults:0, defaultRate:0, creditAvg:0, dtiAvg:0 });
  const metrics = (fs.existsSync(paths.metrics) ? loadJSON(paths.metrics) : { logreg: zeroMetrics(), tree: zeroMetrics() });
  res.json({
    rows: summary.rows,
    defaults: summary.defaults,
    nonDefaults: summary.nonDefaults,
    defaultRate: summary.defaultRate,
    creditAvg: summary.creditAvg,
    dtiAvg: summary.dtiAvg,
    lastModelMetrics: {
      logreg: { model: "logreg", ...metrics.logreg },
      tree:   { model: "tree",   ...metrics.tree }
    }
  });
});

// ---- utils ----
function zeroMetrics(){ return { accuracy:0, precision:0, recall:0, f1:0, tp:0, tn:0, fp:0, fn:0 }; }
function shuffleInPlace(a, seed=42){
  let m=a.length, i, s=seed;
  while (m){ i=Math.floor(rand()*m--); [a[m],a[i]]=[a[i],a[m]]; }
  function rand(){ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s<0?~s+1:s)%1000)/1000; }
  return a;
}

// ---- start ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ML API listening on http://localhost:${PORT}`));
