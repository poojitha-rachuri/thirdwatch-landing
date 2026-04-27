---
title: "Scrape Naukri Jobs for India Recruiting at Scale (2026)"
slug: "scrape-naukri-jobs-for-india-recruiting"
description: "Pull India's #1 job-portal listings at $0.002 per job using Thirdwatch's Naukri Scraper. Salary, skills, full descriptions across 20+ cities. Python recipes inside."
actor: "naukri-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/naukri-jobs-scraper"
actorTitle: "Naukri.com Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-india-it-services-hiring-on-naukri"
  - "build-naukri-salary-benchmarks-by-experience"
  - "find-india-tech-jobs-by-skill-on-naukri"
keywords:
  - "naukri scraper"
  - "india jobs api"
  - "scrape naukri without login"
  - "india recruiting pipeline"
faqs:
  - q: "How much does it cost to scrape Naukri jobs?"
    a: "Thirdwatch's Naukri Scraper charges $0.002 per job on the FREE tier and drops to $0.001 at GOLD volume — among the cheapest jobs scrapers in the catalog. A 50-query India recruiter pipeline at 20 jobs each (Naukri caps a single search page at ~20 results) costs $2 per pull, well below typical Indian recruitment SaaS subscriptions."
  - q: "Why scrape Naukri specifically for Indian recruiting?"
    a: "Naukri dominates the Indian job market with 80%+ market share and 50M+ monthly visits — materially deeper coverage of Indian listings than LinkedIn, Indeed India, or Glassdoor. For any India-focused recruiter pipeline, Naukri is non-negotiable as the primary source. Pair it with CutShort for product-tech startups and AmbitionBox for compensation context."
  - q: "How does the actor structure city + role queries?"
    a: "Naukri's URL structure encodes both role and city in the query string, so the actor accepts queries that include both — for example software engineer bangalore or data analyst mumbai. Each query scrapes one search results page (~20 jobs). For systematic city × role coverage, build a query matrix (8 cities × 5 roles = 40 queries) and run them in one batch."
  - q: "Are salaries returned reliably?"
    a: "About 50-60% of Naukri listings publish salary; the rest return Not disclosed. The actor returns the salary string as Naukri shows it (e.g. 25-30 Lacs PA, 8-12 Lacs PA), so downstream you'll need to regex-parse to numerics. Indian compensation is typically reported in lakhs (1 lakh = 100,000 INR) and the actor preserves this convention faithfully."
  - q: "How fresh is Naukri data?"
    a: "Each run pulls live from Naukri at request time. Naukri's posted_at field shows relative time (1 day ago, 3 hours ago) since Naukri itself doesn't publish absolute timestamps. For freshness-sensitive pipelines, capture your scrape timestamp and treat posted_at as relative. Most active recruiter pipelines run Naukri daily."
  - q: "What's the right query strategy for full Indian-city coverage?"
    a: "Eight tier-1 + tier-2 cities cover ~85% of Indian tech recruiting volume: Bangalore, Mumbai, Delhi NCR (Gurgaon/Noida), Hyderabad, Chennai, Pune, Kolkata, Ahmedabad. Crossed with 5-10 target roles, that's 40-80 queries totaling 800-1,600 listings per daily refresh. At $0.002 per result that's $1.60-$3.20/day — small enough to run unsupervised."
---

> Thirdwatch's [Naukri.com Scraper](https://apify.com/thirdwatch/naukri-jobs-scraper) returns India's largest job board's listings at $0.002 per job — title, company, location, salary, experience, skills, full descriptions across 20+ Indian cities. Built for India-focused recruiter agencies, Indian tech startups building their own talent attraction, salary-research analysts, and aggregator builders who need Naukri's catalog as a structured feed without per-call API billing.

## Why scrape Naukri for Indian recruiting

Naukri is the dominant Indian job board. According to [Naukri parent InfoEdge's 2024 annual disclosures](https://www.infoedge.in/), the platform processes more than 50 million monthly visits and indexes 80%+ of the Indian recruiting catalog — material depth no other source matches in India. For any India-focused pipeline (recruiter agency, in-house TA team, salary-research analyst), Naukri is the primary source. The blocker for systematic access: Naukri does not offer a public job-search API for third-party developers.

The job-to-be-done is structured. An India-focused recruiter agency wants daily refresh of every senior backend engineer role across Bangalore, Mumbai, and Delhi NCR. A startup HR leader monitoring competitor postings wants Naukri data for the 30 companies they actively poach from. A salary-research analyst tracks Indian tech compensation by experience band over time. An aggregator builder ingests Naukri alongside LinkedIn and Indeed for the broadest possible India coverage. All reduce to query × maxResults pulls returning structured rows ready for pandas, BigQuery, or a CRM.

## How does this compare to the alternatives?

Three options for getting Naukri data into a pipeline:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Naukri research + Excel | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Indian recruitment SaaS (HirePro, Vahan API) | $20K–$100K/year flat | High | Days–weeks | Vendor lock-in |
| Thirdwatch Naukri Scraper | $2 ($0.002 × 1,000) | Production-tested | 5 minutes | Thirdwatch tracks Naukri changes |

Indian recruitment SaaS bundles Naukri with LinkedIn and other sources behind enterprise contracts. The [Naukri Scraper actor page](/scrapers/naukri-jobs-scraper) gives you the structured feed at pay-per-result pricing — no minimum, no contract.

## How to scrape Naukri jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs across multiple cities and roles?

Build a city × role query matrix and pass to the actor. Each query returns one results page (~20 jobs).

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~naukri-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CITIES = ["bangalore", "mumbai", "delhi", "hyderabad",
          "chennai", "pune", "kolkata", "ahmedabad"]
ROLES = ["software engineer", "data scientist", "product manager",
         "devops engineer", "frontend developer"]

queries = [f"{role} {city}" for city in CITIES for role in ROLES]
print(f"Submitting {len(queries)} queries")

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResultsPerQuery": 20, "scrapeMode": "full"},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} listings across {df.company_name.nunique()} companies")
```

8 cities × 5 roles = 40 queries × 20 jobs = up to 800 listings, costing $1.60.

### Step 3: How do I parse salary strings into numeric lakhs?

Naukri publishes salaries in lakhs format like `25-30 Lacs PA`; regex-parse for analytics.

```python
import re

def parse_lakhs(s):
    if not s or "Not disclosed" in str(s):
        return (None, None)
    nums = re.findall(r"(\d+(?:\.\d+)?)", str(s))
    if len(nums) < 1:
        return (None, None)
    if len(nums) == 1:
        return (float(nums[0]), float(nums[0]))
    return (float(nums[0]), float(nums[1]))

df[["lakhs_min", "lakhs_max"]] = df.salary.apply(
    lambda s: pd.Series(parse_lakhs(s))
)
disclosed = df[df.lakhs_min.notna()]
print(f"Salary disclosed on {len(disclosed)}/{len(df)} listings ({len(disclosed)/len(df):.0%})")

ranked = (
    disclosed.groupby("company_name")
    .agg(median_lakhs=("lakhs_max", "median"),
         n=("title", "count"))
    .query("n >= 3")
    .sort_values("median_lakhs", ascending=False)
)
print(ranked.head(20))
```

The output is the company-by-company Indian compensation leaderboard for your role-and-city watchlist.

### Step 4: How do I push to a recruiter CRM with deduplication?

Naukri's `apply_url` is stable per posting; dedupe on it and upsert to HubSpot or your sourcing tool.

```python
df = df.drop_duplicates(subset=["apply_url"])

import psycopg2.extras
with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO naukri_jobs
              (apply_url, title, company_name, location,
               salary, experience, skills, description,
               posted_at, scraped_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             title = EXCLUDED.title,
             salary = EXCLUDED.salary,
             scraped_at = now()""",
        [(j["apply_url"], j["title"], j["company_name"], j.get("location"),
          j.get("salary"), j.get("experience"), j.get("skills"),
          j.get("description"), j.get("posted_at"), "now()")
         for j in df.to_dict("records")],
    )
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at daily cadence and the loop is fully self-maintaining.

## Sample output

A single record for one Bangalore software engineer role looks like this. Five rows of this shape weigh ~25 KB.

```json
{
  "title": "Software Engineer",
  "company_name": "Cisco",
  "location": "Bengaluru, Hyderabad",
  "salary": "Not disclosed",
  "experience": "0-1 Yrs",
  "skills": ["Python", "Java", "Agile", "Unit Testing"],
  "description": "Please note this posting is to advertise potential job opportunities...",
  "posted_at": "1 day ago",
  "apply_url": "https://www.naukri.com/job-listings-software-engineer-cisco-..."
}
```

`apply_url` is the canonical natural key for upsert. `salary` is whatever Naukri shows publicly — `25-30 Lacs PA` for disclosed salaries or `Not disclosed` (which the actor preserves verbatim). `experience` is a free-text band like `0-1 Yrs`, `5-8 Yrs`, or `10+ Yrs` — parse the lower bound out via regex for filtering. `skills` is a clean array of strings, much higher signal than keyword extraction from descriptions.

## Common pitfalls

Three things go wrong in production Naukri pipelines. **Salary opacity** — about 40-50% of Naukri listings show `Not disclosed`. Pipelines that compute averages without filtering null rows produce wildly wrong estimates; always filter to disclosed-salary rows before aggregating bands. **City-name spelling drift** — Naukri accepts both `bangalore` and `bengaluru` interchangeably, but they return slightly different result sets. Standardise to one spelling per city in your query matrix. **Pagination cap** — each query returns one search results page (~20 jobs); for deeper coverage, narrow queries by seniority (`senior software engineer bangalore` + `staff software engineer bangalore`) rather than expecting one broad query to return more.

Thirdwatch's actor uses Camoufox stealth-browser bypass with Indian residential proxy — production-tested at sustained daily volumes. The 4096 MB max memory and 3,600-second timeout headroom mean even multi-city batch runs complete cleanly. Pair Naukri with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for compensation context, [CutShort Scraper](https://apify.com/thirdwatch/cutshort-jobs-scraper) for startup tech jobs, and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for international coverage. A fourth subtle issue worth flagging is that Naukri shows the same job under different city tags when the role is open at multiple offices (Cisco's posting often shows "Bengaluru, Hyderabad" as the location), so cross-city dedupe by `apply_url` before computing per-city volume — otherwise multi-office postings double-count. A fifth note for India-specific recruiting: Naukri's experience field encodes both minimum and maximum (e.g. `0-1 Yrs`, `5-8 Yrs`); for cleanest pipelines parse both bounds and segment listings into Junior (0-2y), Mid (3-7y), Senior (8-12y), Lead (13y+) bands using the lower bound.

## Related use cases

- [Track India IT-services hiring on Naukri](/blog/track-india-it-services-hiring-on-naukri)
- [Build Naukri salary benchmarks by experience](/blog/build-naukri-salary-benchmarks-by-experience)
- [Find India tech jobs by skill on Naukri](/blog/find-india-tech-jobs-by-skill-on-naukri)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Naukri jobs?

Thirdwatch's Naukri Scraper charges $0.002 per job on the FREE tier and drops to $0.001 at GOLD volume — among the cheapest jobs scrapers in the catalog. A 50-query India recruiter pipeline at 20 jobs each (Naukri caps a single search page at ~20 results) costs $2 per pull, well below typical Indian recruitment SaaS subscriptions.

### Why scrape Naukri specifically for Indian recruiting?

Naukri dominates the Indian job market with 80%+ market share and 50M+ monthly visits — materially deeper coverage of Indian listings than LinkedIn, Indeed India, or Glassdoor. For any India-focused recruiter pipeline, Naukri is non-negotiable as the primary source. Pair it with CutShort for product-tech startups and AmbitionBox for compensation context.

### How does the actor structure city + role queries?

Naukri's URL structure encodes both role and city in the query string, so the actor accepts queries that include both — for example `software engineer bangalore` or `data analyst mumbai`. Each query scrapes one search results page (~20 jobs). For systematic city × role coverage, build a query matrix (8 cities × 5 roles = 40 queries) and run them in one batch.

### Are salaries returned reliably?

About 50-60% of Naukri listings publish salary; the rest return `Not disclosed`. The actor returns the salary string as Naukri shows it (e.g. `25-30 Lacs PA`, `8-12 Lacs PA`), so downstream you'll need to regex-parse to numerics. Indian compensation is typically reported in lakhs (1 lakh = 100,000 INR) and the actor preserves this convention faithfully.

### How fresh is Naukri data?

Each run pulls live from Naukri at request time. Naukri's `posted_at` field shows relative time (`1 day ago`, `3 hours ago`) since Naukri itself doesn't publish absolute timestamps. For freshness-sensitive pipelines, capture your scrape timestamp and treat `posted_at` as relative. Most active recruiter pipelines run Naukri daily.

### What's the right query strategy for full Indian-city coverage?

Eight tier-1 + tier-2 cities cover ~85% of Indian tech recruiting volume: Bangalore, Mumbai, Delhi NCR (Gurgaon/Noida), Hyderabad, Chennai, Pune, Kolkata, Ahmedabad. Crossed with 5-10 target roles, that's 40-80 queries totaling 800-1,600 listings per daily refresh. At $0.002 per result that's $1.60-$3.20/day — small enough to run unsupervised.

Run the [Naukri.com Scraper on Apify Store](https://apify.com/thirdwatch/naukri-jobs-scraper) — pay-per-job, free to try, no credit card to test.
