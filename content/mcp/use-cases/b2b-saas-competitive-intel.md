---
title: "Battle-cards in one Claude prompt — competitive intel for B2B SaaS"
description: "Track competitors, compare products, monitor brand sentiment across G2, Capterra, Trustpilot, Reddit, ProductHunt, LinkedIn jobs. 8-source briefs in 30 seconds."
path: "mcp/use-cases/b2b-saas-competitive-intel/"
type: "mcp-use-case"
icp: "b2b-saas"
keywords: "competitive intelligence saas, g2 track alternative, claude competitive intel, battle card automation, ai competitor tracking"
---

<section class="mcp-hero">
  <h1>Battle-cards in one Claude prompt</h1>
  <p class="tagline">Track competitors, compare products, monitor brand sentiment — across G2 + Capterra + Trustpilot + Reddit + ProductHunt + LinkedIn + Google News. Three tools, 30 seconds, $0.15 a brief.</p>
  <div class="mcp-cta-row">
    <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get an API key</a>
    <a class="mcp-cta-secondary" href="/mcp/">All 20 tools</a>
  </div>
</section>

## Why competitive intel is broken in 2026

Competitive intel platforms are **built for the wrong consumer** — they assume you have a dedicated CI analyst with 4 hours to read a dashboard. You don't. You're a PM who wants a battle-card *now* because you're in a deal-review meeting at 3pm. Or a CMO comparing your G2 score to a rival's before the QBR. Or a founder writing a "vs Notion" landing page.

The incumbent options are:
- **Klue / Crayon** — $30K–$100K/yr, real-time tracking, but the data is mostly press releases + LinkedIn scraping. Manual battle-card curation.
- **G2 Track** — buyer-intent, $15K+/yr, but only G2.
- **DIY**: alerts in 8 places, a Notion table, and the silent prayer that you remembered to update it.

Meanwhile, the actual signals — review-volume changes, hiring-pattern shifts, ProductHunt launches, Reddit complaints — are scattered across 8 platforms with no unifying API.

## Three Thirdwatch MCP tools that fix it

- **`track_competitor(company, sources, max_results)`** — one call, eight sources: G2 reviews, Capterra reviews, Trustpilot complaints, AmbitionBox employer reviews, LinkedIn jobs (what they're hiring for now), LinkedIn employees (recent hires by team), ProductHunt launches, Google News mentions. 15 credits, ~$0.15.
- **`compare_products(product_a, product_b, max_reviews_each)`** — head-to-head G2 + Capterra side-by-side: features, pricing, ratings, last 50 reviews each. 8 credits.
- **`monitor_brand(brand, sources, lookback_days, max_results)`** — Trustpilot + Reddit + Yelp + Google News in a sliding window. Use this to catch a viral complaint thread before it eats a renewal. 6 credits.

## 5 example prompts

> **"Pull a battle-card for Linear vs Jira: features, ratings, recent G2 reviews, top complaints. Format as a slide-ready Markdown table."**
>
> Claude calls `compare_products("Linear", "Jira", max_reviews_each=50)`, then formats. ~$0.08.

> **"Track Notion's last 90 days. I want hires by department, ProductHunt mentions, ratings drift, and any Reddit threads with >100 upvotes."**
>
> One `track_competitor("Notion", lookback_days=90)` call. Hits 8 sources. Returns structured signals. ~$0.15.

> **"Write a 'Postman vs Bruno' comparison page using the latest G2 reviews. Include 5 quoted complaints about Postman pricing."**
>
> `compare_products("Postman", "Bruno")`, then Claude drafts the page. The reviews are pre-quoted with author + date. ~$0.08.

> **"Brand-monitor Asana for the last 30 days. Flag any sentiment dip below 3.5 on Trustpilot or any Reddit thread with the words 'switching from'."**
>
> `monitor_brand("Asana", lookback_days=30)` → Claude does the threshold filter. ~$0.06.

> **"Compare the hiring patterns of our top 3 competitors. Are any of them aggressively hiring AI engineers?"**
>
> Three `track_competitor` calls in parallel, filter to engineering jobs with "AI/ML" keywords. Claude tabulates. ~$0.45.

## Output shape (track_competitor)

```json
{
  "company": "Linear",
  "lookback_days": 90,
  "g2": {
    "rating": 4.7,
    "reviews_count": 1024,
    "recent_reviews": [{ "title": "Best PM tool ever", "rating": 5, "date": "2026-04-22", "..." }]
  },
  "capterra": { "rating": 4.6, "reviews_count": 412 },
  "trustpilot": { "rating": 4.2, "complaints_last_30d": 7 },
  "ambitionbox": { "employer_rating": 4.4, "wlb": 4.6 },
  "linkedin_jobs": {
    "open_count": 27,
    "by_department": { "Engineering": 14, "Sales": 6, "Product": 4, "Other": 3 }
  },
  "linkedin_recent_hires": [{ "name": "...", "title": "...", "joined_date": "2026-03-12" }],
  "producthunt": [{ "launch": "Linear Insights v2", "votes": 814, "date": "2026-04-08" }],
  "google_news": [{ "title": "Linear raises $100M Series C", "url": "...", "date": "2026-03-30" }],
  "credits_charged": 15
}
```

## Thirdwatch MCP vs. CI incumbents

<table class="mcp-comparison">
<thead>
<tr>
  <th>Capability</th>
  <th>Klue / Crayon</th>
  <th>G2 Track</th>
  <th>DIY (alerts + Notion)</th>
  <th>Thirdwatch MCP</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Annual cost</td>
  <td>$30K – $100K</td>
  <td>$15K+</td>
  <td>~$0 (your time)</td>
  <td class="yes">~$200 / heavy use</td>
</tr>
<tr>
  <td>Sources covered</td>
  <td>5–10 (curated)</td>
  <td>1 (G2)</td>
  <td>2–3</td>
  <td class="yes">8 per call</td>
</tr>
<tr>
  <td>AI-native (Claude/Cursor)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">Yes</td>
</tr>
<tr>
  <td>Battle-card on demand</td>
  <td class="partial">Manual curate</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">One prompt</td>
</tr>
<tr>
  <td>Brand-sentiment monitoring</td>
  <td class="partial">Add-on</td>
  <td class="no">No</td>
  <td class="partial">Brand24 needed</td>
  <td class="yes">Built-in</td>
</tr>
<tr>
  <td>Hiring-pattern signals</td>
  <td class="partial">Yes (LinkedIn only)</td>
  <td class="no">No</td>
  <td class="partial">Manual</td>
  <td class="yes">LinkedIn + ATS</td>
</tr>
<tr>
  <td>Pay only for the data you ask for</td>
  <td class="no">No (annual)</td>
  <td class="no">No</td>
  <td class="yes">N/A</td>
  <td class="yes">Yes</td>
</tr>
</tbody>
</table>

## Three workflows we see most

1. **The 3pm battle-card.** PM is in a deal-review meeting; sales says "they're evaluating us against [X]." PM hits Claude with `compare_products("us", "X")`. Slack-ready output in 25 seconds.
2. **The QBR brand-health check.** CMO runs `monitor_brand("our_brand", lookback_days=90)` and `monitor_brand("rival", lookback_days=90)` weekly. Charts go straight into the QBR deck.
3. **The "vs competitor" SEO page.** Marketing programmatically generates 20 "vs" pages — one prompt per page, 8 cited reviews each, fresh Capterra ratings, $1.60 total.

## Get started

<div class="mcp-cta-row">
  <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get 100 free credits</a>
  <a class="mcp-cta-secondary" href="/mcp/tools/track-competitor/">Read track_competitor docs</a>
</div>
