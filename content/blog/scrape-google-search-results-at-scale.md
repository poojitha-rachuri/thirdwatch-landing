---
title: "Scrape Google Search Results at Scale (2026 Guide)"
slug: "scrape-google-search-results-at-scale"
description: "Pull Google SERPs at $0.008 per result using Thirdwatch's Google Search Scraper. Web/news/images/videos/shopping. Country + language + time filters. Python recipes inside."
actor: "google-search-scraper"
actor_url: "https://apify.com/thirdwatch/google-search-scraper"
actorTitle: "Google Search Scraper"
category: "other"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-keyword-rankings-on-google-search"
  - "research-competitor-content-with-google-search"
  - "build-serp-monitoring-pipeline-with-google-search"
keywords:
  - "google search scraper"
  - "scrape google serps"
  - "google search api alternative"
  - "google results scraper python"
faqs:
  - q: "How much does it cost to scrape Google search results?"
    a: "Thirdwatch's Google Search Scraper charges $0.008 per result on the FREE tier and drops to $0.004 at GOLD volume. A 100-keyword SEO ranking sweep at 20 results each costs $16 per refresh. Daily cadence over 100 keywords costs ~$480/month at FREE pricing — competitive with paid SERP-API services for the same coverage."
  - q: "What surface types does the actor support?"
    a: "Five: web, news, images, videos, shopping. Pass searchType to choose. The output schema stays consistent across all five types, so a multi-surface dashboard can union the results without per-type parsing. Each surface returns the same core fields — position, title, url, description — with surface-specific extras when applicable."
  - q: "Can I track keyword rankings over time?"
    a: "Yes. Run the same queries on a daily or weekly schedule with consistent countryCode and languageCode and persist the results. Compare position per (query, url) tuple across snapshots — a URL moving from position 7 to position 3 is a real ranking gain. Use the actor as the data layer for your own SEO-tracking dashboard rather than paying for Ahrefs or SEMrush at scale."
  - q: "Do results vary by country or language?"
    a: "Yes, materially. Google personalises SERPs by country (countryCode) and language (languageCode). The same query in us/en vs in/hi vs uk/en returns substantially different result sets — different domains, different ranking, different featured snippets. For multi-market SEO, run the same query across each target market separately and store countryCode in your downstream schema."
  - q: "Can I filter to recent results only?"
    a: "Yes. timeFilter accepts any, pastHour, pastDay, pastWeek, pastMonth, pastYear. For breaking-news monitoring use pastHour or pastDay; for trend research pastWeek or pastMonth. For SEO ranking tracking, leave at any so you see the actual current SERP composition."
  - q: "What data is NOT returned?"
    a: "Featured snippets, knowledge panels, People Also Ask blocks, and Twitter/X carousels are not returned as separate rows — only organic web results. For PAA and featured-snippet tracking, you'd need a more specialised SERP scraper. For most SEO and competitive-research workflows, organic-only is the right starting point — those are the results that drive most click-through."
---

> Thirdwatch's [Google Search Scraper](https://apify.com/thirdwatch/google-search-scraper) returns Google SERP data at $0.008 per result across five surface types (web, news, images, videos, shopping) with country, language, and time filters. Built for SEO professionals tracking keyword rankings, market researchers studying topic coverage by geography, brand-monitoring teams watching mention placement, and content teams finding gaps in competitor coverage.

## Why scrape Google search results

Google still dominates global search. According to [Statcounter's 2024 search engine market share](https://gs.statcounter.com/search-engine-market-share), Google holds 91%+ of global desktop search and 95%+ of mobile — making SERP data the single most important input for SEO, content, and competitive-intelligence teams. The blocker for systematic access: Google's official Custom Search API caps at 100 free queries per day and is priced per query for higher volumes, with material limitations on result depth and surface types.

The job-to-be-done is structured. An SEO professional tracks 200 keywords daily across US, UK, and India to monitor client rankings. A content team researches "what's ranking for our target keywords" weekly to find gaps. A brand-monitoring team watches their brand mentions across web and news SERPs. An academic studies how Google surfaces a topic across 20 country-language pairs. All reduce to the same shape — query + country + language + searchType + timeFilter — returning structured rows. The actor is the data layer.

## How does this compare to the alternatives?

Three options for getting Google SERP data into a pipeline:

| Approach | Cost per 1,000 results | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Google Custom Search API | $5 (after free 100/day) | High | Hours (project + billing setup) | Per-query quotas |
| Paid SERP API (SerpAPI, ScraperAPI, ScrapingBee) | $30–$100 (varies by plan) | High | Hours | Vendor lock-in |
| Thirdwatch Google Search Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, full surface coverage | 5 minutes | Thirdwatch tracks Google changes |

Google's own Custom Search API is the cheapest per-result option but capped at 10 results per query and missing news/images/shopping surfaces. Paid SERP APIs match the actor's coverage but charge 4-12x the per-result rate. The [Google Search Scraper actor page](/scrapers/google-search-scraper) sits in the middle — meaningfully cheaper than competing SERP APIs while covering all five surfaces.

## How to scrape Google search results in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull results for a keyword watchlist?

Pass an array of keywords, set `countryCode` and `languageCode`, and choose the `searchType`.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~google-search-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["web scraping tools", "data extraction api",
                    "best scraping framework", "apify alternatives"],
        "maxResultsPerQuery": 30,
        "countryCode": "us",
        "languageCode": "en",
        "searchType": "web",
        "timeFilter": "any",
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} results across {df['query'].nunique()} queries")
```

4 queries × 30 results = 120 records, costing $0.96.

### Step 3: How do I track ranking changes over time?

Persist daily snapshots and diff position-per-(query, url) across days.

```python
import datetime, json, pathlib, glob

today = datetime.date.today().isoformat()
pathlib.Path(f"snapshots/serp-{today}.json").write_text(df.to_json(orient="records"))

frames = []
for f in sorted(glob.glob("snapshots/serp-*.json")):
    date = pathlib.Path(f).stem.replace("serp-", "")
    snap = pd.read_json(f)
    snap["date"] = pd.to_datetime(date)
    frames.append(snap)

if len(frames) >= 2:
    history = pd.concat(frames, ignore_index=True)
    pivot = history.pivot_table(
        index=["query", "url"], columns="date", values="position", aggfunc="min"
    ).fillna(100)  # treat missing-from-SERP as position 100

    dates = sorted(pivot.columns)
    pivot["movement"] = pivot[dates[-7]] - pivot[dates[-1]]  # +ve = moved up
    movers = pivot[pivot.movement.abs() >= 3].sort_values("movement", ascending=False)
    print(movers.head(20))
```

Positive `movement` = URL moved up in the SERP; negative = moved down. A 3+ position move week-over-week is meaningful signal beyond ranking volatility noise.

### Step 4: How do I monitor brand mentions across web and news?

Run the same query under both web and news surfaces in parallel, then merge.

```python
results = {}
for stype in ["web", "news"]:
    r = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
        params={"token": TOKEN},
        json={
            "queries": ["thirdwatch scraping"],
            "maxResultsPerQuery": 50,
            "searchType": stype,
            "timeFilter": "pastWeek",
        },
        timeout=3600,
    )
    results[stype] = r.json()

import requests as r
all_mentions = pd.concat([
    pd.DataFrame(results["web"]).assign(source="web"),
    pd.DataFrame(results["news"]).assign(source="news"),
])
print(f"{len(all_mentions)} mentions in last week ({len(results['web'])} web, "
      f"{len(results['news'])} news)")
for _, row in all_mentions.head(10).iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": f":eyes: *{row.source}* mention: {row.title}\n{row.url}"},
           timeout=10)
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at daily or six-hourly cadence and the loop runs unattended.

## Sample output

A single record from the dataset for a web SERP query looks like this. Five rows of this shape weigh ~3 KB.

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

`position` is the canonical SERP rank (1 is top of page 1). `query` is preserved on every row so multi-query batch results stay attributable without losing context. `displayUrl` is Google's breadcrumb-style URL display, useful for compact UI rendering. `siteLinks` is populated when Google shows sub-links beneath a result (typically positions 1-3 for big sites) — the array can be empty without indicating a problem.

## Common pitfalls

Three issues bite Google SERP pipelines. **Result-set drift across runs** — Google personalises and rotates results, so the same query 30 minutes apart can produce slightly different rankings; for ranking tracking, smooth with a 3-7 day rolling median rather than treating single-day rank as authoritative. **Featured-snippet attribution** — when Google shows a featured snippet, the URL appears in two places (the snippet at position 0 plus its organic position 1-9); the actor returns the organic-result row, not a separate featured-snippet row, which can make rank-tracking dashboards look artificially worse for snippet-winning URLs. **Country-code surprises** — `in` returns Indian English-language results when `languageCode: en`; for Hindi-language results in India set `languageCode: hi`. Mismatches produce confusing data without obvious failures.

Thirdwatch's actor uses Camoufox + humanize stealth-browser bypass for Google's anti-bot defenses (Google blocks most direct HTTP scraping). The 4096 MB max memory and 3,600-second timeout headroom mean even hundreds of keywords across multiple country-language pairs complete in one run. Pair with our [Google News Scraper](https://apify.com/thirdwatch/google-news-scraper) for richer news-surface data and [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) for local-pack rankings. A fourth subtle issue worth flagging is that Google's SERP composition has shifted toward AI Overviews (the AI-generated answer box at the top) for many informational queries, which pushes traditional organic results below the fold; the actor returns the organic results, but for queries where AI Overviews dominate, ranking gains may not translate to traffic gains. A fifth note: shopping-surface results are sparse outside English-speaking markets — for non-US/UK shopping intelligence, supplement with marketplace-specific scrapers like our [Amazon Scraper](https://apify.com/thirdwatch/amazon-product-scraper).

## Related use cases

- [Track keyword rankings on Google Search](/blog/track-keyword-rankings-on-google-search)
- [Research competitor content with Google Search](/blog/research-competitor-content-with-google-search)
- [Build a SERP monitoring pipeline with Google Search](/blog/build-serp-monitoring-pipeline-with-google-search)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Google search results?

Thirdwatch's Google Search Scraper charges $0.008 per result on the FREE tier and drops to $0.004 at GOLD volume. A 100-keyword SEO ranking sweep at 20 results each costs $16 per refresh. Daily cadence over 100 keywords costs ~$480/month at FREE pricing — competitive with paid SERP-API services for the same coverage.

### What surface types does the actor support?

Five: `web`, `news`, `images`, `videos`, `shopping`. Pass `searchType` to choose. The output schema stays consistent across all five types, so a multi-surface dashboard can union the results without per-type parsing. Each surface returns the same core fields — `position`, `title`, `url`, `description` — with surface-specific extras when applicable.

### Can I track keyword rankings over time?

Yes. Run the same queries on a daily or weekly schedule with consistent `countryCode` and `languageCode` and persist the results. Compare `position` per `(query, url)` tuple across snapshots — a URL moving from position 7 to position 3 is a real ranking gain. Use the actor as the data layer for your own SEO-tracking dashboard rather than paying for [Ahrefs](https://ahrefs.com/) or SEMrush at scale.

### Do results vary by country or language?

Yes, materially. Google personalises SERPs by country (`countryCode`) and language (`languageCode`). The same query in `us`/`en` vs `in`/`hi` vs `uk`/`en` returns substantially different result sets — different domains, different ranking, different featured snippets. For multi-market SEO, run the same query across each target market separately and store `countryCode` in your downstream schema.

### Can I filter to recent results only?

Yes. `timeFilter` accepts `any`, `pastHour`, `pastDay`, `pastWeek`, `pastMonth`, `pastYear`. For breaking-news monitoring use `pastHour` or `pastDay`; for trend research `pastWeek` or `pastMonth`. For SEO ranking tracking, leave at `any` so you see the actual current SERP composition.

### What data is NOT returned?

Featured snippets, knowledge panels, People Also Ask blocks, and Twitter/X carousels are not returned as separate rows — only organic web results. For PAA and featured-snippet tracking, you'd need a more specialised SERP scraper. For most SEO and competitive-research workflows, organic-only is the right starting point — those are the results that drive most click-through.

Run the [Google Search Scraper on Apify Store](https://apify.com/thirdwatch/google-search-scraper) — pay-per-result, free to try, no credit card to test.
