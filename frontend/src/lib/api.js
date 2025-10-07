// src/lib/api.js
// Drop-in API helpers for both Python(FastAPI) and Node(Express) backends.

const DEFAULT_BASE = "/api";

export function getApiBase() {
  return localStorage.getItem("api-base") || DEFAULT_BASE;
}
export function setApiBase(url) {
  localStorage.setItem("api-base", url || DEFAULT_BASE);
}

const API_BASE = getApiBase();

/* ---------- utils ---------- */
class HttpError extends Error {
  constructor(message, status = 500, body = null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function withTimeout(promise, ms = 15000) {
  const to = new Promise((_, rej) => setTimeout(() => rej(new Error("Request timed out")), ms));
  return Promise.race([promise, to]);
}

async function parseJSON(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    throw new HttpError(`Invalid JSON response (${res.status})`, res.status, text);
  }
}

/* ---------- endpoints ---------- */

// POST /api/train (CSV upload)
export async function trainWithCSV(file, testSize = 0.2, randomState = 42) {
  const base = getApiBase();
  const fd = new FormData();
  fd.append("file", file);
  const q = new URLSearchParams({
    test_size: String(testSize),
    random_state: String(randomState),
  });
  const res = await withTimeout(
    fetch(`${base}/train?${q.toString()}`, { method: "POST", body: fd })
  );
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(body || "Training failed", res.status, body);
  }
  return parseJSON(res);
}

// POST /api/predict (JSON body)
export async function predictOne(payload, model = "logreg", threshold = 0.5) {
  const base = getApiBase();
  const q = new URLSearchParams({ model, threshold: String(threshold) });
  const res = await withTimeout(
    fetch(`${base}/predict?${q.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(body || "Prediction failed", res.status, body);
  }
  return parseJSON(res);
}

// GET /api/reports/summary
export async function fetchSummary() {
  const base = getApiBase();
  const res = await withTimeout(fetch(`${base}/reports/summary`));
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(body || "Failed to fetch summary", res.status, body);
  }
  return parseJSON(res);
}

// GET /api/health
export async function health() {
  const base = getApiBase();
  const res = await withTimeout(fetch(`${base}/health`));
  if (!res.ok) throw new HttpError(`Health check failed (${res.status})`, res.status);
  return parseJSON(res);
}

/* ---------- helpers for UI flows ---------- */

// Convenience: detect & remember a working API base.
// Tries current localStorage base first, then common fallbacks.
export async function autoDetectApiBase(fallbacks = ["http://localhost:3000/api", "/api"]) {
  const tried = new Set();
  const candidates = [getApiBase(), ...fallbacks].filter(Boolean);
  for (const base of candidates) {
    if (tried.has(base)) continue;
    tried.add(base);
    try {
      const res = await withTimeout(fetch(`${base}/health`), 4000);
      if (res.ok) {
        setApiBase(base);
        return base;
      }
    } catch { /* ignore */ }
  }
  throw new Error("Could not detect a working API base. Start backend or set it in Settings.");
}

// Convenience: upload a CSV string (e.g., pasted content) as a File and train
export async function trainFromCsvString(csvString, filename = "dataset.csv", testSize = 0.2) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
  const file = new File([blob], filename, { type: "text/csv" });
  return trainWithCSV(file, testSize);
}

/* ---------- example payload shape ----------
predictOne(
  { Age: 30, Income: 40000, LoanAmount: 15000, CreditScore: 720 },
  "logreg",
  0.5
);
-------------------------------------------- */
