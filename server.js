require("dotenv").config();

const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number.parseInt(process.env.PORT || "5005", 10);
const staticRoot = path.resolve(__dirname);

let pool = null;
const hasConnectionString = Boolean(process.env.DATABASE_URL);
const hasDiscretePgConfig = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"].every(
  (key) => Boolean(process.env[key])
);

if (hasConnectionString || hasDiscretePgConfig) {
  const poolOptions = hasConnectionString
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST,
        port: Number.parseInt(process.env.PGPORT || "5432", 10),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
      };

  if (process.env.PGSSL === "true") {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolOptions);
}

app.use(express.json());
app.use(
  express.static(staticRoot, {
    index: "index.html",
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "neonparty-pakking",
    port,
  });
});

app.get("/health/db", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({
      ok: false,
      error: "Database is not configured. Set DATABASE_URL or PG* variables.",
    });
  }

  try {
    const result = await pool.query("SELECT NOW() AS now");
    return res.json({
      ok: true,
      now: result.rows[0]?.now,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(staticRoot, "index.html"));
});

app.listen(port, () => {
  console.log(`Neonparty Pakking is running on port ${port}`);
});
