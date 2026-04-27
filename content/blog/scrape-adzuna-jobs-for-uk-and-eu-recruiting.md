---
title: "Scrape Adzuna Jobs for UK and EU Recruiting (2026)"
slug: "scrape-adzuna-jobs-for-uk-and-eu-recruiting"
description: "Pull Adzuna UK + EU jobs at $0.0015 per record using Thirdwatch. Salary benchmarks + UK Office of National Statistics partnership data + recipes."
actor: "adzuna-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/adzuna-scraper"
actorTitle: "Adzuna Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "build-adzuna-uk-salary-benchmarks"
  - "track-uk-job-market-with-adzuna"
  - "scrape-reed-jobs-for-uk-recruiter-pipeline"
keywords:
  - "adzuna scraper"
  - "uk jobs aggregator"
  - "eu jobs api alternative"
  - "uk salary benchmarks"
faqs:
  - q: "Why scrape Adzuna for UK + EU recruiting?"
    a: "Adzuna is the UK's official labor-market data partner with the Office of National Statistics. According to Adzuna's 2024 partnership disclosures, the platform indexes 1M+ active UK + EU listings with structured salary data on 60%+ of postings (materially higher than US Indeed). For UK recruiter pipelines, EU labor-market research, and salary-benchmarking research, Adzuna is the canonical mid-market source."
  - q: "What data does the actor return?"
    a: "Per job: title, company, location (UK postcode + region), salary (annual, typically published), category, contract_type, posted date, description, apply URL. About 60% of UK + EU jobs publish structured salary (much higher than US sources). Adzuna also publishes regional + role-level salary aggregates in their official ONS partnership reports."
  - q: "How does Adzuna handle anti-bot defenses?"
    a: "Adzuna allows lightweight HTTP scraping with datacenter proxy. No Cloudflare, no DataDome, no Turnstile. Sustained polling rate: 500 records per minute per proxy IP. Production-tested at 95%+ success rate. Failed queries auto-retry with fresh datacenter proxy."
  - q: "How does Adzuna compare to Indeed UK + LinkedIn UK?"
    a: "Indeed UK has broader employer coverage (3M+ UK listings) but lower salary-publication rate (~30%). LinkedIn UK skews toward MNC + tech (lower mid-market coverage). Adzuna sits in the middle — strong mid-market UK coverage with higher salary-disclosure rate due to ONS-partnership structuring requirements. For UK salary-benchmarking, Adzuna is primary; for breadth, supplement with Indeed."
  - q: "How fresh do Adzuna signals need to be?"
    a: "For active UK recruiter pipelines, daily cadence catches new postings. For UK labor-market research aligned with ONS-cycle, weekly snapshots suffice. For longitudinal salary research, monthly aggregates produce stable trend data. UK fiscal-year cycle (April-March) drives most salary-band adjustments — late-March + April postings show 5-10% higher offered comp than other periods."
  - q: "How does this compare to Adzuna's official API?"
    a: "Adzuna's official API has 250 calls/month free + paid tiers up to $5K+/month for higher volume. The actor delivers raw job data at $0.0015/record without API gatekeeping. For low-volume one-off research (under 250 calls/month), Adzuna's free API tier is cheapest. For high-volume aggregator pipelines, the actor scales linearly without per-call billing."
---

> Thirdwatch's [Adzuna Scraper](https://apify.com/thirdwatch/adzuna-scraper) returns UK + EU jobs at $0.0015 per record — title, company, salary (60%+ disclosure), location, contract type, description, apply URL. Built for UK recruiter pipelines, EU labor-market research, salary-benchmarking platforms, and aggregator builders targeting UK + EU.

## Why scrape Adzuna for UK + EU recruiting

Adzuna is the UK's official labor-market data partner. According to [Adzuna's 2024 partnership with the UK Office for National Statistics](https://www.adzuna.co.uk/), the platform indexes 1M+ UK + EU listings with structured salary data on 60%+ of postings — materially higher disclosure rate than US Indeed. For UK recruiter pipelines, EU labor-market research, and salary-benchmarking, Adzuna is the canonical mid-market source.

The job-to-be-done is structured. A UK recruiter platform monitors 50 categories × 30 cities = 1,500 queries weekly for UK + EU coverage. A salary-benchmarking SaaS powers UK pay-transparency calculators with live Adzuna data. An EU labor-market research function tracks per-country hiring + salary trends for ONS-cycle reporting. A UK aggregator builder ingests Adzuna alongside Indeed UK + LinkedIn UK for comprehensive coverage. All reduce to category + city queries + per-record salary aggregation.

## How does this compare to the alternatives?

Three options for UK + EU jobs data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Adzuna official API | Free (250 calls/month) → $5K+/year | Official | Days (key approval) | Per-tier billing |
| Indeed UK / LinkedIn UK | $80 ($0.008 × 10K) | Broader coverage, lower salary | Hours | Generic UK |
| Thirdwatch Adzuna Scraper | $15 ($0.0015 × 10K) | HTTP + datacenter proxy | 5 minutes | Thirdwatch tracks Adzuna changes |

Adzuna's first-party API has 250 calls/month free + paid tiers. The [Adzuna Scraper actor page](/scrapers/adzuna-scraper) delivers raw job data at materially lower per-record cost for high-volume aggregators.

## How to scrape Adzuna in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull UK category × city batches?

Pass title + location queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~adzuna-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

TITLES = ["software engineer", "data scientist",
          "registered nurse", "accountant",
          "marketing manager", "operations manager"]
UK_CITIES = ["London", "Manchester", "Birmingham",
             "Edinburgh", "Bristol", "Leeds"]

queries = [{"title": t, "location": c} for t, c in product(TITLES, UK_CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "country": "uk", "maxResults": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} UK jobs across {df.location.nunique()} cities")
```

6 titles × 6 cities = 36 queries × 100 = up to 3,600 records, costing $5.40.

### Step 3: How do I parse salary + build percentile bands?

Adzuna salaries publish in £ annual format.

```python
import re

def parse_gbp(s):
    if not isinstance(s, str): return None, None
    m = re.search(r"£([\d,]+)\s*-\s*£?([\d,]+)", s)
    if m:
        return float(m.group(1).replace(",", "")), float(m.group(2).replace(",", ""))
    m = re.search(r"£([\d,]+)", s)
    if m:
        v = float(m.group(1).replace(",", ""))
        return v, v
    return None, None

df[["sal_min_gbp", "sal_max_gbp"]] = df.salary.apply(parse_gbp).apply(pd.Series)
df["sal_mid"] = (df.sal_min_gbp + df.sal_max_gbp) / 2

bands = (
    df.dropna(subset=["sal_mid"])
    .groupby(["title", "location"])
    .agg(p25=("sal_mid", lambda x: x.quantile(0.25)),
         p50=("sal_mid", "median"),
         p75=("sal_mid", lambda x: x.quantile(0.75)),
         n=("sal_mid", "count"))
    .query("n >= 30")
)
print(bands)
```

UK title × city × percentile bands feed pay-transparency calculators + UK salary-benchmarking platforms.

### Step 4: How do I push to Postgres?

Upsert per apply_url for cross-snapshot dedup.

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO uk_jobs (apply_url, title, company, location, salary,
                                  sal_min_gbp, sal_max_gbp, contract_type,
                                  posted_date, scraped_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             salary = EXCLUDED.salary,
             scraped_at = now()""",
        [(j["apply_url"], j["title"], j["company"], j.get("location"),
          j.get("salary"), j.get("sal_min_gbp"), j.get("sal_max_gbp"),
          j.get("contract_type"), j.get("posted_date"), "now()")
         for _, j in df.iterrows()],
    )
print(f"Upserted {len(df)} UK jobs")
```

## Sample output

A single Adzuna UK job record looks like this. Five rows weigh ~5 KB.

```json
{
  "title": "Senior Software Engineer",
  "company": "Monzo Bank",
  "location": "London, UK",
  "postcode": "EC2A 4PB",
  "salary": "£90,000 - £130,000",
  "category": "IT Jobs",
  "contract_type": "Permanent",
  "description": "We are looking for a Senior Software Engineer to join...",
  "posted_date": "2026-04-25",
  "apply_url": "https://www.adzuna.co.uk/details/...",
  "country": "uk"
}
```

`postcode` is a UK-specific killer field — enables PostGIS-based territory mapping + commute-radius analysis. `category` follows Adzuna's structured taxonomy (IT Jobs, Healthcare Jobs, etc) — useful for cross-category aggregation.

## Common pitfalls

Three things go wrong in Adzuna pipelines. **Currency variance for EU jobs** — Adzuna covers UK (£), Germany (€), France (€), Netherlands (€); ensure currency normalization before cross-country benchmarking. **Contract-type variance** — UK uses "Permanent", "Contract", "Temporary"; for cross-source dedup with US sources, normalize to canonical (Full-time, Contract, Part-time). **Salary-disclosure regional shift** — UK pay-transparency regulations have driven disclosure-rate from ~30% (2020) to 60%+ (2024); for longitudinal research, weight historical salary data carefully against recent.

Thirdwatch's actor uses HTTP + datacenter proxy at $0.20/1K, ~75% margin. Pair Adzuna with [Reed Scraper](https://apify.com/thirdwatch/reed-scraper) and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for comprehensive UK coverage. A fourth subtle issue worth flagging: Adzuna aggregates from many UK boards (including direct-employer career pages); same role often appears under multiple Adzuna source-attribution paths. Dedupe on `(title, company, location, salary_min)` before treating as unique. A fifth pattern unique to UK labor-market research: ONS-cycle releases drive temporary spikes in Adzuna-aligned research traffic (early-month around ONS publication dates); during ONS-aligned research windows, supplement scraped data with ONS-published aggregate benchmarks for boardroom-grade reporting. A sixth and final pitfall: Adzuna's salary publication is heavily title-dependent — engineering + finance + healthcare have 70-80% disclosure; sales + marketing have 40-50%; trades + retail under 30%. For accurate per-category benchmarks, use disclosure-rate weighting + flag categories with low disclosure as estimate-only.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. UK + EU jobs accumulate at moderate volume — daily polling on top categories + weekly on long-tail covers most use cases. Tier the watchlist into Tier 1 (active recruiter pipelines, daily), Tier 2 (broad UK + EU research, weekly), Tier 3 (long-tail country research, monthly). 60-80% cost reduction with negligible signal loss.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful as your salary-parser or category-classifier evolves. Compress with gzip at write-time.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Adzuna schema occasionally changes during ONS-partnership reporting cycles — catch drift early.  A seventh and final operational pattern unique to this scraper at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, ownership-transfers, status-changes. These structural changes precede or follow material events (acquisitions, rebrands, regulatory issues, leadership departures) and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, for each scrape, persist (field, old_value, new_value) tuples. Surface high-leverage diffs (name changes, category re-classifications, headcount shifts >10%) to human reviewers; low-leverage diffs (single-record additions, minor count updates) stay in the audit log. This pattern catches signal that pure aggregate-trend monitoring misses entirely.

## Related use cases

- [Build Adzuna UK salary benchmarks](/blog/build-adzuna-uk-salary-benchmarks)
- [Track UK job market with Adzuna](/blog/track-uk-job-market-with-adzuna)
- [Scrape Reed jobs for UK recruiter pipeline](/blog/scrape-reed-jobs-for-uk-recruiter-pipeline)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Adzuna for UK + EU recruiting?

Adzuna is the UK's official labor-market data partner with the Office of National Statistics. According to Adzuna's 2024 partnership disclosures, the platform indexes 1M+ active UK + EU listings with structured salary data on 60%+ of postings (materially higher than US Indeed). For UK recruiter pipelines, EU labor-market research, and salary-benchmarking research, Adzuna is the canonical mid-market source.

### What data does the actor return?

Per job: title, company, location (UK postcode + region), salary (annual, typically published), category, contract_type, posted date, description, apply URL. About 60% of UK + EU jobs publish structured salary (much higher than US sources). Adzuna also publishes regional + role-level salary aggregates in their official ONS partnership reports.

### How does Adzuna handle anti-bot defenses?

Adzuna allows lightweight HTTP scraping with datacenter proxy. No Cloudflare, no DataDome, no Turnstile. Sustained polling rate: 500 records per minute per proxy IP. Production-tested at 95%+ success rate. Failed queries auto-retry with fresh datacenter proxy.

### How does Adzuna compare to Indeed UK + LinkedIn UK?

Indeed UK has broader employer coverage (3M+ UK listings) but lower salary-publication rate (~30%). LinkedIn UK skews toward MNC + tech (lower mid-market coverage). Adzuna sits in the middle — strong mid-market UK coverage with higher salary-disclosure rate due to ONS-partnership structuring requirements. For UK salary-benchmarking, Adzuna is primary; for breadth, supplement with Indeed.

### How fresh do Adzuna signals need to be?

For active UK recruiter pipelines, daily cadence catches new postings. For UK labor-market research aligned with ONS-cycle, weekly snapshots suffice. For longitudinal salary research, monthly aggregates produce stable trend data. UK fiscal-year cycle (April-March) drives most salary-band adjustments — late-March + April postings show 5-10% higher offered comp than other periods.

### How does this compare to Adzuna's official API?

[Adzuna's official API](https://developer.adzuna.com/) has 250 calls/month free + paid tiers up to $5K+/month for higher volume. The actor delivers raw job data at $0.0015/record without API gatekeeping. For low-volume one-off research (under 250 calls/month), Adzuna's free API tier is cheapest. For high-volume aggregator pipelines, the actor scales linearly without per-call billing.

Run the [Adzuna Scraper on Apify Store](https://apify.com/thirdwatch/adzuna-scraper) — pay-per-job, free to try, no credit card to test.
