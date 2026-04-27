---
title: "Track Keyword Rankings on Google Search at Scale (2026)"
slug: "track-keyword-rankings-on-google-search"
description: "Build a daily keyword-rank tracker at $0.008 per result using Thirdwatch's Google Search Scraper. Multi-country SERP monitoring + position-change alerts."
actor: "google-search-scraper"
actor_url: "https://apify.com/thirdwatch/google-search-scraper"
actorTitle: "Google Search Scraper"
category: "other"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-google-search-results-at-scale"
  - "research-competitor-content-with-google-search"
  - "build-serp-monitoring-pipeline-with-google-search"
keywords:
  - "google keyword rank tracker"
  - "serp position monitoring"
  - "track google rankings"
  - "ahrefs alternative keyword tracking"
faqs:
  - q: "How much does it cost to track keyword rankings?"
    a: "Thirdwatch's Google Search Scraper charges $0.008 per result on the FREE tier. A 200-keyword daily rank-tracker pulling top-20 positions per keyword costs $32 per refresh. Daily cadence on 200 keywords across two markets (US, UK) costs ~$1,920/month at FREE pricing — meaningfully below Ahrefs ($129+/seat) or SEMrush ($129+/seat) for the same coverage scale, with full schema control."
  - q: "How does this differ from Ahrefs or SEMrush?"
    a: "Ahrefs and SEMrush bundle keyword tracking with backlink analysis, content explorer, site audits, and reporting dashboards. Thirdwatch's actor is the data layer only — no dashboard, no on-page analysis. Build your own tracker with ranking data flowing into your preferred analytics stack (Looker, Metabase, internal Postgres) for far less than the SaaS cost."
  - q: "What position-change threshold should trigger alerts?"
    a: "A 3+ position move week-over-week is meaningful for organic rankings. Smaller moves are within typical SERP volatility. Position 1-3 movements matter most (page-1 visibility), position 4-10 second-tier, position 11+ usually only worth monitoring if you're trying to break into page 1. Tune by category — competitive keywords (insurance, loans, software) move less; long-tail keywords move more."
  - q: "How do I track keyword rankings across countries?"
    a: "Pass the same query list with different countryCode and languageCode combinations. The same query in us/en vs in/hi vs uk/en returns substantially different result sets — different domains rank, different featured snippets, different ranking. For multi-market SEO, run separate snapshots per market and store countryCode in your downstream schema."
  - q: "What if my URL doesn't appear in the top results?"
    a: "Treat absence-from-top-N as position 100 (or whatever your search depth allows). Track this as a missing-from-SERP signal — a URL that consistently lands at position 100 across multiple keywords is either un-ranked or de-indexed. For URLs that previously ranked but no longer appear, flag immediately as it usually indicates a Google penalty or content removal."
  - q: "How fresh do rankings need to be?"
    a: "Daily cadence is the standard. Google's index updates continuously, but most ranking shifts on stable queries happen on a 2-7 day cycle. Daily snapshots catch genuine shifts; hourly is overkill for rank-tracking specifically (use hourly for breaking-news or AI-generated SERP-shift detection). Schedule the actor at midnight UTC for clean day-aligned snapshots."
---

> Thirdwatch's [Google Search Scraper](https://apify.com/thirdwatch/google-search-scraper) feeds a programmatic keyword rank-tracking pipeline at $0.008 per result — daily snapshot 200+ keywords across multiple country markets, compute position changes, alert on threshold-crossing movers. Built for SEO managers tracking client rankings, content-marketing teams measuring page-by-page progress, e-commerce ops monitoring product-keyword visibility, and SEO-tooling builders who want raw SERP data instead of paid SaaS dashboards.

## Why track keyword rankings programmatically

SEO is a rank-position game. According to [Backlinko's 2024 organic CTR study](https://backlinko.com/google-ctr-stats), the top organic SERP position commands 27.6% click-through, position 2 hits 15.8%, and position 10 drops to 2.4%. Each rank improvement materially affects organic traffic, which makes systematic position monitoring core operational infrastructure for any business with material organic-traffic dependence. The blocker for systematic access: Google's Search Console only reports your own URLs (not competitors), and paid SaaS tools (Ahrefs, SEMrush) bundle ranking-tracking with non-essential features at premium pricing.

The job-to-be-done is structured. An SEO agency tracks 200 keywords daily for 10 client URLs, alerting on 3+ position moves. A content team measures their own pages' ranking progress weekly across 500 keywords. An e-commerce merchandiser tracks 1,000 product-name keywords to time campaigns against ranking dips. A market researcher studies how Google surfaces a topic across 20 country-language pairs. All reduce to query × country × snapshot → ranking time-series.

## How does this compare to the alternatives?

Three options for tracking keyword rankings programmatically:

| Approach | Cost per 1,000 keyword-positions × daily | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Ahrefs / SEMrush | $129–$2,500/month per seat | High, includes site audits | Hours | Per-seat licensing |
| Google Custom Search API | Capped at 100 free queries/day | Official | Hours | Strict quota gate |
| Thirdwatch Google Search Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, full surface coverage | 5 minutes | Thirdwatch tracks Google changes |

Ahrefs and SEMrush are the canonical SaaS choices but priced for marketing teams. The [Google Search Scraper actor page](/scrapers/google-search-scraper) gives you the ranking data layer at meaningfully lower unit cost — most teams build their own dashboards on top with full schema control.

## How to track keyword rankings in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a daily snapshot of a keyword watchlist?

Pass keywords as `queries`, set `countryCode` and `languageCode`, capture top-20 positions per keyword.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~google-search-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

KEYWORDS = [
    "web scraping tools", "data extraction api", "scraping framework",
    "apify alternatives", "octoparse alternative",
    "best linkedin scraper", "indeed jobs api alternative",
    "google maps scraper python", "amazon product api alternative",
    # ... extend to 200+ keywords for production rank tracking
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": KEYWORDS,
        "maxResultsPerQuery": 20,
        "countryCode": "us",
        "languageCode": "en",
        "searchType": "web",
        "timeFilter": "any",
    },
    timeout=3600,
)
records = resp.json()
today = datetime.date.today().isoformat()
pathlib.Path(f"snapshots/serp-{today}.json").write_text(json.dumps(records))
print(f"{today}: {len(records)} ranking rows across {len(KEYWORDS)} keywords")
```

9 keywords × 20 results = up to 180 rows, costing $1.44.

### Step 3: How do I compute position changes day-over-day?

Aggregate snapshots, key on `(query, url)`, compute position deltas.

```python
import pandas as pd, glob

frames = []
for f in sorted(glob.glob("snapshots/serp-*.json")):
    date = pathlib.Path(f).stem.replace("serp-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        frames.append({
            "date": date, "query": j.get("query"), "url": j.get("url"),
            "position": j.get("position"), "title": j.get("title"),
        })

df = pd.DataFrame(frames).dropna(subset=["query", "url", "position"])
df["date"] = pd.to_datetime(df["date"])

pivot = df.pivot_table(
    index=["query", "url"], columns="date", values="position", aggfunc="min"
).fillna(100)  # missing-from-SERP = position 100

dates = sorted(pivot.columns)
if len(dates) >= 2:
    pivot["movement"] = pivot[dates[-2]] - pivot[dates[-1]]  # +ve = moved UP
    pivot["abs_move"] = pivot.movement.abs()
    movers = pivot[pivot.abs_move >= 3].sort_values("movement", ascending=False)
    print("--- Day-over-day position changes ---")
    print(movers[[dates[-2], dates[-1], "movement"]].head(20))
```

A 3+ position improvement is genuinely interesting; a 3+ position drop warrants investigation. URLs newly appearing in top-20 (yesterday's position 100, today's position ≤ 20) are major wins; the inverse signals a SERP penalty.

### Step 4: How do I forward ranking alerts to Slack?

Persist seen movements; forward only new threshold crossings.

```python
import json, pathlib, requests as r

target_domains = ["thirdwatch.dev"]  # your tracked URLs
significant = movers.reset_index()
significant = significant[
    significant.url.str.contains("|".join(target_domains))
    & (significant.abs_move >= 3)
]

snapshot = pathlib.Path("rank-alerts-seen.json")
seen = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()

for _, row in significant.iterrows():
    key = f"{row.query}|{row.url}|{dates[-1]}"
    if key in seen:
        continue
    arrow = ":chart_with_upwards_trend:" if row.movement > 0 else ":chart_with_downwards_trend:"
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f"{arrow} *{row['query']}* — position "
                          f"{int(row[dates[-2]])} → {int(row[dates[-1]])} "
                          f"({int(row.movement):+}) for {row['url']}")},
           timeout=10)
    seen.add(key)

snapshot.write_text(json.dumps(list(seen)))
print(f"{len(significant)} significant ranking alerts processed")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at daily cadence (`0 0 * * *`) and the loop runs unattended.

## Sample output

A single ranking record looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "position": 1,
  "title": "Kubernetes vs Docker: What you need to know in 2026",
  "url": "https://northflank.com/blog/kubernetes-vs-docker",
  "displayUrl": "https://northflank.com > blog > kubernetes-vs-docker",
  "description": "Kubernetes is incredibly powerful but also more complex than Docker alone.",
  "query": "kubernetes vs docker comparison",
  "searchType": "web",
  "page": 1,
  "siteLinks": [],
  "timestamp": "2026-04-22T10:00:00Z"
}
```

`position` is the canonical SERP rank (1 = top of page 1). `query` preserved on every row keeps multi-keyword batch results attributable. `siteLinks` is populated when Google shows sub-links beneath a result (typically positions 1-3 for big sites) — useful for distinguishing "true #1" placements from page-1 positions without site-link enrichment.

## Common pitfalls

Three things go wrong in production rank-tracking pipelines. **Featured-snippet attribution** — when Google shows a featured snippet, the URL appears at "position 0" plus its underlying organic position; the actor returns the organic-result row, which can make rank-tracking dashboards look artificially worse for snippet-winning URLs. Track snippets separately if their absence/presence matters. **Result-set drift across runs** — Google personalises and rotates results, so the same query 30 minutes apart can produce slightly different rankings; for ranking tracking specifically, smooth with a 7-day rolling median rather than reading single-day rank as authoritative. **AI Overviews dilution** — for many informational queries, Google's AI Overview now occupies the top of the SERP, pushing organic results down. The actor returns organic results; AI-Overview presence requires separate detection.

Thirdwatch's actor uses Camoufox + humanize stealth-browser bypass for Google's anti-bot defenses (Google blocks most direct HTTP scraping). The 4096 MB max memory and 3,600-second timeout headroom mean even hundreds of keywords across multiple country-language pairs complete in one run. Pair with our [Google News Scraper](https://apify.com/thirdwatch/google-news-scraper) for news-surface tracking.

## Related use cases

- [Scrape Google search results at scale](/blog/scrape-google-search-results-at-scale)
- [Research competitor content with Google Search](/blog/research-competitor-content-with-google-search)
- [Build a SERP monitoring pipeline with Google Search](/blog/build-serp-monitoring-pipeline-with-google-search)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to track keyword rankings?

Thirdwatch's Google Search Scraper charges $0.008 per result on the FREE tier. A 200-keyword daily rank-tracker pulling top-20 positions per keyword costs $32 per refresh. Daily cadence on 200 keywords across two markets (US, UK) costs ~$1,920/month at FREE pricing — meaningfully below [Ahrefs](https://ahrefs.com/) ($129+/seat) or SEMrush ($129+/seat) for the same coverage scale, with full schema control.

### How does this differ from Ahrefs or SEMrush?

Ahrefs and SEMrush bundle keyword tracking with backlink analysis, content explorer, site audits, and reporting dashboards. Thirdwatch's actor is the data layer only — no dashboard, no on-page analysis. Build your own tracker with ranking data flowing into your preferred analytics stack (Looker, Metabase, internal Postgres) for far less than the SaaS cost.

### What position-change threshold should trigger alerts?

A 3+ position move week-over-week is meaningful for organic rankings. Smaller moves are within typical SERP volatility. Position 1-3 movements matter most (page-1 visibility), position 4-10 second-tier, position 11+ usually only worth monitoring if you're trying to break into page 1. Tune by category — competitive keywords (insurance, loans, software) move less; long-tail keywords move more.

### How do I track keyword rankings across countries?

Pass the same query list with different `countryCode` and `languageCode` combinations. The same query in `us/en` vs `in/hi` vs `uk/en` returns substantially different result sets — different domains rank, different featured snippets, different ranking. For multi-market SEO, run separate snapshots per market and store `countryCode` in your downstream schema.

### What if my URL doesn't appear in the top results?

Treat absence-from-top-N as position 100 (or whatever your search depth allows). Track this as a missing-from-SERP signal — a URL that consistently lands at position 100 across multiple keywords is either un-ranked or de-indexed. For URLs that previously ranked but no longer appear, flag immediately as it usually indicates a Google penalty or content removal.

### How fresh do rankings need to be?

Daily cadence is the standard. Google's index updates continuously, but most ranking shifts on stable queries happen on a 2-7 day cycle. Daily snapshots catch genuine shifts; hourly is overkill for rank-tracking specifically (use hourly for breaking-news or AI-generated SERP-shift detection). Schedule the actor at midnight UTC for clean day-aligned snapshots.

Run the [Google Search Scraper on Apify Store](https://apify.com/thirdwatch/google-search-scraper) — pay-per-result, free to try, no credit card to test.
