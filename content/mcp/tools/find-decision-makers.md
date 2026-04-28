---
title: "find_decision_makers"
description: "Buying-committee mapping. VPs, Directors, Heads-of for any role family at a target company. 3 credits."
path: "mcp/tools/find-decision-makers/"
type: "mcp-tool"
toolName: "find_decision_makers"
cluster: "talent"
clusterLabel: "Talent / sales"
costLabel: "3 credits"
actorsLabel: "linkedin-profiles"
keywords: "decision maker mapping, buying committee api, abm decision maker, claude mcp sales prospecting"
---

## find_decision_makers

Pass a target company and a list of role families; get back the people who decide. Designed for ABM, buying-committee mapping, and pre-call research.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `company_url` | string | yes | LinkedIn company URL or domain. |
| `target_roles` | array | yes | List of role families: `["VP Engineering", "CFO", "Director Marketing"]`. |
| `max_results` | int | no | Default 10. Cap 50. |

### Output

```json
{
  "company": "Stripe",
  "target_roles": ["VP Payments", "VP Product", "CFO"],
  "results": [
    {
      "name": "Will G.",
      "title": "VP, Payment Orchestration",
      "matched_role": "VP Payments",
      "department": "Payments",
      "linkedin_url": "...",
      "tenure_years": 4,
      "previous_companies": ["Square", "PayPal"]
    }
  ],
  "credits_charged": 3
}
```

### Example prompts in Claude

- "Map the buying committee at HubSpot for our marketing-ops product. Target VP Marketing, Director RevOps, CRO."
- "Find Stripe's VP of Payments and CFO."
- "For each of these 30 SaaS companies, pull the VP of Engineering."

### Suggested next

- [`get_company_employees`](/mcp/tools/get-company-employees/) — wider org sweep.
- [`find_hiring`](/mcp/tools/find-hiring/) — combine with hiring intent for warmer outreach.
- [`enrich_company`](/mcp/tools/enrich-company/) — pre-call context.

### Underlying actors

[LinkedIn Profiles scraper](https://apify.com/thirdwatch). HTTP-only.
