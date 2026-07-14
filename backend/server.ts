import pg from "pg";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import type { Endpoints } from "@octokit/types";

import { readFileSync } from "fs";
import { join } from "path";

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

const EXPRESS_PORT = 3001;
const GITHUB_HEADERS = {
  "User-Agent": "prism-ai",
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  "X-Github-Api-Version": "2026-03-10",
};
const promptTemplate = readFileSync(join(process.cwd(), "prompts", "summary.md"), "utf-8");

const ANTHROPIC_CLIENT = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// customer-facing requests
app.post("/sync/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=100`, {
      headers: GITHUB_HEADERS,
    });

    if (!githubResponse.ok) {
      return res.status(githubResponse.status).json({ error: "Failed to fetch pull requests!" });
    }

    type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][number];
    const pullRequests = (await githubResponse.json()) as PullRequest[];

    // filter only at merged_at != null
    const merged = pullRequests.filter((pr: PullRequest) => pr.merged_at !== null);

    // batch merge requests
    const batched = merged.map((pr: PullRequest) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      merged_at: pr.merged_at,
    }));

    const prompt = promptTemplate.replace(`{{pull_requests}}`, JSON.stringify(batched, null, 2));

    const modelResponse = await ANTHROPIC_CLIENT.messages.create({
      max_tokens: 4096,
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              summaries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    number: { type: "number" },
                    headline: { type: "string" },
                    description: { type: "string" },
                    tag: { type: "string", enum: ["new", "improved", "fixed", "internal"] },
                    merged_at: { type: "string" },
                  },
                  required: ["number", "headline", "description", "tag", "merged_at"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summaries"],
            additionalProperties: false,
          },
        },
      },
    });

    const block = modelResponse.content[0];
    if (!block || block.type !== "text") {
      return res.status(502).json({ error: "Unexpected response format from model!" });
    }
    const result = JSON.parse(block.text);

    const query = `INSERT INTO updates_entries (owner, repo, number, headline, description, tag, merged_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                ON CONFLICT (owner, repo, number) 
                DO UPDATE SET headline=EXCLUDED.headline, description=EXCLUDED.description, tag=EXCLUDED.tag, merged_at=EXCLUDED.merged_at`;

    for (const s of result.summaries) {
      const values = [owner, repo, s.number, s.headline, s.description, s.tag, s.merged_at];
      await pool.query(query, values);
    }

    return res.status(201).json({ message: "Successfully summarized PRs and added to Postgres!" });
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate updates!" });
  }
});

app.get("/updates/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const query = "SELECT * FROM updates_entries WHERE owner=$1 AND repo=$2 ORDER BY merged_at DESC";
    const values = [owner, repo];
    const response = await pool.query(query, values);
    return res.json(response.rows);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch entries!" });
  }
});

app.delete("/updates", async (req, res) => {
  try {
    const query = "TRUNCATE TABLE updates_entries";
    await pool.query(query);
    return res.status(200).json({ message: "Successfully deleted updates!" });
  } catch (e) {
    return res.status(500).json({ error: "Failed to delete updates!" });
  }
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
      headers: GITHUB_HEADERS,
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

    const message = await ANTHROPIC_CLIENT.messages.create({
      max_tokens: 1024,
      system: "You summarize GitHub pull requests concisely.",
      messages: [{ role: "user", content: `Summarize this PR in one to two sentences for a customer-facing user.\n\nTitle: ${prInfo.title}\n\nDescription: ${prInfo.body}` }],
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

app.listen(EXPRESS_PORT, () => {
  console.log("Server is running!");
});
