---
title: "Build UK Salary Benchmarks from Adzuna (2026)"
slug: "build-adzuna-uk-salary-benchmarks"
description: "Build UK salary benchmarks from Adzuna at $0.001 per result using Thirdwatch. Per-role per-region tier salary medians + recipes for HR analytics."
actor: "adzuna-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/adzuna-jobs-scraper"
actorTitle: "Adzuna Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-adzuna-jobs-for-uk-and-eu-recruiting"
  - "track-uk-job-market-with-adzuna"
  - "scrape-reed-jobs-for-uk-recruiter-pipeline"
keywords:
  - "uk salary benchmarks"
  - "adzuna salary data"
  - "uk compensation research"
  - "uk salary database"
faqs:
  - q: "Why use Adzuna for UK salary benchmarks?"
    a: "Adzuna is the UK's largest jobs aggregator with 1.8M active UK listings + 95% salary disclosure rate (highest in UK market vs LinkedIn ~40%, Indeed UK ~50%). According to Adzuna's 2024 Real-Time Labour Index, the platform powers Office for National Statistics (ONS) labour-market reports. For UK compensation research, Adzuna's depth + disclosure rate make it the canonical UK salary source."
  - q: "What roles + regions should the UK benchmark cover?"
    a: "150 roles × 12 UK regions × 3 experience-tiers = 5,400 cells. Top 150 roles per ONS SOC2020 taxonomy (software developer, NHS nurse, teacher, accountant). 12 UK regions: London, South East, South West, East, Midlands East, Midlands West, Yorkshire, North East, North West, Wales, Scotland, Northern Ireland. Tiers: junior (0-2y), mid (3-7y), senior (8+y). 5,400 cells × 50 listings = 270K records — comprehensive UK benchmark."
  - q: "How fresh do UK salary snapshots need to be?"
    a: "Quarterly cadence catches meaningful UK salary shifts. Monthly cadence captures faster-moving markets (post-BoE rate decisions, post-budget). For active hiring-research, weekly snapshots produce stable trend data. UK salary moves slower than US tech but faster than US heritage industries (NHS, public sector); monthly cadence is canonical for UK comp-research."
  - q: "How do I handle GBP vs EUR vs USD currencies?"
    a: "Adzuna mixes GBP (UK), EUR (Ireland + EU listings appearing in UK searches), and rare USD; normalize to GBP via daily FX. Filter listings to UK-region-only before benchmarking — multi-region listings (e.g., 'remote UK + EU') skew toward higher-salary EU markets. Annual + hourly + daily-rate disclosure formats — normalize per UK 1820-hours-per-year (lower than US 2080) for hourly-to-annual conversion."
  - q: "Can I segment by industry + company-size?"
    a: "Yes — and segmentation reveals UK-specific patterns. London tech 30-40% above non-London tech (the 'London weighting'). Public sector 15-25% below private sector for equivalent roles. SME (Small/Medium Enterprise) 20-30% below corporates for equivalent roles. Adzuna surfaces both fields when available; ~60% of UK listings have explicit company-size + industry tags."
  - q: "How does this compare to ONS + Glassdoor + LinkedIn?"
    a: "ONS ASHE (Annual Survey of Hours and Earnings): authoritative, 12-18 month lag, weekly-pay focused. Glassdoor UK: 6M UK salaries (self-reported, varied freshness). LinkedIn UK: ~40% disclosure (real-time, narrow). Adzuna UK: 1.8M+ active listings with 95% disclosure (real-time, broad coverage). For real-time UK benchmarks, Adzuna is materially better. For policy research, ONS authoritative."
---

> Thirdwatch's [Adzuna Scraper](https://apify.com/thirdwatch/adzuna-jobs-scraper) makes UK salary research a structured workflow at $0.001 per result — per-role per-region per-experience UK salary medians, quarterly snapshots, London-weighting segmentation. Built for UK compensation-research firms, HR-analytics SaaS platforms, recruiting agencies, and UK labour-market research.

## Why build a UK Adzuna salary database

Adzuna is the canonical UK salary-disclosure source. According to [Adzuna's 2024 Real-Time Labour Index](https://www.adzuna.co.uk/blog/jobs-statistics/), the platform indexes 1.8M+ active UK jobs with 95% salary disclosure (highest UK rate) — material gap-fill from ONS ASHE (lagged 12-18 months) and Glassdoor (self-reported, narrow). For UK HR-analytics + compensation research teams, Adzuna's depth + disclosure rate make it the canonical real-time UK salary source.

The job-to-be-done is structured. A UK compensation-consulting firm builds a 150-role × 12-region benchmark for client client briefings. A UK HR-analytics SaaS platform powers customer-facing UK salary tools with real-time data. A recruiting agency surfaces per-role UK market-rate context to clients during search. A UK labour-market research function studies regional dynamics for retail-investment thesis development. All reduce to per-role + per-region queries + quarterly aggregation.

## How does this compare to the alternatives?

Three options for UK salary data:

| Approach | Cost per 5K-cell UK benchmark | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Korn Ferry / Hay UK | £25K-£100K/year | Authoritative | Weeks | Annual contract |
| ONS ASHE (free) | Free, 12-18mo lag | Official, lagged | Hours | Government cycle |
| Thirdwatch Adzuna Scraper | ~£8/quarter (10K records) | HTTP + datacenter proxy | 5 minutes | Thirdwatch tracks Adzuna |

The [Adzuna Scraper actor page](/scrapers/adzuna-jobs-scraper) gives you raw real-time UK salary data at materially lower per-record cost.

## How to build the database in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull per-role per-region UK batches

```python
import os, requests, datetime, json, pathlib
from itertools import product

ACTOR = "thirdwatch~adzuna-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

ROLES = ["software developer", "data scientist", "product manager",
         "marketing manager", "accountant", "nurse"]
REGIONS = ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds",
           "Bristol", "Cardiff", "Belfast"]

queries = [{"role": r, "location": reg, "country": "uk"}
           for r, reg in product(ROLES, REGIONS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/adzuna-uk-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} UK listings across {len(queries)} role-region combos")
```

48 role-region × 50 = 2,400 records, costing £2.40 per snapshot.

### Step 3: Compute per-role per-region UK benchmarks

```python
import pandas as pd

df = pd.DataFrame(records)
df["salary_gbp"] = pd.to_numeric(df.salary_min, errors="coerce")  # already GBP for UK

# Tier by experience
def tier_from_title(title):
    t = str(title).lower()
    if any(k in t for k in ["senior", "principal", "lead", "head"]): return "senior"
    if any(k in t for k in ["junior", "trainee", "graduate", "entry"]): return "junior"
    return "mid"

df["tier"] = df.title.apply(tier_from_title)
df["region_group"] = df.location.apply(
    lambda l: "London" if "london" in str(l).lower() else "Outside London"
)

uk_benchmark = (
    df.dropna(subset=["salary_gbp"])
    .groupby(["role", "region_group", "tier"])
    .agg(median_salary_gbp=("salary_gbp", "median"),
         p25_salary=("salary_gbp", lambda x: x.quantile(0.25)),
         p75_salary=("salary_gbp", lambda x: x.quantile(0.75)),
         listing_count=("salary_gbp", "count"))
    .reset_index()
)
uk_benchmark = uk_benchmark[uk_benchmark.listing_count >= 5]
print(uk_benchmark.sort_values("median_salary_gbp", ascending=False).head(20))
```

### Step 4: Compute London-weighting for cross-region context

```python
# London weighting per role
weighting = (
    df.dropna(subset=["salary_gbp"])
    .groupby(["role", "region_group"]).salary_gbp.median()
    .unstack()
)
weighting["london_weight_pct"] = (weighting["London"] / weighting["Outside London"] - 1) * 100
print(weighting.sort_values("london_weight_pct", ascending=False))
```

UK London weighting typically ranges 20-40% across roles — software developers see 30-40% London uplift; accountants 15-25%.

## Sample output

```json
{
  "title": "Senior Software Developer",
  "company": "FinTech Co Ltd",
  "location": "London, EC2",
  "salary_min": 75000,
  "salary_max": 95000,
  "salary_currency": "GBP",
  "contract_type": "permanent",
  "category": "IT Jobs",
  "posted_at": "2026-04-22",
  "url": "https://www.adzuna.co.uk/jobs/details/12345"
}
```

## Common pitfalls

Three things go wrong in UK benchmark pipelines. **GBP vs EUR mixing** — Adzuna UK occasionally surfaces Ireland (EUR) listings in UK searches; filter by currency before benchmarking. **London vs Outside-London segmentation** — must segment to capture London weighting accurately; aggregating produces misleading "UK average" figures. **Hourly-to-annual variance** — UK works 1820 hours/year (vs US 2080) due to longer holiday entitlements; normalize hourly listings using UK convention.

Thirdwatch's actor uses HTTP + datacenter proxy at $0.20/1K, ~75% margin. Pair with [Reed Scraper](https://apify.com/thirdwatch/reed-jobs-scraper) for UK-specific deeper coverage and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for triangulation. A fourth subtle issue worth flagging: UK public-sector pay is published in transparent bands (e.g., NHS Agenda for Change pay-bands £21K-£105K mapped to roles); for accurate public-sector benchmarking, supplement Adzuna with the official band tables. A fifth pattern unique to UK comp-research: post-Brexit UK has accelerated wage-inflation in healthcare + hospitality due to EU-worker shortage; for accurate trend research, segment 2020+ data from pre-Brexit baselines. A sixth and final pitfall: UK April fiscal-year-start drives material hiring + comp-review cycles; for accurate trend research, deseasonalize against fiscal-year cycle rather than calendar quarters.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active comp-research watchlist, monthly), Tier 2 (broader UK coverage, quarterly), Tier 3 (long-tail roles, semi-annually). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive benchmark cells from raw JSON as your tier-classification + outlier-clipping logic evolves. Cross-snapshot diff alerts on per-role-per-region benchmark deltas catch UK labor-market velocity signals.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Adzuna schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for material UK salary shifts (>3% YoY at role-region-tier cell level) catch labor-market signals before they appear in lagged ONS data. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual analyst-action rates. If analysts ignore 80%+ of alerts at a given threshold, raise the threshold. If they manually surface signals the alerts missed, lower the threshold. The right threshold drifts as your watchlist composition changes.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

A twelfth pattern: cost attribution per consumer. Tag every API call with a downstream-consumer identifier (team, product, feature) so you can attribute compute spend back to the workflow that drove it. When a downstream consumer's spend exceeds projected budget, you can have a precise conversation with them about the queries driving cost rather than a vague "scraping is expensive" debate.

## Related use cases

- [Scrape Adzuna jobs for UK and EU recruiting](/blog/scrape-adzuna-jobs-for-uk-and-eu-recruiting)
- [Track UK job market with Adzuna](/blog/track-uk-job-market-with-adzuna)
- [Scrape Reed jobs for UK recruiter pipeline](/blog/scrape-reed-jobs-for-uk-recruiter-pipeline)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why use Adzuna for UK salary benchmarks?

Adzuna is the UK's largest jobs aggregator with 1.8M active UK listings + 95% salary disclosure rate (highest in UK market vs LinkedIn ~40%, Indeed UK ~50%). According to Adzuna's 2024 Real-Time Labour Index, the platform powers Office for National Statistics (ONS) labour-market reports. For UK compensation research, Adzuna's depth + disclosure rate make it the canonical UK salary source.

### What roles + regions should the UK benchmark cover?

150 roles × 12 UK regions × 3 experience-tiers = 5,400 cells. Top 150 roles per ONS SOC2020 taxonomy (software developer, NHS nurse, teacher, accountant). 12 UK regions: London, South East, South West, East, Midlands East, Midlands West, Yorkshire, North East, North West, Wales, Scotland, Northern Ireland. Tiers: junior (0-2y), mid (3-7y), senior (8+y). 5,400 cells × 50 listings = 270K records — comprehensive UK benchmark.

### How fresh do UK salary snapshots need to be?

Quarterly cadence catches meaningful UK salary shifts. Monthly cadence captures faster-moving markets (post-BoE rate decisions, post-budget). For active hiring-research, weekly snapshots produce stable trend data. UK salary moves slower than US tech but faster than US heritage industries (NHS, public sector); monthly cadence is canonical for UK comp-research.

### How do I handle GBP vs EUR vs USD currencies?

Adzuna mixes GBP (UK), EUR (Ireland + EU listings appearing in UK searches), and rare USD; normalize to GBP via daily FX. Filter listings to UK-region-only before benchmarking — multi-region listings (e.g., 'remote UK + EU') skew toward higher-salary EU markets. Annual + hourly + daily-rate disclosure formats — normalize per UK 1820-hours-per-year (lower than US 2080) for hourly-to-annual conversion.

### Can I segment by industry + company-size?

Yes — and segmentation reveals UK-specific patterns. London tech 30-40% above non-London tech (the 'London weighting'). Public sector 15-25% below private sector for equivalent roles. SME (Small/Medium Enterprise) 20-30% below corporates for equivalent roles. Adzuna surfaces both fields when available; ~60% of UK listings have explicit company-size + industry tags.

### How does this compare to ONS + Glassdoor + LinkedIn?

[ONS ASHE](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2024) (Annual Survey of Hours and Earnings): authoritative, 12-18 month lag, weekly-pay focused. Glassdoor UK: 6M UK salaries (self-reported, varied freshness). LinkedIn UK: ~40% disclosure (real-time, narrow). Adzuna UK: 1.8M+ active listings with 95% disclosure (real-time, broad coverage). For real-time UK benchmarks, Adzuna is materially better. For policy research, ONS authoritative.

Run the [Adzuna Scraper on Apify Store](https://apify.com/thirdwatch/adzuna-jobs-scraper) — pay-per-result, free to try, no credit card to test.
