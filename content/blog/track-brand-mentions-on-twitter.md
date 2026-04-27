---
title: "Track Brand Mentions on Twitter/X at Scale (2026)"
slug: "track-brand-mentions-on-twitter"
description: "Monitor brand mentions and competitor activity at $0.003 per tweet using Thirdwatch's Twitter Scraper. Engagement-velocity ranking + Slack alert recipes inside."
actor: "twitter-scraper"
actor_url: "https://apify.com/thirdwatch/twitter-scraper"
actorTitle: "Twitter/X Profile Scraper"
category: "social"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-twitter-profiles-without-api"
  - "build-twitter-data-pipeline-for-research"
  - "monitor-influencer-tweets-at-scale"
keywords:
  - "twitter brand mentions"
  - "x brand monitoring"
  - "track twitter mentions no api"
  - "twitter listening tool"
faqs:
  - q: "Why monitor Twitter brand mentions specifically?"
    a: "Twitter remains the platform with highest velocity for breaking-news and crisis communication. According to Pew Research's 2024 social-media survey, 67% of US news consumers report seeing breaking news on Twitter/X first. For brand-monitoring functions, this means Twitter is where reputation events break before they appear anywhere else — making real-time mention tracking operationally critical for any consumer-facing or crisis-sensitive brand."
  - q: "How does this differ from Twitter's official monitoring tools?"
    a: "Twitter offers TweetDeck (now X Pro) for native monitoring, but it lacks structured-data export and requires real-time browser sessions. The Thirdwatch actor pulls structured tweet data programmatically — every mention as a database row with engagement metrics, ready for downstream alerting, sentiment analysis, or Slack routing. Use TweetDeck for human-watched real-time review; use the actor for systematic structured monitoring."
  - q: "How do I find tweets mentioning my brand without keyword search?"
    a: "The actor is profile-first — pass official brand handles + executive handles + journalists in your space and capture their tweets. For mentions FROM accounts not on your watchlist, you'd need keyword search across X (which requires Twitter's paid Pro API). Most brand-monitoring teams build watchlists of 50-200 known accounts (industry journalists, key analysts, top customers, executives) plus their own brand accounts and accept the tradeoff for cost and reliability."
  - q: "What engagement threshold should trigger alerts?"
    a: "For most B2B brands, a tweet from a watchlist account with 1,000+ likes within 24 hours of posting is a meaningful alert. For consumer brands with broader awareness, raise to 5,000+. Calibrate by sampling — if your alerts produce more than 5-10 per day, raise the threshold; less than 1 per week and you're missing signal. The engagement-velocity weighting (likes + retweets×2 + replies×3) typically separates noise from signal cleanly."
  - q: "How fresh do brand mentions need to be?"
    a: "Hourly cadence catches mentions within the same business day they happen. For crisis-monitoring scenarios where minutes matter (executive resignation, product recall), 15-minute cadence is justifiable. For standard brand-listening (PR, competitive intelligence), six-hourly is sufficient. Each hourly run on a 50-account watchlist costs roughly $7-$10 — affordable enough to run continuously."
  - q: "Can I correlate tweet mentions with news coverage?"
    a: "Yes. Pair this Twitter actor with our [Google News Scraper](https://apify.com/thirdwatch/google-news-scraper) — run both on the same brand keyword schedule and join results by date. A spike in Twitter mentions usually precedes news coverage by 4-12 hours; tracking the gap between Twitter velocity and news article volume reveals which stories will spread vs which will stay contained."
---

> Thirdwatch's [Twitter/X Profile Scraper](https://apify.com/thirdwatch/twitter-scraper) feeds a structured brand-mentions tracker at $0.003 per tweet — pull tweets from a watchlist of brand, executive, journalist, and analyst handles; rank by engagement velocity; alert on threshold crossings. Built for PR teams, brand-monitoring functions, crisis-communications operations, and competitive-intelligence groups who need real-time Twitter data without X's paid API economics.

## Why track brand mentions on Twitter

Twitter is where reputation events break first. According to [Pew Research's 2024 social-media survey](https://www.pewresearch.org/), 67% of US news consumers see breaking news on Twitter/X before any other source — and within that ecosystem, the highest-engagement tweets from journalists, analysts, and executives drive most mention volume. For PR and brand-monitoring functions, the operational question is "which tweets in the last hour are gaining engagement on topics related to our brand?" The answer requires structured data flowing into alerting infrastructure.

The job-to-be-done is structured. A PR team monitors 50 industry journalists and 20 brand-relevant influencer accounts hourly to catch mentions before they trend. A crisis-communications team watches 30 brand-related accounts plus the company's own executives for sensitive content surfacing. A competitive-intelligence team tracks 100 competitor and partner exec handles for product-launch and corporate-event signals. All reduce to the same shape — handle list + tweet pull + engagement ranking + alert routing.

## How does this compare to the alternatives?

Three options for getting brand mentions into a monitoring pipeline:

| Approach | Cost per 1,000 tweets/day across 50 accounts | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| X API Pro tier ($5,000/month) | Effectively free up to 1M reads/month | Official | Hours | Vendor contract |
| Brand-monitoring SaaS (Sprinklr, Brandwatch, Sprout Social) | $20K–$200K/year per brand | High, includes sentiment + reporting | Weeks–months | Vendor lock-in |
| Thirdwatch Twitter/X Scraper | $3 ($0.003 × 1,000) | Production-tested, no login | 5 minutes | Thirdwatch tracks X changes |

Brand-monitoring SaaS bundles Twitter with sentiment analysis and reporting dashboards but is priced for full marketing-comms departments. The [Twitter/X Profile Scraper actor page](/scrapers/twitter-scraper) gives you the data layer at pay-per-result pricing — most lean PR teams build their own monitoring on top for 1-2% of the SaaS cost.

## How to track brand mentions on Twitter in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull tweets from a watchlist of relevant handles?

Curate a list of accounts likely to mention your brand: industry journalists, analysts, top customers, competitors, executive handles. Pass them as `usernames`.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~twitter-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

# Curated watchlist — adjust to your industry
WATCHLIST = [
    # Industry journalists
    "alexheath", "caseynewton", "kararswisher",
    # Analysts
    "benthompson", "stratechery", "zackkanter",
    # Brand handles
    "thirdwatch", "apify",
    # Executive handles
    "satyanadella", "sundarpichai",
    # Competitors
    "brightdata", "scrapingbee",
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"usernames": WATCHLIST, "maxTweetsPerUser": 30},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} tweets across {df.author.nunique()} watchlist accounts")
```

13 accounts × 30 tweets each = up to 390 tweets, costing $1.17.

### Step 3: How do I filter to tweets that mention your brand?

Use a keyword-list filter on the tweet text — include exact-match brand names, common variations, and product names.

```python
BRAND_TERMS = [
    "thirdwatch", "thirdwatch.dev", "third watch",
    "apify", "apify actor", "apify store",
]

import re
pattern = re.compile(r"\b(" + "|".join(re.escape(t) for t in BRAND_TERMS) + r")\b",
                     re.IGNORECASE)
df["mentions_brand"] = df.text.str.contains(pattern, na=False, regex=True)
mentions = df[df.mentions_brand].copy()
print(f"{len(mentions)} tweets mention the brand")
```

For more sophisticated matching, use spaCy or a named-entity-recognition model to detect brand mentions written without exact keyword match (e.g. "the scraping platform from Apify").

### Step 4: How do I rank by engagement velocity and alert?

Compute engagement velocity (engagement per hour since posting) and forward newly-flagged high-velocity mentions to Slack.

```python
import json, pathlib, requests as r

mentions["posted_date"] = pd.to_datetime(mentions.posted_date)
mentions["age_hours"] = (
    pd.Timestamp.utcnow() - mentions.posted_date
).dt.total_seconds() / 3600

mentions["engagement"] = (
    mentions.likes + mentions.retweets * 2 + mentions.replies * 3
)
mentions["velocity"] = mentions.engagement / mentions.age_hours.clip(lower=0.5)

snapshot = pathlib.Path("twitter-mentions-seen.json")
seen = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()

high_velocity = mentions[mentions.velocity >= 100]  # tune for your audience
new_alerts = high_velocity[~high_velocity.url.isin(seen)]

for _, t in new_alerts.iterrows():
    r.post(
        "https://hooks.slack.com/services/.../...",
        json={"text": (f":mega: *@{t.author}* — {int(t.likes):,} likes / "
                       f"{int(t.retweets):,} RTs in {t.age_hours:.1f}h\n"
                       f"_{t.text[:280]}_\n{t.url}")},
        timeout=10,
    )

snapshot.write_text(json.dumps(list(seen | set(high_velocity.url))))
print(f"{len(new_alerts)} new high-velocity brand mentions alerted")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at hourly cadence (`0 * * * *`) and the loop runs unattended.

## Sample output

A single tweet record (brand mention detected) looks like this. Five rows weigh ~3 KB.

```json
{
  "text": "Just tried Thirdwatch's Apify actor for scraping LinkedIn — way cheaper than Bright Data and the schema is cleaner.",
  "likes": 1240,
  "retweets": 320,
  "replies": 85,
  "posted_date": "2026-04-27T10:30:00Z",
  "media_urls": [],
  "author": "alexheath",
  "url": "https://twitter.com/alexheath/status/..."
}
```

`url` is the canonical natural key for cross-snapshot dedup. `posted_date` is ISO 8601 UTC, which makes age-in-hours calculations clean. `media_urls` is empty for text-only tweets and populated with image/video URLs for media tweets — useful for visual brand-monitoring (logo placement, screenshot mentions). `author` is preserved so cross-snapshot tracking by handle stays clean even when watchlist contents drift.

## Common pitfalls

Three things go wrong in production Twitter brand-monitoring pipelines. **False positives from common-word brand names** — short brand names like "Apify" rarely collide, but longer multi-word brands like "Third Watch" can match accidental mentions in unrelated contexts; tighten patterns with surrounding context (require "scrap", "data", or "actor" within 50 characters of the brand name). **Tweet deletion** — high-engagement tweets sometimes get deleted, especially crisis-related ones; if a tweet you alerted on returns 404 on user click-through, that's not a scraper failure but legitimate deletion. **Watchlist drift** — accounts you curate today may go private, change handles, or stop posting; review the watchlist quarterly and prune accounts with zero tweets in the last 90 days.

Thirdwatch's actor uses Apify residential-proxy rotation by default. The pure-HTTP architecture (Twitter's syndication API) means a 50-account hourly pull at 30 tweets each completes in 5-10 minutes and costs $4.50 — affordable enough to run continuously even on a sensitive crisis-monitoring schedule. Pair Twitter with our [Google News Scraper](https://apify.com/thirdwatch/google-news-scraper) for cross-source mention correlation and our [Reddit Scraper](https://apify.com/thirdwatch/reddit-scraper) for forum-discussion monitoring.

## Related use cases

- [Scrape Twitter/X profiles without API](/blog/scrape-twitter-profiles-without-api)
- [Build a Twitter data pipeline for research](/blog/build-twitter-data-pipeline-for-research)
- [Monitor influencer tweets at scale](/blog/monitor-influencer-tweets-at-scale)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why monitor Twitter brand mentions specifically?

Twitter remains the platform with highest velocity for breaking-news and crisis communication. According to Pew Research's 2024 social-media survey, 67% of US news consumers report seeing breaking news on Twitter/X first. For brand-monitoring functions, this means Twitter is where reputation events break before they appear anywhere else — making real-time mention tracking operationally critical for any consumer-facing or crisis-sensitive brand.

### How does this differ from Twitter's official monitoring tools?

Twitter offers TweetDeck (now X Pro) for native monitoring, but it lacks structured-data export and requires real-time browser sessions. The Thirdwatch actor pulls structured tweet data programmatically — every mention as a database row with engagement metrics, ready for downstream alerting, sentiment analysis, or Slack routing. Use TweetDeck for human-watched real-time review; use the actor for systematic structured monitoring.

### How do I find tweets mentioning my brand without keyword search?

The actor is profile-first — pass official brand handles + executive handles + journalists in your space and capture their tweets. For mentions FROM accounts not on your watchlist, you'd need keyword search across X (which requires Twitter's paid Pro API). Most brand-monitoring teams build watchlists of 50-200 known accounts (industry journalists, key analysts, top customers, executives) plus their own brand accounts and accept the tradeoff for cost and reliability.

### What engagement threshold should trigger alerts?

For most B2B brands, a tweet from a watchlist account with 1,000+ likes within 24 hours of posting is a meaningful alert. For consumer brands with broader awareness, raise to 5,000+. Calibrate by sampling — if your alerts produce more than 5-10 per day, raise the threshold; less than 1 per week and you're missing signal. The engagement-velocity weighting (likes + retweets×2 + replies×3) typically separates noise from signal cleanly.

### How fresh do brand mentions need to be?

Hourly cadence catches mentions within the same business day they happen. For crisis-monitoring scenarios where minutes matter (executive resignation, product recall), 15-minute cadence is justifiable. For standard brand-listening (PR, competitive intelligence), six-hourly is sufficient. Each hourly run on a 50-account watchlist costs roughly $7-$10 — affordable enough to run continuously.

### Can I correlate tweet mentions with news coverage?

Yes. Pair this Twitter actor with our [Google News Scraper](https://apify.com/thirdwatch/google-news-scraper) — run both on the same brand keyword schedule and join results by date. A spike in Twitter mentions usually precedes news coverage by 4-12 hours; tracking the gap between Twitter velocity and news article volume reveals which stories will spread vs which will stay contained.

Run the [Twitter/X Profile Scraper on Apify Store](https://apify.com/thirdwatch/twitter-scraper) — pay-per-tweet, free to try, no credit card to test.
