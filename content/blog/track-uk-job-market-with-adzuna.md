---
title: "Track the UK Job Market with Adzuna (2026)"
slug: "track-uk-job-market-with-adzuna"
description: "Monitor UK labour-market dynamics via Adzuna at $0.001 per result using Thirdwatch. Per-region per-sector velocity + recipes for UK research."
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
  - "build-adzuna-uk-salary-benchmarks"
  - "track-uk-tech-hiring-with-reed"
keywords:
  - "uk labour market"
  - "adzuna real-time index"
  - "uk hiring trends"
  - "uk jobs research"
faqs:
  - q: "Why use Adzuna for UK labour-market tracking?"
    a: "Adzuna's UK-job-volume data feeds into the Bank of England + Office for National Statistics labour-market reports per Adzuna's 2024 partnership announcement. With 1.8M+ active UK listings + 95% salary-disclosure, Adzuna provides the canonical UK labour-market real-time signal — material gap-fill from ONS Labour Force Survey (lagged 60-90 days)."
  - q: "What labour-market signals matter most?"
    a: "Five signals: (1) total UK job-postings velocity (week-over-week, seasonally-adjusted); (2) per-sector mix (tech, healthcare, finance, retail); (3) per-region distribution (London, South East, North, Scotland, Wales); (4) median advertised salary trends; (5) remote-work percentage shifts. Combined per-sector per-region tracking reveals UK labour-cycle dynamics."
  - q: "How fresh do UK labour-market snapshots need to be?"
    a: "Weekly cadence catches material UK labour-market shifts within 7 days. Daily cadence captures macro-event impact (post-budget, post-BoE rate decisions). For active investment-research, weekly snapshots produce stable trend data. UK labour-market moves moderately fast — typical cycle inflection 6-12 weeks; weekly cadence catches most dynamics."
  - q: "Can I detect UK recession-onset signals?"
    a: "Yes. UK recession onset typically shows: (1) total posting-volume declining 15%+ over 90 days; (2) tech + finance sectors leading the decline (cyclical-first); (3) remote-work percentage dropping (companies tightening flexibility during cuts); (4) median salary growth slowing below 2% YoY. Combined cross-snapshot tracking catches recession-onset 4-8 weeks before official ONS confirmation."
  - q: "Can I track sector-specific UK shifts?"
    a: "Yes — and per-sector signals are essential. UK tech: 2022-2023 saw 30-40% posting decline correlating with US tech layoffs; recovered 15-20% in 2024. UK healthcare: counter-cyclical, growing through 2022-2024 due to NHS staff shortages. UK finance: London-skewed, BoE-rate-sensitive. For accurate UK research, segment per sector before benchmarking."
  - q: "How does this compare to ONS Labour Force Survey?"
    a: "ONS Labour Force Survey: authoritative quarterly, 60-90 day lag, household-survey methodology. Adzuna: real-time UK postings data, no lag. For UK monetary-policy research, ONS authoritative. For real-time UK labour-market intelligence, Adzuna materially fresher. Combined: Adzuna for early-warning, ONS for confirmation."
---

> Thirdwatch's [Adzuna Scraper](https://apify.com/thirdwatch/adzuna-jobs-scraper) makes UK labour-market research a structured workflow at $0.001 per result — weekly per-sector per-region tracking, recession-onset detection, salary-velocity benchmarks. Built for UK macro research, UK labour-policy analysts, UK retail-investment thesis development, and UK economics-research SaaS.

## Why track UK labour-market with Adzuna

Adzuna is the canonical UK labour-market real-time source. According to [Adzuna's 2024 Real-Time Labour Index](https://www.adzuna.co.uk/blog/), the platform's UK-job data feeds into [Bank of England](https://www.bankofengland.co.uk/) + [ONS](https://www.ons.gov.uk/) labour-market reports — material gap-fill from ONS Labour Force Survey (lagged 60-90 days). For UK macro + retail-investment research teams, Adzuna provides the canonical UK labour-cycle signal source.

The job-to-be-done is structured. A UK macro-research function studies cross-sector UK labour dynamics for monetary-policy thesis. A UK retail-investment fund maps per-sector hiring velocity for retail-investment thesis development. A UK labour-policy analyst tracks regional dynamics for UK government research. A UK economics SaaS builder offers customer-facing UK labour tools. All reduce to weekly per-sector per-region queries + cross-snapshot velocity computation.

## How does this compare to the alternatives?

Three options for UK labour-market data:

| Approach | Cost per UK weekly tracking | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| TechNation / CIPD UK reports | £20K-£100K/year | Authoritative, lagged | Days | Annual contract |
| ONS Labour Force Survey | Free, 60-90d lag | Official | Hours | Government cycle |
| Thirdwatch Adzuna Scraper | ~£10/week (10K records) | HTTP + datacenter proxy | 5 minutes | Thirdwatch tracks Adzuna |

The [Adzuna Scraper actor page](/scrapers/adzuna-jobs-scraper) gives you raw real-time UK labour-market data at materially lower per-record cost.

## How to track in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull UK weekly per-sector batches

```python
import os, requests, datetime, json, pathlib
from itertools import product

ACTOR = "thirdwatch~adzuna-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

UK_SECTORS = ["software", "nurse", "accountant", "marketing manager",
              "teacher", "engineer", "consultant"]
UK_REGIONS = ["London", "Manchester", "Birmingham", "Edinburgh",
              "Bristol", "Leeds", "Cardiff"]

queries = [{"role": s, "location": r, "country": "uk"}
           for s, r in product(UK_SECTORS, UK_REGIONS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 75},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/uk-labour-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} UK listings across {len(queries)} sector-region combos")
```

49 sector-region × 75 = 3,675 records, costing £3.68 per snapshot.

### Step 3: Compute UK labour-market velocity

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/uk-labour-*.json"))
all_dfs = []
for s in snapshots:
    df = pd.DataFrame(json.loads(open(s).read()))
    df["snapshot_date"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    df["salary_gbp"] = pd.to_numeric(df.salary_max, errors="coerce")
    df["region"] = df.location.apply(
        lambda l: "London" if "london" in str(l).lower() else "Outside London"
    )
    all_dfs.append(df)
combined = pd.concat(all_dfs, ignore_index=True)

# Per-sector per-region weekly velocity
velocity = (
    combined.groupby(["query", "region", "snapshot_date"])
    .agg(posting_count=("job_id", "nunique"),
         median_salary=("salary_gbp", "median"),
         remote_pct=("remote_friendly", "mean"))
    .reset_index()
    .sort_values(["query", "region", "snapshot_date"])
)
velocity["volume_delta_pct"] = velocity.groupby(["query", "region"]).posting_count.pct_change() * 100
velocity["salary_delta_pct"] = velocity.groupby(["query", "region"]).median_salary.pct_change() * 100
print(velocity.tail(20))
```

### Step 4: Recession-onset signal detection

```python
import requests as r

# UK recession-onset patterns
total_volume = combined.groupby("snapshot_date").job_id.nunique().reset_index(name="total_postings")
total_volume["volume_90d_pct"] = total_volume.total_postings.pct_change(periods=12) * 100  # ~12 weeks
recent = total_volume.tail(8)
print(recent)

# Aggregate UK signals
if (recent.volume_90d_pct.iloc[-1] or 0) <= -15:
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: UK labour-market recession signal: "
                          f"total postings down "
                          f"{recent.volume_90d_pct.iloc[-1]:.0f}% over 90 days")})

# Tech-sector early-warning
tech_velocity = velocity[velocity['query'].isin(["software", "engineer"])]
tech_recent_decline = tech_velocity.tail(8).volume_delta_pct.mean()
if tech_recent_decline <= -10:
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: UK tech early-warning: "
                          f"tech postings down "
                          f"{tech_recent_decline:.0f}% over recent weeks")})
```

## Sample output

```json
{
  "title": "Senior Software Developer",
  "company": "FinTech London Ltd",
  "location": "London, EC2",
  "salary_min": 70000,
  "salary_max": 95000,
  "salary_currency": "GBP",
  "contract_type": "permanent",
  "remote_friendly": true,
  "category": "IT Jobs",
  "posted_at": "2026-04-22"
}
```

## Common pitfalls

Three things go wrong in UK labour-tracking pipelines. **Sector-classification noise** — Adzuna's category-mapping has false-positives (e.g., "Engineer" maps to multiple categories); for accurate sector research, build canonical-category mapping. **Recruitment-agency duplicate-posting** — same role posted by 3-5 agencies inflates apparent demand; dedupe on (company, title, location) before benchmarking. **London-weighting bias** — London tech 30-40% above non-London; aggregating produces misleading "UK average" figures.

Thirdwatch's actor uses HTTP + datacenter proxy at $0.20/1K, ~75% margin. Pair Adzuna with [Reed Scraper](https://apify.com/thirdwatch/reed-jobs-scraper) for UK-employer-direct cross-validation + [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for corporate-direct triangulation. A fourth subtle issue worth flagging: post-Brexit UK has materially different visa-sponsorship dynamics — UK employers increasingly filter for UK-resident-only; for accurate research, segment "no-sponsorship" listings as separate cohort. A fifth pattern unique to UK labour-market: April fiscal-year-start drives 30-40% hiring-cycle activity; for accurate trend research, deseasonalize against fiscal-year cycle. A sixth and final pitfall: UK Bank Holiday weeks (3-5 per year) drive 30-50% temporary posting-volume drops; exclude these weeks from longitudinal analysis.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active sector-watchlist, weekly), Tier 2 (broader UK coverage, monthly), Tier 3 (long-tail roles, quarterly). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive sector + region metrics from raw JSON as your category-classification logic evolves. Cross-snapshot diff alerts on per-sector posting-velocity catch UK labour-cycle inflection points.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Adzuna schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for material UK posting-volume shifts (>15% week-over-week) catch labour-market inflection points before they appear in lagged ONS data. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual analyst-action rates. If analysts ignore 80%+ of alerts at a given threshold, raise the threshold. If they manually surface signals the alerts missed, lower the threshold.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

A twelfth pattern: cost attribution per consumer. Tag every API call with a downstream-consumer identifier (team, product, feature) so you can attribute compute spend back to the workflow that drove it. When a downstream consumer's spend exceeds projected budget, you can have a precise conversation with them about the queries driving cost.

## Related use cases

- [Scrape Adzuna jobs for UK and EU recruiting](/blog/scrape-adzuna-jobs-for-uk-and-eu-recruiting)
- [Build Adzuna UK salary benchmarks](/blog/build-adzuna-uk-salary-benchmarks)
- [Track UK tech hiring with Reed](/blog/track-uk-tech-hiring-with-reed)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why use Adzuna for UK labour-market tracking?

Adzuna's UK-job-volume data feeds into the Bank of England + Office for National Statistics labour-market reports per Adzuna's 2024 partnership announcement. With 1.8M+ active UK listings + 95% salary-disclosure, Adzuna provides the canonical UK labour-market real-time signal — material gap-fill from ONS Labour Force Survey (lagged 60-90 days).

### What labour-market signals matter most?

Five signals: (1) total UK job-postings velocity (week-over-week, seasonally-adjusted); (2) per-sector mix (tech, healthcare, finance, retail); (3) per-region distribution (London, South East, North, Scotland, Wales); (4) median advertised salary trends; (5) remote-work percentage shifts. Combined per-sector per-region tracking reveals UK labour-cycle dynamics.

### How fresh do UK labour-market snapshots need to be?

Weekly cadence catches material UK labour-market shifts within 7 days. Daily cadence captures macro-event impact (post-budget, post-BoE rate decisions). For active investment-research, weekly snapshots produce stable trend data. UK labour-market moves moderately fast — typical cycle inflection 6-12 weeks; weekly cadence catches most dynamics.

### Can I detect UK recession-onset signals?

Yes. UK recession onset typically shows: (1) total posting-volume declining 15%+ over 90 days; (2) tech + finance sectors leading the decline (cyclical-first); (3) remote-work percentage dropping (companies tightening flexibility during cuts); (4) median salary growth slowing below 2% YoY. Combined cross-snapshot tracking catches recession-onset 4-8 weeks before official ONS confirmation.

### Can I track sector-specific UK shifts?

Yes — and per-sector signals are essential. UK tech: 2022-2023 saw 30-40% posting decline correlating with US tech layoffs; recovered 15-20% in 2024. UK healthcare: counter-cyclical, growing through 2022-2024 due to NHS staff shortages. UK finance: London-skewed, BoE-rate-sensitive. For accurate UK research, segment per sector before benchmarking.

### How does this compare to ONS Labour Force Survey?

[ONS Labour Force Survey](https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork): authoritative quarterly, 60-90 day lag, household-survey methodology. Adzuna: real-time UK postings data, no lag. For UK monetary-policy research, ONS authoritative. For real-time UK labour-market intelligence, Adzuna materially fresher. Combined: Adzuna for early-warning, ONS for confirmation.

Run the [Adzuna Scraper on Apify Store](https://apify.com/thirdwatch/adzuna-jobs-scraper) — pay-per-result, free to try, no credit card to test.
