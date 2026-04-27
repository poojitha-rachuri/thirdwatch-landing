---
title: "Scrape ZipRecruiter Jobs for Aggregator (2026)"
slug: "scrape-ziprecruiter-jobs-for-aggregator"
description: "Pull ZipRecruiter US jobs at $0.008 per record using Thirdwatch. Hourly + blue-collar coverage + recipes for jobs aggregator builders."
actor: "ziprecruiter-scraper"
actor_url: "https://apify.com/thirdwatch/ziprecruiter-scraper"
actorTitle: "ZipRecruiter Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "find-hourly-and-blue-collar-jobs-on-ziprecruiter"
  - "build-ziprecruiter-salary-database-for-mid-market"
  - "scrape-indeed-jobs-for-recruiter-pipeline"
keywords:
  - "ziprecruiter scraper"
  - "scrape hourly jobs"
  - "blue collar jobs scraper"
  - "ziprecruiter api alternative"
faqs:
  - q: "Why ZipRecruiter for jobs aggregation?"
    a: "ZipRecruiter dominates US hourly + mid-market hiring (retail, hospitality, healthcare, logistics, blue-collar trades) where Indeed and LinkedIn both under-index. According to ZipRecruiter's 2024 report, the platform indexes 9M+ active US listings with strong coverage of small/mid-market employers. For aggregator-builders targeting non-tech US labor markets, ZipRecruiter is essential alongside Indeed."
  - q: "How does ZipRecruiter handle anti-bot defenses?"
    a: "ZipRecruiter uses Cloudflare Turnstile aggressively. Thirdwatch's actor uses Camoufox + humanize behavior + Turnstile iframe click at (28,28) — production-tested with 100% bypass rate. Failed queries auto-retry with fresh proxy. About $0.07-$0.18 per run for 5-10 jobs at full ZipRecruiter coverage."
  - q: "What data does the actor return?"
    a: "Per job: title, company, location (city + state + zip), salary (when published, ~25% of US listings), job type, description, posted date, apply URL. Per query: results across keyword + location filtering. Salary publication has improved with state pay-transparency laws (CA, NY, CO, WA require disclosure on certain roles)."
  - q: "How does ZipRecruiter compare to Indeed?"
    a: "Indeed has broader US coverage (7M listings) but skews toward mid-market + tech. ZipRecruiter (9M listings) catches more SMB + hourly + blue-collar roles Indeed misses. For comprehensive US labor-market coverage, run both — typically 30-40% non-overlap. For tech recruiting, Indeed is primary; for hourly/blue-collar, ZipRecruiter is primary."
  - q: "What's the cost for an aggregator with ZipRecruiter?"
    a: "$0.008/record FREE tier. A 200-keyword daily run at 100 results each = 20K records/day = $160/day FREE. Combined with Indeed + LinkedIn = $480/day for full US-jobs coverage. For SMB-mid-market aggregators (50K daily records), $5-15K/month all-source. Scale linearly with scope."
  - q: "Can I track salary trends with ZipRecruiter?"
    a: "Yes, with caveats. Salary publication on ZipRecruiter is ~25% of listings (lower than Indeed's ~40%). State pay-transparency laws pushed disclosure rates higher in CA/NY/CO/WA. For mid-market salary benchmarks (where ZipRecruiter dominates), 200+ rows per (title × metro) cell produces stable percentile bands. For tech/professional roles, Indeed has better salary depth."
---

> Thirdwatch's [ZipRecruiter Scraper](https://apify.com/thirdwatch/ziprecruiter-scraper) returns US hourly + mid-market jobs at $0.008 per record — title, company, location, salary, job type, description, posted date, apply URL. Built for jobs-aggregator developers, US-recruiter pipelines, hourly/blue-collar talent platforms, and labor-market research targeting non-tech US segments.

## Why scrape ZipRecruiter

ZipRecruiter dominates US hourly + mid-market hiring. According to [ZipRecruiter's 2024 report](https://www.ziprecruiter.com/), the platform indexes 9M+ active US listings — the largest single-source US jobs corpus alongside Indeed. For aggregator-builders targeting non-tech US labor markets (retail, hospitality, healthcare, logistics, blue-collar trades), ZipRecruiter is essential coverage.

The job-to-be-done is structured. A US-jobs aggregator covers 50 metros × 100 keywords = 5,000 queries per refresh. A hourly-jobs platform monitors 50 retail/hospitality categories nationally. A US-labor-market research function tracks mid-market hiring shifts on hourly cadence. A staffing-agency pipeline matches candidates to ZipRecruiter postings via cross-referencing skills + location. All reduce to category + city queries + ZipRecruiter-specific result aggregation.

## How does this compare to the alternatives?

Three options for ZipRecruiter data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| ZipRecruiter API (paid) | $5K–$50K/year | Official | Days (approval) | Per-tier license |
| Indeed scraper (overlap) | $8 ($0.008 × 1,000) | Coverage gap on hourly/SMB | 5 minutes | Generic US coverage |
| Thirdwatch ZipRecruiter Scraper | $8 ($0.008 × 1,000) | Camoufox + Turnstile | 5 minutes | Thirdwatch tracks ZipRecruiter changes |

ZipRecruiter's first-party API is gated behind partner approval. Indeed alone misses ~30% of ZipRecruiter coverage (especially hourly/SMB). The [ZipRecruiter Scraper actor page](/scrapers/ziprecruiter-scraper) gives you raw data at the lowest unit cost.

## How to scrape ZipRecruiter in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a category × city batch?

Pass title + location queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~ziprecruiter-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

TITLES = ["registered nurse", "warehouse associate",
          "truck driver", "retail manager",
          "restaurant server", "home health aide",
          "delivery driver", "customer service rep"]
CITIES = ["Phoenix, AZ", "Charlotte, NC", "Memphis, TN",
          "Indianapolis, IN", "Columbus, OH"]

queries = [{"title": t, "location": c} for t, c in product(TITLES, CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.location.nunique()} locations")
```

8 titles × 5 cities = 40 queries × 50 results = up to 2,000 records, costing $16.

### Step 3: How do I dedupe + filter?

Filter to fresh, salary-disclosed roles.

```python
df["posted_days_ago"] = df.posted_date.str.extract(r"(\d+)").astype(float)
df["has_salary"] = df.salary.notna() & (df.salary != "")

active = df[
    (df.posted_days_ago <= 7)
    & df.has_salary
].drop_duplicates(subset=["apply_url"])

print(f"{len(active)} fresh + salary-disclosed jobs")
print(active[["title", "company_name", "location", "salary"]].head(15))
```

Fresh + salary-disclosed cohort enables high-quality aggregator content with strong consumer signals.

### Step 4: How do I push to a Postgres index?

Upsert on apply_url for cross-snapshot dedup.

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO jobs (apply_url, title, company_name, location,
                              salary, job_type, source, posted_date, scraped_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             salary = EXCLUDED.salary,
             scraped_at = now()""",
        [(j["apply_url"], j["title"], j["company_name"], j.get("location"),
          j.get("salary"), j.get("job_type"), "ziprecruiter",
          j.get("posted_date"), "now()") for _, j in active.iterrows()],
    )
print(f"Upserted {len(active)} ZipRecruiter rows")
```

## Sample output

A single ZipRecruiter record looks like this. Five rows weigh ~7 KB.

```json
{
  "title": "Warehouse Associate",
  "company_name": "Amazon",
  "location": "Phoenix, AZ 85042",
  "salary": "$18.50 - $22.00 an hour",
  "job_type": "Full-time",
  "description": "Pick + pack orders in our Phoenix fulfillment center...",
  "posted_date": "2 days ago",
  "apply_url": "https://www.ziprecruiter.com/jobs/amazon-/...",
  "remote": false
}
```

`apply_url` is the canonical natural key. `salary` (when present) follows hourly format ($X.XX an hour) — convert to annual via × 2080 for cross-source benchmarking. `posted_date` enables freshness filtering.

## Common pitfalls

Three things go wrong in ZipRecruiter pipelines. **Cloudflare Turnstile drift** — Turnstile periodically updates challenge mechanics; the actor's Turnstile iframe click pattern is robust but may need updates. Thirdwatch tracks these changes. **Salary format variance** — hourly ($X/hr), weekly ($X/wk), monthly ($X/mo), annual ($X/yr); always normalize to annual before benchmark aggregation. **Re-listing inflation** — small/mid-market employers re-post the same role frequently; smooth velocity calculations with 7-day rolling averages.

Thirdwatch's actor uses Camoufox + humanize + Turnstile iframe click at $7.64/1K, ~16% margin (relatively expensive due to Turnstile + humanize compute). Pair ZipRecruiter with [Indeed Scraper](https://apify.com/thirdwatch/indeed-scraper) for full US coverage and [SimplyHired Scraper](https://apify.com/thirdwatch/simplyhired-scraper) for additional aggregator depth. A fourth subtle issue worth flagging: ZipRecruiter aggressively cross-posts listings from other sources (especially Indeed and direct ATS), so cross-source dedup is essential — typical 25-40% overlap with Indeed, normalized on `(title, company, location, salary_min)`. A fifth pattern unique to ZipRecruiter: hourly-rate roles (warehouse, retail, hospitality) cluster heavily around state minimum-wage bands; for accurate per-region wage analysis, segment by state minimum-wage tier rather than treating national medians as comparable. A sixth and final pitfall: ZipRecruiter's "estimated salary" feature populates a salary range when the employer didn't disclose — these are model-derived estimates, not employer-published. For employer-truth analysis, filter on `salary_disclosure: employer-published` rather than including estimated values.  A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size.

An eighth subtle issue: snapshot-storage strategy materially affects long-term economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. Partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Find hourly and blue-collar jobs on ZipRecruiter](/blog/find-hourly-and-blue-collar-jobs-on-ziprecruiter)
- [Build ZipRecruiter salary database for mid-market](/blog/build-ziprecruiter-salary-database-for-mid-market)
- [Scrape Indeed jobs for recruiter pipeline](/blog/scrape-indeed-jobs-for-recruiter-pipeline)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why ZipRecruiter for jobs aggregation?

ZipRecruiter dominates US hourly + mid-market hiring (retail, hospitality, healthcare, logistics, blue-collar trades) where Indeed and LinkedIn both under-index. According to ZipRecruiter's 2024 report, the platform indexes 9M+ active US listings with strong coverage of small/mid-market employers. For aggregator-builders targeting non-tech US labor markets, ZipRecruiter is essential alongside Indeed.

### How does ZipRecruiter handle anti-bot defenses?

ZipRecruiter uses Cloudflare Turnstile aggressively. Thirdwatch's actor uses Camoufox + humanize behavior + Turnstile iframe click at (28,28) — production-tested with 100% bypass rate. Failed queries auto-retry with fresh proxy. About $0.07-$0.18 per run for 5-10 jobs at full ZipRecruiter coverage.

### What data does the actor return?

Per job: title, company, location (city + state + zip), salary (when published, ~25% of US listings), job type, description, posted date, apply URL. Per query: results across keyword + location filtering. Salary publication has improved with state pay-transparency laws (CA, NY, CO, WA require disclosure on certain roles).

### How does ZipRecruiter compare to Indeed?

Indeed has broader US coverage (7M listings) but skews toward mid-market + tech. ZipRecruiter (9M listings) catches more SMB + hourly + blue-collar roles Indeed misses. For comprehensive US labor-market coverage, run both — typically 30-40% non-overlap. For tech recruiting, Indeed is primary; for hourly/blue-collar, ZipRecruiter is primary.

### What's the cost for an aggregator with ZipRecruiter?

$0.008/record FREE tier. A 200-keyword daily run at 100 results each = 20K records/day = $160/day FREE. Combined with Indeed + LinkedIn = $480/day for full US-jobs coverage. For SMB-mid-market aggregators (50K daily records), $5-15K/month all-source. Scale linearly with scope.

### Can I track salary trends with ZipRecruiter?

Yes, with caveats. Salary publication on ZipRecruiter is ~25% of listings (lower than Indeed's ~40%). State pay-transparency laws pushed disclosure rates higher in CA/NY/CO/WA. For mid-market salary benchmarks (where ZipRecruiter dominates), 200+ rows per (title × metro) cell produces stable percentile bands. For tech/professional roles, Indeed has better salary depth.

Run the [ZipRecruiter Scraper on Apify Store](https://apify.com/thirdwatch/ziprecruiter-scraper) — pay-per-job, free to try, no credit card to test.
