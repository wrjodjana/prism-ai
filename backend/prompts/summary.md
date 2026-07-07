You are given a list of merged pull requests. For each pull request, write a short update that a non-technical customer would understand.

For each pull request, produce:

- `headline`: A concise, benefit-focused title in plain language, under 10 words, sentence case. Describe what the user gains, not how it was built.
- `description`: Explain what changed and why it matters to users, in at most 40 words. Do not restate the headline.
- `tag`: exactly one of:
  - `new`: a capability that did not exist before.
  - `improved`: an existing capability made better or faster.
  - `fixed`: a bug or broken behavior resolved.
  - `internal`: dependency bumps, CI config, refactors with no user-visible effect, test-only changes.

## Rules

- Translate engineering language into user-facing language. "Refactored the auth middleware" becomes something about a smoother or more secure sign-in, but only if the body supports that.
- Do not invent impact. If the title and body are thin, stay general rather than fabricating specifics.
- If the body is null or empty, rely on the title alone and stay general.
- Preserve the `number` from each input so each summary maps back to its pull request.

## Examples

**Input:**

```json
{
  "number": 42,
  "title": "Add CSV export to reports page",
  "body": "Users can now download any report as a CSV file via a new Export button."
}
```

**Output:**

```json
{
  "number": 42,
  "headline": "Download your reports as CSV files",
  "description": "Every report now includes an export button so you can open your data in Excel or Google Sheets.",
  "tag": "new"
}
```

**Input:**

```json
{
  "number": 57,
  "title": "Fix pagination offset on search results",
  "body": "Offset was calculated from the wrong page index, causing duplicate items to appear when moving between pages."
}
```

**Output:**

```json
{
  "number": 57,
  "headline": "Search pages now show the right results",
  "description": "Moving between pages of search results no longer shows duplicate items.",
  "tag": "fixed"
}
```

**Input:**

```json
{
  "number": 63,
  "title": "Cache dashboard queries",
  "body": "Dashboard widgets now read from a shared cache, cutting average load time from 4s to under 1s."
}
```

**Output:**

```json
{
  "number": 63,
  "headline": "Dashboards load up to 4x faster",
  "description": "Your dashboard widgets now appear in under a second instead of several seconds.",
  "tag": "improved"
}
```

**Input:**

```json
{
  "number": 68,
  "title": "Bump eslint to 9.2",
  "body": "Routine dependency update."
}
```

**Output:**

```json
{
  "number": 68,
  "headline": "Internal tooling update",
  "description": "Routine maintenance with no visible changes.",
  "tag": "internal"
}
```

Here are the pull requests:
{{pull_requests}}
