---
title: "Scrape Instagram Profiles and Posts at Scale (2026)"
slug: "scrape-instagram-profiles-and-posts"
description: "Pull Instagram public posts, profiles, follower counts at $0.006 per record using Thirdwatch — no login. Likes, comments, hashtags, video URLs. Python recipes inside."
actor: "instagram-scraper"
actor_url: "https://apify.com/thirdwatch/instagram-scraper"
actorTitle: "Instagram Scraper"
category: "social"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-influencer-follower-growth-on-instagram"
  - "research-instagram-hashtag-performance"
  - "monitor-brand-instagram-engagement"
keywords:
  - "instagram scraper no login"
  - "scrape instagram profiles"
  - "instagram api alternative"
  - "extract instagram posts"
faqs:
  - q: "Do I need an Instagram account or API access?"
    a: "No. Thirdwatch's Instagram Scraper accesses publicly visible profile and post pages without login — the same URLs anyone can view as a guest. This sidesteps Meta's Graph API, which gates most public-data access behind app-review requirements and Business-tier credentials that take weeks to onboard."
  - q: "How much does it cost?"
    a: "Thirdwatch charges $0.006 per record on the FREE tier and drops to $0.003 at GOLD volume. A 100-account influencer-monitoring batch with 12 recent posts each costs roughly $7-$8 per refresh. Daily cadence on a 100-account watchlist costs ~$220/month — meaningfully below influencer-marketing SaaS subscriptions like Modash or HypeAuditor."
  - q: "What's the difference between posts and profiles search types?"
    a: "searchType='posts' returns individual posts/media — one row per post with full engagement metrics. searchType='profiles' returns profile-level info (follower count, bio, post count) plus an array of recent posts (controlled by maxPostsPerProfile, default 12). For follower-growth tracking choose profiles; for hashtag content research or single-post analysis choose posts."
  - q: "Can I scrape hashtag feeds?"
    a: "Yes, with limitations. Pass #hashtag-prefixed queries and Instagram returns recent posts under that hashtag. Instagram has rate-limited hashtag search heavily in 2026 — expect partial results on broad/popular hashtags and sparse results on smaller ones. For systematic hashtag tracking, run small batches frequently rather than one large batch at a time."
  - q: "What does the actor NOT return?"
    a: "Three things: Stories (require login and expire after 24 hours), the Reels For You feed (algorithmically personalised, requires login), and private accounts (the 🔒 padlock means even logged-in scrapers without an active follow can't access). The actor returns whatever Instagram shows publicly; for any of the above, alternative approaches require Meta's Graph API with Business credentials."
  - q: "How does this compare to apify/instagram-scraper?"
    a: "The apify/instagram-scraper actor (224K users) is cheaper per result ($0.0027) and battle-tested at scale. Thirdwatch's actor is priced higher but ships a single consolidated schema across posts and profiles, includes maxPostsPerProfile for recent-post enrichment, and is maintained on a predictable release cadence. For pure cost, apify's wins; for schema simplicity in mixed posts/profiles workflows, this one wins."
---

> Thirdwatch's [Instagram Scraper](https://apify.com/thirdwatch/instagram-scraper) returns Instagram public posts and profiles at $0.006 per record — captions, like and comment counts, media URLs, hashtags, follower counts, and recent-post arrays — without requiring a login or Graph API access. Built for social-media marketers, influencer analysts, brand-monitoring teams, and trend researchers who need machine-readable Instagram data programmatically.

## Why scrape Instagram without API

Instagram is the second-largest social platform globally. According to [Meta's 2024 user disclosures](https://about.meta.com/), Instagram crossed 2 billion monthly active users with creator engagement growing faster than any other Meta property. For brand and creator monitoring, the platform is non-negotiable. The blocker for systematic access: Meta's Instagram Graph API gates most public-data endpoints behind app review, Business credentials, and creator-account permissions — a multi-week onboarding for what is effectively public information.

The job-to-be-done is structured. A social-media marketing team monitors 50 competitor profiles weekly for engagement benchmarks. An influencer-research team builds a creator shortlist of 200 accounts with follower counts and recent-post engagement. A brand-monitoring team watches hashtags and tagged-account feeds for mentions. A trend researcher collects caption corpora for NLP analysis. All reduce to handle/hashtag list + searchType + max results returning structured rows. The actor is the data layer.

## How does this compare to the alternatives?

Three options for getting Instagram data into a pipeline:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Meta Instagram Graph API | Free with quotas | Official | Weeks (app review + Business creds) | Strict rate limits |
| Influencer SaaS (Modash, HypeAuditor, CreatorIQ) | $5K–$50K/year | High, includes audience demographics | Hours | Vendor lock-in |
| Thirdwatch Instagram Scraper | $6 ($0.006 × 1,000) | Production-tested, no login | 5 minutes | Thirdwatch tracks Instagram changes |

Influencer SaaS bundles Instagram with audience demographics (age/gender/geo splits) the public profile pages don't expose. The [Instagram Scraper actor page](/scrapers/instagram-scraper) gives you the public data layer at pay-per-result pricing — most teams build their own monitoring on top for far less than the SaaS cost.

## How to scrape Instagram in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull profile data with recent posts?

Pass `@username`-prefixed handles, set `searchType: "profiles"`, and choose how many recent posts to enrich.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~instagram-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CREATORS = ["@natgeo", "@nasa", "@nike",
            "@apple", "@vogue", "@gucci"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": CREATORS,
        "searchType": "profiles",
        "maxResults": 50,
        "maxPostsPerProfile": 12,
    },
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} profiles, total recent posts: "
      f"{sum(len(p) for p in df.recentPosts)}")
```

6 profiles × 12 recent posts each ≈ 78 records (6 profile rows + 72 nested posts), costing $0.50.

### Step 3: How do I rank profiles by engagement rate?

Engagement rate (interactions per follower) is the canonical creator-quality metric. Compute it from the recent-posts array.

```python
def engagement_rate(row):
    posts = row.get("recentPosts") or []
    if not posts or not row.get("followerCount"):
        return None
    avg_engagement = sum(
        (p.get("likeCount") or 0) + (p.get("commentCount") or 0)
        for p in posts
    ) / len(posts)
    return avg_engagement / row["followerCount"]

df["engagement_rate"] = df.apply(engagement_rate, axis=1)
ranked = df.sort_values("engagement_rate", ascending=False)
print(ranked[["username", "followerCount", "postCount",
              "engagement_rate", "isVerified"]].head(15))
```

Engagement rate of 1-3% is typical for mega-creators (10M+ followers); 3-6% for mid-tier (100K-1M); 6%+ for niche micro-creators. A high follower count combined with low engagement rate often signals follower fraud — a useful filter for genuine influencer shortlists.

### Step 4: How do I track follower growth over time?

Persist daily snapshots of follower counts and diff across days.

```python
import datetime, json, pathlib, glob

today = datetime.date.today().isoformat()
profiles = df[["username", "followerCount", "postCount"]].copy()
profiles["date"] = today
profiles.to_json(f"snapshots/ig-followers-{today}.json", orient="records")

frames = []
for f in sorted(glob.glob("snapshots/ig-followers-*.json")):
    frames.append(pd.read_json(f))
history = pd.concat(frames, ignore_index=True)
history["date"] = pd.to_datetime(history["date"])

pivot = history.pivot(index="username", columns="date", values="followerCount")
dates = sorted(pivot.columns)
if len(dates) >= 30:
    pivot["growth_30d"] = pivot[dates[-1]] - pivot[dates[-30]]
    pivot["growth_30d_pct"] = (pivot[dates[-1]] / pivot[dates[-30]]) - 1
    print(pivot.sort_values("growth_30d", ascending=False).head(15))
```

A 5%+ 30-day follower growth rate is meaningful — most established accounts grow at 1-2% per month. Spikes above 10% usually indicate viral content or bot-driven inflation; cross-check with engagement rate before acting on the signal.

## Sample output

A single post record looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "shortcode": "C7xYz12ABcd",
  "url": "https://www.instagram.com/p/C7xYz12ABcd/",
  "type": "image",
  "caption": "Sunrise at the South Rim. #nature #photography",
  "likeCount": 245000,
  "commentCount": 1200,
  "authorUsername": "natgeo",
  "timestamp": "2026-04-08T18:30:00+00:00",
  "location": "Grand Canyon National Park",
  "imageUrl": "https://scontent.cdninstagram.com/...",
  "hashtags": ["nature", "photography"]
}
```

A profile record (with `searchType: "profiles"`) includes profile-level fields plus a `recentPosts` array:

```json
{
  "username": "natgeo",
  "fullName": "National Geographic",
  "biography": "Experience the world through the eyes of National Geographic...",
  "followerCount": 281500000,
  "followingCount": 134,
  "postCount": 30200,
  "isVerified": true,
  "isPrivate": false,
  "profilePicUrl": "https://scontent.cdninstagram.com/...",
  "externalUrl": "https://www.nationalgeographic.com/",
  "recentPosts": [/* 12 post objects */]
}
```

`shortcode` is Instagram's globally unique post identifier — the canonical key for cross-snapshot dedup. `type` distinguishes image, video, carousel, and reel content, useful for content-mix analysis. `hashtags` is parsed from the caption automatically — much cleaner than regex-extracting them downstream.

## Common pitfalls

Three things go wrong in production Instagram pipelines. **Hashtag rate limiting** — Instagram rate-limits hashtag-feed access heavily in 2026; expect partial results on popular hashtags and run smaller batches frequently rather than one large batch. **viewCount nullness** — `viewCount` only populates for video and reel posts; image posts return `null`. For engagement calculations, treat null `viewCount` as zero (or skip viewCount entirely on image-heavy accounts). **Follower-count rounding** — Instagram displays follower counts as `2.8M` for large accounts; the actor parses these to integers but loses precision. For absolute-precision follower tracking on mega-creators, expect ±0.5% rounding error.

Thirdwatch's actor returns `shortcode`, `url`, and `timestamp` on every post record so cross-snapshot dedup and time-series analysis are clean. The pure-HTTP architecture means a 50-account profile-mode pull with 12 posts each completes in 8-15 minutes wall-clock and costs roughly $4. Pair Instagram with our [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) and [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) for cross-platform creator research. A fourth subtle issue worth flagging: Instagram's grid sometimes shows pinned posts at the top regardless of recency, which can skew "recent posts" analysis if the pinned post is months old. Cross-check the `timestamp` on each `recentPosts` entry rather than trusting their order. A fifth pattern unique to creator analytics: a profile with 5M followers but only 50K likes per post on average has a ~1% engagement rate, which is in the normal mega-creator band; expecting 5M-follower accounts to consistently hit 100K+ likes is a common analyst mistake when the comparison cohort is mid-tier creators.

## Related use cases

- [Track influencer follower growth on Instagram](/blog/track-influencer-follower-growth-on-instagram)
- [Research Instagram hashtag performance](/blog/research-instagram-hashtag-performance)
- [Monitor brand Instagram engagement](/blog/monitor-brand-instagram-engagement)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Do I need an Instagram account or API access?

No. Thirdwatch's Instagram Scraper accesses publicly visible profile and post pages without login — the same URLs anyone can view as a guest. This sidesteps Meta's Graph API, which gates most public-data access behind app-review requirements and Business-tier credentials that take weeks to onboard.

### How much does it cost?

Thirdwatch charges $0.006 per record on the FREE tier and drops to $0.003 at GOLD volume. A 100-account influencer-monitoring batch with 12 recent posts each costs roughly $7-$8 per refresh. Daily cadence on a 100-account watchlist costs ~$220/month — meaningfully below influencer-marketing SaaS subscriptions like [Modash](https://www.modash.io/) or HypeAuditor.

### What's the difference between posts and profiles search types?

`searchType: "posts"` returns individual posts/media — one row per post with full engagement metrics. `searchType: "profiles"` returns profile-level info (follower count, bio, post count) plus an array of recent posts (controlled by `maxPostsPerProfile`, default 12). For follower-growth tracking choose `profiles`; for hashtag content research or single-post analysis choose `posts`.

### Can I scrape hashtag feeds?

Yes, with limitations. Pass `#hashtag`-prefixed queries and Instagram returns recent posts under that hashtag. Instagram has rate-limited hashtag search heavily in 2026 — expect partial results on broad/popular hashtags and sparse results on smaller ones. For systematic hashtag tracking, run small batches frequently rather than one large batch at a time.

### What does the actor NOT return?

Three things: Stories (require login and expire after 24 hours), the Reels For You feed (algorithmically personalised, requires login), and private accounts (the 🔒 padlock means even logged-in scrapers without an active follow can't access). The actor returns whatever Instagram shows publicly; for any of the above, alternative approaches require Meta's Graph API with Business credentials.

### How does this compare to apify/instagram-scraper?

The [apify/instagram-scraper](https://apify.com/apify/instagram-scraper) actor (224K users) is cheaper per result ($0.0027) and battle-tested at scale. Thirdwatch's actor is priced higher but ships a single consolidated schema across posts and profiles, includes `maxPostsPerProfile` for recent-post enrichment, and is maintained on a predictable release cadence. For pure cost, apify's wins; for schema simplicity in mixed posts/profiles workflows, this one wins.

Run the [Instagram Scraper on Apify Store](https://apify.com/thirdwatch/instagram-scraper) — pay-per-record, free to try, no credit card to test.
