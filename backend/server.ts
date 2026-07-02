import pg from "pg";
import express from "express";
import cors from "cors";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
});

const app = express();
app.use(cors());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/pull_requests", async (req, res) => {
  try {
    const query = "SELECT * FROM pull_requests;";
    const pull_requests = await pool.query(query);
    return res.json(pull_requests.rows);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch pull requests!" });
  }
});

function checkStatus(state: string, merged_at: string | null) {
  if (merged_at !== null) {
    return "merged";
  }

  if (state === "closed") {
    return "closed";
  }
  return "open";
}

app.get("/github", async (req, res) => {
  try {
    const headers = { "User-Agent": "merge-ai", Accept: "application/vnd.github+json" };
    const response = await fetch(`https://api.github.com/repos/${req.query.owner}/${req.query.repo}/pulls?state=all`, {
      headers: headers,
    });
    const prs = await response.json();

    const query = `INSERT INTO pull_requests (id, title, status, author, created_at) 
                   VALUES ($1, $2, $3, $4, $5) 
                   ON CONFLICT (id) 
                   DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status, author=EXCLUDED.author, created_at = EXCLUDED.created_at`;

    for (const pr of prs) {
      const values = [pr.number, pr.title, checkStatus(pr.state, pr.merged_at), pr.user.login, pr.created_at];
      await pool.query(query, values);
    }
    return res.status(201).json({ synced: prs.length });
  } catch (e) {
    return res.status(500).json({ error: "Failed to connect to github" });
  }
});

app.listen(port, () => {
  console.log("Server is running!");
});
