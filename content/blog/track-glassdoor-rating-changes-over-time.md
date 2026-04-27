---
title: "Track Glassdoor Rating Changes Over Time (2026)"
slug: "track-glassdoor-rating-changes-over-time"
description: "Monitor Glassdoor company-rating drift at $0.008 per record using Thirdwatch. Weekly snapshots + delta detection + Slack alerts on rating drops."
actor: "glassdoor-scraper"
actor_url: "https://apify.com/thirdwatch/glassdoor-scraper"
actorTitle: "Glassdoor Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-glassdoor-salaries-for-comp-benchmarking"
  - "research-company-reviews-on-glassdoor"
  - "find-glassdoor-interview-questions-by-role"
keywords:
  - "glassdoor rating tracker"
  - "monitor company rating changes"
  - "glassdoor rating drift alert"
  - "employer brand monitoring"
faqs:
  - q: "Why track Glassdoor rating changes specifically?"
    a: "Glassdoor's overall company rating is the canonical employer-brand metric — recruiter teams reference it for talent-attraction analysis and HR teams reference it for retention-risk signal. A 0.3-0.5 star drop within a quarter is materially predictive of attrition issues; a 0.5+ rise often correlates with strategic culture investment paying off. For HR analytics, talent-acquisition strategy, and competitive employer-brand intelligence, rating drift is the single highest-signal KPI on Glassdoor."
  - q: "What rating-change threshold matters?"
    a: "0.2-star moves over 4 weeks are statistical noise (sub-50-review companies). 0.3-star moves at companies with 200+ reviews are meaningful early signals. 0.5+ star moves at any review count are alert-worthy — indicates either a high-impact policy change or a coordinated review-bombing event. Always check `reviews_count` delta alongside rating delta — if 50+ new reviews drove the move, it's a real signal."
  - q: "How fresh do rating snapshots need to be?"
    a: "Weekly cadence is the sweet spot for HR analytics. Below weekly, you miss inflection points; above weekly, the rating-change signal is too small to act on between snapshots. For competitive M&A diligence (rating drift around layoff announcements), daily cadence catches the immediate response. For long-term employer-brand reporting, monthly is sufficient."
  - q: "Can I track rating changes per location or department?"
    a: "Yes, indirectly. Glassdoor returns location- and department-tagged reviews via the reviews scrapeType. Aggregate ratings within (company, location) or (company, department) bins to compute per-cell deltas. About 60% of large-employer reviews include location tags; 40% include department tags. Cross-tabulating both produces the highest-resolution employer-brand drift maps."
  - q: "How do I alert on negative drift?"
    a: "Persist (company, snapshot_date, rating, reviews_count) tuples and compute 4-week rolling deltas. Trigger Slack alerts when delta < -0.3 AND reviews_count delta > 20 (real signal, not noise). For high-stakes accounts (M&A targets, IPO candidates), tighten to delta < -0.2 AND reviews_count delta > 10. The actor's structured output makes this dashboard a half-day build."
  - q: "How does this compare to Comparably or Indeed Reviews?"
    a: "Comparably and Indeed Reviews offer competing employer-brand datasets but neither has Glassdoor's depth (1.4M+ companies, decade+ of historical reviews). For M&A diligence and serious employer-brand research, Glassdoor is the canonical source. Comparably skews toward tech and culture-conscious employers; Indeed Reviews tilts toward retail and operations roles. Use all three for triangulation; Glassdoor for the primary signal."
---

> Thirdwatch's [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) makes employer-brand drift tracking a structured workflow at $0.008 per record — weekly snapshot of company rating and reviews_count, delta detection, Slack alerting on negative trajectory. Built for HR analytics teams, talent-acquisition strategy functions, M&A diligence analysts, and employer-brand consultants studying competitive positioning.

## Why track Glassdoor rating changes over time

Employer-brand health is a leading indicator. According to [Glassdoor's 2024 Employer Branding report](https://www.glassdoor.com/research/), companies with sustained 0.3-star Glassdoor rating declines see 18-25% higher voluntary attrition within 12 months and 30%+ slower offer-acceptance rates for senior hires. For HR analytics, talent-acquisition strategy, and M&A diligence teams, rating drift catches signals 6-12 months before they show up in lagging HR metrics.

The job-to-be-done is structured. An HR analytics team monitors rating drift across a 50-company peer set weekly to inform internal benchmarking. A talent-acquisition strategy function tracks competitor employer-brand health to time recruitment campaigns. An M&A diligence analyst studies target-company rating drift over 24 months to validate culture-fit narratives. An employer-brand consultancy serves clients with rating-trajectory dashboards for boardroom reporting. All reduce to weekly company-list snapshot + delta computation + threshold-based alerting.

## How does this compare to the alternatives?

Three options for Glassdoor rating-trajectory data:

| Approach | Cost per 1,000 records weekly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Glassdoor checks | Effectively unbounded analyst time | Sampling bias | Continuous | Doesn't scale |
| Glassdoor B2B (Indeed Hiring Insights) | $20K–$100K/year | Authoritative | Weeks | Annual contract |
| Thirdwatch Glassdoor Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, structured output | 5 minutes | Thirdwatch tracks Glassdoor changes |

Glassdoor's B2B Hiring Insights product offers authoritative employer-brand analytics but the per-seat cost limits adoption. Manual tracking is unscalable past 5-10 companies. The [Glassdoor Scraper actor page](/scrapers/glassdoor-scraper) gives you the underlying time-series data for less than 1% of B2B-product cost.

## How to track Glassdoor rating changes in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a weekly snapshot for a peer set?

Pass company queries weekly with `scrapeType: "reviews"` (returns rating + reviews_count + recent themes).

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~glassdoor-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PEER_SET = ["google", "meta", "openai", "anthropic", "stripe",
            "airbnb", "amazon", "microsoft", "netflix", "apple",
            "uber", "lyft", "dropbox", "asana", "atlassian",
            "snowflake", "databricks", "datadog", "mongodb", "twilio"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": PEER_SET, "scrapeType": "reviews",
          "country": "us", "maxResults": 50},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/glassdoor-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} records across {len(PEER_SET)} companies")
```

20 companies × 50 reviews each = up to 1,000 records weekly, costing $8.

### Step 3: How do I compute rating deltas across snapshots?

Aggregate per-company rating + reviews_count, compute week-over-week delta.

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/glassdoor-*.json"))
print(f"{len(snapshots)} weekly snapshots loaded")

dfs = []
for s in snapshots:
    snap_df = pd.DataFrame(json.loads(open(s).read()))
    ts = s.split("-")[-1].split(".")[0]
    snap_df["snapshot_date"] = pd.to_datetime(ts)
    dfs.append(snap_df)

df = pd.concat(dfs, ignore_index=True)
weekly = (
    df.groupby(["company_name", "snapshot_date"])
    .agg(rating=("company_rating", "first"),
         reviews_count=("reviews_count", "first"))
    .reset_index()
)

weekly["rating_delta_4w"] = weekly.groupby("company_name").rating.diff(4)
weekly["reviews_delta_4w"] = weekly.groupby("company_name").reviews_count.diff(4)
print(weekly.tail(10))
```

The 4-week delta smooths weekly noise and surfaces true drift trajectories. Companies with delta < -0.3 and reviews_delta > 20 are alert-worthy.

### Step 4: How do I forward negative-drift alerts to Slack?

Persist alerted (company, week) tuples and forward only new alerts.

```python
import requests as r

snapshot = pathlib.Path("rating-alerts-seen.json")
seen = set(tuple(x) for x in json.loads(snapshot.read_text())) if snapshot.exists() else set()

alerts = weekly[
    (weekly.rating_delta_4w <= -0.3)
    & (weekly.reviews_delta_4w >= 20)
]

new_alerts = alerts[
    ~alerts.apply(lambda x: (x.company_name, str(x.snapshot_date)), axis=1).isin(seen)
]

for _, a in new_alerts.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: *{a.company_name}* rating dropped "
                          f"{a.rating_delta_4w:+.2f} stars over 4 weeks "
                          f"(now {a.rating}, +{int(a.reviews_delta_4w)} reviews). "
                          f"Possible culture/policy change.")})

new_keys = [(a.company_name, str(a.snapshot_date)) for _, a in new_alerts.iterrows()]
snapshot.write_text(json.dumps(list(seen | set(new_keys))))
print(f"{len(new_alerts)} new rating-drop alerts forwarded")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at weekly cadence (`0 0 * * 1`) and the loop runs unattended.

## Sample output

A single Glassdoor company-record (reviews scrapeType) looks like this. Five rows weigh ~6 KB.

```json
{
  "company_name": "Stripe",
  "company_rating": 4.4,
  "reviews_count": 1842,
  "company_size": "1001-5000",
  "company_industry": "Internet & Software Services",
  "ceo_approval": 92,
  "recommend_to_friend": 87,
  "pros": ["Smart team", "Strong leadership", "Equity upside"],
  "cons": ["High pressure", "Long hours during product launches"]
}
```

`company_rating` is the headline metric; `reviews_count` provides the volume context for delta significance. `ceo_approval` and `recommend_to_friend` are secondary culture-health metrics — drops in these often precede overall rating drops by 2-4 weeks. `company_size` and `company_industry` provide cohort context for benchmark comparisons (a 0.3-star drop at a 10K-employee company is more significant than at a 100-person startup).

## Common pitfalls

Three things go wrong in rating-trajectory pipelines. **Review-volume bias** — rating moves at low-review companies (under 50 reviews) reflect statistical noise rather than real signal; always require a minimum reviews_count threshold (200+ for headline alerts). **Coordinated review bombs** — disgruntled employee groups occasionally coordinate negative reviews after layoffs; check for >10 negative reviews within a 7-day window before declaring a real culture issue. **Glassdoor moderation lag** — Glassdoor occasionally removes reviews after publication (policy violations, employer disputes), causing apparent rating "improvements" that don't reflect underlying culture change; cross-reference with employee-pulse signals when interpreting positive drifts.

Thirdwatch's actor uses Camoufox stealth-browser bypass for Glassdoor's Cloudflare protection at $2/1K, ~75% margin. The 4096 MB memory and 3,600-second timeout headroom mean even 100-company weekly batches complete cleanly. Pair Glassdoor with [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) to identify departed employees who may explain culture-drift causes. A fourth subtle issue worth flagging: Glassdoor's overall rating computation gives extra weight to recent reviews (last 12 months vs older), so a company that had a great 2022 but mediocre 2025 will show a declining headline rating even if 2025 reviews are stable; for true culture-trajectory analysis, compute trailing-12-month rating deltas separately rather than relying solely on the headline number Glassdoor displays. A fifth pattern unique to longitudinal tracking: companies undergoing acquisitions or rebrands sometimes get split into multiple Glassdoor entries (legacy entity + acquired entity); for unified time-series, manually merge entity-pairs and recompute combined rating with reviews_count weighting before publishing trend dashboards. A sixth and final pitfall: Glassdoor's CEO approval rating moves on much shorter timescales than overall rating — a single high-profile CEO comment or policy reversal can shift CEO approval 10-15 points in a week while overall rating barely moves; for early-warning systems, weight CEO approval delta 2-3x more heavily than overall-rating delta in alert thresholds.

## Related use cases

- [Scrape Glassdoor salaries for compensation benchmarking](/blog/scrape-glassdoor-salaries-for-comp-benchmarking)
- [Research company reviews on Glassdoor](/blog/research-company-reviews-on-glassdoor)
- [Find Glassdoor interview questions by role](/blog/find-glassdoor-interview-questions-by-role)
- [The complete guide to scraping reviews](/blog/guide-scraping-reviews)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track Glassdoor rating changes specifically?

Glassdoor's overall company rating is the canonical employer-brand metric — recruiter teams reference it for talent-attraction analysis and HR teams reference it for retention-risk signal. A 0.3-0.5 star drop within a quarter is materially predictive of attrition issues; a 0.5+ rise often correlates with strategic culture investment paying off. For HR analytics, talent-acquisition strategy, and competitive employer-brand intelligence, rating drift is the single highest-signal KPI on Glassdoor.

### What rating-change threshold matters?

0.2-star moves over 4 weeks are statistical noise (sub-50-review companies). 0.3-star moves at companies with 200+ reviews are meaningful early signals. 0.5+ star moves at any review count are alert-worthy — indicates either a high-impact policy change or a coordinated review-bombing event. Always check `reviews_count` delta alongside rating delta — if 50+ new reviews drove the move, it's a real signal.

### How fresh do rating snapshots need to be?

Weekly cadence is the sweet spot for HR analytics. Below weekly, you miss inflection points; above weekly, the rating-change signal is too small to act on between snapshots. For competitive M&A diligence (rating drift around layoff announcements), daily cadence catches the immediate response. For long-term employer-brand reporting, monthly is sufficient.

### Can I track rating changes per location or department?

Yes, indirectly. Glassdoor returns location- and department-tagged reviews via the `reviews` scrapeType. Aggregate ratings within (company, location) or (company, department) bins to compute per-cell deltas. About 60% of large-employer reviews include location tags; 40% include department tags. Cross-tabulating both produces the highest-resolution employer-brand drift maps.

### How do I alert on negative drift?

Persist (company, snapshot_date, rating, reviews_count) tuples and compute 4-week rolling deltas. Trigger Slack alerts when `delta < -0.3 AND reviews_count delta > 20` (real signal, not noise). For high-stakes accounts (M&A targets, IPO candidates), tighten to `delta < -0.2 AND reviews_count delta > 10`. The actor's structured output makes this dashboard a half-day build.

### How does this compare to Comparably or Indeed Reviews?

[Comparably](https://www.comparably.com/) and Indeed Reviews offer competing employer-brand datasets but neither has Glassdoor's depth (1.4M+ companies, decade+ of historical reviews). For M&A diligence and serious employer-brand research, Glassdoor is the canonical source. Comparably skews toward tech and culture-conscious employers; Indeed Reviews tilts toward retail and operations roles. Use all three for triangulation; Glassdoor for the primary signal.

Run the [Glassdoor Scraper on Apify Store](https://apify.com/thirdwatch/glassdoor-scraper) — pay-per-record, free to try, no credit card to test.
