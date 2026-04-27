---
title: "Track TikTok Trending Content by Hashtag (2026)"
slug: "track-tiktok-trending-content-by-hashtag"
description: "Detect viral TikTok content at $0.006 per video using Thirdwatch's TikTok Scraper. Hashtag-feed monitoring + views-per-hour velocity + Slack alert recipes."
actor: "tiktok-scraper"
actor_url: "https://apify.com/thirdwatch/tiktok-scraper"
actorTitle: "TikTok Scraper"
category: "social"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-tiktok-profiles-and-videos"
  - "research-tiktok-creator-engagement"
  - "monitor-brand-tiktok-presence"
keywords:
  - "tiktok trending hashtag tracker"
  - "viral tiktok detection"
  - "tiktok hashtag api"
  - "trending content monitor"
faqs:
  - q: "Why hashtag-based trend tracking specifically?"
    a: "Hashtags are the cleanest TikTok-native discovery primitive. Trends concentrate in 5-50 hashtags per niche, which means tracking the right 30-50 hashtags covers most viral activity for your category. The actor's #hashtag query syntax pulls TikTok's recent-content feed for that tag — surfacing fresh viral content typically within 6-12 hours of peak velocity."
  - q: "How do I distinguish viral from steady content?"
    a: "Views-per-hour velocity is the canonical viral signal. Compute (viewCount / age_hours) for videos posted in the last 7 days. Videos at 50,000+ views/hour with 4.0+ engagement-rate-per-thousand-views are in active viral phase. Below 5,000 views/hour is steady-state for hashtag content; above 200,000 views/hour is mega-viral (rare, ~1-2 per major hashtag per week)."
  - q: "How fresh do trend signals need to be?"
    a: "Hourly cadence catches viral content within 1-2 hours of peak velocity onset. For brands trying to catch a wave (jumping on a trend with branded content), 6-hour cadence is too slow — by the time you respond, the trend has decayed. For competitive intelligence (which trends are competitors riding?), daily cadence is sufficient. Each hourly run on 30 hashtags costs roughly $5-$8."
  - q: "Can I detect rising hashtags before they go viral?"
    a: "Yes, indirectly. Track aggregate hashtag-feed activity (sum of views and post-counts per hashtag per hour) over time; hashtags showing 3x-5x post-volume growth within 48 hours often precede viral content emergence by 24-48 hours. The earliest-stage signal is rising posts-per-hour, not rising views — by the time views spike, the trend is already obvious."
  - q: "How does this compare to TikTok's Creative Center?"
    a: "TikTok's Creative Center surfaces officially-tagged trending content but skews toward partnerships and ads. The actor scrapes the public hashtag feed which represents organic creator content, including the trends Creative Center misses. Use both — Creative Center for what TikTok promotes, the actor for what creators actually post in volume."
  - q: "Are deleted or removed videos handled?"
    a: "TikTok occasionally removes videos for policy violations, often during/after viral peaks. The actor returns whatever TikTok shows publicly at scrape time — videos removed between snapshots disappear from subsequent runs. For long-running trend dashboards, this means historical view counts on now-removed videos remain in your snapshot data but no longer match TikTok's current state. Treat snapshot data as a frozen view, not a live source of truth."
---

> Thirdwatch's [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) makes TikTok hashtag-trend tracking a structured workflow at $0.006 per video — hourly snapshot 30+ hashtags relevant to your niche, compute views-per-hour velocity, surface rising content before peak. Built for social-media managers riding viral trends, brand-monitoring teams watching category hashtags, content researchers studying viral mechanics, and creator-strategy analysts informing recommendation models.

## Why track TikTok trending content by hashtag

TikTok trends move fast and concentrated. According to [TikTok's 2024 What's Next trend report](https://www.tiktok.com/whats-next/), the platform's discovery algorithm weights hashtag-tagged content heavily for its For You page distribution — meaning hashtag-feed activity is the leading indicator of which content TikTok will amplify globally. For brands, creators, and analysts, hashtag-feed monitoring catches viral signal before mainstream discovery.

The job-to-be-done is structured. A social-media manager at a CPG brand watches 25 food and lifestyle hashtags hourly to time branded-content responses. A content-research team studies viral mechanics across 50 hashtags to inform their own creation strategy. A creator-economy SaaS surfaces rising hashtag-content for product feature recommendations. A trend-intel function tracks emerging cultural movements per region. All reduce to hashtag list + max results + views-per-hour ranking → structured trend dashboard.

## How does this compare to the alternatives?

Three options for getting TikTok hashtag-trend data into a pipeline:

| Approach | Cost per 1,000 videos × hourly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| TikTok Creative Center | Free | Partial (advertiser-curated) | Hours | Limited research depth |
| Influencer/trend SaaS (Modash, Tagger, Trendpop) | $5K–$50K/year | High | Hours | Vendor lock-in |
| Thirdwatch TikTok Scraper | $6 ($0.006 × 1,000) per run | Production-tested with XHR interception | 5 minutes | Thirdwatch tracks TikTok changes |

Trend SaaS bundles hashtag-trend tracking with creator search and audience demographics. The [TikTok Scraper actor page](/scrapers/tiktok-scraper) gives you the data layer at pay-per-result pricing — most teams build their own dashboards on top for far less than the SaaS cost.

## How to track TikTok trending content in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a hashtag watchlist hourly?

Pass `#hashtag`-prefixed terms with `searchType: "videos"` and a high `maxResultsPerQuery`.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~tiktok-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

HASHTAGS = ["#foodtok", "#cooking", "#recipe", "#easyrecipes",
            "#foodie", "#mealprep", "#healthyrecipes", "#ramadan",
            "#viralrecipe", "#tiktokmademebuyit", "#kitchengadget",
            "#dessert", "#breakfast", "#dinner", "#lunch"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": HASHTAGS, "searchType": "videos",
          "maxResults": 600, "maxResultsPerQuery": 50},
    timeout=900,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d-%H")
pathlib.Path(f"snapshots/tiktok-trends-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} videos across {len(HASHTAGS)} hashtags")
```

15 hashtags × 50 videos = up to 600 records per hourly snapshot, costing $3.60.

### Step 3: How do I rank by views-per-hour velocity?

Compute age in hours from `createdAt`, divide views by age, filter to recent + high-velocity content.

```python
import pandas as pd

df = pd.DataFrame(records)
df["createdAt"] = pd.to_datetime(df.createdAt)
df["age_hours"] = (
    pd.Timestamp.utcnow() - df.createdAt
).dt.total_seconds() / 3600

df["views_per_hour"] = df.viewCount / df.age_hours.clip(lower=0.5)
df["engagement"] = df.likeCount + df.commentCount * 5 + df.shareCount * 10
df["er_per_kv"] = (df.engagement / df.viewCount.clip(lower=1) * 1000)  # engagement per 1K views

trending = df[
    (df.age_hours <= 168)  # last week
    & (df.views_per_hour >= 50000)
    & (df.er_per_kv >= 4.0)
].sort_values("views_per_hour", ascending=False).head(30)

print(trending[["authorUsername", "description", "viewCount",
                "likeCount", "age_hours", "views_per_hour",
                "er_per_kv", "url"]].head(15))
```

A video at 50K+ views/hour with 4.0+ engagement per 1K views is genuinely viral. The two filters together separate viral content from sponsored or bot-inflated content.

### Step 4: How do I forward newly-detected viral content to Slack?

Persist seen video IDs and forward only new viral entries.

```python
import requests as r

snapshot = pathlib.Path("tiktok-viral-seen.json")
seen = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()

new_viral = trending[~trending.id.isin(seen)]
for _, t in new_viral.iterrows():
    r.post(
        "https://hooks.slack.com/services/.../...",
        json={"text": (f":fire: *@{t.authorUsername}* — {int(t.viewCount/1000)}K views in "
                       f"{t.age_hours:.1f}h ({int(t.views_per_hour/1000)}K/hr)\n"
                       f"_{t.description[:200]}_\n{t.url}")},
        timeout=10,
    )

snapshot.write_text(json.dumps(list(seen | set(trending.id))))
print(f"{len(new_viral)} new viral videos forwarded")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at hourly cadence (`0 * * * *`) and the loop runs unattended.

## Sample output

A single trending-video record looks like this. Five rows weigh ~5 KB.

```json
{
  "id": "7345678901234567890",
  "description": "Easy 15-minute pasta recipe #cooking #recipe #foodtok",
  "url": "https://www.tiktok.com/@chefmike/video/7345678901234567890",
  "authorName": "Chef Mike",
  "authorUsername": "chefmike",
  "authorFollowers": 1250000,
  "authorVerified": true,
  "viewCount": 8500000,
  "likeCount": 425000,
  "commentCount": 3200,
  "shareCount": 18000,
  "bookmarkCount": 95000,
  "duration": 47,
  "createdAt": "2026-03-15T14:30:00Z",
  "musicTitle": "original sound",
  "musicAuthor": "Chef Mike",
  "hashtags": ["cooking", "recipe", "foodtok"],
  "isAd": false
}
```

`createdAt` feeds the age-in-hours calculation that's central to velocity ranking. `bookmarkCount` is the underrated quality signal — high bookmark-to-like ratio indicates content viewers want to come back to, which correlates with content that ranks well in TikTok's For You page over time. `isAd: false` filters out branded-content rows when you want pure organic trend signal.

## Common pitfalls

Three things go wrong in production TikTok trend pipelines. **Hashtag composition drift** — a hashtag's video composition changes hourly as new content overtakes old; for trend stability, average velocity over a rolling 6-hour window rather than reading single-snapshot rank. **Bot-inflated views** — some videos receive bot views from view-farming services, which inflates `viewCount` without proportional engagement; the engagement-per-1K-views filter (`er_per_kv >= 4.0`) catches most bot-inflated content cleanly. **Original-sound vs trending-audio attribution** — when a video uses a viral audio track (separate from the video's `musicTitle`), some of the views are driven by audio-page traffic; for accurate creator attribution, dedupe on `id` (TikTok's stable internal video ID) before counting per-creator viral hits.

Thirdwatch's actor uses Camoufox + Playwright with XHR-response interception (TikTok's web search renders client-side). The 4096 MB max memory and 600-second timeout headroom mean even multi-hashtag batch runs complete cleanly. Pair TikTok with our [Instagram Scraper](https://apify.com/thirdwatch/instagram-scraper) and [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) for cross-platform creator-trend research. A fourth subtle issue worth flagging: TikTok's algorithm can feature the same viral video across multiple hashtag feeds simultaneously, which means your raw multi-hashtag pull will return the same `id` from several queries. Always dedupe on `id` before computing per-hashtag metrics, otherwise viral cross-tagged videos inflate the apparent volume of every hashtag they touch. A fifth pattern unique to TikTok-trend tracking: very recent videos (under 30 minutes old) sometimes return zero or very low view counts because TikTok's distribution flywheel hasn't fully fired yet; treat sub-30-minute-old videos as not-yet-classified rather than failed velocity candidates, and rescore them on the next hourly run.

## Related use cases

- [Scrape TikTok profiles and videos](/blog/scrape-tiktok-profiles-and-videos)
- [Research TikTok creator engagement](/blog/research-tiktok-creator-engagement)
- [Monitor brand TikTok presence](/blog/monitor-brand-tiktok-presence)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why hashtag-based trend tracking specifically?

Hashtags are the cleanest TikTok-native discovery primitive. Trends concentrate in 5-50 hashtags per niche, which means tracking the right 30-50 hashtags covers most viral activity for your category. The actor's `#hashtag` query syntax pulls TikTok's recent-content feed for that tag — surfacing fresh viral content typically within 6-12 hours of peak velocity.

### How do I distinguish viral from steady content?

Views-per-hour velocity is the canonical viral signal. Compute `(viewCount / age_hours)` for videos posted in the last 7 days. Videos at 50,000+ views/hour with 4.0+ engagement-rate-per-thousand-views are in active viral phase. Below 5,000 views/hour is steady-state for hashtag content; above 200,000 views/hour is mega-viral (rare, ~1-2 per major hashtag per week).

### How fresh do trend signals need to be?

Hourly cadence catches viral content within 1-2 hours of peak velocity onset. For brands trying to catch a wave (jumping on a trend with branded content), 6-hour cadence is too slow — by the time you respond, the trend has decayed. For competitive intelligence (which trends are competitors riding?), daily cadence is sufficient. Each hourly run on 30 hashtags costs roughly $5-$8.

### Can I detect rising hashtags before they go viral?

Yes, indirectly. Track aggregate hashtag-feed activity (sum of views and post-counts per hashtag per hour) over time; hashtags showing 3x-5x post-volume growth within 48 hours often precede viral content emergence by 24-48 hours. The earliest-stage signal is rising posts-per-hour, not rising views — by the time views spike, the trend is already obvious.

### How does this compare to TikTok's Creative Center?

[TikTok's Creative Center](https://ads.tiktok.com/business/creativecenter/) surfaces officially-tagged trending content but skews toward partnerships and ads. The actor scrapes the public hashtag feed which represents organic creator content, including the trends Creative Center misses. Use both — Creative Center for what TikTok promotes, the actor for what creators actually post in volume.

### Are deleted or removed videos handled?

TikTok occasionally removes videos for policy violations, often during/after viral peaks. The actor returns whatever TikTok shows publicly at scrape time — videos removed between snapshots disappear from subsequent runs. For long-running trend dashboards, this means historical view counts on now-removed videos remain in your snapshot data but no longer match TikTok's current state. Treat snapshot data as a frozen view, not a live source of truth.

Run the [TikTok Scraper on Apify Store](https://apify.com/thirdwatch/tiktok-scraper) — pay-per-record, free to try, no credit card to test.
