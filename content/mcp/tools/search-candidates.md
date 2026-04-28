---
title: "search_candidates"
description: "LinkedIn candidate finder by skills, seniority, location, current company. 3 credits per call."
path: "mcp/tools/search-candidates/"
type: "mcp-tool"
toolName: "search_candidates"
cluster: "talent"
clusterLabel: "Talent"
costLabel: "3 credits"
actorsLabel: "linkedin-profiles"
keywords: "linkedin candidate finder, linkedin recruiter alternative, candidate sourcing api, claude mcp recruiter"
---

## search_candidates

LinkedIn candidate finder. Pass skills + seniority + location; get back profile snippets with current title, current company, years of experience, and LinkedIn URL.

Designed to replace LinkedIn Recruiter and Sales Navigator for sourcing workflows that need to be **inside an AI agent** rather than a UI.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | Skills + role, e.g. "staff python engineer kubernetes". |
| `location` | string | no | City, region, or country. |
| `country` | string | no | ISO alpha-2. |
| `years_min` | int | no | Minimum years of experience. |
| `current_company` | string | no | Filter to candidates currently at a specific company. |
| `max_results` | int | no | Default 25. |

### Output

```json
{
  "query": "staff python engineer",
  "location": "Berlin",
  "results": [
    {
      "name": "Anika R.",
      "headline": "Staff Engineer @ Pitch · ex-Google, Stripe",
      "current_company": "Pitch",
      "current_title": "Staff Software Engineer",
      "linkedin_url": "https://linkedin.com/in/...",
      "location": "Berlin, Germany",
      "skills": ["Python", "Distributed systems"],
      "experience_years": 11,
      "previous_companies": ["Google", "Stripe"]
    }
  ],
  "total": 23,
  "credits_charged": 3
}
```

### Example prompts in Claude

- "Find 20 staff Python engineers in Berlin, 8+ years, currently at a Series A–B startup."
- "Search candidates: senior PMs in Bangalore, ex-Microsoft, ex-Atlassian."
- "Pull 50 freelance ML engineers in India open to remote work."

### Suggested next

- [`get_company_employees`](/mcp/tools/get-company-employees/) — pull every employee at a target.
- [`find_decision_makers`](/mcp/tools/find-decision-makers/) — for outreach mapping.

### Underlying actors

[LinkedIn Profiles scraper](https://apify.com/thirdwatch) — HTTP + Sec-Fetch headers, no cookies, ~$0.01/profile. 90K+ users on the underlying actor.
