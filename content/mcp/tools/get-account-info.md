---
title: "get_account_info"
description: "Current credit balance, plan, and recent usage history for your Thirdwatch MCP key. Free."
path: "mcp/tools/get-account-info/"
type: "mcp-tool"
toolName: "get_account_info"
cluster: "free"
clusterLabel: "Free / accounting"
costLabel: "0 credits"
actorsLabel: "None"
keywords: "thirdwatch mcp account, mcp credits balance, claude mcp account info"
---

## get_account_info

Returns the current state of your Thirdwatch MCP account: credit balance, plan, recent usage. Free, no charge.

### Inputs

None. Authenticated via your bearer token.

### Output

```json
{
  "plan": "pay_per_result",
  "credits_remaining": 87,
  "free_credits_used": 13,
  "free_credits_total": 100,
  "topup_credits_remaining": 0,
  "usage_last_30d": {
    "calls": 14,
    "credits_spent": 13,
    "by_tool": {
      "search_candidates": 9,
      "search_jobs": 22,
      "estimate_cost": 0
    }
  },
  "rate_limits": {
    "concurrent": 5,
    "requests_per_hour": 1000
  }
}
```

### Example prompts in Claude

- "How many credits do I have left?"
- "Which Thirdwatch tools have I been using most this month?"
- "Am I close to my rate limit?"

### Suggested next

- [`estimate_cost`](/mcp/tools/estimate-cost/) — preflight before spending.
- [Top up credits](https://thirdwatch.dev/mcp/credits) — if you're running low.

### Underlying actors

None — pure account-state lookup. Always free.
