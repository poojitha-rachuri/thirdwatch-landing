---
title: "enrich_company"
description: "Reviews + ratings + employer scores for one company: Trustpilot, AmbitionBox, Glassdoor. 4–6 credits."
path: "mcp/tools/enrich-company/"
type: "mcp-tool"
toolName: "enrich_company"
cluster: "business"
clusterLabel: "Business"
costLabel: "4–6 credits"
actorsLabel: "trustpilot-scraper, ambitionbox-scraper, glassdoor-scraper"
keywords: "company enrichment api, trustpilot api, glassdoor api, ambitionbox api, claude company enrichment"
---

## enrich_company

Single-company snapshot of customer + employer signals. Pulls Trustpilot reviews, AmbitionBox employer ratings (India), and Glassdoor scores in parallel.

Use it for pre-call briefs, candidate-pitch context, vendor due-diligence, and account-research playbooks.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `company` | string | yes | Company name or domain. "stripe.com". |

### Output

```json
{
  "company": "Stripe",
  "trustpilot": {
    "rating": 1.7,
    "reviews_count": 8412,
    "trust_score_change_30d": -0.1
  },
  "ambitionbox": {
    "employer_rating": 4.0,
    "wlb": 4.1,
    "salary_rating": 4.2,
    "culture_rating": 4.0,
    "reviews_count": 187
  },
  "glassdoor": {
    "rating": 4.3,
    "ceo_approval": 91,
    "recommend_to_friend": 87,
    "reviews_count": 1422
  },
  "credits_charged": 5
}
```

### Example prompts in Claude

- "Enrich Stripe with Trustpilot, AmbitionBox, Glassdoor. I'm pitching a candidate."
- "For 30 SaaS targets, pull employer ratings to build a 'best places to work' shortlist."
- "Compare employer ratings: Notion vs Linear vs Asana."

### Suggested next

- [`track_competitor`](/mcp/tools/track-competitor/) — wider 8-source brief.
- [`monitor_brand`](/mcp/tools/monitor-brand/) — sentiment in a sliding window.

### Underlying actors

Trustpilot, AmbitionBox, Glassdoor.
