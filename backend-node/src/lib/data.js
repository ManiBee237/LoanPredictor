const { parse } = require("csv-parse/sync");

async function parseCsvToObjects(buffer) {
  const text = buffer.toString("utf-8");
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  return records;
}

function validateColumns(rows, features, target) {
  if (!rows || !rows.length) throw new Error("CSV appears empty.");
  const cols = Object.keys(rows[0] || {});
  const need = [...features, target];
  const missing = need.filter(c => !cols.includes(c));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
}

module.exports = { parseCsvToObjects, validateColumns };
