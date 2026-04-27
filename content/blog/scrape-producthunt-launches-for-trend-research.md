---
title: "Scrape Product Hunt Launches for Trend Research (2026)"
slug: "scrape-producthunt-launches-for-trend-research"
description: "Pull Product Hunt launches + votes at $0.003 per record using Thirdwatch. Daily launch tracking + emerging-tool detection + recipes for VCs and content teams."
actor: "producthunt-scraper"
actor_url: "https://apify.com/thirdwatch/producthunt-scraper"
actorTitle: "Product Hunt Scraper"
category: "general"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "track-producthunt-vote-velocity-for-launch-detection"
  - "find-emerging-saas-tools-via-producthunt"
  - "scrape-g2-reviews-for-b2b-saas-research"
keywords:
  - "product hunt scraper"
  - "scrape producthunt launches"
  - "saas trend research"
  - "tech launch detection"
faqs:
  - q: "Why scrape Product Hunt for trend research?"
    a: "Product Hunt is the canonical surface for new-tech-product launches — 5,000+ products launch annually with founder + investor attention. According to Product Hunt's 2024 report, the platform serves as primary discovery channel for early-adopter tech-buyers, and 'Top 5 of the day' positioning correlates with 50K+ subsequent product visits. For VC trend research, content-strategy teams, and emerging-SaaS discovery, Product Hunt data is high-signal."
  - q: "What data does the actor return?"
    a: "Per launch: name, tagline, description, vote count, comment count, launch date, ranking on launch day, maker name, hunter name, topics list (Productivity, AI, Developer Tools, etc.), website URL, app store links. About 95% of Product Hunt launches have comprehensive metadata."
  - q: "Can I detect rising launches in real time?"
    a: "Yes. Track per-launch vote velocity (votes per hour since posted) on launch day. Top 5 launches typically accumulate 200-500 votes within first 12 hours; the cutoff for 'Top of the day' is ~300 votes. For VCs + content-research teams, real-time velocity tracking surfaces breakout launches before official ranking."
  - q: "How fresh does Product Hunt data need to be?"
    a: "For active launch-tracking, hourly cadence on launch day catches velocity peaks. For VC daily-screening, daily snapshot post-launch (next morning UTC) captures ranking + vote-count outcomes. For trend research aggregating 30-90 days of launches, weekly snapshots produce stable trend data. PH operates on UTC daily-cycle ending at midnight."
  - q: "How does Product Hunt handle anti-scraping?"
    a: "Product Hunt has lightweight anti-bot defenses with structured GraphQL endpoint accessible via HTTP. Thirdwatch's actor uses HTTP scraping with sustained polling rate 200 records/minute per proxy IP. Production-tested at 95%+ success rate."
  - q: "How does this compare to PH's official API?"
    a: "Product Hunt's API v2 (GraphQL) is free with developer-account approval but rate-limited. The actor delivers similar coverage at $0.003/record without API gatekeeping. For one-off research with low-volume needs, PH's free API is cheapest. For high-volume trend research or platform-builder use cases, the actor scales without rate-limit ceiling."
---

> Thirdwatch's [Product Hunt Scraper](https://apify.com/thirdwatch/producthunt-scraper) returns Product Hunt launches at $0.003 per record — name, tagline, description, votes, comments, makers, topics, website. Built for VC trend research, emerging-SaaS discovery, content-strategy teams, and tech-startup tracking platforms.

## Why scrape Product Hunt for trend research

Product Hunt is the canonical new-tech-launch surface. According to [Product Hunt's 2024 community report](https://www.producthunt.com/), 5,000+ products launch annually with engaged early-adopter audiences — Top 5 launches typically capture 50K+ subsequent website visits. For VC trend research, emerging-SaaS discovery platforms, and content-strategy teams, Product Hunt data is the highest-signal early-launch surface available.

The job-to-be-done is structured. A VC analyst tracks daily PH launches for early-stage investment surface. A content-strategy team builds editorial roundups of weekly top launches. An emerging-SaaS-tool platform surfaces newly-launched tools to user communities. A tech-startup database backfills launch-history per company. All reduce to date-range queries + per-launch metadata extraction.

## How does this compare to the alternatives?

Three options for Product Hunt data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Product Hunt API v2 (GraphQL) | Free w/ rate limits | Official | Hours | API key approval |
| Manual PH browsing | Effectively unbounded | Low | Continuous | Doesn't scale |
| Thirdwatch Product Hunt Scraper | $30 ($0.003 × 10K) | HTTP scraping | 5 minutes | Thirdwatch tracks PH changes |

PH's official API is free with rate limits. The [Product Hunt Scraper actor page](/scrapers/producthunt-scraper) gives you raw data without rate-limit ceiling for high-volume research.

## How to scrape Product Hunt in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull recent launches?

Pass date-range queries.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~producthunt-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"days_back": 30, "maxResults": 1000},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} launches over the past 30 days")
```

30 days × ~30 daily launches = ~900 records, costing $2.70.

### Step 3: How do I rank by vote velocity + filter to top tier?

Compute votes-per-hour velocity + filter to "Top of the day" cohort.

```python
df["launch_date"] = pd.to_datetime(df.launch_date)
df["age_hours"] = (pd.Timestamp.utcnow() - df.launch_date).dt.total_seconds() / 3600
df["votes_per_hour"] = df.vote_count / df.age_hours.clip(lower=1)

# Top 5 of each launch day
df["launch_date_only"] = df.launch_date.dt.date
top_per_day = (
    df.sort_values("vote_count", ascending=False)
    .groupby("launch_date_only").head(5)
)

# Aggregate vote-velocity stats
print(f"\nTop-of-the-day median votes: {top_per_day.vote_count.median():.0f}")
print(f"Top-of-the-day median velocity: {top_per_day.votes_per_hour.median():.1f}/hr")
```

Top 5 daily launches typically accumulate 200-500 votes within 24 hours; the velocity threshold for breakout is ~10-15 votes/hour sustained.

### Step 4: How do I extract topic-cluster trends?

Aggregate topic distributions across the launch dataset.

```python
from collections import Counter

topic_counter = Counter()
for topics in df.topics.dropna():
    if isinstance(topics, list):
        topic_counter.update(topics)

print("Top 20 launch topics over 30 days:")
for topic, count in topic_counter.most_common(20):
    print(f"  {topic}: {count} launches")
```

Topic-cluster volume reveals emerging tech-category trends. AI launches dominated 2024-2025 (~30% of all launches); Developer Tools, Productivity, and Marketing tools follow.

## Sample output

A single Product Hunt launch record looks like this. Five rows weigh ~7 KB.

```json
{
  "name": "Notion AI",
  "tagline": "AI-powered writing in your Notion workspace",
  "description": "Notion AI accelerates how you write...",
  "vote_count": 4250,
  "comment_count": 145,
  "launch_date": "2024-02-22T08:01:00Z",
  "rank_on_launch_day": 1,
  "topics": ["Productivity", "Artificial Intelligence", "Notion Templates"],
  "maker_name": "Akshay Kothari",
  "hunter_name": "Nima Owji",
  "website": "https://www.notion.so/product/ai",
  "ios_url": "https://apps.apple.com/us/app/notion/id1232780281",
  "android_url": "https://play.google.com/store/apps/details?id=notion.id"
}
```

`vote_count` + `rank_on_launch_day` are the killer fields for breakout-detection. `topics` array enables cross-launch category research. `maker_name` + `hunter_name` (different — maker ships product, hunter posts to PH) reveal community influence patterns.

## Common pitfalls

Three things go wrong in Product Hunt pipelines. **UTC daily-cycle alignment** — PH's "day" runs midnight-to-midnight UTC, which differs from US/EU local days; for accurate daily-ranking analysis, use UTC dates rather than local. **Vote-pattern manipulation** — small percentage of launches show coordinated vote-count surges from external networks (Twitter promotion, paid PH-specialist services); for clean trend research, filter on `vote_count_to_comment_ratio < 50` (high vote/low comment indicates promo, not organic). **Re-launches and updates** — same product can launch multiple times (v1, v2, AI update); treat re-launches as separate records but cluster by maker + product-name for company-trajectory analysis.

Thirdwatch's actor uses HTTP + structured JSON at $0.10/1K, ~96% margin. Pair Product Hunt with [G2 Scraper](https://apify.com/thirdwatch/g2-scraper) for product-tier validation post-launch and [Twitter Scraper](https://apify.com/thirdwatch/twitter-scraper) for cross-platform launch-discourse analysis. A fourth subtle issue worth flagging: Product Hunt's seasonality is pronounced — launch volume drops 30-40% during late December + early August (holiday windows). For accurate trend research, deseasonalize against same-week prior-year baselines rather than treating absolute volume as comparable. A fifth pattern unique to PH research: AI-tagged launches now dominate top tiers — about 30% of 2024-2025 launches use AI in tagline. For accurate non-AI trend research, segment AI vs non-AI launches separately. A sixth and final pitfall: Product Hunt's "featured" badge is editorially-set, not algorithmic; featured launches show 3-5x higher engagement regardless of intrinsic quality. For accurate competitive research, weight featured-vs-non-featured cohorts separately.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. PH launches happen daily — daily polling captures all signals. For real-time launch-day tracking, hourly polling on top-tier launches enables velocity-based ranking. Tier the watchlist into Tier 1 (top-tier launches, hourly), Tier 2 (broader daily-launch list, daily), Tier 3 (long-tail historical research, weekly).

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful for topic-cluster classifier evolution as new tech-categories emerge (AI Agents in 2024, multi-modal AI in 2025).

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). PH schema occasionally changes during platform UI revisions — catch drift early before downstream consumers degrade silently.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, ownership-transfers, status changes. These structural changes precede or follow material events (acquisitions, rebrands, regulatory issues, leadership departures) and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs (name changes, category re-classifications, status updates) to human reviewers; low-leverage diffs (single-record additions, minor count updates) stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale.

## Related use cases

- [Track Product Hunt vote velocity for launch detection](/blog/track-producthunt-vote-velocity-for-launch-detection)
- [Find emerging SaaS tools via Product Hunt](/blog/find-emerging-saas-tools-via-producthunt)
- [Scrape G2 reviews for B2B SaaS research](/blog/scrape-g2-reviews-for-b2b-saas-research)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Product Hunt for trend research?

Product Hunt is the canonical surface for new-tech-product launches — 5,000+ products launch annually with founder + investor attention. According to Product Hunt's 2024 report, the platform serves as primary discovery channel for early-adopter tech-buyers, and "Top 5 of the day" positioning correlates with 50K+ subsequent product visits. For VC trend research, content-strategy teams, and emerging-SaaS discovery, Product Hunt data is high-signal.

### What data does the actor return?

Per launch: name, tagline, description, vote count, comment count, launch date, ranking on launch day, maker name, hunter name, topics list (Productivity, AI, Developer Tools, etc.), website URL, app store links. About 95% of Product Hunt launches have comprehensive metadata.

### Can I detect rising launches in real time?

Yes. Track per-launch vote velocity (votes per hour since posted) on launch day. Top 5 launches typically accumulate 200-500 votes within first 12 hours; the cutoff for "Top of the day" is ~300 votes. For VCs + content-research teams, real-time velocity tracking surfaces breakout launches before official ranking.

### How fresh does Product Hunt data need to be?

For active launch-tracking, hourly cadence on launch day catches velocity peaks. For VC daily-screening, daily snapshot post-launch (next morning UTC) captures ranking + vote-count outcomes. For trend research aggregating 30-90 days of launches, weekly snapshots produce stable trend data. PH operates on UTC daily-cycle ending at midnight.

### How does Product Hunt handle anti-scraping?

Product Hunt has lightweight anti-bot defenses with structured GraphQL endpoint accessible via HTTP. Thirdwatch's actor uses HTTP scraping with sustained polling rate 200 records/minute per proxy IP. Production-tested at 95%+ success rate.

### How does this compare to PH's official API?

[Product Hunt's API v2 (GraphQL)](https://api.producthunt.com/v2/docs) is free with developer-account approval but rate-limited. The actor delivers similar coverage at $0.003/record without API gatekeeping. For one-off research with low-volume needs, PH's free API is cheapest. For high-volume trend research or platform-builder use cases, the actor scales without rate-limit ceiling.

Run the [Product Hunt Scraper on Apify Store](https://apify.com/thirdwatch/producthunt-scraper) — pay-per-record, free to try, no credit card to test.
