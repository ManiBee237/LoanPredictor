from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel
from typing import List, Literal, Dict, Any
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# -------------------
# Config / Globals
# -------------------
ARTIFACT_DIR = Path(__file__).resolve().parent.parent / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = ["Age", "Income", "LoanAmount", "CreditScore"]
TARGET = "Default"

STATE = {
    "logreg_path": ARTIFACT_DIR / "logreg.joblib",
    "tree_path": ARTIFACT_DIR / "tree.joblib",
    "metrics": {},      # per-model metrics
    "summary": {},      # dataset summary
}

# -------------------
# FastAPI
# -------------------
app = FastAPI(title="Loan Default ML API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://0.0.0.0:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------
# Nice root + favicon
# -------------------
@app.get("/", include_in_schema=False, response_class=HTMLResponse)
def index():
    return """
    <!doctype html><html><head><meta charset="utf-8"/>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:40px;color:#0f172a}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px;max-width:760px}
    a{color:#2563eb;text-decoration:none}</style></head><body>
    <div class="card">
      <h1>Loan Default ML API</h1>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/docs">/docs</a></li>
        <li><a href="/redoc">/redoc</a></li>
      </ul>
      <p>Train via <code>POST /api/train</code> (CSV) and predict via <code>POST /api/predict</code> (JSON).</p>
    </div></body></html>
    """

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

# -------------------
# Schemas
# -------------------
class PredictIn(BaseModel):
    Age: float
    Income: float
    LoanAmount: float
    CreditScore: float

class PredictOut(BaseModel):
    model: Literal["logreg", "tree"]
    prob: float
    label: int
    explanation: Dict[str, Any]

class TrainReport(BaseModel):
    model: Literal["logreg", "tree"]
    accuracy: float
    precision: float
    recall: float
    f1: float
    tp: int
    tn: int
    fp: int
    fn: int

class SummaryOut(BaseModel):
    rows: int
    defaults: int
    nonDefaults: int
    defaultRate: float
    creditAvg: float
    dtiAvg: float
    lastModelMetrics: Dict[str, TrainReport]

# -------------------
# Helpers
# -------------------
def _validate_columns(df: pd.DataFrame):
    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

def _compute_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel().tolist()
    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "tp": tp, "tn": tn, "fp": fp, "fn": fn}

def _train_logreg(X_train, y_train):
    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=200, class_weight="balanced"))
    ])
    pipe.fit(X_train, y_train)
    return pipe

def _train_tree(X_train, y_train):
    clf = DecisionTreeClassifier(max_depth=6, min_samples_leaf=10, class_weight="balanced", random_state=42)
    clf.fit(X_train, y_train)
    return clf

def _safe_float(v):
    try:
        return float(v)
    except:
        return 0.0

def _build_summary(df: pd.DataFrame) -> Dict[str, Any]:
    n = len(df)
    defaults = int(df[TARGET].sum())
    non = int(n - defaults)
    credit_avg = float(df["CreditScore"].mean()) if n else 0.0
    dti_avg = float((df["LoanAmount"] / df["Income"].replace(0, np.nan)).mean())
    if np.isnan(dti_avg):
        dti_avg = 0.0
    return {
        "rows": n,
        "defaults": defaults,
        "nonDefaults": non,
        "defaultRate": defaults / n if n else 0.0,
        "creditAvg": credit_avg,
        "dtiAvg": dti_avg,
    }

def _load_model(which: Literal["logreg","tree"]):
    path = STATE["logreg_path"] if which == "logreg" else STATE["tree_path"]
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Model '{which}' not trained yet.")
    return joblib.load(path)

# -------------------
# Routes
# -------------------
@app.get("/api/health")
def health():
    return {"ok": True, "artifacts": str(ARTIFACT_DIR)}

@app.post("/api/train", response_model=List[TrainReport])
async def train_models(
    file: UploadFile = File(..., description="CSV with columns Age,Income,LoanAmount,CreditScore,Default"),
    test_size: float = Query(0.2, ge=0.1, le=0.5),
    random_state: int = Query(42),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")
    content = await file.read()
    try:
        df = pd.read_csv(pd.io.common.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    _validate_columns(df)
    for c in FEATURES + [TARGET]:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    STATE["summary"] = _build_summary(df)

    X = df[FEATURES].values
    y = df[TARGET].astype(int).values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state,
        stratify=y if y.sum() and len(y) - y.sum() else None
    )

    # Logistic Regression
    logreg = _train_logreg(X_train, y_train)
    y_prob_lr = logreg.predict_proba(X_test)[:, 1]
    y_pred_lr = (y_prob_lr >= 0.5).astype(int)
    m_lr = _compute_metrics(y_test, y_pred_lr)
    joblib.dump(logreg, STATE["logreg_path"])

    # Decision Tree
    tree = _train_tree(X_train, y_train)
    y_prob_dt = tree.predict_proba(X_test)[:, 1]
    y_pred_dt = (y_prob_dt >= 0.5).astype(int)
    m_dt = _compute_metrics(y_test, y_pred_dt)
    joblib.dump(tree, STATE["tree_path"])

    STATE["metrics"] = {"logreg": m_lr, "tree": m_dt}

    return [
        TrainReport(model="logreg", **m_lr),
        TrainReport(model="tree", **m_dt),
    ]

@app.post("/api/predict", response_model=PredictOut)
async def predict_one(
    payload: PredictIn,
    model: Literal["logreg","tree"] = Query("logreg"),
    threshold: float = Query(0.5, ge=0.1, le=0.9),
):
    mdl = _load_model(model)
    x = np.array([[
        _safe_float(payload.Age),
        _safe_float(payload.Income),
        _safe_float(payload.LoanAmount),
        _safe_float(payload.CreditScore),
    ]])
    prob = float(mdl.predict_proba(x)[0, 1])
    label = int(prob >= float(threshold))
    explanation = {
        "features": dict(
            Age=float(payload.Age),
            Income=float(payload.Income),
            LoanAmount=float(payload.LoanAmount),
            CreditScore=float(payload.CreditScore)
        ),
        "threshold": threshold,
        "note": "For full explanations, compute SHAP on the server model."
    }
    return PredictOut(model=model, prob=prob, label=label, explanation=explanation)

@app.get("/api/reports/summary", response_model=SummaryOut)
async def reports_summary():
    summary = STATE.get("summary") or {
        "rows": 0, "defaults": 0, "nonDefaults": 0,
        "defaultRate": 0.0, "creditAvg": 0.0, "dtiAvg": 0.0
    }
    metrics = STATE.get("metrics") or {}
    def pack(model_key):
        m = metrics.get(model_key) or {"accuracy":0,"precision":0,"recall":0,"f1":0,"tp":0,"tn":0,"fp":0,"fn":0}
        return TrainReport(model=model_key, **m)
    return SummaryOut(
        rows=int(summary["rows"]),
        defaults=int(summary["defaults"]),
        nonDefaults=int(summary["nonDefaults"]),
        defaultRate=float(summary["defaultRate"]),
        creditAvg=float(summary["creditAvg"]),
        dtiAvg=float(summary["dtiAvg"]),
        lastModelMetrics={"logreg": pack("logreg"), "tree": pack("tree")},
    )
