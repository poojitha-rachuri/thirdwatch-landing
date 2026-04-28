---
title: "find_hiring"
description: "Companies actively hiring for a role/location, cross-platform. LinkedIn + Indeed + Naukri + Wellfound. 6–10 credits."
path: "mcp/tools/find-hiring/"
type: "mcp-tool"
toolName: "find_hiring"
cluster: "talent"
clusterLabel: "Talent / sales"
costLabel: "6–10 credits"
actorsLabel: "linkedin-jobs, indeed-scraper, naukri-scraper, wellfound, glassdoor"
keywords: "companies hiring api, hiring signal abm, claude mcp hiring intent"
---

## find_hiring

The reverse of `search_jobs` — given a role and a location, return the **companies** posting that role across LinkedIn, Indeed, Naukri, Wellfound. Use it for ABM, hiring-intent signals, and competitive talent-spend tracking.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | The role family. "DevRel engineer", "data engineer". |
| `location` | string | no | City or region. |
| `country` | string | no | ISO alpha-2. Routes to country-specific sources. |
| `max_results` | int | no | Default 25 companies. |

### Output

```json
{
  "query": "DevRel engineer",
  "location": "EU",
  "results": [
    {
      "company": "Linear",
      "company_url": "linear.app",
      "linkedin_url": "linkedin.com/company/linear",
      "open_count": 3,
      "by_source": {"linkedin": 2, "indeed": 1, "wellfound": 0},
      "first_posted": "2026-04-12",
      "latest_posted": "2026-04-26",
      "headquarters": "San Francisco / Remote",
      "size": "51-200"
    }
  ],
  "total": 27,
  "credits_charged": 8
}
```

### Example prompts in Claude

- "Find 50 SaaS companies in EU hiring DevRel engineers right now."
- "Companies hiring senior data engineers in Bangalore — cross-platform, dedup."
- "Which fintechs are hiring product designers in NYC this month?"

### Suggested next

- [`find_decision_makers`](/mcp/tools/find-decision-makers/) — pull VPs from each company in the result.
- [`search_jobs`](/mcp/tools/search-jobs/) — flip to candidate-perspective listings.

### Underlying actors

LinkedIn Jobs, Indeed, Naukri, Wellfound, Glassdoor.
