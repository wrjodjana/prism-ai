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
app.use(express.json());

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

app.post("/sync/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    type PullRequest = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][number];

    let pullRequests: PullRequest[] = [];
    let page = 1;

    while (true) {
      if (page == 6) {
        break;
      }

      const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&per_page=100&page=${page}`, { headers: GITHUB_HEADERS });

      if (!githubResponse.ok) {
        return res.status(githubResponse.status).json({ error: "Failed to fetch pull requests!" });
      }

      const batch = (await githubResponse.json()) as PullRequest[];
      pullRequests = pullRequests.concat(batch);
      page++;
    }

    const merged = pullRequests.filter((pr: PullRequest) => pr.merged_at !== null);

    const batched = merged.map((pr: PullRequest) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      merged_at: pr.merged_at,
    }));

    const prompt = promptTemplate.replace(`{{pull_requests}}`, JSON.stringify(batched, null, 2));

    const modelResponse = await ANTHROPIC_CLIENT.messages.create({
      max_tokens: 16000,
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

    const prByNumber = new Map<number, { title: string; body: string | null }>();
    for (const pr of batched) {
      prByNumber.set(pr.number, { title: pr.title, body: pr.body });
    }

    const query = `INSERT INTO updates_entries (owner, repo, number, headline, description, tag, merged_at, pr_title, pr_body, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
                ON CONFLICT (owner, repo, number)
                DO NOTHING`;

    let drafted = 0;
    for (const s of result.summaries) {
      const pr = prByNumber.get(s.number);
      const values = [owner, repo, s.number, s.headline, s.description, s.tag, s.merged_at, pr ? pr.title : null, pr ? pr.body : null];
      const insertResponse = await pool.query(query, values);
      drafted += insertResponse.rowCount ?? 0;
    }

    return res.status(201).json({ message: "Successfully summarized PRs and added to Postgres!", drafted });
  } catch (e) {
    console.error("Failed to generate updates!", e);
    return res.status(500).json({ error: "Failed to generate updates!" });
  }
});

const VALID_TAGS = ["new", "improved", "fixed", "internal"];
const VALID_STATUSES = ["draft", "published", "discarded"];

app.get("/updates/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { status } = req.query;

    if (status !== undefined && !VALID_STATUSES.includes(status as string)) {
      return res.status(400).json({ error: "Invalid status!" });
    }

    if (status) {
      const query = "SELECT * FROM updates_entries WHERE owner=$1 AND repo=$2 AND status=$3 ORDER BY merged_at DESC";
      const values = [owner, repo, status];
      const response = await pool.query(query, values);
      return res.json(response.rows);
    }

    const query = "SELECT * FROM updates_entries WHERE owner=$1 AND repo=$2 ORDER BY merged_at DESC";
    const values = [owner, repo];
    const response = await pool.query(query, values);
    return res.json(response.rows);
  } catch (e) {
    console.error("Failed to fetch entries!", e);
    return res.status(500).json({ error: "Failed to fetch entries!" });
  }
});

app.patch("/updates/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const body = req.body ?? {};

    if (!Array.isArray(body.numbers) || body.numbers.length === 0 || !body.numbers.every((n: unknown) => typeof n === "number")) {
      return res.status(400).json({ error: "Invalid numbers!" });
    }

    if (!VALID_STATUSES.includes(body.status)) {
      return res.status(400).json({ error: "Invalid status!" });
    }

    const query = "UPDATE updates_entries SET status=$1 WHERE owner=$2 AND repo=$3 AND number = ANY($4::int[]) RETURNING number";
    const values = [body.status, owner, repo, body.numbers];
    const response = await pool.query(query, values);
    return res.json({ updated: response.rowCount ?? 0 });
  } catch (e) {
    console.error("Failed to update entries!", e);
    return res.status(500).json({ error: "Failed to update entries!" });
  }
});

app.patch("/updates/:owner/:repo/:number", async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const body = req.body ?? {};

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (body.headline !== undefined) {
      if (typeof body.headline !== "string" || body.headline.trim() === "") {
        return res.status(400).json({ error: "Invalid headline!" });
      }
      values.push(body.headline);
      fields.push(`headline=$${values.length}`);
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return res.status(400).json({ error: "Invalid description!" });
      }
      values.push(body.description);
      fields.push(`description=$${values.length}`);
    }

    if (body.tag !== undefined) {
      if (!VALID_TAGS.includes(body.tag)) {
        return res.status(400).json({ error: "Invalid tag!" });
      }
      values.push(body.tag);
      fields.push(`tag=$${values.length}`);
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return res.status(400).json({ error: "Invalid status!" });
      }
      values.push(body.status);
      fields.push(`status=$${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update!" });
    }

    values.push(owner);
    values.push(repo);
    values.push(Number(number));
    const query = `UPDATE updates_entries SET ${fields.join(", ")} WHERE owner=$${values.length - 2} AND repo=$${values.length - 1} AND number=$${values.length} RETURNING *`;
    const response = await pool.query(query, values);

    if (response.rowCount === 0) {
      return res.status(404).json({ error: "Entry not found!" });
    }

    return res.json(response.rows[0]);
  } catch (e) {
    console.error("Failed to update entry!", e);
    return res.status(500).json({ error: "Failed to update entry!" });
  }
});

app.delete("/updates/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const query = "DELETE FROM updates_entries WHERE owner=$1 AND repo=$2";
    const values = [owner, repo];
    await pool.query(query, values);
    return res.status(200).json({ message: "Successfully deleted updates!" });
  } catch (e) {
    console.error("Failed to delete updates!", e);
    return res.status(500).json({ error: "Failed to delete updates!" });
  }
});

app.delete("/updates", async (req, res) => {
  try {
    const query = "TRUNCATE TABLE updates_entries";
    await pool.query(query);
    return res.status(200).json({ message: "Successfully deleted updates!" });
  } catch (e) {
    console.error("Failed to delete updates!", e);
    return res.status(500).json({ error: "Failed to delete updates!" });
  }
});

app.listen(EXPRESS_PORT, () => {
  console.log("Server is running!");
});
