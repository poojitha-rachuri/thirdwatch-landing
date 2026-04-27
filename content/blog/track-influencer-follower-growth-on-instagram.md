---
title: "Track Influencer Follower Growth on Instagram (2026)"
slug: "track-influencer-follower-growth-on-instagram"
description: "Build a daily Instagram influencer growth tracker at $0.006 per profile using Thirdwatch's Instagram Scraper. Follower-velocity ranking + audience-fraud detection."
actor: "instagram-scraper"
actor_url: "https://apify.com/thirdwatch/instagram-scraper"
actorTitle: "Instagram Scraper"
category: "social"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-instagram-profiles-and-posts"
  - "research-instagram-hashtag-performance"
  - "monitor-brand-instagram-engagement"
keywords:
  - "instagram follower growth tracker"
  - "influencer follower velocity"
  - "instagram audit no api"
  - "creator growth instagram"
faqs:
  - q: "Why track influencer follower growth specifically?"
    a: "Follower count is the most-watched single metric in influencer marketing — it determines pricing for sponsored content. According to Influencer Marketing Hub's 2024 benchmark, a creator with 100K-500K followers (the mid-tier band most brand budgets target) earns $500-$5,000 per sponsored post. Tracking growth over time validates whether a creator is genuinely scaling (good for partnerships) or stagnating (lower negotiating leverage)."
  - q: "What growth rate is normal for Instagram creators?"
    a: "Established creators typically grow 1-2% monthly. Rising-star creators in active growth phase hit 5-10% monthly. Sustained growth above 15% monthly is rare and usually indicates either viral content (good signal) or follower-fraud purchases (bad signal — flag for audit). Decline of more than 1% monthly across 3 consecutive months indicates account stagnation or post-controversy decay."
  - q: "How do I detect fake or purchased follower growth?"
    a: "Three heuristics: (1) follower spikes without engagement-rate growth — genuine virality lifts both. (2) sub-1% engagement rate combined with 5%+ monthly growth — bots inflate followers but don't engage. (3) sudden 10K+ follower jumps within 24 hours not tied to any viral content — purchases happen in batches. The actor's recentPosts array lets you compute engagement velocity to cross-check against follower velocity."
  - q: "How fresh do follower counts need to be?"
    a: "Daily cadence is the standard for active monitoring. Instagram updates follower counts within minutes of changes, so daily snapshots are accurate enough for trend tracking. For high-stakes campaigns (partnership negotiations, contract renewals), pair daily snapshots with weekly engagement-rate audits — the combined signal is much more reliable than either alone."
  - q: "Can I detect newly-rising creators before they peak?"
    a: "Yes. Track aggregate follower growth across a curated watchlist of 200+ niche creators; the top 5-10% by 30-day growth rate are typically your rising-star cohort. Combined with engagement-rate filtering (above niche median), this surfaces genuinely-growing creators 2-4 months before they hit mainstream-influencer pricing tiers — useful for early partnership outreach at lower rates."
  - q: "How does this compare to Modash or HypeAuditor?"
    a: "Modash and HypeAuditor (and similar SaaS like CreatorIQ, Tagger, Aspire) bundle influencer-growth tracking with audience-demographics analysis and partnership-management workflows. Thirdwatch's actor is the data layer only — public follower counts and recent-posts engagement, no audience demographics. Build your own tracker on top for 1-2% of the SaaS cost; if you need audience demographics (gender splits, age bands, geo), pair with the SaaS or run separate audience-research surveys."
---

> Thirdwatch's [Instagram Scraper](https://apify.com/thirdwatch/instagram-scraper) feeds a programmatic Instagram influencer-growth tracker at $0.006 per profile — daily snapshot a creator watchlist, compute follower-growth velocity, surface genuine vs fraud-inflated growth via engagement cross-validation. Built for influencer-marketing teams sourcing creators for partnerships, agency talent scouts maintaining creator rosters, and brand teams auditing creator partnerships before signing contracts.

## Why track Instagram follower growth

Influencer-marketing pricing is follower-driven. According to [Influencer Marketing Hub's 2024 benchmark](https://influencermarketinghub.com/influencer-marketing-benchmark-report/), creator pricing for sponsored content tracks closely with follower count tier: nano (<10K) at $50-$200/post, micro (10K-100K) at $200-$1,500, mid-tier (100K-500K) at $500-$5,000, macro (500K-1M) at $5,000-$25,000, and mega (1M+) at $25,000+. Knowing whether a creator is rising into a higher tier (worth locking in at current rates) vs stagnating (lower negotiation leverage) is operationally critical for partnership decisions.

The job-to-be-done is structured. An influencer-marketing team monitors 500 creators in their niche daily for partnership shortlist updates. An agency talent scout watches 200 emerging creators weekly to identify rising stars before they peak. A brand audit team validates 30 active partnerships monthly to ensure paid creators are genuinely growing. A creator-economy researcher studies growth-rate distributions across niches. All reduce to handle list × daily snapshot × follower velocity → ranked output.

## How does this compare to the alternatives?

Three options for tracking Instagram influencer growth:

| Approach | Cost per 1,000 profiles × daily | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Instagram browsing + spreadsheets | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Influencer SaaS (Modash, HypeAuditor, CreatorIQ) | $5K–$50K/year per seat | High, includes audience demographics | Hours | Vendor lock-in |
| Thirdwatch Instagram Scraper | $6 ($0.006 × 1,000) per snapshot | Production-tested, no login | 5 minutes | Thirdwatch tracks Instagram changes |

Influencer SaaS bundles follower tracking with audience-demographics analysis (age/gender/geo splits). The [Instagram Scraper actor page](/scrapers/instagram-scraper) gives you the public-data layer at pay-per-result pricing — most agencies build their own tracker for 1-2% of the SaaS cost.

## How to track influencer follower growth in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a daily snapshot of a creator watchlist?

Pass `@username`-prefixed handles, set `searchType: "profiles"`, and capture follower counts plus recent posts.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~instagram-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

# Curated watchlist — adjust to your niche
CREATORS = [
    "@natgeo", "@nasa", "@nike", "@apple", "@vogue",
    "@gucci", "@chanelofficial", "@dior", "@versace",
    "@adidas",
    # ... extend to 200-500 niche-specific creators
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": CREATORS, "searchType": "profiles",
          "maxResults": 100, "maxPostsPerProfile": 12},
    timeout=900,
)
records = resp.json()
today = datetime.date.today().isoformat()
pathlib.Path(f"snapshots/ig-creators-{today}.json").write_text(json.dumps(records))
print(f"{today}: {len(records)} creators snapshotted")
```

10 creators × ~80 records (1 profile + 12 posts each) ≈ 130 records, costing $0.78.

### Step 3: How do I compute follower-growth velocity?

Aggregate snapshots, key on `username`, compute 30-day growth rate.

```python
import pandas as pd, glob

frames = []
for f in sorted(glob.glob("snapshots/ig-creators-*.json")):
    date = pathlib.Path(f).stem.replace("ig-creators-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        if j.get("username") and j.get("followerCount") is not None:
            frames.append({
                "date": date, "username": j["username"],
                "followers": j["followerCount"],
                "posts": j.get("postCount"),
                "verified": j.get("isVerified"),
                "recent_posts": j.get("recentPosts") or [],
            })

df = pd.DataFrame(frames)
df["date"] = pd.to_datetime(df["date"])

pivot = df.pivot_table(index="username", columns="date",
                        values="followers", aggfunc="first").ffill(axis=1)
dates = sorted(pivot.columns)
if len(dates) >= 30:
    pivot["growth_30d"] = pivot[dates[-1]] - pivot[dates[-30]]
    pivot["growth_30d_pct"] = (pivot[dates[-1]] / pivot[dates[-30]]) - 1
    print("--- Top 30-day follower growth ---")
    print(pivot.sort_values("growth_30d_pct", ascending=False)
            [[dates[-30], dates[-1], "growth_30d", "growth_30d_pct"]].head(15))
```

5%+ 30-day growth is meaningful (above typical 1-2% baseline); 15%+ requires audit (likely viral content or follower fraud).

### Step 4: How do I cross-validate growth against engagement quality?

Compute engagement rate per creator from `recent_posts`; flag high-growth + low-engagement combos as fraud candidates.

```python
def engagement_rate(row):
    posts = row.recent_posts
    if not posts or row.followers == 0:
        return None
    avg_eng = sum(
        (p.get("likeCount") or 0) + (p.get("commentCount") or 0)
        for p in posts
    ) / len(posts)
    return avg_eng / row.followers

latest = df[df.date == dates[-1]].copy()
latest["engagement_rate"] = latest.apply(engagement_rate, axis=1)
latest["growth_30d_pct"] = latest.username.map(pivot["growth_30d_pct"])

fraud_candidates = latest[
    (latest.growth_30d_pct >= 0.10)  # 10%+ growth
    & (latest.engagement_rate < 0.005)  # less than 0.5% engagement
].sort_values("growth_30d_pct", ascending=False)
print("--- Suspected follower fraud ---")
print(fraud_candidates[["username", "followers", "growth_30d_pct",
                          "engagement_rate"]])

genuine_risers = latest[
    (latest.growth_30d_pct >= 0.05)
    & (latest.engagement_rate >= 0.02)
].sort_values("growth_30d_pct", ascending=False)
print("--- Genuine rising creators ---")
print(genuine_risers[["username", "followers", "growth_30d_pct",
                        "engagement_rate"]].head(15))
```

Genuine rising creators are the partnership-outreach shortlist; fraud candidates are the ones to drop from existing rosters before contract renewals.

## Sample output

A single profile record (with `searchType: "profiles"`) looks like this. Five rows of this shape weigh ~10 KB.

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

`username` is the canonical natural key for cross-snapshot dedup. `followerCount` feeds the growth-velocity calculation. `recentPosts` array (with `likeCount` and `commentCount` per post) feeds the engagement-rate cross-validation. `isVerified: true` is a soft trust signal — verified creators rarely engage in follower fraud, though it doesn't rule it out entirely.

## Common pitfalls

Three things go wrong in production growth-tracking pipelines. **Follower-count rounding** — Instagram displays `2.8M` for large accounts; the actor parses to integers but loses precision (±0.5%). For absolute precision on mega-creators, capture daily snapshots and use the daily delta rather than month-over-month diff (rounding cancels out within consistent display thresholds). **Pinned-post recentPosts skew** — pinned posts at the top of grids can be months old; for engagement-rate calculations, sort `recentPosts` by `timestamp` and use the most recent N rather than trusting array order. **Account-rebrand follower-count resets** — when a creator rebrands or merges accounts, follower count can shift dramatically; cross-check with a manual review for any account showing 30%+ change in 24 hours rather than 30 days.

Thirdwatch's actor returns 11 fields per profile + an array of recent posts. The pure-HTTP architecture means a 100-profile daily snapshot completes in 8-15 minutes wall-clock and costs roughly $1.50. Pair Instagram with our [TikTok Scraper](https://apify.com/thirdwatch/tiktok-scraper) and [YouTube Scraper](https://apify.com/thirdwatch/youtube-scraper) for cross-platform creator-growth tracking. A fourth subtle issue worth flagging: Instagram's algorithm sometimes hides specific posts from the public profile feed (Sensitive Content controls or shadow-banning), which means `postCount` may be higher than the visible posts you can pull. For audit workflows, surface the gap between `postCount` and the count of returned `recentPosts` as a content-moderation signal.

## Related use cases

- [Scrape Instagram profiles and posts](/blog/scrape-instagram-profiles-and-posts)
- [Research Instagram hashtag performance](/blog/research-instagram-hashtag-performance)
- [Monitor brand Instagram engagement](/blog/monitor-brand-instagram-engagement)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track influencer follower growth specifically?

Follower count is the most-watched single metric in influencer marketing — it determines pricing for sponsored content. According to Influencer Marketing Hub's 2024 benchmark, a creator with 100K-500K followers (the mid-tier band most brand budgets target) earns $500-$5,000 per sponsored post. Tracking growth over time validates whether a creator is genuinely scaling (good for partnerships) or stagnating (lower negotiating leverage).

### What growth rate is normal for Instagram creators?

Established creators typically grow 1-2% monthly. Rising-star creators in active growth phase hit 5-10% monthly. Sustained growth above 15% monthly is rare and usually indicates either viral content (good signal) or follower-fraud purchases (bad signal — flag for audit). Decline of more than 1% monthly across 3 consecutive months indicates account stagnation or post-controversy decay.

### How do I detect fake or purchased follower growth?

Three heuristics: (1) follower spikes without engagement-rate growth — genuine virality lifts both. (2) sub-1% engagement rate combined with 5%+ monthly growth — bots inflate followers but don't engage. (3) sudden 10K+ follower jumps within 24 hours not tied to any viral content — purchases happen in batches. The actor's `recentPosts` array lets you compute engagement velocity to cross-check against follower velocity.

### How fresh do follower counts need to be?

Daily cadence is the standard for active monitoring. Instagram updates follower counts within minutes of changes, so daily snapshots are accurate enough for trend tracking. For high-stakes campaigns (partnership negotiations, contract renewals), pair daily snapshots with weekly engagement-rate audits — the combined signal is much more reliable than either alone.

### Can I detect newly-rising creators before they peak?

Yes. Track aggregate follower growth across a curated watchlist of 200+ niche creators; the top 5-10% by 30-day growth rate are typically your rising-star cohort. Combined with engagement-rate filtering (above niche median), this surfaces genuinely-growing creators 2-4 months before they hit mainstream-influencer pricing tiers — useful for early partnership outreach at lower rates.

### How does this compare to Modash or HypeAuditor?

[Modash](https://www.modash.io/) and [HypeAuditor](https://hypeauditor.com/) (and similar SaaS like CreatorIQ, Tagger, Aspire) bundle influencer-growth tracking with audience-demographics analysis and partnership-management workflows. Thirdwatch's actor is the data layer only — public follower counts and recent-posts engagement, no audience demographics. Build your own tracker on top for 1-2% of the SaaS cost; if you need audience demographics (gender splits, age bands, geo), pair with the SaaS or run separate audience-research surveys.

Run the [Instagram Scraper on Apify Store](https://apify.com/thirdwatch/instagram-scraper) — pay-per-record, free to try, no credit card to test.
