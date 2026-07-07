GET PR info from here: https://api.github.com/repos/{repo_owner}/{repo_name}/pulls?state=closed

- check if merged_at !== null

information we can get

- title and body
- labels[].name: for the type, only used as a hint
- diff content

send to ai

- send batched PRs to Haiku with single call
  - ask haiku to check if needs more info by flagging PRs
  - send to another tier to look through diff
- return everything with a type and filter in query

inside ai

- few shot examples of customer-facing tone
