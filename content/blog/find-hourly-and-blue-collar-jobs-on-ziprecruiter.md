---
title: "Find Hourly and Blue-Collar Jobs on ZipRecruiter (2026)"
slug: "find-hourly-and-blue-collar-jobs-on-ziprecruiter"
description: "Pull hourly + blue-collar US jobs from ZipRecruiter at $0.008 per record using Thirdwatch. Trade + retail + healthcare + recipes for non-tech recruiters."
actor: "ziprecruiter-scraper"
actor_url: "https://apify.com/thirdwatch/ziprecruiter-scraper"
actorTitle: "ZipRecruiter Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-ziprecruiter-jobs-for-aggregator"
  - "build-ziprecruiter-salary-database-for-mid-market"
  - "scrape-simplyhired-jobs-for-aggregator"
keywords:
  - "blue collar jobs scraper"
  - "hourly jobs aggregator"
  - "ziprecruiter trades jobs"
  - "us non-tech recruiting"
faqs:
  - q: "Why scrape ZipRecruiter for hourly + blue-collar specifically?"
    a: "ZipRecruiter dominates US hourly + blue-collar listings (warehouse, retail, hospitality, healthcare, trades, logistics) where Indeed and LinkedIn under-index. According to ZipRecruiter's 2024 report, the platform serves 50%+ of US blue-collar candidate searches with 9M+ listings — much of it small/mid-market employers Indeed misses entirely."
  - q: "What categories return the most volume?"
    a: "Top hourly + blue-collar categories: registered nurse (200K+ active), warehouse associate (150K+), truck driver (100K+), retail manager (80K+), home health aide (60K+), delivery driver (60K+), restaurant server (50K+). Together these 7 categories account for 60%+ of ZipRecruiter's hourly inventory."
  - q: "What pay ranges are typical?"
    a: "US hourly pay (2024): $15-$20/hr (warehouse/retail/restaurant), $18-$25/hr (delivery/CDL trades), $25-$45/hr (skilled trades — electrician, plumber, HVAC), $30-$60/hr (RN/nursing). State pay-transparency laws (CA, NY, CO, WA) drive 60%+ disclosure rates in those states; non-transparency states see 25-30% disclosure."
  - q: "How does ZipRecruiter compare to SimplyHired + Indeed for hourly?"
    a: "Indeed has broader overall coverage but lower hourly-tier depth. SimplyHired has comparable hourly coverage to ZipRecruiter but smaller employer breadth. For comprehensive US hourly + blue-collar recruiting coverage, run all three — typically 30-40% non-overlap. ZipRecruiter has the strongest hourly-rate disclosure rate."
  - q: "How fresh do hourly snapshots need to be?"
    a: "Hourly + blue-collar postings turn over fast (median 7-21 days on market vs 30-60 days for tech roles). For active recruiter pipelines, daily cadence catches new postings + filled roles. For weekly market-research, weekly is sufficient. Holiday windows (November-December retail, summer hospitality) drive 2-3x posting volume spikes."
  - q: "Can I detect skilled-trades shortages?"
    a: "Yes. Track per-(metro, trade) posting volume vs prior-year baseline. Persistent 2x+ year-over-year growth in trade-postings indicates structural shortage — typically electricians + plumbers + HVAC technicians lead trade-shortage signals in growing US Sun Belt metros."
---

> Thirdwatch's [ZipRecruiter Scraper](https://apify.com/thirdwatch/ziprecruiter-scraper) returns hourly + blue-collar US jobs at $0.008 per record — title, company, location, hourly rate, job type, posted date. Built for non-tech US recruiter pipelines, hourly-jobs platforms, blue-collar talent platforms, and US labor-market research targeting trades + service segments.

## Why scrape ZipRecruiter for hourly research

US hourly + blue-collar hiring operates differently from tech. According to [ZipRecruiter's 2024 Job Market report](https://www.ziprecruiter.com/), the platform serves 50%+ of US blue-collar candidate searches with 9M+ listings — much of it small/mid-market employers Indeed under-indexes. For non-tech US recruiter pipelines, hourly-jobs platforms, and blue-collar-skills research, ZipRecruiter is canonical alongside SimplyHired.

The job-to-be-done is structured. A US healthcare staffing agency monitors RN + LPN postings daily across 50 metros. A blue-collar talent platform builds per-trade per-metro lead lists for outbound. An hourly-jobs aggregator ingests warehouse + retail + restaurant postings nationally. A US labor-market research function tracks blue-collar-segment hiring trends. All reduce to category + city queries + per-record aggregation.

## How does this compare to the alternatives?

Three options for hourly + blue-collar US jobs:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Indeed (overlap, lower hourly depth) | $80 ($0.008 × 10K) | Generic US | Hours | Cross-source dedup needed |
| SimplyHired (comparable) | $80 ($0.008 × 10K) | Comparable to ZR | Hours | Cross-source dedup needed |
| Thirdwatch ZipRecruiter Scraper | $80 ($0.008 × 10K) | Camoufox + Turnstile | 5 minutes | Thirdwatch tracks ZR changes |

For comprehensive US hourly coverage, run ZipRecruiter + Indeed + SimplyHired together — typically 30-40% non-overlap.

## How to find hourly jobs in 4 steps

### Step 1: How do I authenticate?

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull hourly category × metro batches

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~ziprecruiter-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CATEGORIES = ["registered nurse", "warehouse associate", "truck driver",
              "retail manager", "home health aide", "delivery driver",
              "restaurant server", "electrician", "plumber"]
METROS = ["Phoenix, AZ", "Charlotte, NC", "Memphis, TN",
          "Indianapolis, IN", "Columbus, OH", "Atlanta, GA",
          "Houston, TX", "Dallas, TX"]

queries = [{"title": c, "location": m} for c, m in product(CATEGORIES, METROS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} hourly jobs across {df.location.nunique()} metros")
```

9 categories × 8 metros × 50 = up to 3,600 records, costing $29.

### Step 3: Parse hourly rate + filter

```python
import re

def parse_hourly(s):
    if not isinstance(s, str): return None, None
    m = re.search(r"\$([\d.]+)\s*-\s*\$?([\d.]+)\s*an hour", s, re.I)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"\$([\d.]+)\s*an hour", s, re.I)
    if m:
        v = float(m.group(1))
        return v, v
    return None, None

df[["rate_min", "rate_max"]] = df.salary.apply(parse_hourly).apply(pd.Series)
df["rate_mid"] = (df.rate_min + df.rate_max) / 2

per_trade = (
    df.dropna(subset=["rate_mid"])
    .groupby(["title", "location"])
    .agg(median_rate=("rate_mid", "median"),
         p25=("rate_mid", lambda x: x.quantile(0.25)),
         p75=("rate_mid", lambda x: x.quantile(0.75)),
         n=("rate_mid", "count"))
    .query("n >= 10")
)
print(per_trade.head(15))
```

### Step 4: Track hourly-rate trends

```python
import datetime, pathlib

ts = datetime.datetime.utcnow().strftime("%Y%m%d")
out = pathlib.Path(f"snapshots/zr-hourly-{ts}.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(per_trade.to_json(orient="records"))
print(f"Persisted {len(per_trade)} hourly-rate aggregates")
```

Weekly snapshots build the time-series for hourly-wage trend research + trade-shortage detection.

## Sample output

```json
{
  "title": "Registered Nurse - Telemetry",
  "company_name": "Banner Health",
  "location": "Phoenix, AZ 85008",
  "salary": "$38.00 - $52.00 an hour",
  "job_type": "Full-time",
  "posted_date": "1 day ago",
  "apply_url": "https://www.ziprecruiter.com/jobs/banner-health/...",
  "remote": false
}
```

## Common pitfalls

Three things go wrong in hourly pipelines. **Hourly vs annual mixing** — same listing may show "$45,000-$65,000/year" instead of hourly; filter on "an hour" string-match before treating as hourly-rate. **Salary-range vs single-rate variance** — about 25% of disclosed listings show single rate ("$25 an hour"), 75% show range; treat single-rate as both min + max. **State minimum-wage clustering** — California ($16/hr min) + Washington ($16/hr min) skew distributions vs Texas ($7.25/hr min); for accurate per-trade benchmarks, segment by state-tier rather than national medians.

Thirdwatch's actor uses Camoufox + Turnstile click at $7.64/1K, ~16% margin. Pair ZipRecruiter with [Indeed Scraper](https://apify.com/thirdwatch/indeed-scraper) and [SimplyHired Scraper](https://apify.com/thirdwatch/simplyhired-scraper) for full US hourly coverage. A fourth subtle issue worth flagging: hourly + blue-collar postings often show "Full-time + Part-time" as `job_type` simultaneously — don't filter by job-type strictly; many hourly roles are flexible-tier. A fifth pattern unique to skilled trades: licensure requirements vary by state (electrician journeyman license, RN state license) — for accurate cross-state research, factor in license-portability + state-specific certification requirements. A sixth and final pitfall: ZipRecruiter aggressively cross-posts from Indeed + employer ATS — about 40% of ZipRecruiter listings appear elsewhere with same `apply_url`. Cross-source dedup on `apply_url` essential.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. Hourly postings turn over fast (7-21 days median); daily polling captures most signal. Tier the watchlist: Tier 1 (active recruiter targets, daily), Tier 2 (broader market research, weekly), Tier 3 (long-tail discovery, monthly). 60-80% cost reduction with negligible signal loss.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Compress with gzip at write-time. Most production pipelines run 90 days raw + 12 months derived aggregates + indefinite metric time-series.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). ZipRecruiter schema occasionally changes during platform UI revisions — catch drift early.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale. This pattern is particularly important when scaling beyond 100K records per snapshot.

## Related use cases

- [Scrape ZipRecruiter jobs for aggregator](/blog/scrape-ziprecruiter-jobs-for-aggregator)
- [Build ZipRecruiter salary database for mid-market](/blog/build-ziprecruiter-salary-database-for-mid-market)
- [Scrape SimplyHired jobs for aggregator](/blog/scrape-simplyhired-jobs-for-aggregator)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape ZipRecruiter for hourly + blue-collar specifically?

ZipRecruiter dominates US hourly + blue-collar listings (warehouse, retail, hospitality, healthcare, trades, logistics) where Indeed and LinkedIn under-index. According to ZipRecruiter's 2024 report, the platform serves 50%+ of US blue-collar candidate searches with 9M+ listings — much of it small/mid-market employers Indeed misses entirely.

### What categories return the most volume?

Top hourly + blue-collar categories: registered nurse (200K+ active), warehouse associate (150K+), truck driver (100K+), retail manager (80K+), home health aide (60K+), delivery driver (60K+), restaurant server (50K+). Together these 7 categories account for 60%+ of ZipRecruiter's hourly inventory.

### What pay ranges are typical?

US hourly pay (2024): $15-$20/hr (warehouse/retail/restaurant), $18-$25/hr (delivery/CDL trades), $25-$45/hr (skilled trades — electrician, plumber, HVAC), $30-$60/hr (RN/nursing). State pay-transparency laws (CA, NY, CO, WA) drive 60%+ disclosure rates in those states; non-transparency states see 25-30% disclosure.

### How does ZipRecruiter compare to SimplyHired + Indeed for hourly?

Indeed has broader overall coverage but lower hourly-tier depth. SimplyHired has comparable hourly coverage to ZipRecruiter but smaller employer breadth. For comprehensive US hourly + blue-collar recruiting coverage, run all three — typically 30-40% non-overlap. ZipRecruiter has the strongest hourly-rate disclosure rate.

### How fresh do hourly snapshots need to be?

Hourly + blue-collar postings turn over fast (median 7-21 days on market vs 30-60 days for tech roles). For active recruiter pipelines, daily cadence catches new postings + filled roles. For weekly market-research, weekly is sufficient. Holiday windows (November-December retail, summer hospitality) drive 2-3x posting volume spikes.

### Can I detect skilled-trades shortages?

Yes. Track per-`(metro, trade)` posting volume vs prior-year baseline. Persistent 2x+ year-over-year growth in trade-postings indicates structural shortage — typically electricians + plumbers + HVAC technicians lead trade-shortage signals in growing US Sun Belt metros.

Run the [ZipRecruiter Scraper on Apify Store](https://apify.com/thirdwatch/ziprecruiter-scraper) — pay-per-job, free to try, no credit card to test.
