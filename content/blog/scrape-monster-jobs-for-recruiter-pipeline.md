---
title: "Scrape Monster Jobs for a Recruiter Pipeline (2026)"
slug: "scrape-monster-jobs-for-recruiter-pipeline"
description: "Pull US Monster.com job listings at $0.008 per record with Thirdwatch's Monster Scraper. Salary, descriptions, location filters. Python and CRM recipes."
actor: "monster-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/monster-jobs-scraper"
actorTitle: "Monster Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-us-job-market-with-monster-data"
  - "monster-vs-indeed-vs-ziprecruiter-data-coverage"
  - "build-jobs-meta-search-from-monster"
keywords:
  - "monster jobs scraper"
  - "monster.com api alternative"
  - "us recruiter pipeline monster"
  - "scrape monster jobs python"
faqs:
  - q: "How much does it cost to scrape Monster jobs?"
    a: "Thirdwatch's Monster Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US recruiter pipeline at 100 jobs per query — typical for a multi-role daily refresh — costs $8 per pull. Hourly cadence is around $200 a month, in line with the rest of the Camoufox-based jobs cluster."
  - q: "Why is Monster harder to scrape than RemoteOK or career sites?"
    a: "Monster sits behind DataDome anti-bot protection and serves a JavaScript-rendered SPA, which means HTTP-only scrapers fail. The actor uses Camoufox — a stealth Firefox fork that bypasses DataDome with humanize and homepage warmup. That stealth layer is the cost driver and the reason Monster sits at $0.008 per job rather than the $0.0015 of pure-HTTP actors."
  - q: "Does the actor return parsed numeric salary or only the display string?"
    a: "Both. salary_text holds the display string as Monster published it ($100,000 - $140,000); salary_min and salary_max hold parsed integer values when the band is well-formed. salary_period (yearly, hourly) and salary_currency are also returned. Hourly rates are returned as the raw hourly number — multiply by 2,080 if you need an annualised band."
  - q: "How do I run this against multiple cities in one job?"
    a: "Each run takes a single location — for multi-city coverage, run the actor once per city in parallel. Apify's API supports concurrent run starts; spawn 5-10 in parallel and join the datasets afterwards. The actor also accepts location='remote' for nationwide remote-only listings, which collapses many city searches into one for remote roles."
  - q: "How fresh is Monster data, and how often should I refresh?"
    a: "Each run pulls live from Monster.com at request time. Monster publishes new postings every business hour, but most postings stay live for 14-30 days. Daily is the standard cadence for recruiter pipelines; six-hourly catches early-morning recruiter postings before competing sourcers see them. Pair the actor with Apify's scheduler for cron."
  - q: "Can I push Monster jobs straight into a CRM?"
    a: "Yes. The dataset returns CRM-ready fields: title, company, location, salary_min, salary_max, description, url. Map each row to your ATS or CRM Job schema and POST. Greenhouse, Lever, Ashby, Bullhorn, and HubSpot all accept this shape with minimal mapping. Most recruiter pipelines use Apify's webhook integration to forward each completed run's dataset directly to an ingestion endpoint."
---

> Thirdwatch's [Monster Scraper](https://apify.com/thirdwatch/monster-jobs-scraper) returns structured US job listings from Monster.com at $0.008 per job. Returns title, company, location, salary_min, salary_max, full description, and posted_date per record. Built on Camoufox stealth-browser bypass of DataDome — the same architecture as our Indeed and ZipRecruiter scrapers — for recruiters and aggregator builders who need the Monster catalog in machine-readable JSON.

## Why scrape Monster for a US recruiter pipeline

Monster.com is one of the original US job boards and still publishes hundreds of thousands of active US listings at any time. According to [Monster's 2024 careers report](https://www.monster.com/career-advice/), the platform indexes more than 250,000 active US postings on a typical weekday with strong coverage of mid-market employers in healthcare, manufacturing, finance, and retail — exactly the segments that LinkedIn-only sourcing pipelines under-cover. For a US recruiter or staffing agency, Monster is a complementary source alongside Indeed and LinkedIn.

The job-to-be-done is structured. A recruiter monitoring open roles for a healthcare-staffing client wants a daily refresh of nursing roles in five US metros. A staffing agency building a sales pipeline wants every new account-executive posting nationwide piped into HubSpot every six hours. An HR analytics team wants salary bands by role and metro tracked monthly. All of these reduce to the same data shape — search by keyword, return structured rows, dedupe on URL, push to CRM. The Monster Scraper handles the harder half (DataDome bypass + SPA rendering) and returns clean structured records.

## How does this compare to the alternatives?

Three options for getting Monster job data into a recruiter pipeline:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| DIY Camoufox + DataDome research | Free compute, weeks of dev | Brittle without humanize tuning | 4–8 weeks | You own the stealth-browser layer |
| Generic scraping API + custom parser | $30–$80 (proxy + parsing) | High proxy, parsing is yours | 2–4 weeks | You own the parser |
| Thirdwatch Monster Scraper | $8 ($0.008 × 1,000) | Production-tested with humanize + iframe Turnstile click | 5 minutes | Thirdwatch maintains the stealth layer |

The DIY estimate reflects what most teams burn building a stable Monster scraper from scratch — DataDome is a moving target. The [Monster Scraper actor page](/scrapers/monster-jobs-scraper) documents every input field, but the value compared to a generic scraping API is the maintained stealth-browser layer that Monster's anti-bot defences require.

## How to scrape Monster jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs by query and location?

Pass keyword queries in `queries` and a city or `remote` in `location`. Set `maxResults` to your daily refresh size — Monster supports up to 500 per run.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~monster-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["registered nurse", "nurse practitioner", "RN charge"],
        "location": "Houston, TX",
        "maxResults": 200,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company.nunique()} employers")
```

The actor's run timeout is set to 3,600 seconds because Camoufox launches and stealth navigation take longer than pure-HTTP runs. A typical 200-job run completes in 8-15 minutes wall-clock.

### Step 3: How do I filter by salary band and dedupe by URL?

Salary fields are null on roughly 30-40% of postings. Filter to non-null rows for any band analysis, and dedupe on `url` for clean recruiter-facing output.

```python
QUALIFIED = df[
    df.salary_min.notna()
    & (df.salary_period == "yearly")
    & (df.salary_min >= 80000)
].drop_duplicates(subset=["url"]).sort_values("salary_max", ascending=False)

print(QUALIFIED[["title", "company", "location",
                 "salary_min", "salary_max", "url"]].head(25))
```

`salary_period == "yearly"` filters out hourly bands (which would otherwise be compared like-with-unlike against annualised salaries). For a fully unified view, multiply hourly bands by 2,080 first.

### Step 4: How do I push to a recruiter CRM via webhook?

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) and add an `ACTOR.RUN.SUCCEEDED` webhook pointing at your ingestion service:

```bash
curl -X POST "https://api.apify.com/v2/schedules?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "monster-houston-nursing-6h",
    "cronExpression": "0 */6 * * *",
    "timezone": "America/Chicago",
    "isEnabled": true,
    "actions": [{
      "type": "RUN_ACTOR",
      "actorId": "thirdwatch~monster-jobs-scraper",
      "runInput": {
        "queries": ["registered nurse", "nurse practitioner"],
        "location": "Houston, TX",
        "maxResults": 200
      }
    }]
  }'
```

Add a webhook for `ACTOR.RUN.SUCCEEDED` pointing at your CRM ingestion endpoint and the loop is closed — every six hours, fresh Houston nursing jobs land in the recruiter's pipeline without human intervention.

## Sample output

A single record from the dataset for one Austin full-stack role looks like this. Five rows of this shape weigh ~12 KB.

```json
{
  "title": "Full Stack Developer",
  "company": "IBM",
  "location": "Austin, TX",
  "salary_text": "$100,000 - $140,000",
  "salary_min": 100000,
  "salary_max": 140000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "description": "Looking for a Full Stack Developer with React and Node.js experience to build customer-facing web applications...",
  "posted_date": "2026-04-07",
  "source": "monster",
  "url": "https://www.monster.com/job-openings/full-stack-developer-austin-tx"
}
```

`salary_min` and `salary_max` are the parsed numeric values when the published band is well-formed; `salary_text` is the unparsed display string. Always prefer the parsed numerics for analysis but fall back to `salary_text` regex parsing when the band is non-standard ("$50/hour DOE", "Up to $80K"). `posted_date` is when Monster first indexed the listing — for true recruiter freshness, `last_seen_at` (your downstream timestamp) matters more.

## Common pitfalls

Three things go wrong in Monster-based recruiter pipelines. **Salary-period mixing** — Monster lets employers post hourly and yearly rates in the same search results; aggregating without filtering on `salary_period` produces nonsensical averages. **Listing rotation** — Monster occasionally rotates listings in and out of the public search index for ranking experiments; the same query on consecutive days may return slightly different sets, so your dedupe logic should treat URLs as the source of truth, not search-result position. **Camoufox-cost surprise** — at $0.008 per job, a 10K-job nightly aggregator pull costs $80; this is the right unit cost for stealth-browser bypass but easy to miss when budgeting against $0.0015 pure-HTTP actors. Plan accordingly.

Thirdwatch's actor uses Camoufox with humanize and homepage warmup to bypass Monster's DataDome consistently — the same architecture proved 100% bypass on Indeed, ZipRecruiter, and Upwork in production. The 2,048 MB memory and 3,600-second timeout headroom mean even larger runs (500+ jobs) complete reliably.

## Related use cases

- [Track US job market with Monster data](/blog/track-us-job-market-with-monster-data)
- [Monster vs. Indeed vs. ZipRecruiter — data coverage](/blog/monster-vs-indeed-vs-ziprecruiter-data-coverage)
- [Build a jobs meta-search from Monster](/blog/build-jobs-meta-search-from-monster)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Monster jobs?

Thirdwatch's Monster Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US recruiter pipeline at 100 jobs per query — typical for a multi-role daily refresh — costs $8 per pull. Hourly cadence is around $200 a month, in line with the rest of the Camoufox-based jobs cluster.

### Why is Monster harder to scrape than RemoteOK or career sites?

Monster sits behind DataDome anti-bot protection and serves a JavaScript-rendered SPA, which means HTTP-only scrapers fail. The actor uses Camoufox — a stealth Firefox fork that bypasses DataDome with `humanize` and homepage warmup. That stealth layer is the cost driver and the reason Monster sits at $0.008 per job rather than the $0.0015 of pure-HTTP actors.

### Does the actor return parsed numeric salary or only the display string?

Both. `salary_text` holds the display string as Monster published it (`$100,000 - $140,000`); `salary_min` and `salary_max` hold parsed integer values when the band is well-formed. `salary_period` (yearly, hourly) and `salary_currency` are also returned. Hourly rates are returned as the raw hourly number — multiply by 2,080 if you need an annualised band.

### How do I run this against multiple cities in one job?

Each run takes a single `location` — for multi-city coverage, run the actor once per city in parallel. Apify's API supports concurrent run starts; spawn 5-10 in parallel and join the datasets afterwards. The actor also accepts `location: "remote"` for nationwide remote-only listings, which collapses many city searches into one for remote roles.

### How fresh is Monster data, and how often should I refresh?

Each run pulls live from Monster.com at request time. Monster publishes new postings every business hour, but most postings stay live for 14-30 days. Daily is the standard cadence for recruiter pipelines; six-hourly catches early-morning recruiter postings before competing sourcers see them. Pair the actor with Apify's scheduler for cron.

### Can I push Monster jobs straight into a CRM?

Yes. The dataset returns CRM-ready fields: `title`, `company`, `location`, `salary_min`, `salary_max`, `description`, `url`. Map each row to your ATS or CRM Job schema and POST. Greenhouse, Lever, Ashby, Bullhorn, and HubSpot all accept this shape with minimal mapping. Most recruiter pipelines use Apify's webhook integration to forward each completed run's dataset directly to an ingestion endpoint.

Run the [Monster Scraper on Apify Store](https://apify.com/thirdwatch/monster-jobs-scraper) — pay-per-job, free to try, no credit card to test.
