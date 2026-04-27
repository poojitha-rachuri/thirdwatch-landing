---
title: "Scrape TikTok Profiles and Videos at Scale (2026)"
slug: "scrape-tiktok-profiles-and-videos"
description: "Pull TikTok videos + creator profiles at $0.006 per record using Thirdwatch — no login. Views, likes, hashtags, music, follower counts. Python recipes inside."
actor: "tiktok-scraper"
actor_url: "https://apify.com/thirdwatch/tiktok-scraper"
actorTitle: "TikTok Scraper"
category: "social"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-tiktok-trending-content-by-hashtag"
  - "research-tiktok-creator-engagement"
  - "monitor-brand-tiktok-presence"
keywords:
  - "tiktok scraper no login"
  - "scrape tiktok videos"
  - "tiktok api alternative"
  - "extract tiktok engagement"
faqs:
  - q: "Do I need a TikTok account or API access?"
    a: "No. Thirdwatch's TikTok Scraper accesses publicly visible video and profile pages without login, cookies, or API credentials. This sidesteps TikTok's Research API (gated behind academic-affiliate approval) and the Marketing API (restricted to advertisers), both of which require multi-week onboarding for what is effectively public information."
  - q: "How much does it cost?"
    a: "Thirdwatch charges $0.006 per record on the FREE tier and drops to $0.003 at GOLD volume. A 50-creator daily monitoring batch at 25 videos each costs roughly $7-$8 per refresh. Daily cadence over 50 creators costs ~$220/month — meaningfully below TikTok-focused influencer SaaS subscriptions."
  - q: "What's the difference between videos and users search types?"
    a: "searchType=videos returns individual video records with full engagement metrics (views, likes, comments, shares, bookmarks, duration). searchType=users returns profile-level metadata (followers, total likes, video count, bio). For trend research and viral-content discovery use videos; for creator shortlist building and follower-growth tracking use users."
  - q: "Can I scrape hashtag and keyword search?"
    a: "Yes. Pass #hashtag-prefixed terms or plain keywords in queries. The actor uses TikTok's web search response and intercepts the XHR endpoints that power TikTok's For You page client-side rendering. Hashtag results work reliably; keyword results depend on TikTok surfacing them in the public web search (some niche keywords return sparse results)."
  - q: "What metadata is returned per video?"
    a: "20 fields per video: id, description, url, authorName, authorUsername, authorUrl, authorFollowers, authorVerified, viewCount, likeCount, commentCount, shareCount, bookmarkCount, duration (seconds), createdAt (ISO 8601), musicTitle, musicAuthor, thumbnailUrl, hashtags array, isAd flag. The author-level fields (authorFollowers, authorVerified) avoid a separate user-profile fetch when you also want creator context per video."
  - q: "How does this compare to clockworks/tiktok-scraper?"
    a: "clockworks/tiktok-scraper (156K users) is cheaper per result ($0.0037) and covers a broader surface area including challenges and trends. Thirdwatch's actor is priced higher but ships a single tighter schema across video and user search modes, making it simpler to integrate into mixed-use pipelines. For pure cost at large scale, clockworks wins; for schema simplicity, this one wins."
---

> Thirdwatch's [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) returns TikTok videos and user profiles by keyword, hashtag, or handle at $0.006 per record — full engagement metrics, music attribution, hashtags, creator follower counts — without requiring a login or API access. Built for influencer researchers, brand-monitoring teams, trend analysts, and creator-economy analytics workflows.

## Why scrape TikTok without API

TikTok is the fastest-growing social platform globally. According to [Sensor Tower's 2024 mobile-app report](https://sensortower.com/), TikTok exceeded 2 billion monthly active users with the highest engagement-per-user across major platforms. For brand monitoring, influencer research, and trend discovery, TikTok is non-negotiable. The blocker for systematic access: TikTok's Research API gates behind academic-institution approval, and the Marketing API is restricted to active advertisers. Both take weeks of onboarding to access basic public-content data.

The job-to-be-done is structured. An influencer-research team builds a creator shortlist of 200 accounts in a niche (cooking, beauty, fitness) with engagement metrics. A brand-monitoring team watches 30 brand-related hashtags daily for mention surfaces. A trend analyst tracks viral content across hashtags hourly to surface early breakouts. A creator-economy analyst compares engagement rates across creator tiers to inform pricing models. All reduce to query + searchType + max results returning structured rows.

## How does this compare to the alternatives?

Three options for getting TikTok data into a pipeline:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| TikTok Research API | Free with quotas | Official | Weeks (academic affiliation required) | Strict access criteria |
| TikTok-specific influencer SaaS | $5K–$50K/year | High, includes audience demographics | Hours | Vendor lock-in |
| Thirdwatch TikTok Scraper | $6 ($0.006 × 1,000) | Production-tested with XHR interception | 5 minutes | Thirdwatch tracks TikTok changes |

TikTok's Research API is the official path but the academic-institution gate excludes most commercial use cases. The [TikTok Scraper actor page](/scrapers/tiktok-scraper) gives you the public-data layer at pay-per-result pricing without the gate.

## How to scrape TikTok in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull videos from a creator watchlist?

Pass `@username`-prefixed handles, set `searchType: "videos"`, and choose your per-creator depth.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~tiktok-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CREATORS = ["@chefmike", "@khaby.lame", "@charlidamelio",
            "@bellapoarch", "@willsmith"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": CREATORS,
        "searchType": "videos",
        "maxResults": 200,
        "maxResultsPerQuery": 40,
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} videos across {df.authorUsername.nunique()} creators")
```

5 creators × 40 videos each = 200 records, costing $1.20.

### Step 3: How do I rank creators by engagement rate?

Engagement rate (interactions per follower per video) is the canonical creator-quality metric. TikTok engagement rates run materially higher than Instagram (5-15% vs 1-3%) due to the algorithm's wider distribution.

```python
df["engagement"] = df.likeCount + df.commentCount * 5 + df.shareCount * 10
df["engagement_rate"] = df.engagement / df.authorFollowers.replace(0, 1)

ranked = (
    df[df.authorFollowers >= 100000]
    .groupby("authorUsername")
    .agg(median_engagement_rate=("engagement_rate", "median"),
         median_views=("viewCount", "median"),
         followers=("authorFollowers", "first"),
         video_count=("id", "count"))
    .sort_values("median_engagement_rate", ascending=False)
)
print(ranked.head(15))
```

Weighting comments 5x and shares 10x reflects their relative effort cost — a share is high-intent virality, a like is low-effort. Median engagement rate filters out one-off viral videos that distort the average.

### Step 4: How do I track trending content by hashtag?

Switch to hashtag queries with `searchType: "videos"`, sort by view velocity (views per hour since posting).

```python
HASHTAGS = ["#foodtok", "#cooking", "#recipe", "#easyrecipes"]

resp2 = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": HASHTAGS, "searchType": "videos",
          "maxResults": 400, "maxResultsPerQuery": 100},
    timeout=900,
)
hash_df = pd.DataFrame(resp2.json())
hash_df["createdAt"] = pd.to_datetime(hash_df.createdAt)
hash_df["age_hours"] = (pd.Timestamp.utcnow() - hash_df.createdAt).dt.total_seconds() / 3600
hash_df["views_per_hour"] = hash_df.viewCount / hash_df.age_hours.clip(lower=1)

trending = hash_df[
    hash_df.age_hours <= 48
].sort_values("views_per_hour", ascending=False).head(20)
print(trending[["authorUsername", "description", "viewCount",
                "age_hours", "views_per_hour", "url"]])
```

Views-per-hour is a much better trending signal than absolute view count — it surfaces fresh viral content before it peaks rather than after.

## Sample output

A single video record looks like this. Five rows of this shape weigh ~5 KB.

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

`id` is TikTok's globally unique video identifier — the canonical key for cross-snapshot dedup. `viewCount`, `likeCount`, `shareCount`, and `bookmarkCount` are the core engagement signals; `bookmarkCount` (saves) is underrated as a quality signal — high bookmarks relative to likes indicates content viewers want to come back to. `isAd: true` distinguishes paid-promotion videos from organic content, useful for filtering branded-content noise out of organic-trend analysis.

## Common pitfalls

Three things go wrong in production TikTok pipelines. **Counter rounding** — TikTok displays counts as `8.5M` for large numbers; the actor parses to integers, but rounding loses precision (8.5M could be anywhere from 8.45M to 8.55M). For viral-content velocity tracking, this is fine; for absolute precision on smaller-scale measurements, expect ±0.5% rounding error. **Trending hashtag drift** — a hashtag's video composition changes hourly as new content overtakes old; for trend tracking, snapshot frequently rather than relying on one large pull. **Music attribution** — `musicTitle: "original sound"` means the creator used their own audio (no attribution to a separate music track); when tracking music-driven trends, filter out original-sound rows to focus on viral audio adoption.

Thirdwatch's actor uses Camoufox + Playwright with XHR-response interception (TikTok's web search renders client-side, so attaching a response listener BEFORE navigation is required to capture the data). The 4096 MB max memory and 600-second timeout headroom mean even multi-hashtag batch runs complete cleanly. Pair TikTok with our [Instagram Scraper](https://apify.com/thirdwatch/instagram-scraper) and [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) for full cross-platform creator research. A fourth subtle issue worth flagging is that TikTok's `viewCount` includes auto-play views from For You page scrolls (typically ~1 second of playback), which inflates absolute view counts vs. genuine watch time; for engagement-quality analysis weight likes and shares more heavily than raw views. A fifth pattern: TikTok's algorithm sometimes resurfaces older videos when a creator goes viral, so a video with a 2-month-old `createdAt` but rapidly-growing `viewCount` is a legitimate signal of late-stage virality, not a data error. A sixth note for brand teams: `isAd: true` only flags videos where the creator used TikTok's official Branded Content disclosure — many sponsored posts skip the disclosure label, so isAd is a high-precision but low-recall signal. A seventh and final pattern: TikTok video URLs occasionally redirect across CDN regions, which means the same video can return slightly different `url` strings on consecutive scrapes; always dedupe on `id` (TikTok's stable internal video ID) rather than `url`.

## Related use cases

- [Track TikTok trending content by hashtag](/blog/track-tiktok-trending-content-by-hashtag)
- [Research TikTok creator engagement](/blog/research-tiktok-creator-engagement)
- [Monitor brand TikTok presence](/blog/monitor-brand-tiktok-presence)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Do I need a TikTok account or API access?

No. Thirdwatch's TikTok Scraper accesses publicly visible video and profile pages without login, cookies, or API credentials. This sidesteps TikTok's [Research API](https://developers.tiktok.com/products/research-api) (gated behind academic-affiliate approval) and the Marketing API (restricted to advertisers), both of which require multi-week onboarding for what is effectively public information.

### How much does it cost?

Thirdwatch charges $0.006 per record on the FREE tier and drops to $0.003 at GOLD volume. A 50-creator daily monitoring batch at 25 videos each costs roughly $7-$8 per refresh. Daily cadence over 50 creators costs ~$220/month — meaningfully below TikTok-focused influencer SaaS subscriptions.

### What's the difference between videos and users search types?

`searchType: "videos"` returns individual video records with full engagement metrics (views, likes, comments, shares, bookmarks, duration). `searchType: "users"` returns profile-level metadata (followers, total likes, video count, bio). For trend research and viral-content discovery use `videos`; for creator shortlist building and follower-growth tracking use `users`.

### Can I scrape hashtag and keyword search?

Yes. Pass `#hashtag`-prefixed terms or plain keywords in `queries`. The actor uses TikTok's web search response and intercepts the XHR endpoints that power TikTok's For You page client-side rendering. Hashtag results work reliably; keyword results depend on TikTok surfacing them in the public web search (some niche keywords return sparse results).

### What metadata is returned per video?

20 fields per video: `id`, `description`, `url`, `authorName`, `authorUsername`, `authorUrl`, `authorFollowers`, `authorVerified`, `viewCount`, `likeCount`, `commentCount`, `shareCount`, `bookmarkCount`, `duration` (seconds), `createdAt` (ISO 8601), `musicTitle`, `musicAuthor`, `thumbnailUrl`, `hashtags` array, `isAd` flag. The author-level fields (`authorFollowers`, `authorVerified`) avoid a separate user-profile fetch when you also want creator context per video.

### How does this compare to clockworks/tiktok-scraper?

[clockworks/tiktok-scraper](https://apify.com/clockworks/tiktok-scraper) (156K users) is cheaper per result ($0.0037) and covers a broader surface area including challenges and trends. Thirdwatch's actor is priced higher but ships a single tighter schema across video and user search modes, making it simpler to integrate into mixed-use pipelines. For pure cost at large scale, clockworks wins; for schema simplicity, this one wins.

Run the [TikTok Scraper on Apify Store](https://apify.com/thirdwatch/tiktok-scraper) — pay-per-record, free to try, no credit card to test.
