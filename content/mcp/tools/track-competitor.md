---
title: "track_competitor"
description: "8-source company intel: G2 + Capterra + Trustpilot + AmbitionBox + LinkedIn jobs + employees + ProductHunt + Google News. 15 credits."
path: "mcp/tools/track-competitor/"
type: "mcp-tool"
toolName: "track_competitor"
cluster: "competitive"
clusterLabel: "Competitive intel"
costLabel: "15 credits"
actorsLabel: "g2-scraper, capterra-scraper, trustpilot-scraper, ambitionbox-scraper, linkedin-jobs, linkedin-profiles, producthunt-scraper, google-news-scraper"
keywords: "competitive intelligence api, competitor tracking mcp, g2 capterra api, claude competitor research"
---

## track_competitor

One call, eight sources. Pulls a complete brief on a competitor: G2 + Capterra reviews, Trustpilot complaints, AmbitionBox employer reviews, LinkedIn open jobs (by department), recent LinkedIn hires, ProductHunt launches, Google News mentions. With a lookback window.

This is the flagship "battle-card in one prompt" tool.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `company` | string | yes | Company name or domain. "Notion", "linear.app". |
| `sources` | array | no | Subset of 8 sources. Default all. |
| `max_results` | int | no | Per-source result cap. Default 25. |
| `lookback_days` | int | no | Time window for news / reviews / hires. Default 90. |

### Output (sketch)

```json
{
  "company": "Linear",
  "lookback_days": 90,
  "g2": {"rating": 4.7, "reviews_count": 1024, "recent_reviews": [...]},
  "capterra": {"rating": 4.6, "reviews_count": 412},
  "trustpilot": {"rating": 4.2, "complaints_last_30d": 7},
  "ambitionbox": {"employer_rating": 4.4, "wlb": 4.6},
  "linkedin_jobs": {"open_count": 27, "by_department": {"Engineering": 14, "...": 13}},
  "linkedin_recent_hires": [{"name": "...", "title": "...", "joined_date": "2026-03-12"}],
  "producthunt": [{"launch": "Linear Insights v2", "votes": 814, "date": "2026-04-08"}],
  "google_news": [{"title": "Linear raises $100M Series C", "url": "...", "date": "2026-03-30"}],
  "credits_charged": 15
}
```

### Example prompts in Claude

- "Track Notion's last 90 days. Hires, ratings drift, ProductHunt mentions, viral Reddit threads."
- "Pull a battle-card for Linear: G2 + Capterra + LinkedIn hiring + recent news."
- "Compare hiring patterns of Notion, Linear, Asana over the last 60 days. Which is hiring AI engineers?"

### Suggested next

- [`compare_products`](/mcp/tools/compare-products/) — head-to-head review compare.
- [`monitor_brand`](/mcp/tools/monitor-brand/) — sentiment in a sliding window.

### Underlying actors

G2 Reviews, Capterra, Trustpilot, AmbitionBox, LinkedIn Jobs, LinkedIn Profiles, ProductHunt, Google News.
