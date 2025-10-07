const fs = require("fs");
const path = require("path");

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function saveJSON(filepath, obj){ ensureDir(path.dirname(filepath)); fs.writeFileSync(filepath, JSON.stringify(obj, null, 2), "utf-8"); }
function loadJSON(filepath){ return JSON.parse(fs.readFileSync(filepath, "utf-8")); }

module.exports = { ensureDir, saveJSON, loadJSON };
