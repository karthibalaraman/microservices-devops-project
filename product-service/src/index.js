const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.DATA_FILE || "/app/data/records.json";

app.use(express.json({ limit: "100kb" }));

function validate(body) {
  if (!body || typeof body.name !== "string" || !body.name.trim()) return "name is required";
  if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) return "price must be a non-negative number";
  return null;
}
function pickFields(body) {
  return {
    name: body.name.trim(),
    price: Number(body.price),
    description: typeof body.description === "string" ? body.description.trim() : ""
  };
}

function readRecords() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    console.error("Could not read data file:", error);
    throw error;
  }
}

function writeRecords(records) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(records, null, 2));
  fs.renameSync(temporaryFile, DATA_FILE);
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "UP", service: "product-service" });
});

app.get("/api/products", (_req, res) => {
  res.json(readRecords());
});

app.get("/api/products/:id", (req, res) => {
  const record = readRecords().find((item) => item.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.json(record);
});

app.post("/api/products", (req, res) => {
  const validationError = validate(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const records = readRecords();
  const record = {
    id: randomUUID(),
    ...pickFields(req.body),
    createdAt: new Date().toISOString()
  };
  records.push(record);
  writeRecords(records);
  res.status(201).json(record);
});

app.delete("/api/products/:id", (req, res) => {
  const records = readRecords();
  const remaining = records.filter((item) => item.id !== req.params.id);
  if (remaining.length === records.length) {
    return res.status(404).json({ error: "Record not found" });
  }
  writeRecords(remaining);
  res.json({ message: "Record deleted", id: req.params.id });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`product-service listening on port ${PORT}`);
});
