---
title: "professional_search"
description: "Natural-language router. Tells Claude which Thirdwatch MCP tool fits your query, with cost and confidence. Free."
path: "mcp/tools/professional-search/"
type: "mcp-tool"
toolName: "professional_search"
cluster: "free"
clusterLabel: "Free / discovery"
costLabel: "0 credits"
actorsLabel: "Router model only"
keywords: "professional search mcp, claude tool router, natural language search api"
---

## professional_search

Free natural-language router. Pass it any question; it tells Claude (or you) which Thirdwatch tool to call, with the right arguments and a cost preview.

Useful when you're new to the MCP and don't know which tool maps to your problem, or when you want a cheap "should I run this?" preflight check before spending credits.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | The natural-language question. |
| `country` | string | no | ISO 3166-1 alpha-2 (`US`, `IN`, `AE`). Helps the router pick country-specific tools. |
| `max_results` | int | no | Hint for downstream tool. Default 25. |

### Output (sketch)

```json
{
  "query": "Find YC startups in SF hiring senior engineers",
  "recommended_tool": "find_hiring",
  "recommended_args": {
    "query": "senior engineer",
    "location": "San Francisco",
    "country": "US",
    "max_results": 25
  },
  "estimated_cost_credits": 8,
  "confidence": 0.92,
  "alternatives": [
    { "tool": "search_jobs", "cost_credits": 22, "confidence": 0.71 }
  ]
}
```

### Example prompts in Claude

- "What's the cheapest Thirdwatch tool for finding companies hiring data engineers in NYC?"
- "I want to compare Notion and ClickUp's reviews. Which tool should I use?"
- "Help me build a list of fintech competitors. Route me to the right tool."

### Suggested next

- [`estimate_cost`](/mcp/tools/estimate-cost/) — once you know the tool, preview exact cost.
- [`get_account_info`](/mcp/tools/get-account-info/) — check balance.

### Underlying actors

None — this tool is purely the Thirdwatch router model. No actors are invoked. Always free.
