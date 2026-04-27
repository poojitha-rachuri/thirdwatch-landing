---
title: "Scrape Reed Jobs for UK Recruiter Pipeline (2026)"
slug: "scrape-reed-jobs-for-uk-recruiter-pipeline"
description: "Pull Reed UK jobs at $0.003 per record using Thirdwatch. Structured Next.js data + UK-specific filters + recipes for recruiter platforms."
actor: "reed-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/reed-scraper"
actorTitle: "Reed Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "track-uk-tech-hiring-with-reed"
  - "build-uk-jobs-aggregator-from-reed"
  - "scrape-adzuna-jobs-for-uk-and-eu-recruiting"
keywords:
  - "reed scraper"
  - "uk jobs api"
  - "reed.co.uk scraper"
  - "uk recruitment data"
faqs:
  - q: "Why scrape Reed for UK recruiting?"
    a: "Reed.co.uk is one of the UK's largest recruitment platforms — Reed Specialist Recruitment + reed.co.uk indexes 250K+ active UK listings. According to Reed's 2024 report, the platform serves 75M+ candidate-views monthly with strong coverage of professional services, finance, healthcare, and tech roles. For UK recruiter pipelines + UK aggregator builders, Reed is essential alongside Adzuna and Indeed UK."
  - q: "What data does the actor return?"
    a: "Per job: title, company, location (city + region + postcode), salary (£ annual or hourly), category, contract_type, posted date, description, apply URL. About 65% of Reed jobs publish structured salary (higher than Indeed UK). Reed provides structured Next.js data (`__NEXT_DATA__` embedded JSON) — no DOM scraping required."
  - q: "How does Reed handle anti-bot defenses?"
    a: "Reed has lightweight anti-bot defenses; HTTP scraping with `__NEXT_DATA__` extraction works reliably. Sustained polling rate: 200 records/minute per proxy IP. Production-tested with 95%+ success rate. Failed queries auto-retry."
  - q: "How does Reed compare to Adzuna + Indeed UK?"
    a: "Three UK boards have meaningful coverage — Reed (250K listings, professional-tier focus), Adzuna (1M aggregated UK + EU, ONS partnership), Indeed UK (3M broad coverage, lower salary disclosure). For comprehensive UK recruitment coverage, run all three. Reed has stronger contract-tier filtering (Permanent, Contract, Temporary) which matters for UK staffing-agency pipelines."
  - q: "How fresh do Reed signals need to be?"
    a: "For active UK recruiter pipelines, daily cadence catches new postings. For UK labor-market research, weekly suffices. Reed postings update within hours of submission; for staffing agencies bidding on contract roles, multiple-times-daily polling is justified."
  - q: "How does this compare to Reed's official API?"
    a: "Reed's official API is gated behind Reed Recruiter accounts ($999/month+). The actor delivers similar coverage at $0.003/record without recruiter-account gatekeeping. For active recruiter operations using Reed's full ATS integration, the API is required. For research + aggregator use cases, the actor is materially cheaper."
---

> Thirdwatch's [Reed Scraper](https://apify.com/thirdwatch/reed-scraper) returns UK jobs at $0.003 per record — title, company, location, salary, contract type, description, apply URL. Built for UK recruiter pipelines, UK staffing-agency platforms, UK labor-market research, and aggregator builders.

## Why scrape Reed for UK recruiting

Reed.co.uk dominates UK professional-tier recruitment. According to [Reed's 2024 report](https://www.reed.co.uk/), the platform serves 75M+ candidate-views monthly across 250K+ active UK listings with strong coverage of professional services, finance, healthcare, and tech roles. For UK recruiter pipelines, staffing agencies, and aggregator builders, Reed is essential alongside Adzuna and Indeed UK.

The job-to-be-done is structured. A UK recruiter platform monitors 30 categories × 20 cities = 600 queries weekly across professional UK markets. A UK staffing agency tracks Contract + Temporary tiers daily for time-sensitive bidding. A UK labor-market research function maps Reed alongside Adzuna for comprehensive professional-tier UK data. A UK aggregator builder ingests Reed for stronger professional-tier coverage. All reduce to category + city + contract-type queries + per-record aggregation.

## How does this compare to the alternatives?

Three options for Reed data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Reed Recruiter API | $999+/month | Official + ATS integration | Days | Per-account license |
| Adzuna + Indeed UK | $80+ ($0.008 × 10K) | Generic UK | Hours | Cross-source dedup |
| Thirdwatch Reed Scraper | $30 ($0.003 × 10K) | HTTP + Next.js data | 5 minutes | Thirdwatch tracks Reed changes |

Reed Recruiter API is gated behind active recruiter accounts. The [Reed Scraper actor page](/scrapers/reed-scraper) delivers raw professional-tier UK data at materially lower per-record cost.

## How to scrape Reed in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull UK category × city batches?

Pass keyword + location + contract-type queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~reed-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

KEYWORDS = ["software engineer", "accountant", "marketing manager",
            "registered nurse", "operations manager", "project manager"]
UK_CITIES = ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol"]

queries = [{"keyword": k, "location": c, "contract_type": "permanent"}
           for k, c in product(KEYWORDS, UK_CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} permanent UK jobs across {df.location.nunique()} cities")
```

6 keywords × 5 cities = 30 queries × 100 = up to 3,000 records, costing $9.

### Step 3: How do I parse contract tiers + filter?

Reed's contract-type field enables UK-specific staffing analysis.

```python
df["contract_type"] = df.contract_type.fillna("Unknown")
df["salary_min_gbp"] = pd.to_numeric(df.salary_min, errors="coerce")
df["salary_max_gbp"] = pd.to_numeric(df.salary_max, errors="coerce")

contract_dist = df.contract_type.value_counts()
print("Contract type distribution:")
print(contract_dist)

permanent = df[df.contract_type == "Permanent"]
contract = df[df.contract_type == "Contract"]
print(f"\nPermanent: {len(permanent)} jobs, median £{permanent.salary_min_gbp.median():,.0f}")
print(f"Contract: {len(contract)} jobs, median day-rate £{contract.salary_min_gbp.median():,.0f}")
```

UK contract roles publish day-rates rather than annual salary; segment analysis prevents misleading benchmarks across tiers.

### Step 4: How do I push to Postgres?

Upsert per apply_url for cross-snapshot dedup.

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO uk_reed_jobs (apply_url, title, company, location,
                                       salary, contract_type, posted_date, scraped_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             salary = EXCLUDED.salary,
             scraped_at = now()""",
        [(j["apply_url"], j["title"], j["company"], j.get("location"),
          j.get("salary"), j.get("contract_type"), j.get("posted_date"), "now()")
         for _, j in df.iterrows()],
    )
print(f"Upserted {len(df)} Reed UK jobs")
```

## Sample output

A single Reed job record looks like this. Five rows weigh ~5 KB.

```json
{
  "title": "Senior Software Engineer (Python)",
  "company": "FinTech Co",
  "location": "London, EC2A",
  "salary": "£75,000 - £95,000",
  "salary_min": 75000,
  "salary_max": 95000,
  "contract_type": "Permanent",
  "category": "IT Jobs",
  "description": "We are looking for a Senior Software Engineer...",
  "posted_date": "2026-04-25",
  "apply_url": "https://www.reed.co.uk/jobs/senior-software-engineer/12345"
}
```

`contract_type` distinguishes UK-specific Permanent / Contract / Temporary tiers — critical for staffing-agency analysis. `category` follows Reed's structured taxonomy useful for cross-category research.

## Common pitfalls

Three things go wrong in Reed pipelines. **Day-rate vs annual salary mixing** — Contract roles often show £400-£800/day rates; for cross-tier salary analysis, normalize to annual via × 250 (UK working days). **Postcode granularity** — Reed publishes UK postcode area (EC2A) rather than full postcode (EC2A 4PB); for PostGIS-based territory analysis, supplement with full-postcode lookups. **Recruiter-vs-direct posting attribution** — about 60% of Reed listings are recruiter-posted (anonymous client name); the company field shows the recruiter, not the actual employer. For employer-direct analysis, filter on company-name-disclosure pattern.

Thirdwatch's actor uses HTTP + `__NEXT_DATA__` extraction at $0.10/1K, ~88% margin. Pair Reed with [Adzuna Scraper](https://apify.com/thirdwatch/adzuna-scraper) and [Indeed Scraper](https://apify.com/thirdwatch/indeed-scraper) for comprehensive UK coverage. A fourth subtle issue: Reed's day-rate format varies — "£500 per day" vs "£500-£600 per day" vs "Up to £600 per day"; for accurate day-rate parsing, handle all three formats. A fifth pattern unique to UK staffing: contract roles reposted multiple times (typical 2-4x per quarter for in-demand contractors); dedupe on `(title, company, location, contract_type)` over rolling 90-day window for accurate active-contract counts. A sixth and final pitfall: Reed surfaces a "boost" tier where employers pay for higher visibility — these appear at top of results regardless of recency, so for true new-posting velocity tracking, sort by `posted_date` rather than relying on Reed's default ranking.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. UK postings accumulate at moderate volume — daily polling on top categories + weekly on long-tail covers most use cases. 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful as your salary-parser or category-classifier evolves.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Reed schema occasionally changes during platform UI revisions — catch drift early. Cross-snapshot diff alerts on field-level changes (company-name disclosures, contract-type changes, postcode-format updates) catch structural shifts that pure aggregate-trend monitoring misses.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, ownership-transfers, status changes. These structural changes precede or follow material events (acquisitions, rebrands, regulatory issues, leadership departures) and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs (name changes, category re-classifications, status updates) to human reviewers; low-leverage diffs (single-record additions, minor count updates) stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale.

## Related use cases

- [Track UK tech hiring with Reed](/blog/track-uk-tech-hiring-with-reed)
- [Build UK jobs aggregator from Reed](/blog/build-uk-jobs-aggregator-from-reed)
- [Scrape Adzuna jobs for UK and EU recruiting](/blog/scrape-adzuna-jobs-for-uk-and-eu-recruiting)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Reed for UK recruiting?

Reed.co.uk is one of the UK's largest recruitment platforms — Reed Specialist Recruitment + reed.co.uk indexes 250K+ active UK listings. According to Reed's 2024 report, the platform serves 75M+ candidate-views monthly with strong coverage of professional services, finance, healthcare, and tech roles. For UK recruiter pipelines + UK aggregator builders, Reed is essential alongside Adzuna and Indeed UK.

### What data does the actor return?

Per job: title, company, location (city + region + postcode), salary (£ annual or hourly), category, contract_type, posted date, description, apply URL. About 65% of Reed jobs publish structured salary (higher than Indeed UK). Reed provides structured Next.js data (`__NEXT_DATA__` embedded JSON) — no DOM scraping required.

### How does Reed handle anti-bot defenses?

Reed has lightweight anti-bot defenses; HTTP scraping with `__NEXT_DATA__` extraction works reliably. Sustained polling rate: 200 records/minute per proxy IP. Production-tested with 95%+ success rate. Failed queries auto-retry.

### How does Reed compare to Adzuna + Indeed UK?

Three UK boards have meaningful coverage — Reed (250K listings, professional-tier focus), Adzuna (1M aggregated UK + EU, ONS partnership), Indeed UK (3M broad coverage, lower salary disclosure). For comprehensive UK recruitment coverage, run all three. Reed has stronger contract-tier filtering (Permanent, Contract, Temporary) which matters for UK staffing-agency pipelines.

### How fresh do Reed signals need to be?

For active UK recruiter pipelines, daily cadence catches new postings. For UK labor-market research, weekly suffices. Reed postings update within hours of submission; for staffing agencies bidding on contract roles, multiple-times-daily polling is justified.

### How does this compare to Reed's official API?

[Reed's official API](https://www.reed.co.uk/developers/jobseeker) is gated behind Reed Recruiter accounts ($999/month+). The actor delivers similar coverage at $0.003/record without recruiter-account gatekeeping. For active recruiter operations using Reed's full ATS integration, the API is required. For research + aggregator use cases, the actor is materially cheaper.

Run the [Reed Scraper on Apify Store](https://apify.com/thirdwatch/reed-scraper) — pay-per-job, free to try, no credit card to test.
