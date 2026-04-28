---
title: "Build a ZipRecruiter Salary Database for Mid-Market (2026)"
slug: "build-ziprecruiter-salary-database-for-mid-market"
description: "Build US mid-market salary benchmarks from ZipRecruiter at $0.008 per result using Thirdwatch. Per-role per-metro per-tier salary medians + recipes."
actor: "ziprecruiter-scraper"
actor_url: "https://apify.com/thirdwatch/ziprecruiter-scraper"
actorTitle: "ZipRecruiter Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-ziprecruiter-jobs-for-aggregator"
  - "find-hourly-and-blue-collar-jobs-on-ziprecruiter"
  - "build-adzuna-uk-salary-benchmarks"
keywords:
  - "ziprecruiter salary database"
  - "us mid-market salaries"
  - "salary benchmarks 2026"
  - "compensation research"
faqs:
  - q: "Why ZipRecruiter for US mid-market salary data?"
    a: "ZipRecruiter indexes 9M+ active US jobs with salary disclosure on ~70% of listings — the highest disclosure rate of any major US board (vs Indeed ~40%, LinkedIn ~30%). According to ZipRecruiter's 2024 report, 110M+ US workers reference the platform. For mid-market (50-5000 employee) salary research, ZipRecruiter's depth + disclosure rate make it the canonical source."
  - q: "What roles + metros should the database cover?"
    a: "200 roles × 50 metros × 3 experience-tiers = 30K cells. Top 200 roles per BLS taxonomy (software engineer, RN, accountant, sales rep). Top 50 metros (NYC, SF, LA, Chicago, Dallas, Atlanta, Boston, Seattle, etc.). Tiers: junior (0-2y), mid (3-7y), senior (8+y). 30K cells × 50 listings each = 1.5M records — comprehensive US mid-market benchmark."
  - q: "How fresh do salary snapshots need to be?"
    a: "Quarterly cadence catches meaningful US mid-market salary shifts. Monthly cadence captures faster-moving markets (post-Fed-rate decisions, post-major-layoffs cycles). For active hiring-research, weekly snapshots produce stable trend data. US salary moves much slower than ecommerce or social-media — annual cadence is too sparse for compensation-decision data."
  - q: "How do I normalize salaries across hourly + annual postings?"
    a: "ZipRecruiter mixes annual ($75K), hourly ($35/hr), and ranges ($60-80K). Normalize to annual: hourly × 2080 hours/year (40 hrs/week × 52). For ranges, use median or both bounds. Filter outliers: 99th percentile within role+metro to remove obvious data-entry errors. Median salary by (role, metro, tier) is the reportable benchmark."
  - q: "Can I segment by company-size + industry?"
    a: "Yes — and segmentation reveals material differences. Mid-market (50-5000) salaries typically 70-90% of large-enterprise (5000+) but 110-130% of small (<50). Industry: tech > finance > healthcare > retail typical hierarchy. ZipRecruiter surfaces both fields when available; 60-70% of listings have explicit company-size + industry tags."
  - q: "How does this compare to Glassdoor + Levels.fyi + BLS?"
    a: "Glassdoor: 60M salaries (self-reported, varied freshness). Levels.fyi: 200K+ tech salaries (high quality, narrow universe). BLS OEWS: official US data (12-18 month lag, large strata only). ZipRecruiter: 6M+ active listings with ~70% disclosure (real-time, broad coverage). For mid-market real-time benchmarks, ZipRecruiter is materially better than alternatives. For policy research, BLS authoritative."
---

> Thirdwatch's [ZipRecruiter Scraper](https://apify.com/thirdwatch/ziprecruiter-scraper) makes US mid-market salary research a structured workflow at $0.008 per result — per-role per-metro per-experience salary medians, quarterly snapshots, mid-market segmentation. Built for compensation-research firms, HR-analytics SaaS platforms, recruiting agencies, and economic-research functions.

## Why build a ZipRecruiter salary database

ZipRecruiter has the highest US salary disclosure rate. According to [ZipRecruiter's 2024 annual report](https://www.ziprecruiter.com/), the platform indexes 9M+ active US jobs with salary disclosure on ~70% of listings — materially higher than Indeed (~40%) or LinkedIn (~30%). For mid-market (50-5000 employee) compensation research, the combination of broad coverage + high disclosure makes ZipRecruiter the canonical real-time US salary source.

The job-to-be-done is structured. A compensation-consulting firm builds a 200-role × 50-metro benchmark for client mid-market clients. A HR-analytics SaaS platform powers customer-facing salary tools with real-time data. A recruiting agency surfaces per-role market-rate context to clients during search engagements. A economic-research function studies US labor-market dynamics by metro for retail-investment thesis. All reduce to per-role + per-metro queries + quarterly aggregation.

## How does this compare to the alternatives?

Three options for US mid-market salary data:

| Approach | Cost per 30K-cell benchmark | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Mercer / Radford comp surveys | $50K-$300K/year | Authoritative | Weeks | Annual contract |
| BLS OEWS (free) | Free, 12-18mo lag | Official, lagged | Hours | Government cycle |
| Thirdwatch ZipRecruiter Scraper | ~$120/month (15K records) | Camoufox + Turnstile | 5 minutes | Thirdwatch tracks ZR |

The [ZipRecruiter Scraper actor page](/scrapers/ziprecruiter-scraper) gives you raw real-time salary data at materially lower per-record cost.

## How to build the database in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull per-role per-metro batches quarterly

```python
import os, requests, datetime, json, pathlib
from itertools import product

ACTOR = "thirdwatch~ziprecruiter-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

ROLES = ["software engineer", "registered nurse", "accountant",
         "sales representative", "project manager", "marketing manager"]
METROS = ["New York, NY", "San Francisco, CA", "Los Angeles, CA",
          "Chicago, IL", "Dallas, TX", "Atlanta, GA",
          "Boston, MA", "Seattle, WA"]

queries = [{"role": r, "location": m} for r, m in product(ROLES, METROS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/zr-salaries-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} listings across {len(queries)} role-metro combos")
```

48 role-metro × 50 = 2,400 records, costing $19.20.

### Step 3: Normalize hourly + annual to annual

```python
import re, pandas as pd

df = pd.DataFrame(records)

def to_annual(salary_min, salary_max, salary_unit):
    if pd.isna(salary_min) or pd.isna(salary_max): return (None, None)
    if salary_unit == "hour":
        return (float(salary_min) * 2080, float(salary_max) * 2080)
    if salary_unit == "year":
        return (float(salary_min), float(salary_max))
    return (None, None)

df[["annual_min", "annual_max"]] = df.apply(
    lambda r: pd.Series(to_annual(r.salary_min, r.salary_max, r.salary_unit)),
    axis=1,
)
df["annual_median"] = (df.annual_min + df.annual_max) / 2

# Tier by experience
def tier_from_title(title):
    t = str(title).lower()
    if any(k in t for k in ["senior", "staff", "principal", "lead"]): return "senior"
    if any(k in t for k in ["junior", "associate", "entry"]): return "junior"
    return "mid"

df["tier"] = df.title.apply(tier_from_title)
print(df.groupby(["role", "tier"]).annual_median.median().unstack().head())
```

### Step 4: Build per-role per-metro per-tier benchmarks

```python
benchmark = (
    df.dropna(subset=["annual_median"])
    .groupby(["role", "location", "tier"])
    .agg(median_salary=("annual_median", "median"),
         p25_salary=("annual_median", lambda x: x.quantile(0.25)),
         p75_salary=("annual_median", lambda x: x.quantile(0.75)),
         listing_count=("annual_median", "count"))
    .reset_index()
)
benchmark = benchmark[benchmark.listing_count >= 5]
benchmark.to_csv(f"snapshots/zr-benchmark-{ts}.csv", index=False)
print(f"{len(benchmark)} cells in benchmark with 5+ listings")
print(benchmark.sort_values("median_salary", ascending=False).head(20))
```

5+ listings per cell is the minimum threshold for statistical reliability. Cells with fewer listings should be marked low-confidence.

## Sample output

```json
{
  "title": "Senior Software Engineer",
  "company": "Acme Corp",
  "location": "Boston, MA",
  "salary_min": 140000,
  "salary_max": 180000,
  "salary_unit": "year",
  "company_size": "501-1000 employees",
  "industry": "Software",
  "posted_at": "2026-04-25",
  "url": "https://www.ziprecruiter.com/jobs/12345"
}
```

## Common pitfalls

Three things go wrong in salary-database pipelines. **Hourly vs annual mixing** — always normalize via 2080-hours-per-year before benchmarking. **Title-tier classification** — "Senior" in title doesn't always equal 8+ years; cross-reference with required-experience field when available. **Outlier influence** — single outlier $500K listings inflate medians; use percentile clipping (1st–99th) before aggregation.

Thirdwatch's actor uses Camoufox + humanize + Turnstile click at ~$7.64/1K, ~16% margin — one of the highest-cost actors due to ZR's aggressive Cloudflare. Pair with [Adzuna UK Salary Benchmarks](/blog/build-adzuna-uk-salary-benchmarks) for UK coverage. A fourth subtle issue: ZipRecruiter increasingly shows employer-tier-specific listings ("ZR Featured" vs standard); featured listings skew higher on salary disclosure but represent only top-tier-paying employers — segment by featured-flag if material to research. A fifth pattern: company-size signals are self-reported and skewed; for accurate mid-market segmentation, supplement with LinkedIn Company headcount data when stakes warrant. A sixth and final pitfall: post-2025 federal salary-disclosure laws (CO, NY, WA, CA, IL) drove disclosure rates up dramatically in those metros vs disclosure-optional states (FL, TX); for cross-metro comparison, control for disclosure-law effect rather than treating raw rates as comparable.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active comp-research watchlist, weekly), Tier 2 (broader US coverage, monthly), Tier 3 (long-tail roles, quarterly). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive benchmark cells from raw JSON as your tier-classification + outlier-clipping logic evolves. Cross-snapshot diff alerts on per-role-per-metro benchmark deltas catch labor-market-velocity signals.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). ZipRecruiter schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for material salary shifts (>5% YoY at role-metro-tier cell level) catch labor-market-tightening or loosening signals before they appear in lagged BLS data. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early before downstream consumers degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual analyst-action rates. If analysts ignore 80%+ of alerts at a given threshold, raise the threshold (fewer alerts, higher signal-to-noise). If they manually surface signals the alerts missed, lower the threshold. The right threshold drifts as your watchlist composition changes.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

## Related use cases

- [Scrape ZipRecruiter jobs for aggregator](/blog/scrape-ziprecruiter-jobs-for-aggregator)
- [Find hourly and blue-collar jobs on ZipRecruiter](/blog/find-hourly-and-blue-collar-jobs-on-ziprecruiter)
- [Build Adzuna UK salary benchmarks](/blog/build-adzuna-uk-salary-benchmarks)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why ZipRecruiter for US mid-market salary data?

ZipRecruiter indexes 9M+ active US jobs with salary disclosure on ~70% of listings — the highest disclosure rate of any major US board (vs Indeed ~40%, LinkedIn ~30%). According to ZipRecruiter's 2024 report, 110M+ US workers reference the platform. For mid-market (50-5000 employee) salary research, ZipRecruiter's depth + disclosure rate make it the canonical source.

### What roles + metros should the database cover?

200 roles × 50 metros × 3 experience-tiers = 30K cells. Top 200 roles per BLS taxonomy (software engineer, RN, accountant, sales rep). Top 50 metros (NYC, SF, LA, Chicago, Dallas, Atlanta, Boston, Seattle, etc.). Tiers: junior (0-2y), mid (3-7y), senior (8+y). 30K cells × 50 listings each = 1.5M records — comprehensive US mid-market benchmark.

### How fresh do salary snapshots need to be?

Quarterly cadence catches meaningful US mid-market salary shifts. Monthly cadence captures faster-moving markets (post-Fed-rate decisions, post-major-layoffs cycles). For active hiring-research, weekly snapshots produce stable trend data. US salary moves much slower than ecommerce or social-media — annual cadence is too sparse for compensation-decision data.

### How do I normalize salaries across hourly + annual postings?

ZipRecruiter mixes annual ($75K), hourly ($35/hr), and ranges ($60-80K). Normalize to annual: hourly × 2080 hours/year (40 hrs/week × 52). For ranges, use median or both bounds. Filter outliers: 99th percentile within role+metro to remove obvious data-entry errors. Median salary by (role, metro, tier) is the reportable benchmark.

### Can I segment by company-size + industry?

Yes — and segmentation reveals material differences. Mid-market (50-5000) salaries typically 70-90% of large-enterprise (5000+) but 110-130% of small (<50). Industry: tech > finance > healthcare > retail typical hierarchy. ZipRecruiter surfaces both fields when available; 60-70% of listings have explicit company-size + industry tags.

### How does this compare to Glassdoor + Levels.fyi + BLS?

Glassdoor: 60M salaries (self-reported, varied freshness). [Levels.fyi](https://www.levels.fyi/): 200K+ tech salaries (high quality, narrow universe). [BLS OEWS](https://www.bls.gov/oes/): official US data (12-18 month lag, large strata only). ZipRecruiter: 6M+ active listings with ~70% disclosure (real-time, broad coverage). For mid-market real-time benchmarks, ZipRecruiter is materially better than alternatives. For policy research, BLS authoritative.

Run the [ZipRecruiter Scraper on Apify Store](https://apify.com/thirdwatch/ziprecruiter-scraper) — pay-per-result, free to try, no credit card to test.
