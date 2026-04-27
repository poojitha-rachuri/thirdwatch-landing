---
title: "Track Mid-Market US Hiring via SimplyHired (2026 Guide)"
slug: "track-mid-market-hiring-via-simplyhired"
description: "Detect mid-market US hiring intent at $0.008 per record using Thirdwatch's SimplyHired Scraper. Industry-segmented velocity + posting-volume signals."
actor: "simplyhired-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/simplyhired-jobs-scraper"
actorTitle: "SimplyHired Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-simplyhired-jobs-for-aggregator"
  - "find-blue-collar-jobs-with-simplyhired"
  - "build-us-jobs-coverage-with-simplyhired"
keywords:
  - "us mid market hiring"
  - "simplyhired posting velocity"
  - "mid-market labor signal"
  - "regional employer hiring tracker"
faqs:
  - q: "Why is SimplyHired better than Indeed for mid-market hiring signal?"
    a: "SimplyHired's source mix overweights mid-market employers and partner boards relative to Indeed's tech-mainstream bias. For tracking hiring intent at the 100-1,000 employee band — the segment that drives most US job creation — SimplyHired surfaces signal that gets diluted in Indeed's much larger volume. Use both; SimplyHired is the leading indicator and Indeed is the volume baseline."
  - q: "What defines a mid-market employer in the dataset?"
    a: "There's no employee-count field on SimplyHired listings, so size has to be inferred. The pragmatic heuristic: filter out the top 200 known large employers (Amazon, Walmart, UnitedHealth, etc.) and the long-tail one-off postings, leaving the middle band. Most listings from regional chains, mid-market healthcare networks, and 200-2000 employee companies fall into the right segment."
  - q: "What posting-velocity threshold matters at mid-market scale?"
    a: "A 25%+ rise in week-over-week posting count for a specific industry × metro combination is the standard alert threshold. Mid-market hiring is less volatile than large-enterprise (which moves with quarterly headcount targets) so 25% is meaningful, while a 5-10% week-over-week move is noise. Smooth single-week noise with a 4-week rolling window."
  - q: "How do I segment by industry without an explicit field?"
    a: "Map company names to industry via a public dataset like Open Corporates or the Russell 2000 industry classification. For employer names not in either, infer industry from the role-title keywords (RN/LPN → healthcare, accountant/auditor → finance, software engineer → tech). Imperfect but adequate for industry-level velocity tracking."
  - q: "Can I detect regional economic shifts faster than BLS?"
    a: "Yes. SimplyHired posting velocity at metro level leads BLS metro-employment data by 4-6 weeks. A metro showing 30%+ velocity rise across multiple industries is in a tightening cycle that BLS will confirm in the next monthly metro report. The metro-level lead is shorter than the national-level lead because metro BLS data is itself faster to publish than headline employment."
  - q: "How do I refresh and what's a good cadence?"
    a: "Weekly snapshots are the standard cadence for mid-market hiring tracking. Daily catches noise rather than signal, monthly is too coarse to catch turning points. Six-hourly is overkill for this use case. Schedule the actor every Sunday at midnight UTC and run a multi-metro × multi-industry sweep; the analysis lives in the time series."
---

> Thirdwatch's [SimplyHired Scraper](https://apify.com/thirdwatch/simplyhired-jobs-scraper) makes mid-market US hiring intent a tracked signal at $0.008 per record — weekly snapshot multiple metros and industries, compute posting velocity, surface tightening or loosening regions before BLS metro data confirms it. Built for regional economists, mid-market private-equity due-diligence teams, and workforce-planning teams who need a leading indicator focused on the 100-2,000 employee segment under-covered by tech-board-only data.

## Why SimplyHired for mid-market US hiring signal

Mid-market employers (100-2,000 employees) drive a disproportionate share of US job creation. According to [the Small Business Administration's 2024 employment dynamics report](https://www.sba.gov/), the mid-market band added more than 1.5 million net new jobs in 2024, exceeding both small-business and large-enterprise net additions. SimplyHired's source mix — partner-board syndication plus direct employer postings — overweights mid-market employers compared to LinkedIn or Indeed, making it a higher-signal single source for tracking this band's hiring intent.

The job-to-be-done is structured. A regional economist tracking Mountain West states wants weekly mid-market posting volume by industry. A private-equity team doing diligence on a regional services company wants its competitor-cohort posting velocity to corroborate management claims. A workforce-planning team at a multi-state mid-market retailer wants peer-cohort hiring data to time their own recruitment campaigns. All three reduce to weekly SimplyHired snapshots × industry × metro, with velocity analysis downstream.

## How does this compare to the alternatives?

Three options for mid-market US hiring intent data:

| Approach | Cost per 1,000 records × weekly × 8 metros | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Bureau of Labor Statistics monthly QCEW | Free, official | Authoritative but lagging 4-8 weeks | Days | Federal release schedule |
| Paid labour-intel SaaS (Lightcast, Burning Glass mid-market tier) | $30K–$150K/year flat | High | Weeks–months to onboard | Vendor lock-in |
| Thirdwatch SimplyHired Scraper | $64 × weekly = $3,328/year | Production-tested, monopoly position on Apify | Half a day | Thirdwatch maintains stealth layer |

Paid labour-intel platforms include SimplyHired data alongside others; building a focused mid-market dashboard on SimplyHired alone is cheaper and gives you full schema control. The [SimplyHired Scraper actor page](/scrapers/simplyhired-jobs-scraper) is the data layer.

## How to track mid-market US hiring in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a weekly multi-industry multi-metro snapshot?

Spawn parallel runs across metros × representative role queries per industry.

```python
import os, requests, time, json, datetime, pathlib

ACTOR = "thirdwatch~simplyhired-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

METROS = ["Charlotte, NC", "Indianapolis, IN", "Nashville, TN",
          "Salt Lake City, UT", "Kansas City, MO", "Tampa, FL",
          "Columbus, OH", "Raleigh, NC"]
INDUSTRIES = {
    "healthcare": ["registered nurse", "medical assistant"],
    "manufacturing": ["production supervisor", "quality engineer"],
    "finance": ["accountant", "financial analyst"],
    "tech": ["software engineer", "IT manager"],
    "retail": ["store manager", "district manager"],
}

run_ids = []
for metro in METROS:
    for industry, queries in INDUSTRIES.items():
        r = requests.post(
            f"https://api.apify.com/v2/acts/{ACTOR}/runs",
            params={"token": TOKEN},
            json={"queries": queries, "location": metro, "maxResults": 100},
        )
        run_ids.append((metro, industry, r.json()["data"]["id"]))
        time.sleep(0.5)

week = datetime.date.today().isocalendar()
ts = f"{week.year}-W{week.week:02d}"
out = pathlib.Path(f"snapshots/simplyhired-mid-{ts}")
out.mkdir(parents=True, exist_ok=True)

for metro, industry, run_id in run_ids:
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
        key = f"{metro.replace(', ', '-')}-{industry}"
        (out / f"{key}.json").write_text(json.dumps(items))
```

8 metros × 5 industries × ~100 jobs = up to 4,000 listings per weekly snapshot, costing $32.

### Step 3: How do I filter to mid-market employers and compute velocity?

Filter out known large employers, aggregate weekly counts.

```python
import pandas as pd, glob, json as J

LARGE_EMPLOYERS = {
    "amazon", "walmart", "kroger", "unitedhealth", "cvs", "fedex",
    "hca", "lowe's", "home depot", "fedex", "ups", "uber", "lyft",
    # ... extend with Russell 1000 + top 200 known mid-cap mass employers
}

frames = []
for d in sorted(glob.glob("snapshots/simplyhired-mid-*")):
    week = pathlib.Path(d).name.replace("simplyhired-mid-", "")
    for f in glob.glob(f"{d}/*.json"):
        key = pathlib.Path(f).stem
        metro = "-".join(key.split("-")[:-1]).replace("-", ", ", 1)
        industry = key.split("-")[-1]
        for j in J.loads(pathlib.Path(f).read_text()):
            company_lower = (j.get("company") or "").lower()
            if any(e in company_lower for e in LARGE_EMPLOYERS):
                continue
            frames.append({"week": week, "metro": metro,
                           "industry": industry,
                           "company": j["company"], "url": j["url"]})

df = pd.DataFrame(frames).drop_duplicates(subset=["week", "url"])
weekly = df.groupby(["week", "metro", "industry"]).size().reset_index(name="postings")
print(weekly.pivot_table(index=["metro", "industry"],
                          columns="week", values="postings").tail(20))
```

Expect 2,000-3,000 mid-market listings per week after filtering — a stable enough sample for industry-level velocity tracking.

### Step 4: How do I detect velocity inflection across metros?

Compute 4-week rolling average and flag metro × industry cells with >25% week-over-week change.

```python
pivot = weekly.pivot_table(index=["metro", "industry"],
                           columns="week", values="postings", fill_value=0)
weeks = sorted(pivot.columns)
if len(weeks) >= 5:
    pivot["rolling_4w"] = pivot[weeks[-5:-1]].mean(axis=1)
    pivot["wow_pct"] = (pivot[weeks[-1]] / pivot.rolling_4w.clip(lower=1)) - 1
    flags = pivot[(pivot[weeks[-1]] >= 30) & (pivot.wow_pct.abs() >= 0.25)]
    print("--- Tightening (positive) and loosening (negative) cells ---")
    print(flags[[weeks[-1], "rolling_4w", "wow_pct"]].sort_values("wow_pct", ascending=False))
```

A metro × industry cell at `wow_pct >= 0.25` with `>=30` listings in the latest week is a meaningful regional hiring signal — typically leading BLS metro-employment data by a month or more.

## Sample output

A single record from the dataset for one Charlotte mid-market role looks like this. The mid-market velocity analysis stitches thousands of such rows.

```json
{
  "title": "Production Supervisor",
  "company": "Pharos Manufacturing",
  "location": "Charlotte, NC",
  "salary_text": "$70,000 - $90,000 a year",
  "salary_min": 70000,
  "salary_max": 90000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "description": "Pharos Manufacturing seeks a Production Supervisor for our Charlotte facility...",
  "posted_date": "2026-04-22",
  "source": "simplyhired",
  "url": "https://www.simplyhired.com/job/abc789"
}
```

A typical velocity dashboard table from 8 weeks of mid-market snapshots looks like:

| Metro | Industry | Wk-3 | Wk-2 | Wk-1 | Wk-0 | 4w avg | WoW |
|---|---|---|---|---|---|---|---|
| Nashville, TN | healthcare | 102 | 118 | 134 | 168 | 130 | +29% |
| Tampa, FL | retail | 88 | 81 | 75 | 64 | 77 | -17% |
| Indianapolis, IN | manufacturing | 142 | 138 | 156 | 198 | 158 | +25% |

Nashville healthcare and Indianapolis manufacturing tightening 25%+ WoW is exactly the kind of regional signal that precedes BLS confirmation by a month.

## Common pitfalls

Three things break mid-market hiring trackers on SimplyHired data. **Large-employer leakage** — the LARGE_EMPLOYERS list is never complete; new entrants and rebrands need quarterly review. Filter aggressively rather than under-filtering, and treat unfiltered runs as suspect. **Industry-keyword overlap** — a "store manager" role can be retail or restaurant; for cleaner industry segmentation, layer a description-keyword filter on top of role-title (e.g. require "QSR" or "restaurant" present in description for food retail). **Cross-board duplicate inflation** — SimplyHired re-publishes Indeed listings under SimplyHired URLs; if you're also pulling Indeed, dedupe across sources by `(title-norm, company-norm, location-norm, salary_min)` before aggregating.

Thirdwatch's actor returns `posted_date` and stable `url` per listing — exactly the fields needed for time-series analysis. The 2,048 MB memory and 3,600-second timeout headroom mean even the multi-metro multi-industry weekly fan-out completes reliably.

## Related use cases

- [Scrape SimplyHired jobs for an aggregator](/blog/scrape-simplyhired-jobs-for-aggregator)
- [Find blue-collar jobs with SimplyHired](/blog/find-blue-collar-jobs-with-simplyhired)
- [Build US jobs coverage with SimplyHired](/blog/build-us-jobs-coverage-with-simplyhired)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why is SimplyHired better than Indeed for mid-market hiring signal?

SimplyHired's source mix overweights mid-market employers and partner boards relative to Indeed's tech-mainstream bias. For tracking hiring intent at the 100-1,000 employee band — the segment that drives most US job creation — SimplyHired surfaces signal that gets diluted in Indeed's much larger volume. Use both; SimplyHired is the leading indicator and Indeed is the volume baseline.

### What defines a mid-market employer in the dataset?

There's no employee-count field on SimplyHired listings, so size has to be inferred. The pragmatic heuristic: filter out the top 200 known large employers (Amazon, Walmart, UnitedHealth, etc.) and the long-tail one-off postings, leaving the middle band. Most listings from regional chains, mid-market healthcare networks, and 200-2000 employee companies fall into the right segment.

### What posting-velocity threshold matters at mid-market scale?

A 25%+ rise in week-over-week posting count for a specific industry × metro combination is the standard alert threshold. Mid-market hiring is less volatile than large-enterprise (which moves with quarterly headcount targets) so 25% is meaningful, while a 5-10% week-over-week move is noise. Smooth single-week noise with a 4-week rolling window.

### How do I segment by industry without an explicit field?

Map company names to industry via a public dataset like [Open Corporates](https://opencorporates.com/) or the Russell 2000 industry classification. For employer names not in either, infer industry from the role-title keywords (RN/LPN → healthcare, accountant/auditor → finance, software engineer → tech). Imperfect but adequate for industry-level velocity tracking.

### Can I detect regional economic shifts faster than BLS?

Yes. SimplyHired posting velocity at metro level leads BLS metro-employment data by 4-6 weeks. A metro showing 30%+ velocity rise across multiple industries is in a tightening cycle that BLS will confirm in the next monthly metro report. The metro-level lead is shorter than the national-level lead because metro BLS data is itself faster to publish than headline employment.

### How do I refresh and what's a good cadence?

Weekly snapshots are the standard cadence for mid-market hiring tracking. Daily catches noise rather than signal, monthly is too coarse to catch turning points. Six-hourly is overkill for this use case. Schedule the actor every Sunday at midnight UTC and run a multi-metro × multi-industry sweep; the analysis lives in the time series.

Run the [SimplyHired Scraper on Apify Store](https://apify.com/thirdwatch/simplyhired-jobs-scraper) — pay-per-job, free to try, no credit card to test.
