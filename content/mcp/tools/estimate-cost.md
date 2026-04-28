---
title: "estimate_cost"
description: "Preview the cost of any Thirdwatch MCP tool call before running it. Free, idempotent."
path: "mcp/tools/estimate-cost/"
type: "mcp-tool"
toolName: "estimate_cost"
cluster: "free"
clusterLabel: "Free / discovery"
costLabel: "0 credits"
actorsLabel: "None (preflight only)"
keywords: "mcp cost estimate, claude tool cost preview, apify cost estimate"
---

## estimate_cost

Free, idempotent preflight. Pass a tool name and arguments; get back the exact credit cost the tool will charge if you run it. No side effects, no actor invocation, no charge.

Use it when you're about to run an expensive call (e.g. a 50-result `search_jobs` across all 14 sources costs ~26 credits) and want to confirm before spending.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `tool_name` | string | yes | e.g. `search_jobs`, `track_competitor`. |
| `query` | string | yes | The query you'd pass. |
| `country` | string | no | ISO country code if applicable. |

### Output

```json
{
  "tool_name": "search_jobs",
  "query": "senior python engineer",
  "estimated_cost_credits": 22,
  "estimated_results": 60,
  "estimated_latency_seconds": 18,
  "would_call_actors": ["linkedin-jobs", "indeed", "naukri", "google-jobs", "..."]
}
```

### Example prompts in Claude

- "Before running it, estimate the cost of `search_jobs` for senior PMs in Bangalore."
- "What would `track_competitor('Notion')` cost?"

### Suggested next

- [`professional_search`](/mcp/tools/professional-search/) — find the right tool first.
- [`get_account_info`](/mcp/tools/get-account-info/) — check your remaining balance.

### Underlying actors

None — this is a pure preflight call against Thirdwatch's pricing model. Always free.
