---
title: "Scrape Twitter/X Profiles Without API at Scale (2026)"
slug: "scrape-twitter-profiles-without-api"
description: "Pull public tweets from any X handle at $0.003 per tweet using Thirdwatch — no login, no API key. Likes, retweets, replies, media. Python recipes inside."
actor: "twitter-scraper"
actor_url: "https://apify.com/thirdwatch/twitter-scraper"
actorTitle: "Twitter/X Profile Scraper"
category: "social"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-brand-mentions-on-twitter"
  - "build-twitter-data-pipeline-for-research"
  - "monitor-influencer-tweets-at-scale"
keywords:
  - "twitter scraper no api"
  - "scrape x profile"
  - "twitter api alternative"
  - "extract tweets python"
faqs:
  - q: "Do I need a Twitter/X API key?"
    a: "No. Thirdwatch's Twitter Scraper works without login, cookies, or API credentials — it reads only public profile pages anyone can view as a guest. This sidesteps X's $200/month basic API tier and the higher Pro and Enterprise tiers, both of which gate volume access behind material monthly fees and rate limits."
  - q: "How much does it cost to scrape Twitter profiles?"
    a: "Thirdwatch charges $0.003 per tweet on the FREE tier and drops to $0.0016 at GOLD volume. A 50-account watchlist at 100 tweets each costs $15 per refresh. Daily cadence over 50 accounts costs ~$450/month at FREE — meaningfully below X's API pricing for the same coverage and without rate-limit complexity."
  - q: "What fields does the actor return per tweet?"
    a: "Up to 8 fields per tweet: text, likes, retweets, replies, posted_date (ISO 8601), media_urls (array), author handle, and url. Quote tweets and replies are included with the same schema. The actor returns up to 100 most-recent tweets per profile per run, controlled by the maxTweetsPerUser input."
  - q: "Can I monitor protected or private accounts?"
    a: "No. Protected accounts (those with the 🔒 icon on X) hide their tweets from non-followers, which means even logged-in scrapers can't access them without an active follow relationship. The actor only reads public profiles. For competitive intelligence on private accounts, you'd need explicit access via X's enterprise products, which carries its own contractual obligations."
  - q: "How fresh is the data?"
    a: "Each run pulls live from twitter.com / x.com at request time. Tweets typically index within seconds of posting, so the actor returns essentially real-time data for active profiles. For continuous monitoring of breaking-news handles or executive accounts, schedule the actor at hourly cadence; for general profile tracking, daily is sufficient."
  - q: "How does this compare to apidojo/tweet-scraper?"
    a: "apidojo is cheaper per tweet ($0.0004 BRONZE) and offers a broader crawl model — search queries, lists, conversations, and replies — but pays the cost in schema complexity. Thirdwatch's actor is profile-first: pass handles, get back one clean row per tweet with consistent fields. For monitoring, analytics, and research pipelines that key on per-handle data, the simpler shape wins. For broad keyword search across X, apidojo is the better fit."
---

> Thirdwatch's [Twitter/X Profile Scraper](https://apify.com/thirdwatch/twitter-scraper) returns public tweets from any X handle at $0.003 per tweet — text, likes, retweets, replies, posted date, and media URLs — without requiring a login, cookies, or X API credentials. Built for social-media analysts, brand-monitoring teams, journalists pulling public timelines, investor-research desks watching exec accounts, and content researchers building tweet corpora.

## Why scrape Twitter without the API

X (formerly Twitter) restructured its API in 2023, gating access to public tweets behind paid tiers — basic at $200/month, Pro at $5,000/month, and enterprise pricing on request. According to [X's own developer pricing pages](https://developer.x.com/en/products/x-api), even basic tier caps at 10,000 tweets per month read access, which makes systematic monitoring of more than ~5 active accounts impractical for most teams. The blocker for most use cases isn't capability; it's economics.

The job-to-be-done is structured. A brand-monitoring team watches 30 official brand and exec accounts daily for announcements. A journalist pulls a public timeline for background and quote verification. An investor-research desk monitors 50 founder accounts for product signals. A content researcher builds a corpus of 5,000 tweets across the AI ecosystem for sentiment analysis. All of these reduce to handle list + max tweets per handle + structured tweet rows. The actor is the data layer, X API economics aside.

## How does this compare to the alternatives?

Three options for getting Twitter/X profile data into a pipeline:

| Approach | Cost per 1,000 tweets | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| X Basic API ($200/month) | Effectively free up to 10K/month, then capped | Official | Hours (API key + auth) | Strict rate limits |
| X Pro API ($5,000/month) | Effectively free up to 1M/month | Official | Hours | Vendor contract |
| Thirdwatch Twitter/X Scraper | $3 ($0.003 × 1,000) | Production-tested, no login | 5 minutes | Thirdwatch tracks X changes |

X's basic tier works for the smallest workloads but falls over once you cross ~5 actively-monitored accounts. The [Twitter/X Profile Scraper actor page](/scrapers/twitter-scraper) gives you the public data with no monthly minimum and no rate-cap surprises.

## How to scrape Twitter profiles in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull tweets from a watchlist of handles?

Pass an array of handles (without `@`) and a per-handle tweet cap.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~twitter-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

WATCHLIST = ["elonmusk", "sundarpichai", "satyanadella",
             "tim_cook", "jeffweiner", "lisasu",
             "patgelsinger", "openai"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"usernames": WATCHLIST, "maxTweetsPerUser": 50},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} tweets across {df.author.nunique()} accounts")
```

Eight handles × 50 tweets each = up to 400 tweets, costing $1.20.

### Step 3: How do I rank by engagement and detect viral tweets?

Sort by total engagement (likes + retweets + replies) and surface the top movers per handle.

```python
df["engagement"] = df.likes + df.retweets * 2 + df.replies * 3
df["posted_date"] = pd.to_datetime(df.posted_date)

last_24h = df[df.posted_date >= (pd.Timestamp.utcnow() - pd.Timedelta("24H"))]
top_per_author = (
    last_24h.sort_values("engagement", ascending=False)
    .groupby("author")
    .head(3)
    .reset_index(drop=True)
)
print(top_per_author[["author", "text", "likes", "retweets", "replies",
                       "engagement", "url"]].head(15))
```

Weighting retweets 2x and replies 3x reflects their relative effort cost — a reply takes more deliberation than a like, so high-reply tweets are higher signal of genuine engagement than pure like volume.

### Step 4: How do I forward viral tweets to Slack?

Forward newly-flagged viral tweets to a brand-monitoring or competitive-intelligence Slack channel.

```python
import json, pathlib, requests as r

snapshot = pathlib.Path("twitter-viral-seen.json")
seen = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()

VIRAL_THRESHOLD = 5000  # likes equivalent
viral = df[df.engagement >= VIRAL_THRESHOLD]
new_viral = viral[~viral.url.isin(seen)]

for _, t in new_viral.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":fire: *@{t.author}* — {int(t.likes/1000)}K likes, "
                          f"{int(t.retweets/1000)}K RTs\n{t.text[:280]}\n{t.url}")},
           timeout=10)

snapshot.write_text(json.dumps(list(seen | set(viral.url))))
print(f"{len(new_viral)} new viral tweets forwarded")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at hourly cadence and the loop is fully self-maintaining.

## Sample output

A single tweet record looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "text": "Excited to announce our latest product launch...",
  "likes": 15000,
  "retweets": 3200,
  "replies": 800,
  "posted_date": "2026-04-08T14:30:00Z",
  "media_urls": ["https://pbs.twimg.com/media/..."],
  "author": "elonmusk",
  "url": "https://twitter.com/elonmusk/status/..."
}
```

`url` is the canonical natural key for cross-snapshot dedup. `posted_date` is ISO 8601 in UTC, which makes time-zone arithmetic clean. `media_urls` is an array because tweets can have up to 4 attached images or one video; for media-heavy content analysis, parse the URL extension to distinguish images from videos. `text` includes any links and mentions inline — strip them with a regex if you need clean text for NLP.

## Common pitfalls

Three things go wrong in production Twitter pipelines. **Retweets vs original tweets** — retweets and quote tweets appear in the timeline alongside originals; the actor returns both with the original author attributed in `text` and `url`, but for "what did this person actually say" filters, drop rows where `author` doesn't match the requested handle. **Engagement count rounding** — X displays counts as `15K` or `1.2M` for large numbers; the actor parses these to integers, but rounding loses precision (15,000 in your data may have been 15,420 on X). For absolute-precision analytics this is not the right source. **Tweet deletion** — tweets get deleted; if you persist tweet IDs and fail to handle 404s on re-fetch, your time series will have ghost rows. Always treat tweet absence on a re-run as legitimate deletion, not data error.

Thirdwatch's actor uses an Apify residential-proxy rotation by default to stay within polite-crawling norms. The pure-HTTP architecture (Twitter's syndication API works without browser automation) means a 50-handle pull at 50 tweets each completes in under five minutes and costs $7.50 — small enough to run hourly on an active brand-monitoring watchlist. A fourth subtle issue worth flagging is that X's display rules occasionally hide tweet content behind "Show more" toggles for very long posts; the actor returns the visible text, so for paragraph-length tweets the captured text may be truncated to the first 280-500 characters. A fifth note: posted_date timestamps are accurate to the minute for recent tweets but only to the day for tweets older than ~7 days (X's own UI reduces precision over time), so historical engagement-velocity analysis on multi-month-old tweets is approximate rather than exact. A sixth and final pattern: very high-volume accounts (10K+ tweets/year) sometimes return only the most-recent ~1,500 tweets via the syndication endpoint regardless of the `maxTweetsPerUser` setting — for full historical archives of these accounts, scrape on a continuous schedule and stitch snapshots over time.

## Related use cases

- [Track brand mentions on Twitter](/blog/track-brand-mentions-on-twitter)
- [Build a Twitter data pipeline for research](/blog/build-twitter-data-pipeline-for-research)
- [Monitor influencer tweets at scale](/blog/monitor-influencer-tweets-at-scale)
- [The complete guide to scraping social media](/blog/guide-scraping-social-media)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Do I need a Twitter/X API key?

No. Thirdwatch's Twitter Scraper works without login, cookies, or API credentials — it reads only public profile pages anyone can view as a guest. This sidesteps X's $200/month basic API tier and the higher Pro and Enterprise tiers, both of which gate volume access behind material monthly fees and rate limits.

### How much does it cost to scrape Twitter profiles?

Thirdwatch charges $0.003 per tweet on the FREE tier and drops to $0.0016 at GOLD volume. A 50-account watchlist at 100 tweets each costs $15 per refresh. Daily cadence over 50 accounts costs ~$450/month at FREE — meaningfully below X's API pricing for the same coverage and without rate-limit complexity.

### What fields does the actor return per tweet?

Up to 8 fields per tweet: `text`, `likes`, `retweets`, `replies`, `posted_date` (ISO 8601), `media_urls` (array), `author` handle, and `url`. Quote tweets and replies are included with the same schema. The actor returns up to 100 most-recent tweets per profile per run, controlled by the `maxTweetsPerUser` input.

### Can I monitor protected or private accounts?

No. Protected accounts (those with the 🔒 icon on X) hide their tweets from non-followers, which means even logged-in scrapers can't access them without an active follow relationship. The actor only reads public profiles. For competitive intelligence on private accounts, you'd need explicit access via X's enterprise products, which carries its own contractual obligations.

### How fresh is the data?

Each run pulls live from `twitter.com` / `x.com` at request time. Tweets typically index within seconds of posting, so the actor returns essentially real-time data for active profiles. For continuous monitoring of breaking-news handles or executive accounts, schedule the actor at hourly cadence; for general profile tracking, daily is sufficient.

### How does this compare to apidojo/tweet-scraper?

apidojo is cheaper per tweet ($0.0004 BRONZE) and offers a broader crawl model — search queries, lists, conversations, and replies — but pays the cost in schema complexity. Thirdwatch's actor is profile-first: pass handles, get back one clean row per tweet with consistent fields. For monitoring, analytics, and research pipelines that key on per-handle data, the simpler shape wins. For broad keyword search across X, apidojo is the better fit.

Run the [Twitter/X Profile Scraper on Apify Store](https://apify.com/thirdwatch/twitter-scraper) — pay-per-tweet, free to try, no credit card to test.
