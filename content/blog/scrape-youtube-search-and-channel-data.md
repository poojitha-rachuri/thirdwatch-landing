---
title: "Scrape YouTube Search and Channel Data at Scale (2026)"
slug: "scrape-youtube-search-and-channel-data"
description: "Pull YouTube videos, channels, playlists at $0.0015 per record using Thirdwatch — no API key. Views, durations, channel info, Shorts flag. Python recipes inside."
actor: "youtube-scraper"
actor_url: "https://apify.com/thirdwatch/youtube-scraper"
actorTitle: "YouTube Scraper"
category: "social"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-youtube-channel-growth-and-views"
  - "research-youtube-keyword-competition"
  - "build-youtube-content-trend-pipeline"
keywords:
  - "youtube scraper no api key"
  - "scrape youtube search results"
  - "youtube channel data api alternative"
  - "extract youtube videos python"
faqs:
  - q: "Do I need a YouTube Data API key?"
    a: "No. Thirdwatch's YouTube Scraper accesses publicly visible search and channel pages without login or API keys. This sidesteps the YouTube Data API's daily quota (10,000 units/day, with each search costing 100 units = max 100 searches/day) and the manual project-setup overhead. The actor handles arbitrarily-large workloads with pay-per-result pricing instead of unit-cost quotas."
  - q: "How much does it cost?"
    a: "Thirdwatch charges $0.0015 per video on the FREE tier and drops to $0.00085 at GOLD volume. A 50-keyword content-research sweep at 50 videos each costs $3.75 per refresh. Daily cadence on a 50-keyword watchlist costs ~$112/month at FREE pricing — a fraction of YouTube-focused content-research SaaS subscriptions."
  - q: "What search modes does the actor support?"
    a: "Three: videos (default — returns individual videos with views, duration, channel), channels (returns channel metadata), playlists (returns playlist info with video counts). The same actor input handles all three via the searchType parameter. Combined with sort options (relevance, date, viewCount, rating), this covers most content-research workflows."
  - q: "Can I scrape a channel's full video list?"
    a: "Yes. Pass a channel handle (@freecodecamp) or /channel/UC... URL as a query and the actor returns the channel's video feed. maxResultsPerQuery controls depth — set to 200 to capture roughly 10 pages of recent uploads, which covers most 6-12 month upload histories for active channels. For complete archives of high-volume channels, run sequential pulls across multiple sort orders."
  - q: "Are YouTube Shorts included?"
    a: "Yes, with the isShort flag set true. YouTube treats Shorts and traditional videos as the same underlying content type but renders them differently in the UI; the actor preserves both formats in the same dataset shape, so a downstream filter on isShort cleanly separates them. For Shorts-only or long-form-only workflows, this single field makes filtering trivial."
  - q: "Why is viewCount sometimes missing or rounded?"
    a: "YouTube displays view counts as 1.2M or 45K for large-view-count videos; the actor parses these to integers but rounding loses precision (1.2M could be 1.15M-1.24M). For absolute precision on individual videos, fetch the specific video URL via the actor — the detail page shows the exact count. For trend tracking and ranking analysis, the rounded counts are sufficient."
---

> Thirdwatch's [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) returns YouTube search results, channel video feeds, and playlist info at $0.0015 per record — title, viewCount, duration, channelName, thumbnailUrl, Shorts flag — without requiring a YouTube Data API key. Built for content researchers, channel-strategy analysts, marketers monitoring competitor channels, and content-aggregator builders.

## Why scrape YouTube without the API

YouTube is the second-largest search engine and the largest video platform globally. According to [Alphabet's 2024 annual disclosures](https://abc.xyz/), YouTube delivered $50B+ in advertising revenue with users uploading 500+ hours of video per minute and watching 1B+ hours daily. For content research, channel benchmarking, and trend monitoring, YouTube is non-negotiable. The blocker for systematic access: YouTube Data API v3 imposes strict daily quotas (10,000 units/day default, with each search consuming 100 units), making any meaningful research workflow run out of quota before lunchtime.

The job-to-be-done is structured. A content-research team analyzes 200 keywords daily for ranking competition. A marketing team watches 50 competitor channels weekly for upload cadence and top-performing video benchmarks. A media team monitors brand-related videos across YouTube for mention surfaces. A creator-strategy analyst studies what's trending in a niche. All reduce to query + searchType + sort returning structured rows.

## How does this compare to the alternatives?

Three options for getting YouTube data into a research pipeline:

| Approach | Cost per 1,000 videos | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| YouTube Data API v3 | Free (with strict quota) | Official | Hours (project + API key) | 100-search/day cap |
| YouTube SaaS (vidIQ, TubeBuddy, Social Blade) | $50–$500/month per seat | High, includes ranking analytics | Hours | Vendor lock-in |
| Thirdwatch YouTube Scraper | $1.50 ($0.0015 × 1,000) | Production-tested, no quota | 5 minutes | Thirdwatch tracks YouTube changes |

YouTube's official API is free but the daily quota is the binding constraint for any real research workflow. The [YouTube Scraper actor page](/scrapers/youtube-scraper) gives you unbounded workload at pay-per-result pricing — meaningfully cheaper than vidIQ-style SaaS once you cross modest research volumes.

## How to scrape YouTube in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I research videos by keyword sorted by view count?

Pass keywords as `queries`, set `searchType: "videos"` and `sort: "viewCount"` to get the highest-performing content first.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~youtube-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["python tutorial", "python web scraping", "python data analysis"],
        "searchType": "videos",
        "sort": "viewCount",
        "maxResults": 150,
        "maxResultsPerQuery": 50,
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} videos across {df.channelName.nunique()} channels")
```

3 queries × 50 results each = 150 records, costing $0.23.

### Step 3: How do I analyze a competitor channel's upload cadence?

Pass the channel handle as a query and pull recent videos sorted by date.

```python
resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["@freecodecamp"],
        "searchType": "videos",
        "sort": "date",
        "maxResults": 200,
        "maxResultsPerQuery": 200,
    },
    timeout=900,
)
ch_df = pd.DataFrame(resp.json())
ch_df["publishedTimeText"] = ch_df.publishedTimeText.fillna("")

# Approximate upload cadence from publishedTimeText
recent = ch_df[ch_df.publishedTimeText.str.contains("day|hour|week", na=False)]
print(f"freeCodeCamp recent uploads (last ~30 days): {len(recent)}")
print(f"Average views per recent video: {recent.viewCount.mean():,.0f}")
print(f"Top recent: {recent.sort_values('viewCount', ascending=False).iloc[0].title}")
```

For exact-date analysis, parse `publishedTimeText` against your scrape timestamp — `5 days ago` + scrape timestamp gives an approximate publish date accurate to the day.

### Step 4: How do I detect trending videos via view-velocity?

Combine view count with relative upload age to surface videos gaining views fastest per hour.

```python
import re

def parse_age_hours(s):
    if not s: return None
    m = re.search(r"(\d+)\s*(hour|day|week|month|year)", s)
    if not m: return None
    n, unit = int(m.group(1)), m.group(2)
    multipliers = {"hour": 1, "day": 24, "week": 168, "month": 720, "year": 8760}
    return n * multipliers[unit]

df["age_hours"] = df.publishedTimeText.apply(parse_age_hours)
fresh = df[df.age_hours.notna() & (df.age_hours <= 168)].copy()  # last week
fresh["views_per_hour"] = fresh.viewCount / fresh.age_hours.clip(lower=1)
print(fresh.sort_values("views_per_hour", ascending=False)
        [["title", "channelName", "viewCount", "age_hours",
          "views_per_hour", "isShort", "url"]].head(15))
```

Views-per-hour is a much better trending signal than absolute view count — it surfaces freshly viral content rather than evergreen leaders. A video with 1M views in 24 hours (~42K/hr) is far more interesting than a 5-year-old video at 50M views (~1K/hr).

## Sample output

A single video record looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "videoId": "rfscVS0vtbw",
  "title": "Learn Python - Full Course for Beginners",
  "url": "https://www.youtube.com/watch?v=rfscVS0vtbw",
  "channelName": "freeCodeCamp.org",
  "channelUrl": "https://www.youtube.com/channel/UC8butISFwT-Wl7EV0hUK0BQ",
  "description": "This course will give you a full introduction into all of the core concepts in python...",
  "viewCount": 45000000,
  "duration": 16264,
  "durationText": "4:31:04",
  "publishedTimeText": "5 years ago",
  "thumbnailUrl": "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
  "isLive": false,
  "isShort": false
}
```

`videoId` is YouTube's globally unique identifier — the canonical key for cross-snapshot dedup. `duration` is in seconds (integer) for clean numerical comparison; `durationText` is the YouTube-display format. `isShort: true` separates Shorts from traditional videos cleanly. `publishedTimeText` is YouTube's relative-time string ("5 years ago", "2 weeks ago", "3 hours ago") — the actor preserves it as YouTube renders, and your downstream code can parse to absolute dates if needed.

## Common pitfalls

Three things go wrong in production YouTube pipelines. **Relative-time precision** — `publishedTimeText` is YouTube's UI rendering, accurate to the year for old videos and to the hour for recent ones; for absolute-date precision use the actor's video-URL mode (passes individual URLs and reads the structured publish date from the page). **viewCount rounding for large counts** — YouTube shows `1.2M` rather than `1,234,567`; the actor parses to integer but rounding loses precision (1.15M-1.24M ambiguity). For trend ranking this is fine; for dashboards reporting absolute view milestones, expect ±0.05% rounding error. **Shorts mixed in search results** — when researching long-form content for a topic, Shorts pollute the data; filter on `isShort: false` for traditional video research, or `isShort: true` for Shorts-specific trend tracking.

Thirdwatch's actor uses a bracket-counting JSON parser to extract `ytInitialData` from YouTube's HTML response — no proxy needed since YouTube returns server-rendered data to anonymous visitors. The pure-HTTP architecture means a 200-video research batch completes in under five minutes and costs $0.30. Pair YouTube with our [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) and [Instagram Scraper](https://apify.com/thirdwatch/instagram-scraper) for cross-platform creator research, or with our [YouTube Transcripts Scraper](https://apify.com/thirdwatch/youtube-transcripts-scraper) for video-content NLP analysis. A fourth subtle issue worth flagging is that YouTube's EU consent banner can interrupt scraping for visitors detected as European — the actor handles this by setting an EU-consent-bypass cookie on every request, but if you're proxying through residential IPs in EU regions, expect occasional empty responses where the consent flow took precedence. A fifth pattern: live streams (`isLive: true`) return view counts that update every few seconds, so dedupe on `videoId` rather than `viewCount` for live content tracking, and re-scrape after the stream concludes to capture the final stable view count.

## Related use cases

- [Track YouTube channel growth and views](/blog/track-youtube-channel-growth-and-views)
- [Research YouTube keyword competition](/blog/research-youtube-keyword-competition)
- [Build a YouTube content trend pipeline](/blog/build-youtube-content-trend-pipeline)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Do I need a YouTube Data API key?

No. Thirdwatch's YouTube Scraper accesses publicly visible search and channel pages without login or API keys. This sidesteps the [YouTube Data API](https://developers.google.com/youtube/v3) daily quota (10,000 units/day, with each search costing 100 units = max 100 searches/day) and the manual project-setup overhead. The actor handles arbitrarily-large workloads with pay-per-result pricing instead of unit-cost quotas.

### How much does it cost?

Thirdwatch charges $0.0015 per video on the FREE tier and drops to $0.00085 at GOLD volume. A 50-keyword content-research sweep at 50 videos each costs $3.75 per refresh. Daily cadence on a 50-keyword watchlist costs ~$112/month at FREE pricing — a fraction of YouTube-focused content-research SaaS subscriptions.

### What search modes does the actor support?

Three: `videos` (default — returns individual videos with views, duration, channel), `channels` (returns channel metadata), `playlists` (returns playlist info with video counts). The same actor input handles all three via the `searchType` parameter. Combined with `sort` options (`relevance`, `date`, `viewCount`, `rating`), this covers most content-research workflows.

### Can I scrape a channel's full video list?

Yes. Pass a channel handle (`@freecodecamp`) or `/channel/UC...` URL as a query and the actor returns the channel's video feed. `maxResultsPerQuery` controls depth — set to 200 to capture roughly 10 pages of recent uploads, which covers most 6-12 month upload histories for active channels. For complete archives of high-volume channels, run sequential pulls across multiple sort orders.

### Are YouTube Shorts included?

Yes, with the `isShort` flag set true. YouTube treats Shorts and traditional videos as the same underlying content type but renders them differently in the UI; the actor preserves both formats in the same dataset shape, so a downstream filter on `isShort` cleanly separates them. For Shorts-only or long-form-only workflows, this single field makes filtering trivial.

### Why is viewCount sometimes missing or rounded?

YouTube displays view counts as `1.2M` or `45K` for large-view-count videos; the actor parses these to integers but rounding loses precision (1.2M could be 1.15M-1.24M). For absolute precision on individual videos, fetch the specific video URL via the actor — the detail page shows the exact count. For trend tracking and ranking analysis, the rounded counts are sufficient.

Run the [YouTube Scraper on Apify Store](https://apify.com/thirdwatch/youtube-scraper) — pay-per-video, free to try, no credit card to test.
