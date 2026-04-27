---
title: "Scrape Indeed Jobs for a Recruiter Pipeline (2026 Guide)"
slug: "scrape-indeed-jobs-for-recruiter-pipeline"
description: "Pull Indeed job listings across 60+ countries at $0.008 per job using Thirdwatch's Indeed Scraper. Salary, benefits, descriptions returned. Python and CRM recipes."
actor: "indeed-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/indeed-jobs-scraper"
actorTitle: "Indeed.com Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-us-tech-hiring-with-indeed-data"
  - "build-indeed-salary-database"
  - "monitor-competitor-hiring-on-indeed"
keywords:
  - "indeed jobs scraper"
  - "indeed api alternative"
  - "scrape indeed without login"
  - "indeed recruiter pipeline"
faqs:
  - q: "How much does it cost to scrape Indeed jobs?"
    a: "Thirdwatch's Indeed Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US recruiter pipeline at 100 jobs per query — typical for a multi-role daily refresh — costs $8 per pull. Hourly cadence is around $200 a month, in line with the rest of the Camoufox-based stealth-jobs cluster."
  - q: "How does Indeed compare to LinkedIn for recruiter sourcing?"
    a: "Indeed has materially higher listing volume — roughly 5M+ active US listings on a typical day vs LinkedIn's narrower paid-post cohort — and broader coverage outside tech-mainstream roles (healthcare, manufacturing, retail). LinkedIn skews toward professional/white-collar roles with stronger salary bands. Most US recruiter pipelines pull both as complementary sources, dedupe by URL, and let downstream filters route candidates by vertical."
  - q: "Which countries does the actor cover?"
    a: "48 country domains: US, UK, India, Canada, Australia, Germany, France, Singapore, UAE, Japan, Brazil, Mexico, Netherlands, Italy, Spain, Austria, Switzerland, Belgium, Ireland, New Zealand, South Africa, Philippines, Hong Kong, Pakistan, Nigeria, Kenya, Egypt, Argentina, Colombia, Chile, Peru, Poland, Czech Republic, Romania, Hungary, Sweden, Norway, Denmark, Finland, Portugal, Greece, Israel, Taiwan, South Korea, Thailand, Malaysia, Indonesia, Vietnam, Bangladesh. Pass the country code as the country input."
  - q: "What's the salary fill-rate on Indeed?"
    a: "Roughly 30-50% of Indeed listings publish salary, varying by country (US runs higher, UK and India lower). The actor parses salary into structured fields when published — salary_min, salary_max, salary_currency, salary_period — and leaves them null otherwise. For salary-band analysis, filter to non-null rows before aggregating; the bias toward published-salary jobs is small enough to not skew most analyses."
  - q: "Are job descriptions returned in full?"
    a: "Yes when scrapeDetails is set to true (default). The actor visits each detail page to extract the full description, typically 2,000-5,000 characters. Setting scrapeDetails: false skips the detail fetch and returns only search-card data — title, company, location, posted_date, url. For high-volume sweeps where you don't need descriptions, this halves run time and is the cheaper option in elapsed compute."
  - q: "Will I get blocked at high volume?"
    a: "Indeed sits behind Cloudflare and DataDome anti-bot protection. The actor uses Camoufox stealth-browser bypass with humanize plus residential proxy rotation, which keeps bypass success at production-stable rates. For very large workloads (over 10K jobs/day), split into multiple smaller runs spread through the day rather than one huge run."
---

> Thirdwatch's [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper) returns Indeed.com job listings across 48 country domains at $0.008 per job — title, company, location, parsed salary (min/max/currency/period), benefits, full descriptions, posted date, company rating. No login needed, no API key. Built for recruiter agencies, in-house TA teams, salary-research analysts, and aggregator builders who need structured Indeed data programmatically.

## Why scrape Indeed for a recruiter pipeline

Indeed is the world's largest job board by listing volume. According to [Indeed's 2024 hiring outlook](https://www.indeed.com/career-advice/career-development/job-market-trends), the platform hosts over 250 million unique listings annually with 350+ million unique monthly visitors — a massive data surface that no recruiter pipeline can ignore. The blocker for most teams: Indeed retired its public job-search API for third parties in 2018, leaving structured-data scrapers as the only systematic access path.

The job-to-be-done is structured. A US-focused recruiter agency monitoring competitor postings wants daily refresh of every senior backend engineer role within 50 miles of seven metros. A staffing firm placing nurses across regional health systems needs Indeed listings filtered to RN/LPN with rate-band data. An aggregator builder ingests Indeed alongside LinkedIn, Monster, ZipRecruiter, and SimplyHired into a multi-source feed. A salary-research analyst tracks compensation distributions across US tech roles. All of these reduce to keyword + location + country pulls returning structured rows. The actor is the data layer.

## How does this compare to the alternatives?

Three options for getting Indeed jobs data into a pipeline:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| DIY Camoufox + Cloudflare/DataDome bypass | Free compute, weeks of dev | Brittle without humanize tuning | 6–10 weeks | You own the stealth layer |
| misceres/indeed-scraper (Apify) | ~$1–$6 (tiered) | Larger installed base | 5 minutes | Vendor maintains |
| Thirdwatch Indeed Scraper | $8 ($0.008 × 1,000) | Production-tested across 48 countries | 5 minutes | Thirdwatch tracks Indeed changes |

The DIY estimate is what most teams burn before getting Camoufox + DataDome bypass stable; Indeed's anti-bot stack is one of the more aggressive on the public web. The [Indeed Scraper actor page](/scrapers/indeed-jobs-scraper) returns 22 fields per job out of the box, including parsed salary and benefits arrays, which most cheaper alternatives do not.

## How to scrape Indeed jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs by query, location, and country?

Pass keyword queries in `queries`, set `country` to the Indeed country domain code, and `location` to narrow within that country.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~indeed-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["senior software engineer", "staff software engineer"],
        "location": "Austin, TX",
        "country": "www",
        "maxResults": 100,
        "scrapeDetails": True,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company_name.nunique()} employers")
```

Two queries × 100 results = up to 200 listings, costing $1.60. The actor's 3,600-second timeout headroom handles the Camoufox stealth-browser launch overhead.

### Step 3: How do I filter by salary, benefits, and remote?

Salary fields are non-null on ~40% of US listings. Filter to non-null and apply band thresholds.

```python
SENIOR_BAND = df[
    df.salary_min.notna()
    & (df.salary_period == "yearly")
    & (df.salary_min >= 150000)
].copy()
SENIOR_BAND["has_health"] = SENIOR_BAND.benefits.apply(
    lambda b: isinstance(b, list) and any("health" in x.lower() for x in b)
)
SENIOR_BAND["has_401k"] = SENIOR_BAND.benefits.apply(
    lambda b: isinstance(b, list) and any("401" in x for x in b)
)
print(SENIOR_BAND[["title", "company_name", "location", "is_remote",
                   "salary_min", "salary_max", "has_health", "has_401k",
                   "company_rating", "url"]].head(20))
```

`is_remote` is a clean boolean from Indeed's own filter — much more reliable than parsing "remote" out of titles or descriptions.

### Step 4: How do I push to a recruiter CRM via webhook?

Indeed's `url` is stable per posting; dedupe on it and upsert into HubSpot or your ATS.

```bash
curl -X POST "https://api.apify.com/v2/schedules?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "indeed-austin-senior-eng-6h",
    "cronExpression": "0 */6 * * *",
    "timezone": "America/Chicago",
    "isEnabled": true,
    "actions": [{
      "type": "RUN_ACTOR",
      "actorId": "thirdwatch~indeed-jobs-scraper",
      "runInput": {
        "queries": ["senior software engineer", "staff software engineer"],
        "location": "Austin, TX",
        "country": "www",
        "maxResults": 100,
        "scrapeDetails": true
      }
    }]
  }'
```

Add an `ACTOR.RUN.SUCCEEDED` webhook pointing at your CRM ingestion endpoint and the loop closes itself — every six hours, fresh Indeed Austin senior engineering roles land in the recruiter's pipeline.

## Sample output

A single record from the dataset for one New York data scientist role looks like this. Five rows of this shape weigh ~15 KB.

```json
{
  "title": "Senior Data Scientist",
  "company_name": "Google",
  "location": "New York, NY",
  "description": "We are looking for a Senior Data Scientist to join our team...",
  "url": "https://www.indeed.com/viewjob?jk=abc123def456",
  "salary_raw": "$120,000 - $180,000 a year",
  "salary_min": 120000,
  "salary_max": 180000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "posted_date": "2026-04-06",
  "job_type": "Full-time",
  "benefits": ["Health insurance", "401(k)", "Paid time off"],
  "is_remote": false,
  "company_rating": "4.2",
  "company_reviews_count": "1523"
}
```

`benefits` is a clean array of strings — much higher signal than keyword extraction from descriptions. `company_rating` and `company_reviews_count` are Indeed's company-rating signals (separate from job-listing rating); use them as a quick employer-quality filter alongside the listing data. `is_remote: false` is Indeed's structured boolean, which avoids false positives from job descriptions that mention "remote" without offering it.

## Common pitfalls

Three things go wrong in production Indeed pipelines. **Salary-period mixing** — Indeed publishes hourly, monthly, and yearly bands across the same search results; aggregating without filtering on `salary_period` produces nonsensical averages. Always filter to one period before computing medians. **Country-domain confusion** — `country: "www"` is the US domain (the Indeed default), `country: "uk"` is the UK domain (`uk.indeed.com`); leaving `country: ""` or omitting it falls back to the US site even when `location` says London. **Cross-board dedup** — when ingesting Indeed alongside Monster, ZipRecruiter, and SimplyHired, dedupe by `(title-norm, company-norm, location-norm, salary_min)` rather than URL alone since the same job has different URLs across boards.

Thirdwatch's actor uses Camoufox + humanize for DataDome and Cloudflare bypass — the same architecture proven 100% effective on Monster and ZipRecruiter. The 4096 MB max memory and 3,600-second timeout give comfortable headroom for 200-job runs. Built-in rate limiting plus residential-proxy rotation keep bypass stable at production volumes.

## Related use cases

- [Track US tech hiring with Indeed data](/blog/track-us-tech-hiring-with-indeed-data)
- [Build an Indeed salary database for compensation research](/blog/build-indeed-salary-database)
- [Monitor competitor hiring on Indeed](/blog/monitor-competitor-hiring-on-indeed)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Indeed jobs?

Thirdwatch's Indeed Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US recruiter pipeline at 100 jobs per query — typical for a multi-role daily refresh — costs $8 per pull. Hourly cadence is around $200 a month, in line with the rest of the Camoufox-based stealth-jobs cluster.

### How does Indeed compare to LinkedIn for recruiter sourcing?

Indeed has materially higher listing volume — roughly 5M+ active US listings on a typical day vs LinkedIn's narrower paid-post cohort — and broader coverage outside tech-mainstream roles (healthcare, manufacturing, retail). LinkedIn skews toward professional/white-collar roles with stronger salary bands. Most US recruiter pipelines pull both as complementary sources, dedupe by URL, and let downstream filters route candidates by vertical.

### Which countries does the actor cover?

48 country domains: US, UK, India, Canada, Australia, Germany, France, Singapore, UAE, Japan, Brazil, Mexico, Netherlands, Italy, Spain, Austria, Switzerland, Belgium, Ireland, New Zealand, South Africa, Philippines, Hong Kong, Pakistan, Nigeria, Kenya, Egypt, Argentina, Colombia, Chile, Peru, Poland, Czech Republic, Romania, Hungary, Sweden, Norway, Denmark, Finland, Portugal, Greece, Israel, Taiwan, South Korea, Thailand, Malaysia, Indonesia, Vietnam, Bangladesh. Pass the country code as the `country` input.

### What's the salary fill-rate on Indeed?

Roughly 30-50% of Indeed listings publish salary, varying by country (US runs higher, UK and India lower). The actor parses salary into structured fields when published — `salary_min`, `salary_max`, `salary_currency`, `salary_period` — and leaves them null otherwise. For salary-band analysis, filter to non-null rows before aggregating; the bias toward published-salary jobs is small enough to not skew most analyses.

### Are job descriptions returned in full?

Yes when `scrapeDetails` is set to true (default). The actor visits each detail page to extract the full description, typically 2,000-5,000 characters. Setting `scrapeDetails: false` skips the detail fetch and returns only search-card data — title, company, location, posted_date, url. For high-volume sweeps where you don't need descriptions, this halves run time and is the cheaper option in elapsed compute.

### Will I get blocked at high volume?

Indeed sits behind Cloudflare and DataDome anti-bot protection. The actor uses Camoufox stealth-browser bypass with `humanize` plus residential proxy rotation, which keeps bypass success at production-stable rates. For very large workloads (over 10K jobs/day), split into multiple smaller runs spread through the day rather than one huge run.

Run the [Indeed Scraper on Apify Store](https://apify.com/thirdwatch/indeed-jobs-scraper) — pay-per-job, free to try, no credit card to test.
