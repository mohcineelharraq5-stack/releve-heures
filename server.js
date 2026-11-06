const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "records.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [], settings: { hourlyRate: 23, currency: "DH" } }, null, 2));
}

function readDb() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return { records: [], settings: { hourlyRate: 23, currency: "DH" } }; }
}

function writeDb(db) { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

app.post("/api/login", (req, res) => {
  res.json({ token: "bypass_token" });
});

app.post("/api/logout", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/data", (req, res) => res.json(readDb()));

app.put("/api/data", (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.records) || !data.settings || typeof data.settings !== "object") {
    return res.status(400).json({ error: "Données invalides." });
  }
  if (data.records.length > 10000) return res.status(413).json({ error: "Trop d'enregistrements." });
  writeDb({ records: data.records, settings: { hourlyRate: Math.max(0, Number(data.settings.hourlyRate) || 0), currency: "DH" } });
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Relevé Heures Effectives disponible sur http://localhost:${PORT}`));