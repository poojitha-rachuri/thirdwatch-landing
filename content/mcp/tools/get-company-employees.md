---
title: "get_company_employees"
description: "Pull every employee at a target company from LinkedIn, optionally filtered by seniority. 3 credits."
path: "mcp/tools/get-company-employees/"
type: "mcp-tool"
toolName: "get_company_employees"
cluster: "talent"
clusterLabel: "Talent"
costLabel: "3 credits"
actorsLabel: "linkedin-profiles"
keywords: "linkedin employees scraper, company employees api, org map api, claude mcp"
---

## get_company_employees

Pull employees at a target company from LinkedIn, optionally filtered by seniority. Use it for org-mapping, talent-mapping, intro-mapping, and competitor-talent analysis.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `company_url` | string | yes | LinkedIn company URL or domain (e.g. `stripe.com`, `linkedin.com/company/stripe`). |
| `seniority` | string | no | Filter to a band: `senior`, `staff`, `director`, `vp`, `c_level`. |
| `max_results` | int | no | Default 50. Cap 500. |

### Output

```json
{
  "company": "Stripe",
  "linkedin_url": "https://linkedin.com/company/stripe",
  "employees": [
    {
      "name": "...",
      "title": "Director of Engineering",
      "department": "Engineering",
      "linkedin_url": "...",
      "tenure_years": 4,
      "joined_at": "2022-08-15",
      "previous_company": "Google"
    }
  ],
  "total": 187,
  "by_department": {"Engineering": 92, "Sales": 31, "..." : 64},
  "credits_charged": 3
}
```

### Example prompts in Claude

- "Pull every senior engineer at Linear with their LinkedIn profiles."
- "Org-map Stripe's product team: PMs, Directors, VPs."
- "Who joined Notion in the last 90 days?"

### Suggested next

- [`find_decision_makers`](/mcp/tools/find-decision-makers/) — narrower buying-committee mapping.
- [`enrich_company`](/mcp/tools/enrich-company/) — add reviews + ratings context.

### Underlying actors

[LinkedIn Profiles scraper](https://apify.com/thirdwatch). HTTP-only (no browser), ~$0.01/profile.
