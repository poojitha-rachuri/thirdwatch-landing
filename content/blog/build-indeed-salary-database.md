---
title: "Build a Salary Database from Indeed Listings (2026)"
slug: "build-indeed-salary-database"
description: "Build a structured salary database from Indeed at $0.008 per job using Thirdwatch. Title × location × experience benchmarks + Postgres recipes + percentile bands."
actor: "indeed-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/indeed-jobs-scraper"
actorTitle: "Indeed Jobs Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-indeed-jobs-for-recruiter-pipeline"
  - "track-us-tech-hiring-with-indeed-data"
  - "monitor-competitor-hiring-on-indeed"
keywords:
  - "indeed salary database"
  - "scrape indeed for salary data"
  - "salary benchmarking with indeed"
  - "compensation data scraper"
faqs:
  - q: "How much of Indeed has salary data?"
    a: "About 35-45% of Indeed listings publish salary, with materially higher rates in tech, healthcare, and remote roles (60-75%) than in retail, sales, and operations (15-25%). For comp benchmarking on tech roles, Indeed's coverage is sufficient at scale; for non-tech salary research, supplement with Glassdoor and Payscale data."
  - q: "What salary formats does Indeed return?"
    a: "Three formats: range ('$80,000 - $120,000 a year'), hourly ('$25 - $35 an hour'), and 'estimated' ranges from Indeed's own model. The first two are employer-published and reliable; estimated ranges are predictions and should be flagged separately. About 65% of salary-bearing rows are employer-published; 35% are estimates."
  - q: "How do I parse and normalize salary strings?"
    a: "Use a regex to extract min/max integers, then normalize to annual based on the unit ('a year', 'an hour' × 2,080, 'a week' × 52, 'a day' × 250). Currency is almost always USD on Indeed.com (other markets use country-specific TLDs). For hourly→annual conversion, assume full-time (40h × 52 weeks); flag part-time roles separately via the `job_type` field."
  - q: "What sample size produces stable benchmarks?"
    a: "For title × metro × experience benchmarks, 50+ rows produces stable median estimates; 200+ produces stable 25th/75th percentile bands. Below 50 rows, the median is noisy. For nationwide title-only benchmarks (no metro), 200+ is the floor. For role + skill cross-tabulations, target 500+ rows per cell."
  - q: "How fresh does salary data need to be?"
    a: "For market-rate benchmarking, monthly refresh is sufficient — salary bands move slowly within a 90-day window. For salary-trend analysis (comp inflation tracking), weekly refresh enables 4-week rolling averages. For one-off compensation studies, a single comprehensive scrape is fine. Build separate snapshots so you can compute deltas over time."
  - q: "How does this compare to Levels.fyi or Payscale?"
    a: "Levels.fyi is crowd-sourced and skews toward big-tech (FAANG-adjacent) compensation; Payscale is survey-based and skews toward white-collar broad employment. Indeed's salary data is employer-published and covers the broadest employer mix — including small and mid-market employers Levels.fyi misses entirely. For comp benchmarking that reflects the full employer universe, Indeed's data is the strongest single source."
---

> Thirdwatch's [Indeed Jobs Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper) lets HR teams, recruiters, and comp analysts build structured salary databases at $0.008 per job — title, company, location, salary range, job type, posted date, full description. Built for compensation-benchmark teams, salary-research SaaS builders, recruiter-pricing tools, and HR-tech platforms that need title × location × experience comp data.

## Why build a salary database from Indeed

Compensation benchmarking is the canonical HR-research workflow. According to [Indeed's 2024 Hiring Lab report](https://www.hiringlab.org/), the platform indexes 7M+ active US listings, with salary publication on roughly 40% of postings — making it the largest single corpus of employer-published compensation data on the public web. For comp-research teams, salary-research SaaS, and pricing tools, Indeed is the foundational dataset.

The job-to-be-done is structured. A comp-research firm building benchmarks for 50 tech roles × 25 metros = 1,250 cells × 100+ rows each = 125K+ jobs per quarterly refresh. A salary-research SaaS platform powering candidate-facing salary calculators wants per-title percentile bands per metro. An HR-tech platform building offer-letter calculators wants live market-rate data per role × experience-level. A recruiter-pricing tool wants competitive pay-band intel for client briefings. All reduce to title + metro queries + salary-string parsing + percentile aggregation.

## How does this compare to the alternatives?

Three options for compensation-benchmark data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Levels.fyi (crowd-sourced API) | Free, big-tech only | Big-tech focused | Hours | Limited mid-market |
| Payscale / Mercer / Aon | $5K–$50K/year | Survey-based | Weeks | Annual cycles |
| Thirdwatch Indeed Jobs Scraper | $8 ($0.008 × 1,000) | Production-tested with Camoufox | 5 minutes | Thirdwatch tracks Indeed changes |

Levels.fyi is free but crowd-sourced and FAANG-skewed. Payscale and Mercer offer comprehensive surveys but the per-seat costs lock out small/mid-market consumers. The [Indeed Jobs Scraper actor page](/scrapers/indeed-jobs-scraper) gives you employer-published salary data at the lowest unit cost.

## How to build a salary database in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a title × metro batch?

Pass title + metro queries as an array.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~indeed-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

TITLES = ["software engineer", "senior software engineer",
          "staff software engineer", "data scientist",
          "senior data scientist", "product manager",
          "senior product manager"]
METROS = ["New York, NY", "San Francisco, CA", "Seattle, WA",
          "Austin, TX", "Boston, MA", "Chicago, IL", "Denver, CO"]

queries = [f"{t} {m}" for t, m in product(TITLES, METROS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "country": "us", "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.location.nunique()} locations")
```

7 titles × 7 metros = 49 queries × 100 results = up to 4,900 jobs, costing $39.

### Step 3: How do I parse salary strings to numerics?

Regex-extract min/max + unit, normalize to annual.

```python
import re

SALARY_RE = re.compile(
    r"\$?([\d,]+(?:\.\d+)?)(?:K)?\s*(?:-\s*\$?([\d,]+(?:\.\d+)?)(?:K)?)?\s*"
    r"(?:a|per)?\s*(year|hour|week|day|month)",
    re.I
)

def parse_salary(s):
    if not isinstance(s, str):
        return None, None
    m = SALARY_RE.search(s)
    if not m:
        return None, None
    lo = float(m.group(1).replace(",", ""))
    hi = float(m.group(2).replace(",", "")) if m.group(2) else lo
    unit = m.group(3).lower()
    if "k" in s.lower() and lo < 1000:
        lo, hi = lo * 1000, hi * 1000
    annual = {"year": 1, "hour": 2080, "week": 52, "day": 250, "month": 12}[unit]
    return int(lo * annual), int(hi * annual)

df[["salary_min", "salary_max"]] = df.salary.apply(parse_salary).apply(pd.Series)
df = df.dropna(subset=["salary_min"])
df["salary_mid"] = (df.salary_min + df.salary_max) / 2
print(f"{len(df)} jobs with parsed salary, median ${df.salary_mid.median():,.0f}")
```

The regex handles the four most common Indeed formats; for edge cases (commission-bonus splits, stock equity), filter to `salary_max - salary_min < 200000` to exclude outliers.

### Step 4: How do I compute percentile bands and upsert to Postgres?

Group by title + metro, compute percentiles, upsert.

```python
import psycopg2

bands = (
    df.groupby(["title", "location"])
    .agg(
        p25=("salary_mid", lambda x: x.quantile(0.25)),
        p50=("salary_mid", "median"),
        p75=("salary_mid", lambda x: x.quantile(0.75)),
        n=("salary_mid", "count"),
    )
    .query("n >= 30")
    .reset_index()
)

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for _, b in bands.iterrows():
        cur.execute(
            """INSERT INTO salary_benchmarks
                  (title, location, p25, p50, p75, sample_size, snapshot_date)
               VALUES (%s,%s,%s,%s,%s,%s, current_date)
               ON CONFLICT (title, location, snapshot_date)
               DO UPDATE SET p25=%s, p50=%s, p75=%s, sample_size=%s""",
            (b.title, b.location, b.p25, b.p50, b.p75, b.n,
             b.p25, b.p50, b.p75, b.n)
        )

print(f"Upserted {len(bands)} salary benchmarks")
```

The (title, location, snapshot_date) primary key lets you preserve historical bands and compute month-over-month inflation deltas.

## Sample output

A single salary-bearing Indeed record looks like this. Five rows weigh ~8 KB.

```json
{
  "title": "Senior Software Engineer",
  "company_name": "Atlassian",
  "location": "Austin, TX",
  "salary": "$140,000 - $190,000 a year",
  "job_type": "Full-time",
  "description": "We are looking for a Senior Software Engineer to join our cloud platform team...",
  "posted_date": "3 days ago",
  "apply_url": "https://www.indeed.com/viewjob?jk=abc123",
  "remote": false
}
```

`salary` is the raw employer-published string — feed to the regex parser for numeric min/max. `job_type: Full-time` is the canonical filter to exclude part-time/contract roles which skew comp distributions. `remote: true/false` lets you split bands by work-mode (remote-eligible roles often pay 8-12% premium over location-tied roles in the same title × metro cell).

## Common pitfalls

Three things go wrong in salary-database pipelines. **Estimated vs published distinction** — Indeed mixes employer-published and Indeed-estimated salaries in the same field; for compliance and accuracy, filter to employer-published only by checking for "Estimated" prefix in `salary` and excluding those rows. **Currency drift on international Indeed domains** — `indeed.co.uk` returns GBP, `indeed.de` returns EUR; always pass `country` and tag rows with currency before benchmark aggregation. **Title-string variance** — "Senior Software Engineer", "Sr. Software Engineer", "SWE III" all describe the same level; for clean benchmarks, normalize titles via a controlled vocabulary or NLP-based clustering before aggregation.

Thirdwatch's actor uses Camoufox stealth-browser at $2.80/1K, ~65% margin. The 4096 MB memory and 3,600-second timeout headroom mean even 5,000-job batch runs complete cleanly. Pair Indeed with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) and [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) for cross-source salary triangulation. A fourth subtle issue worth flagging: Indeed occasionally publishes salary ranges that span $50K-$500K — these are often "broadband" roles where the employer publishes the full leveling band rather than the role-specific compensation; for tighter benchmarks, exclude rows where `salary_max / salary_min > 2.5` as outliers. A fifth pattern unique to comp-database work: bonus and stock-grant components are absent from Indeed listings (the salary field is base only), so for total-comp benchmarks targeted at tech roles, layer Levels.fyi data on top to capture equity and bonus components — Indeed alone undercounts total comp by 15-40% for senior tech roles. A sixth and final pitfall: posted-date in Indeed listings reflects the original posting date, not the most recent boost or refresh; for currency, supplement with the scrape timestamp and treat the larger of the two as the "actively-listed since" anchor before computing freshness-weighted percentile bands.

## Related use cases

- [Scrape Indeed jobs for recruiter pipeline](/blog/scrape-indeed-jobs-for-recruiter-pipeline)
- [Track US tech hiring with Indeed data](/blog/track-us-tech-hiring-with-indeed-data)
- [Monitor competitor hiring on Indeed](/blog/monitor-competitor-hiring-on-indeed)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much of Indeed has salary data?

About 35-45% of Indeed listings publish salary, with materially higher rates in tech, healthcare, and remote roles (60-75%) than in retail, sales, and operations (15-25%). For comp benchmarking on tech roles, Indeed's coverage is sufficient at scale; for non-tech salary research, supplement with Glassdoor and Payscale data.

### What salary formats does Indeed return?

Three formats: range (`$80,000 - $120,000 a year`), hourly (`$25 - $35 an hour`), and "estimated" ranges from Indeed's own model. The first two are employer-published and reliable; estimated ranges are predictions and should be flagged separately. About 65% of salary-bearing rows are employer-published; 35% are estimates.

### How do I parse and normalize salary strings?

Use a regex to extract min/max integers, then normalize to annual based on the unit ("a year", "an hour" × 2,080, "a week" × 52, "a day" × 250). Currency is almost always USD on Indeed.com (other markets use country-specific TLDs). For hourly→annual conversion, assume full-time (40h × 52 weeks); flag part-time roles separately via the `job_type` field.

### What sample size produces stable benchmarks?

For title × metro × experience benchmarks, 50+ rows produces stable median estimates; 200+ produces stable 25th/75th percentile bands. Below 50 rows, the median is noisy. For nationwide title-only benchmarks (no metro), 200+ is the floor. For role + skill cross-tabulations, target 500+ rows per cell.

### How fresh does salary data need to be?

For market-rate benchmarking, monthly refresh is sufficient — salary bands move slowly within a 90-day window. For salary-trend analysis (comp inflation tracking), weekly refresh enables 4-week rolling averages. For one-off compensation studies, a single comprehensive scrape is fine. Build separate snapshots so you can compute deltas over time.

### How does this compare to Levels.fyi or Payscale?

[Levels.fyi](https://www.levels.fyi/) is crowd-sourced and skews toward big-tech (FAANG-adjacent) compensation; Payscale is survey-based and skews toward white-collar broad employment. Indeed's salary data is employer-published and covers the broadest employer mix — including small and mid-market employers Levels.fyi misses entirely. For comp benchmarking that reflects the full employer universe, Indeed's data is the strongest single source.

Run the [Indeed Jobs Scraper on Apify Store](https://apify.com/thirdwatch/indeed-jobs-scraper) — pay-per-job, free to try, no credit card to test.
