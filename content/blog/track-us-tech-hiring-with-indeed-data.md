---
title: "Track US Tech Hiring with Indeed Data (2026 Guide)"
slug: "track-us-tech-hiring-with-indeed-data"
description: "Build a US tech hiring trend dashboard at $0.008 per job using Thirdwatch's Indeed Scraper. Posting velocity, salary inflation, skill demand recipes inside."
actor: "indeed-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/indeed-jobs-scraper"
actorTitle: "Indeed.com Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-indeed-jobs-for-recruiter-pipeline"
  - "build-indeed-salary-database"
  - "monitor-competitor-hiring-on-indeed"
keywords:
  - "us tech hiring trends"
  - "indeed posting velocity"
  - "tech labour market data"
  - "indeed scraper trend analysis"
faqs:
  - q: "Why use Indeed for US tech hiring trend analysis?"
    a: "Indeed has the largest US listing volume — roughly 5M+ active US jobs on a typical day, materially deeper than any single competitor. For trend analysis where breadth matters more than per-listing detail, Indeed is the canonical source. Coverage is broadest in mid-tech and adjacent verticals (healthcare-tech, fintech, retail-tech) where LinkedIn skews thinner."
  - q: "What signals matter most for hiring-trend tracking?"
    a: "Three: (1) posting velocity (week-over-week change in new postings) leads BLS payroll data by 6-8 weeks. (2) salary band drift (median salary per role over time) indicates labour-market tightness. (3) skill mention frequency in descriptions reveals demand shifts (Rust vs Go vs Python over time). The actor's structured fields (salary_min, salary_max, description) feed all three."
  - q: "What cadence is right for trend tracking?"
    a: "Weekly snapshots are the standard cadence. Daily catches noise rather than signal — most US job postings stay live 14-30 days, so daily diff is dominated by re-listings and minor edits. Monthly is too coarse to catch quarterly turning points. Schedule the actor every Sunday at midnight UTC for clean week-aligned snapshots."
  - q: "How do I detect tech-stack demand shifts?"
    a: "Parse description text for stack keywords (Rust, Go, Python, Java, Kotlin, etc.) using regex word-boundary matching. Aggregate weekly mention counts per keyword across the dataset. Stacks with month-over-month mention growth above 20% are rising; those with sustained declines are falling. Cross-validate against the salary_min field — rising demand for a stack usually correlates with rising salary medians."
  - q: "Can I segment trends by metro?"
    a: "Yes. Pass location explicitly (Boston, MA or San Francisco, CA) to narrow snapshots to a specific metro. For nationwide trend dashboards, run parallel snapshots across 8-12 representative metros and aggregate downstream. The country input filters by Indeed country domain (www for US); the location input narrows within that country."
  - q: "How fresh is Indeed data for trend analysis?"
    a: "Each run pulls live from Indeed at request time. Indeed indexes new postings within minutes, but its search ranking weights freshness so the top of the search results skews recent. For trend tracking, the 14-30 day lifecycle of typical postings means weekly snapshots capture nearly all postings within their active window."
---

> Thirdwatch's [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper) feeds a US tech hiring-trend dashboard at $0.008 per job — weekly snapshot multiple metros and roles, compute posting velocity, surface tightening or loosening regions before BLS data confirms it. Built for labour-market researchers, equity-research analysts covering tech, workforce-planning teams at multi-state employers, and HR analytics functions tracking compensation and skill-demand trends.

## Why use Indeed for US tech hiring trends

Indeed is the largest US job board by listing volume. According to [Indeed's 2024 hiring outlook](https://www.indeed.com/career-advice/career-development/job-market-trends), the platform indexes more than 250 million unique listings annually with 350+ million unique monthly visitors — a data surface large enough that hiring trends visible in Indeed lead BLS confirmation by 6-8 weeks at metro and state level. For labour-market researchers, equity analysts, and workforce planners, Indeed's posting volume is the canonical trend signal.

The job-to-be-done is structured. A regional economist tracking metro-level US tech hiring wants weekly Indeed snapshots aggregated by city. A workforce-planning team at a multi-state tech employer benchmarks competitor postings across their hiring footprint. An equity analyst covering enterprise SaaS watches engineering-headcount trends as a leading indicator of revenue growth. A skill-demand researcher tracks Rust vs Go vs Python mention frequency across descriptions over time. All reduce to weekly snapshot × multiple metros × multiple roles → time-series analytics.

## How does this compare to the alternatives?

Three options for US tech hiring trend data:

| Approach | Cost per 1,000 jobs × weekly × 8 metros | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| BLS Quarterly Census of Employment and Wages | Free, official | Authoritative but lagging 4-8 weeks | Days | Federal release schedule |
| Paid labour-intel SaaS (Lightcast, Burning Glass) | $50K–$300K/year flat | High | Weeks–months | Vendor lock-in |
| Thirdwatch Indeed Scraper | $64 × weekly = $3,328/year | Production-tested across 48 countries | Half a day | Thirdwatch maintains stealth layer |

Paid labour-intel platforms include Indeed data alongside others; building a focused Indeed-only trend dashboard is meaningfully cheaper and gives you full schema control. The [Indeed Scraper actor page](/scrapers/indeed-jobs-scraper) is the data layer.

## How to track US tech hiring trends in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a weekly multi-metro multi-role snapshot?

Spawn parallel runs across metros × representative tech-role queries.

```python
import os, requests, time, json, datetime, pathlib

ACTOR = "thirdwatch~indeed-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

METROS = ["San Francisco, CA", "New York, NY", "Seattle, WA",
          "Austin, TX", "Boston, MA", "Denver, CO",
          "Atlanta, GA", "Chicago, IL"]
ROLES = ["software engineer", "senior software engineer",
         "staff software engineer", "data scientist",
         "machine learning engineer", "devops engineer",
         "product manager"]

run_ids = []
for metro in METROS:
    r = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/runs",
        params={"token": TOKEN},
        json={"queries": ROLES, "location": metro,
              "country": "www", "maxResults": 100,
              "scrapeDetails": True},
    )
    run_ids.append((metro, r.json()["data"]["id"]))
    time.sleep(0.5)

week = datetime.date.today().isocalendar()
ts = f"{week.year}-W{week.week:02d}"
out = pathlib.Path(f"snapshots/indeed-tech-{ts}")
out.mkdir(parents=True, exist_ok=True)

for metro, run_id in run_ids:
    while True:
        s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                         params={"token": TOKEN}).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s == "SUCCEEDED":
        items = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN}).json()
        (out / f"{metro.replace(', ', '-')}.json").write_text(json.dumps(items))
```

8 metros × 7 roles × ~100 jobs = up to 5,600 listings per weekly snapshot, costing $44.80.

### Step 3: How do I compute posting velocity per metro × role?

Aggregate snapshots, compute week-over-week change in unique URLs.

```python
import pandas as pd, glob

frames = []
for d in sorted(glob.glob("snapshots/indeed-tech-*")):
    week = pathlib.Path(d).name.replace("indeed-tech-", "")
    for f in glob.glob(f"{d}/*.json"):
        metro = pathlib.Path(f).stem.replace("-", ", ", 1)
        for j in json.loads(pathlib.Path(f).read_text()):
            for role in ROLES:
                if role.lower() in (j.get("title") or "").lower():
                    frames.append({"week": week, "metro": metro,
                                   "role": role, "url": j["url"],
                                   "salary_min": j.get("salary_min"),
                                   "is_remote": j.get("is_remote")})
                    break

df = pd.DataFrame(frames).drop_duplicates(subset=["week", "url"])
weekly = df.groupby(["week", "metro", "role"]).size().reset_index(name="postings")
pivot = weekly.pivot_table(
    index=["metro", "role"], columns="week", values="postings", fill_value=0
)
weeks = sorted(pivot.columns)
if len(weeks) >= 5:
    pivot["wow_pct"] = (pivot[weeks[-1]] / pivot[weeks[-5:-1]].mean(axis=1).clip(lower=1)) - 1
    flags = pivot[(pivot[weeks[-1]] >= 30) & (pivot.wow_pct.abs() >= 0.20)]
    print(flags[[weeks[-1], "wow_pct"]].sort_values("wow_pct", ascending=False))
```

20%+ week-over-week change with 30+ postings in the latest week is a meaningful signal — typically leading BLS metro confirmation by a month.

### Step 4: How do I detect skill-demand shifts in description text?

Regex-mention counts per stack across snapshots reveal which technologies are gaining or losing demand share.

```python
import re

STACK_PATTERNS = {
    "rust": r"\brust\b",
    "go": r"\bgolang\b|\bgo\b(?=\s|$|,)",
    "python": r"\bpython\b",
    "java": r"\bjava\b(?!script)",
    "typescript": r"\btypescript\b|\btsx?\b",
    "kubernetes": r"\bkubernetes\b|\bk8s\b",
    "aws": r"\baws\b",
    "react": r"\breact\b",
}

stack_frames = []
for week_df in [df]:  # extend to all weeks in production
    for stack, pattern in STACK_PATTERNS.items():
        descs = []  # description text from each snapshot
        for d in sorted(glob.glob("snapshots/indeed-tech-*")):
            for f in glob.glob(f"{d}/*.json"):
                for j in json.loads(pathlib.Path(f).read_text()):
                    if j.get("description") and re.search(pattern, j["description"], re.IGNORECASE):
                        stack_frames.append({"week": pathlib.Path(d).name, "stack": stack,
                                              "url": j["url"]})

stack_df = pd.DataFrame(stack_frames).drop_duplicates(subset=["week", "stack", "url"])
stack_pivot = stack_df.groupby(["week", "stack"]).size().unstack(fill_value=0)
print(stack_pivot.tail(8))
```

Track this matrix over 8-12 weeks; stacks with a sustained 30%+ increase in mention frequency are gaining demand share, those with sustained declines are losing it.

## Sample output

A single record from the dataset for one Boston ML engineer role looks like this. Five rows of this shape weigh ~15 KB.

```json
{
  "title": "Senior Machine Learning Engineer",
  "company_name": "HubSpot",
  "location": "Cambridge, MA",
  "description": "We are looking for a Senior ML Engineer with experience in...",
  "url": "https://www.indeed.com/viewjob?jk=abc123def456",
  "salary_min": 180000,
  "salary_max": 240000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "posted_date": "2026-04-21",
  "job_type": "Full-time",
  "benefits": ["Health insurance", "401(k)", "Equity"],
  "is_remote": true,
  "company_rating": "4.5",
  "company_reviews_count": "850"
}
```

`url` is the canonical natural key for cross-snapshot dedup. `salary_min` and `salary_max` are the structured trend signal — track median per (metro, role) over weeks. `is_remote` is Indeed's structured boolean, useful for separating remote-only from in-person trend lines. `description` is the input for skill-demand mention analysis.

## Common pitfalls

Three things go wrong in production Indeed trend dashboards. **Re-listing inflation** — employers occasionally close and re-open the same role under a new URL, which inflates apparent posting velocity; smooth with a 4-week rolling average rather than reading single-week deltas. **Salary-period mixing** — Indeed mixes hourly, monthly, and yearly bands; aggregating without filtering on `salary_period` produces nonsense. Always filter to `salary_period == "yearly"` for tech roles. **Title-keyword false positives** — `software engineer` matches "software engineering manager" and "principal software engineer"; for clean role-level trend tracking, use exact-match boundaries or maintain a per-role title regex.

Thirdwatch's actor uses Camoufox + humanize for Cloudflare and DataDome bypass — production-tested at sustained weekly volumes. The 4096 MB max memory and 3,600-second timeout headroom mean the multi-metro multi-role weekly fan-out completes cleanly. Pair Indeed with our [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for cross-source confirmation and [BLS QCEW data](https://www.bls.gov/cew/) for ground-truth lagging confirmation.

## Related use cases

- [Scrape Indeed jobs for a recruiter pipeline](/blog/scrape-indeed-jobs-for-recruiter-pipeline)
- [Build an Indeed salary database for compensation research](/blog/build-indeed-salary-database)
- [Monitor competitor hiring on Indeed](/blog/monitor-competitor-hiring-on-indeed)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why use Indeed for US tech hiring trend analysis?

Indeed has the largest US listing volume — roughly 5M+ active US jobs on a typical day, materially deeper than any single competitor. For trend analysis where breadth matters more than per-listing detail, Indeed is the canonical source. Coverage is broadest in mid-tech and adjacent verticals (healthcare-tech, fintech, retail-tech) where LinkedIn skews thinner.

### What signals matter most for hiring-trend tracking?

Three: (1) posting velocity (week-over-week change in new postings) leads BLS payroll data by 6-8 weeks. (2) salary band drift (median salary per role over time) indicates labour-market tightness. (3) skill mention frequency in descriptions reveals demand shifts (Rust vs Go vs Python over time). The actor's structured fields (`salary_min`, `salary_max`, `description`) feed all three.

### What cadence is right for trend tracking?

Weekly snapshots are the standard cadence. Daily catches noise rather than signal — most US job postings stay live 14-30 days, so daily diff is dominated by re-listings and minor edits. Monthly is too coarse to catch quarterly turning points. Schedule the actor every Sunday at midnight UTC for clean week-aligned snapshots.

### How do I detect tech-stack demand shifts?

Parse `description` text for stack keywords (Rust, Go, Python, Java, Kotlin, etc.) using regex word-boundary matching. Aggregate weekly mention counts per keyword across the dataset. Stacks with month-over-month mention growth above 20% are rising; those with sustained declines are falling. Cross-validate against the `salary_min` field — rising demand for a stack usually correlates with rising salary medians.

### Can I segment trends by metro?

Yes. Pass `location` explicitly (`Boston, MA` or `San Francisco, CA`) to narrow snapshots to a specific metro. For nationwide trend dashboards, run parallel snapshots across 8-12 representative metros and aggregate downstream. The `country` input filters by Indeed country domain (`www` for US); the `location` input narrows within that country.

### How fresh is Indeed data for trend analysis?

Each run pulls live from Indeed at request time. Indeed indexes new postings within minutes, but its search ranking weights freshness so the top of the search results skews recent. For trend tracking, the 14-30 day lifecycle of typical postings means weekly snapshots capture nearly all postings within their active window.

Run the [Indeed Scraper on Apify Store](https://apify.com/thirdwatch/indeed-jobs-scraper) — pay-per-job, free to try, no credit card to test.
