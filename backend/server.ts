import pg from "pg";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

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

const github_headers = { "User-Agent": "merge-ai", Accept: "application/vnd.github+json" };

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/pull_requests", async (req, res) => {
  try {
    const query = "SELECT * FROM pull_requests;";
    const pull_requests = await pool.query(query);
    return res.json(pull_requests.rows);
  } catch (e) {
    return res.status(500).json({ error: "Failed to get pull requests!" });
  }
});

app.delete("/pull_requests", async (req, res) => {
  try {
    const query = "TRUNCATE TABLE pull_requests";
    await pool.query(query);
    return res.status(200).json({ message: "Successfully deleted pull_requests!" });
  } catch (e) {
    return res.status(500).json({ error: "Failed to delete pull requests!" });
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

app.post("/pull_requests/sync", async (req, res) => {
  try {
    const response = await fetch(`https://api.github.com/repos/${req.query.owner}/${req.query.repo}/pulls?state=all`, {
      headers: github_headers,
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
    return res.status(201).json({ message: "Successfully connected to github!" });
  } catch (e) {
    return res.status(500).json({ error: "Failed to connect to github!" });
  }
});

app.get("/summary", async (req, res) => {
  try {
    // if summary already exists, skip
    const getQuery = `SELECT summary FROM pull_requests WHERE id = $1`;
    const existingResult = await pool.query(getQuery, [req.query.id]);
    const existingSummary = existingResult.rows[0]?.summary;

    if (existingSummary) {
      return res.json({ summary: existingSummary });
    }

    const response = await fetch(`https://api.github.com/repos/${req.query.owner}/${req.query.repo}/pulls/${req.query.id}`);
    const prInfo = await response.json();

    const message = await client.messages.create({
      max_tokens: 1024,
      system: "You summarize GitHub pull requests concisely.",
      messages: [{ role: "user", content: `Summarize this PR in one to two sentences.\n\nTitle: ${prInfo.title}\n\nDescription: ${prInfo.body}` }],
      model: "claude-haiku-4-5",
    });
    const summaryText = message.content.find((b) => b.type === "text")?.text ?? "";

    // save this message under summary inside postgres
    const updateQuery = `UPDATE pull_requests SET summary = $1 WHERE id = $2`;
    const updateValues = [summaryText, req.query.id];
    await pool.query(updateQuery, updateValues);

    return res.json({ summary: summaryText });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch summary for this PR" });
  }
});

app.listen(port, () => {
  console.log("Server is running!");
});
