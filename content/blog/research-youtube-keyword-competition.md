---
title: "Research YouTube Keyword Competition (2026 Guide)"
slug: "research-youtube-keyword-competition"
description: "Analyze YouTube keyword competition at $0.0015 per video using Thirdwatch. Top-10 video views + creator dominance + view-velocity opportunity scoring."
actor: "youtube-scraper"
actor_url: "https://apify.com/thirdwatch/youtube-scraper"
actorTitle: "YouTube Scraper"
category: "social"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-youtube-search-and-channel-data"
  - "track-youtube-channel-growth-and-views"
  - "build-youtube-content-trend-pipeline"
keywords:
  - "youtube keyword research"
  - "youtube seo competition"
  - "youtube niche research"
  - "youtube keyword tool alternative"
faqs:
  - q: "Why keyword-competition research on YouTube specifically?"
    a: "YouTube is the second-largest search engine globally and the canonical surface for educational and how-to content discovery. According to Pew Research, 81% of US adults use YouTube and search-driven discovery accounts for 30%+ of total view volume. For content creators, video-marketing teams, and creator-economy SaaS builders, keyword-competition research is the foundation of channel-growth strategy."
  - q: "What signals indicate keyword competitiveness?"
    a: "Three signals: top-10 video median views (proxy for category demand), creator dominance (HHI of channels in top 10 — high concentration means established competitors), and view-velocity dispersion (variance in views/day across top 10 — high variance means a few mega-hits dominate, low variance means even competition). Cross-tabulate to find keywords with strong demand AND non-dominant competition."
  - q: "How is opportunity defined?"
    a: "Optimal opportunity: top-10 median views >100K (real demand), creator HHI <0.4 (no monopolist), and at least 3 videos under 1 year old (active category). These three conditions together select for keywords where demand exists, no single channel locks out new entrants, and recent content rewards new creators rather than only legacy ones."
  - q: "What sample depth is needed?"
    a: "Top-10 results per keyword is the canonical depth — YouTube's first page captures 80%+ of the demand signal. For broader competitive mapping, top-30 supports HHI computations across a wider creator set. For very-niche keywords where YouTube returns under 30 results, the keyword itself indicates low demand — generally not worth investing in."
  - q: "How does this compare to TubeBuddy or VidIQ?"
    a: "TubeBuddy and VidIQ bundle keyword research with browser-extension publishing tools at $20-$50/month per seat. Their keyword-difficulty scoring is proprietary and reasonably accurate for individual creators. The actor gives you raw data at $1/1K records — for cross-keyword research, agency competitive analysis, or platform-builder use cases, raw data is materially more flexible. For solo creators doing one-off research, the SaaS tools win on UX."
  - q: "How fresh does keyword data need to be?"
    a: "For active campaign-planning workflows, monthly cadence is sufficient — top-10 video composition and creator dominance move slowly enough that monthly snapshots capture meaningful drift. For trend-research operations, weekly cadence catches new-entrant signals. For one-off content-strategy projects, a single comprehensive scrape is fine. Tag scrape timestamps for delta tracking across snapshots."
---

> Thirdwatch's [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) makes keyword-competition research a structured workflow at $0.0015 per video — top-10 view stats, creator dominance, view-velocity dispersion, opportunity scoring across hundreds of keywords. Built for content creators, video-marketing teams, creator-economy SaaS, and SEO-research platforms that need raw YouTube data.

## Why research YouTube keyword competition

YouTube is the dominant educational and how-to discovery surface. According to [Google's 2024 YouTube Watch report](https://blog.google/products/youtube/), more than 70% of YouTube views originate from search and recommendation surfaces driven by keyword relevance. For content creators and video-marketing teams, choosing keywords with real demand and non-dominant competition is the single highest-leverage strategy decision — getting it right unlocks discovery; getting it wrong wastes months of production effort.

The job-to-be-done is structured. A YouTube creator-strategy agency wants 200 client niches × 50 keywords each = 10K keywords competition-scored quarterly. A video-marketing team launching a new educational series wants per-keyword competitiveness benchmarks before content investment. A creator-economy SaaS builder powers keyword-research dashboards for their creator users. An SEO-research platform extends YouTube SERP analysis into broader video-keyword competitive intelligence. All reduce to keyword list + top-10 video pull + competition aggregation per keyword.

## How does this compare to the alternatives?

Three options for YouTube keyword-competition data:

| Approach | Cost per 10,000 records monthly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| TubeBuddy / VidIQ | $20–$50/month per seat | Browser extension UX | Hours | Per-seat license |
| YouTube Data API v3 | Free with quotas | Strict daily limits | Hours | Quota management |
| Thirdwatch YouTube Scraper | $10 ($0.001 × 10,000) | Pure HTTP via ytInitialData | 5 minutes | Thirdwatch tracks YouTube changes |

TubeBuddy and VidIQ are the SaaS market leaders for individual creators. YouTube Data API v3 is the official path but the daily quota (10K units, with each search costing 100 units = 100 searches/day) makes high-volume research impractical. The [YouTube Scraper actor page](/scrapers/youtube-scraper) gives you unlimited keyword research at the lowest unit cost.

## How to research keyword competition in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a keyword-watchlist batch?

Pass keyword queries with `searchType: "videos"` and `maxResultsPerQuery: 10`.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~youtube-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

KEYWORDS = ["how to start a youtube channel",
            "passive income ideas 2026",
            "morning routine productive",
            "kettlebell workout for beginners",
            "react tutorial 2026",
            "tax tips for freelancers",
            "easy meal prep for week",
            "how to learn guitar fast",
            "rust programming language tutorial",
            "minimalist home tour"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": KEYWORDS, "searchType": "videos",
          "maxResults": 100, "maxResultsPerQuery": 10},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} videos across {len(KEYWORDS)} keywords")
```

10 keywords × 10 top videos = up to 100 records, costing $0.10.

### Step 3: How do I compute per-keyword competition metrics?

Aggregate top-10 stats and compute HHI for creator dominance.

```python
df["viewCount"] = pd.to_numeric(df.viewCount, errors="coerce")
df["createdAt"] = pd.to_datetime(df.createdAt, errors="coerce")
df["age_days"] = (pd.Timestamp.utcnow() - df.createdAt).dt.days.clip(lower=1)
df["views_per_day"] = df.viewCount / df.age_days

def channel_hhi(rows):
    shares = rows.channelName.value_counts(normalize=True)
    return float((shares ** 2).sum())

competition = (
    df.groupby("searchString")
    .agg(
        median_views=("viewCount", "median"),
        median_views_per_day=("views_per_day", "median"),
        recent_count=("age_days", lambda x: (x <= 365).sum()),
        creator_hhi=("channelName", lambda x: float((x.value_counts(normalize=True) ** 2).sum())),
    )
    .assign(
        opportunity=lambda d: (
            (d.median_views >= 100000)
            & (d.creator_hhi < 0.4)
            & (d.recent_count >= 3)
        ).astype(int)
    )
    .sort_values(["opportunity", "median_views"], ascending=[False, False])
)
print(competition)
```

The three-condition opportunity filter selects keywords with real demand, non-dominant creators, and an active recent-content base.

### Step 4: How do I track competitive shifts over time?

Snapshot weekly, compute median-views and HHI deltas to detect entry-exit dynamics.

```python
import pathlib, datetime

ts = datetime.datetime.utcnow().strftime("%Y%m%d")
competition.to_csv(f"snapshots/youtube-keywords-{ts}.csv")

# Compare against last snapshot
prev = pd.read_csv("snapshots/youtube-keywords-20260420.csv", index_col=0)
combined = competition.merge(prev, left_index=True, right_index=True, suffixes=("", "_prev"))
combined["views_delta"] = combined.median_views - combined.median_views_prev
combined["hhi_delta"] = combined.creator_hhi - combined.creator_hhi_prev

# Newly-tractable keywords: HHI dropping (less concentrated) + views rising
emerging = combined[
    (combined.hhi_delta <= -0.05)
    & (combined.views_delta >= 50000)
]
print(f"{len(emerging)} keywords with newly-tractable competition")
print(emerging[["median_views", "creator_hhi", "hhi_delta", "views_delta"]])
```

A keyword where HHI is dropping while median views rise is a competitive opening — established creators are losing share to new entrants on growing demand.

## Sample output

A single YouTube video record looks like this. Five rows weigh ~6 KB.

```json
{
  "videoId": "abc123XYZ",
  "title": "How to Start a YouTube Channel in 2026 (Complete Guide)",
  "url": "https://www.youtube.com/watch?v=abc123XYZ",
  "channelName": "Roberto Blake",
  "channelUrl": "https://www.youtube.com/@robertoblake",
  "channelSubscribers": 720000,
  "viewCount": 245000,
  "likeCount": 18500,
  "commentCount": 1240,
  "duration": 845,
  "createdAt": "2026-02-15T14:00:00Z",
  "thumbnailUrl": "https://i.ytimg.com/vi/abc123XYZ/...",
  "description": "Complete guide to starting a YouTube channel..."
}
```

`videoId` is YouTube's globally unique video identifier — the canonical key for cross-snapshot dedup. `viewCount` and `createdAt` feed the views-per-day computation that's central to competition analysis. `channelSubscribers` provides the creator-tier context for normalized engagement-rate analysis. `duration` (seconds) lets you filter to long-form vs Shorts (<60s) since the two surfaces have separate algorithm dynamics.

## Common pitfalls

Three things go wrong in YouTube keyword-research pipelines. **Search-result personalization** — YouTube personalizes results based on viewer history; the actor's IP sees a relatively neutral feed but for advertiser-relevant audience research, supplement with first-party YouTube Analytics from owned channels. **Shorts vs long-form mixing** — YouTube Shorts (under 60s) have separate distribution dynamics and engagement norms; for long-form keyword research, filter out `duration < 60` rows before computing competition metrics. **Recommendations-driven dilution** — top-10 search results sometimes include videos that ranked due to recommendation-feed boost rather than search-keyword relevance; for keyword-pure analysis, cross-check that the keyword appears in the video title or description.

Thirdwatch's actor uses pure HTTP at $0.10/1K, ~99% margin. The 256 MB memory profile means a 100-keyword research batch runs in 8-15 minutes wall-clock for under $1. Pair YouTube with [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) for cross-platform short-form research and [Google Search Scraper](https://apify.com/thirdwatch/google-search-scraper) for keyword-funnel analysis (search SERP → YouTube SERP). A fourth subtle issue worth flagging: YouTube's algorithm increasingly preferences "session length" optimization over per-video views, which means high-views-per-day on individual videos doesn't always translate to channel-level growth — a creator's overall channel-velocity matters more for sustainable competition than any single hit. Cross-reference per-keyword rankings with channel-subscriber growth from snapshot deltas to identify creators who are systematically winning vs creators with one viral hit. A fifth pattern unique to YouTube keyword research: thumbnail and title A/B testing means the same video shows up with different titles across snapshots; for stable cross-snapshot analysis, dedupe on `videoId` rather than title and treat title-changes as a separate signal worth tracking. A sixth and final pitfall: certain keyword-niches have heavy regional dominance (Hindi tech tutorials, Spanish cooking content) where the top-10 reflects regional language rather than English-dominant competition; for cross-region competitive mapping, supplement keyword search with explicit language qualifiers (e.g., "react tutorial in Hindi") to capture region-specific opportunity surfaces.

## Related use cases

- [Scrape YouTube search and channel data](/blog/scrape-youtube-search-and-channel-data)
- [Track YouTube channel growth and views](/blog/track-youtube-channel-growth-and-views)
- [Build YouTube content trend pipeline](/blog/build-youtube-content-trend-pipeline)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why keyword-competition research on YouTube specifically?

YouTube is the second-largest search engine globally and the canonical surface for educational and how-to content discovery. According to Pew Research, 81% of US adults use YouTube and search-driven discovery accounts for 30%+ of total view volume. For content creators, video-marketing teams, and creator-economy SaaS builders, keyword-competition research is the foundation of channel-growth strategy.

### What signals indicate keyword competitiveness?

Three signals: top-10 video median views (proxy for category demand), creator dominance (HHI of channels in top 10 — high concentration means established competitors), and view-velocity dispersion (variance in views/day across top 10 — high variance means a few mega-hits dominate, low variance means even competition). Cross-tabulate to find keywords with strong demand AND non-dominant competition.

### How is opportunity defined?

Optimal opportunity: top-10 median views >100K (real demand), creator HHI <0.4 (no monopolist), and at least 3 videos under 1 year old (active category). These three conditions together select for keywords where demand exists, no single channel locks out new entrants, and recent content rewards new creators rather than only legacy ones.

### What sample depth is needed?

Top-10 results per keyword is the canonical depth — YouTube's first page captures 80%+ of the demand signal. For broader competitive mapping, top-30 supports HHI computations across a wider creator set. For very-niche keywords where YouTube returns under 30 results, the keyword itself indicates low demand — generally not worth investing in.

### How does this compare to TubeBuddy or VidIQ?

[TubeBuddy](https://www.tubebuddy.com/) and [VidIQ](https://vidiq.com/) bundle keyword research with browser-extension publishing tools at $20-$50/month per seat. Their keyword-difficulty scoring is proprietary and reasonably accurate for individual creators. The actor gives you raw data at $1/1K records — for cross-keyword research, agency competitive analysis, or platform-builder use cases, raw data is materially more flexible. For solo creators doing one-off research, the SaaS tools win on UX.

### How fresh does keyword data need to be?

For active campaign-planning workflows, monthly cadence is sufficient — top-10 video composition and creator dominance move slowly enough that monthly snapshots capture meaningful drift. For trend-research operations, weekly cadence catches new-entrant signals. For one-off content-strategy projects, a single comprehensive scrape is fine. Tag scrape timestamps for delta tracking across snapshots.

Run the [YouTube Scraper on Apify Store](https://apify.com/thirdwatch/youtube-scraper) — pay-per-video, free to try, no credit card to test.
