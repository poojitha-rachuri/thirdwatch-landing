---
title: "compare_products"
description: "Side-by-side comparison from G2 + Capterra reviews and ratings. 8 credits."
path: "mcp/tools/compare-products/"
type: "mcp-tool"
toolName: "compare_products"
cluster: "competitive"
clusterLabel: "Competitive intel"
costLabel: "8 credits"
actorsLabel: "g2-scraper, capterra-scraper"
keywords: "g2 vs comparison api, capterra comparison api, software comparison mcp, claude product comparison"
---

## compare_products

Head-to-head comparison from G2 + Capterra. Returns ratings, review counts, top pros, top cons, recent reviews for both products in one structured response.

Designed for battle-cards, "vs competitor" SEO pages, and pre-deal product reviews.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `product_a` | string | yes | Product name. "Notion". |
| `product_b` | string | yes | Product name. "ClickUp". |
| `max_reviews_each` | int | no | Reviews to pull per product. Default 25. Cap 100. |

### Output

```json
{
  "product_a": {
    "name": "Notion",
    "g2_rating": 4.6,
    "g2_reviews_count": 5821,
    "capterra_rating": 4.7,
    "top_pros": ["Flexible", "Beautiful UI", "Great docs"],
    "top_cons": ["Slow on large pages", "Mobile weak"],
    "recent_reviews": [{"title": "...", "rating": 5, "text": "...", "date": "..."}]
  },
  "product_b": {"name": "ClickUp", "...": "..."},
  "winners": {
    "ease_of_use": "Notion",
    "feature_depth": "ClickUp",
    "value_for_money": "ClickUp"
  },
  "credits_charged": 8
}
```

### Example prompts in Claude

- "Compare Notion vs ClickUp on G2 and Capterra. Format as a battle-card."
- "Pull 50 reviews each for Postman vs Bruno. Find the top 5 pricing complaints about Postman."
- "Write a 'Linear vs Jira' SEO page using fresh reviews. Quote 5 reviewers."

### Suggested next

- [`track_competitor`](/mcp/tools/track-competitor/) — wider 8-source brief.
- [`monitor_brand`](/mcp/tools/monitor-brand/) — track sentiment over time.

### Underlying actors

G2 Reviews, Capterra. Both Camoufox-based, Cloudflare-resilient.
