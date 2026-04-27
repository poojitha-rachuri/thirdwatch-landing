---
title: "Track the US Job Market with Monster Data (2026)"
slug: "track-us-job-market-with-monster-data"
description: "Quantify US labour-market signals at $0.008 per record using Thirdwatch's Monster Scraper. Posting velocity, salary inflation, and metro hiring heat."
actor: "monster-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/monster-jobs-scraper"
actorTitle: "Monster Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-monster-jobs-for-recruiter-pipeline"
  - "monster-vs-indeed-vs-ziprecruiter-data-coverage"
  - "build-jobs-meta-search-from-monster"
keywords:
  - "us job market data"
  - "monster posting velocity"
  - "labor market scraper"
  - "metro hiring heatmap"
faqs:
  - q: "Why use Monster for US labour-market analysis?"
    a: "Monster has been operating since 1994 and skews toward mid-market US employers in healthcare, manufacturing, finance, and retail — the segments under-covered by LinkedIn-only datasets. For a researcher or analyst tracking the broad US labour market rather than just the tech subset, Monster fills the mid-market gap. Combine with Indeed and ZipRecruiter for full coverage."
  - q: "How does posting velocity translate into hiring signal?"
    a: "Net new postings per week is a leading indicator of intent to hire. A metro where new postings rose 20% over 4 weeks is in a tightening cycle; a metro where postings dropped 15% is loosening. The signal leads BLS payroll data by 6-8 weeks, which makes a Monster-backed dashboard genuinely useful for state-level economic forecasting that government statistics confirm later."
  - q: "What metros and roles are most useful to track?"
    a: "For a national US labour dashboard, sample 8-12 metros covering different regional economies (NY, SF, Chicago, Atlanta, Dallas, Boston, Seattle, Phoenix, Denver, Miami, Minneapolis, Houston). For roles, pick three to five role-families that span the economy: software engineer, registered nurse, accountant, sales representative, truck driver. The combination gives you a representative picture without overweighting tech."
  - q: "What's a useful refresh cadence?"
    a: "Weekly is the standard cadence for labour-market dashboards. Posting velocity needs at least weekly granularity to catch turning points; monthly smooths out actionable detail. Daily is wasteful for this use case because most postings stay live 14-30 days, so daily diffs are mostly the same listings ageing rather than new arrivals."
  - q: "How do I separate posting velocity from posting volume?"
    a: "Volume is the absolute count of active listings; velocity is the rate of new listings per week. A metro with 15,000 active listings sounds large but if velocity is flat, hiring intent is steady. A metro with 3,000 listings but velocity rising 30% week-over-week is hiring fast. Track both, but velocity is the leading indicator."
  - q: "Can I aggregate Monster data into a state-level or national index?"
    a: "Yes. Spawn parallel runs across 30-50 metros covering each US state, aggregate by week and role-family, weight by metro population, and compute a state-level posting-velocity index. The index lags BLS data by a few days but leads BLS by 6-8 weeks for changes in trend. Most labour-econ teams build something like this on top of multiple boards rather than a single source."
---

> Thirdwatch's [Monster Scraper](https://apify.com/thirdwatch/monster-jobs-scraper) feeds a US labour-market dashboard at $0.008 per job — sample mid-market hiring across metros and role families, compute weekly posting velocity, surface tightening or loosening regions before BLS data confirms it. Built on Camoufox stealth-browser bypass of DataDome, the same architecture as our Indeed and ZipRecruiter scrapers.

## Why track the US job market with Monster data

Hiring data lags. The Bureau of Labor Statistics' monthly employment situation report is released the first Friday of the following month, summarising data already two to four weeks old. Job-board postings are the most timely public signal that bridges that gap. According to [the Federal Reserve Bank of San Francisco's 2024 working paper on online job postings](https://www.frbsf.org/research-and-insights/publications/economic-letter/), posting volume on major US boards leads BLS payroll changes by 6-8 weeks at metro and state level. Monster contributes a mid-market US slice — healthcare, manufacturing, finance, retail — that LinkedIn-only datasets undercover.

The job-to-be-done is structured. A regional economist building a state-level hiring index needs weekly Monster snapshots aggregated by metro. A workforce-planning team at a multi-state employer wants posting velocity for the role families they hire — to time recruitment campaigns ahead of competitor hiring spikes. A policy researcher analysing post-recession recovery wants metro-level posting time series for retrospective comparison. All of these reduce to the same data shape: weekly snapshot × multiple metros × multiple role families. The Thirdwatch actor returns it ready to ingest.

## How does this compare to the alternatives?

Three options for getting US labour-market hiring data:

| Approach | Cost per 1,000 jobs × weekly × 8 metros | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| BLS data | Free | Authoritative but lagging 4 weeks | Days | Federal release schedule |
| Paid labour-intel SaaS (Lightcast, Indeed for Employers) | $50K–$300K/year flat | High coverage | Weeks–months | Vendor lock-in |
| Thirdwatch Monster Scraper | $64 ($0.008 × 1K × 8) per weekly pull | Production-tested, monopoly position on Apify | Half a day | Thirdwatch maintains stealth layer |

Paid labour-intel platforms aggregate dozens of boards including Monster as one source. Building your own on Monster + a few other boards costs a few hundred a month rather than tens of thousands a year, and the [Monster Scraper actor page](/scrapers/monster-jobs-scraper) is the data layer for that build.

## How to track the US job market with Monster in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a weekly multi-metro multi-role snapshot?

Spawn parallel runs across metros × role families. Apify's async runs API supports concurrent spawns.

```python
import os, requests, time, json, datetime, pathlib

ACTOR = "thirdwatch~monster-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

METROS = ["New York, NY", "San Francisco, CA", "Chicago, IL",
          "Atlanta, GA", "Dallas, TX", "Boston, MA",
          "Seattle, WA", "Phoenix, AZ"]
ROLES = ["software engineer", "registered nurse",
         "accountant", "sales representative", "truck driver"]

run_ids = []
for metro in METROS:
    r = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/runs",
        params={"token": TOKEN},
        json={"queries": ROLES, "location": metro, "maxResults": 200},
    )
    run_ids.append((metro, r.json()["data"]["id"]))
    time.sleep(0.5)

week = datetime.date.today().isocalendar()
ts = f"{week.year}-W{week.week:02d}"
out = pathlib.Path(f"snapshots/monster-{ts}")
out.mkdir(parents=True, exist_ok=True)

for metro, run_id in run_ids:
    while True:
        s = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}",
            params={"token": TOKEN},
        ).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s == "SUCCEEDED":
        items = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN},
        ).json()
        (out / f"{metro.replace(', ', '-')}.json").write_text(json.dumps(items))
```

Eight metros × five roles × ~200 jobs = up to 8,000 listings per weekly snapshot, costing $64.

### Step 3: How do I compute weekly posting velocity per metro × role?

Aggregate snapshots by week and metro × role, computing net new URLs week-over-week.

```python
import pandas as pd, glob, re

frames = []
for d in sorted(glob.glob("snapshots/monster-*")):
    week = pathlib.Path(d).name.replace("monster-", "")
    for f in glob.glob(f"{d}/*.json"):
        metro = pathlib.Path(f).stem.replace("-", ", ")
        for j in json.loads(pathlib.Path(f).read_text()):
            for role in ROLES:
                if role.lower() in (j.get("title") or "").lower():
                    frames.append({"week": week, "metro": metro,
                                   "role": role, "url": j["url"]})
                    break

df = pd.DataFrame(frames).drop_duplicates(subset=["week", "url"])
weekly = df.groupby(["week", "metro", "role"]).size().reset_index(name="postings")

# Posting velocity = week-over-week change in postings count
pivot = weekly.pivot_table(
    index=["metro", "role"], columns="week", values="postings"
).fillna(0)
weeks = sorted(pivot.columns)
if len(weeks) >= 2:
    pivot["wow_change"] = pivot[weeks[-1]] - pivot[weeks[-2]]
    pivot["wow_pct"] = pivot["wow_change"] / pivot[weeks[-2]].clip(lower=1)
    print(pivot.sort_values("wow_pct", ascending=False).head(15))
```

The top of this table is the metro × role combinations heating fastest week-over-week — the canonical "where is hiring intent rising" signal.

### Step 4: How do I roll up to a national index?

Population-weight the metro-level signal:

```python
METRO_POP = {  # 2024 metro statistical area populations, millions
    "New York, NY": 19.5, "San Francisco, CA": 4.5,
    "Chicago, IL": 9.5, "Atlanta, GA": 6.3,
    "Dallas, TX": 7.9, "Boston, MA": 4.9,
    "Seattle, WA": 4.0, "Phoenix, AZ": 5.0,
}

weekly["pop"] = weekly.metro.map(METRO_POP)
national = (
    weekly.groupby(["week", "role"])
    .apply(lambda g: (g.postings * g.pop).sum() / g.pop.sum())
    .reset_index(name="weighted_postings")
)
print(national.pivot(index="week", columns="role", values="weighted_postings"))
```

The pivoted output is your national-by-role posting index, ready to chart against BLS data once it lands.

## Sample output

A single record from the dataset for one Boston nursing role looks like this. The labour-market analysis stitches thousands of such rows.

```json
{
  "title": "Registered Nurse - ICU",
  "company": "Beth Israel Deaconess Medical Center",
  "location": "Boston, MA",
  "salary_text": "$80,000 - $115,000",
  "salary_min": 80000,
  "salary_max": 115000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "description": "Beth Israel Deaconess seeks an experienced ICU Registered Nurse...",
  "posted_date": "2026-04-21",
  "source": "monster",
  "url": "https://www.monster.com/job-openings/registered-nurse-icu-boston-ma"
}
```

A typical labour-market dashboard table from 8 metros × 5 roles × 4 weekly snapshots looks like this:

| Metro | Role | Wk-3 | Wk-2 | Wk-1 | Wk-0 | WoW |
|---|---|---|---|---|---|---|
| Atlanta, GA | registered nurse | 145 | 162 | 188 | 224 | +19% |
| Phoenix, AZ | truck driver | 88 | 92 | 106 | 134 | +26% |
| Boston, MA | accountant | 56 | 51 | 48 | 44 | -8% |

Phoenix trucker postings rising 26% WoW on a tight base is exactly the kind of regional signal that precedes BLS confirmation by a quarter.

## Common pitfalls

Three things go wrong in labour-market dashboards built on Monster data. **Listing-rotation noise** — Monster occasionally rotates listings in and out of the public search index for ranking experiments; don't read week-over-week noise of <5% as signal. **Multi-metro overlap** — a national role posted with `location: "remote"` may also surface in city searches that include "remote-friendly" jobs; dedupe by URL across metros within a week before computing per-metro velocity. **Salary inflation parsing** — `salary_period` mixes yearly, hourly, monthly across listings; for any salary-trend analysis, filter to one period or annualise hourly using 2,080 hours/year before aggregating.

Thirdwatch's actor returns `posted_date`, `source: "monster"`, and a stable `url` per listing — exactly the fields needed for time-series analysis. The 2,048 MB memory and 3,600-second timeout headroom mean even 500-job-per-metro runs complete reliably.

## Related use cases

- [Scrape Monster jobs for a recruiter pipeline](/blog/scrape-monster-jobs-for-recruiter-pipeline)
- [Monster vs. Indeed vs. ZipRecruiter — data coverage](/blog/monster-vs-indeed-vs-ziprecruiter-data-coverage)
- [Build a jobs meta-search from Monster](/blog/build-jobs-meta-search-from-monster)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why use Monster for US labour-market analysis?

Monster has been operating since 1994 and skews toward mid-market US employers in healthcare, manufacturing, finance, and retail — the segments under-covered by LinkedIn-only datasets. For a researcher or analyst tracking the broad US labour market rather than just the tech subset, Monster fills the mid-market gap. Combine with Indeed and ZipRecruiter for full coverage.

### How does posting velocity translate into hiring signal?

Net new postings per week is a leading indicator of intent to hire. A metro where new postings rose 20% over 4 weeks is in a tightening cycle; a metro where postings dropped 15% is loosening. The signal leads BLS payroll data by 6-8 weeks, which makes a Monster-backed dashboard genuinely useful for state-level economic forecasting that government statistics confirm later.

### What metros and roles are most useful to track?

For a national US labour dashboard, sample 8-12 metros covering different regional economies (NY, SF, Chicago, Atlanta, Dallas, Boston, Seattle, Phoenix, Denver, Miami, Minneapolis, Houston). For roles, pick three to five role-families that span the economy: software engineer, registered nurse, accountant, sales representative, truck driver. The combination gives you a representative picture without overweighting tech.

### What's a useful refresh cadence?

Weekly is the standard cadence for labour-market dashboards. Posting velocity needs at least weekly granularity to catch turning points; monthly smooths out actionable detail. Daily is wasteful for this use case because most postings stay live 14-30 days, so daily diffs are mostly the same listings ageing rather than new arrivals.

### How do I separate posting velocity from posting volume?

Volume is the absolute count of active listings; velocity is the rate of new listings per week. A metro with 15,000 active listings sounds large but if velocity is flat, hiring intent is steady. A metro with 3,000 listings but velocity rising 30% week-over-week is hiring fast. Track both, but velocity is the leading indicator.

### Can I aggregate Monster data into a state-level or national index?

Yes. Spawn parallel runs across 30-50 metros covering each US state, aggregate by week and role-family, weight by metro population, and compute a state-level posting-velocity index. The index lags BLS data by a few days but leads BLS by 6-8 weeks for changes in trend. Most labour-econ teams build something like this on top of multiple boards rather than a single source.

Run the [Monster Scraper on Apify Store](https://apify.com/thirdwatch/monster-jobs-scraper) — pay-per-job, free to try, no credit card to test.
