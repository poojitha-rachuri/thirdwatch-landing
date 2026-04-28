---
title: "monitor_brand"
description: "Brand sentiment across Trustpilot + Reddit + Yelp + Google News with lookback window. 6 credits."
path: "mcp/tools/monitor-brand/"
type: "mcp-tool"
toolName: "monitor_brand"
cluster: "competitive"
clusterLabel: "Competitive intel"
costLabel: "6 credits"
actorsLabel: "trustpilot-scraper, reddit-scraper, yelp-scraper, google-news-scraper"
keywords: "brand monitoring api, brand sentiment mcp, trustpilot reddit api, claude brand monitor"
---

## monitor_brand

Sliding-window sentiment monitor. Pulls Trustpilot reviews, Reddit threads, Yelp reviews (where applicable), and Google News mentions for a brand within the last N days.

Use it weekly to catch viral complaint threads before they eat a renewal — or to benchmark brand sentiment vs. competitors quarter over quarter.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `brand` | string | yes | Brand name. "Asana", "Notion". |
| `sources` | array | no | Subset of 4. Default all. |
| `lookback_days` | int | no | Time window. Default 30. |
| `max_results` | int | no | Per-source cap. Default 25. |

### Output

```json
{
  "brand": "Asana",
  "lookback_days": 30,
  "trustpilot": {
    "rating": 3.8,
    "rating_change_30d": -0.2,
    "complaints": [{"title": "Pricing changes", "rating": 1, "..."}]
  },
  "reddit": {
    "threads_with_brand": 42,
    "top_threads": [{"title": "Switching from Asana", "upvotes": 287, "url": "..."}]
  },
  "yelp": {"reviews_count": 8, "rating": 4.0},
  "google_news": [{"title": "Asana lays off 13%", "url": "...", "date": "2026-04-15"}],
  "credits_charged": 6
}
```

### Example prompts in Claude

- "Brand-monitor Asana for the last 30 days. Flag any Reddit thread with the words 'switching from'."
- "Sentiment trend on our brand vs. our top 2 competitors over 90 days."
- "Are there any viral complaint threads about Notion right now?"

### Suggested next

- [`track_competitor`](/mcp/tools/track-competitor/) — 8-source full brief.
- [`compare_products`](/mcp/tools/compare-products/) — head-to-head review pull.

### Underlying actors

Trustpilot, Reddit, Yelp, Google News.
