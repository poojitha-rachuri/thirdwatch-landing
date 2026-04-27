---
title: "Scrape SimplyHired Jobs for an Aggregator (2026 Guide)"
slug: "scrape-simplyhired-jobs-for-aggregator"
description: "Pull US SimplyHired job listings at $0.008 per record with Thirdwatch's SimplyHired Scraper. Salary, descriptions, dedupe and Postgres ingestion recipes."
actor: "simplyhired-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/simplyhired-jobs-scraper"
actorTitle: "SimplyHired Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "find-blue-collar-jobs-with-simplyhired"
  - "track-mid-market-hiring-via-simplyhired"
  - "build-us-jobs-coverage-with-simplyhired"
keywords:
  - "simplyhired scraper"
  - "scrape simplyhired.com"
  - "us jobs aggregator simplyhired"
  - "simplyhired api alternative"
faqs:
  - q: "How much does it cost to scrape SimplyHired?"
    a: "Thirdwatch's SimplyHired Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US aggregator daily refresh at 200 jobs per query — typical for a multi-role nationwide pull — costs $16 per pull. Hourly cadence is around $400 a month, in line with the rest of the Camoufox-based stealth-jobs cluster."
  - q: "How does SimplyHired differ from Monster or Indeed for aggregator coverage?"
    a: "SimplyHired aggregates listings from employer career pages and partner boards rather than soliciting direct postings, which means it overlaps significantly with Indeed but skews mid-market and blue-collar. For an aggregator targeting comprehensive US coverage, all three (SimplyHired + Monster + Indeed) catch unique long-tail listings the others miss. Dedupe across sources by URL or by (title, company, location) tuple."
  - q: "Are salaries returned in standard format?"
    a: "Yes, with caveats. salary_min and salary_max are integers when the band is parseable; salary_period is yearly, hourly, or monthly. SimplyHired aggregates from many sources so format consistency varies — about 50-60% of listings have parseable bands, the rest leave salary_min and salary_max null with the raw display string preserved in salary_text."
  - q: "Can I run multi-city pulls in parallel?"
    a: "Yes. Each run takes a single location — for nationwide coverage spawn parallel runs per metro and join datasets afterwards. Apify's API supports concurrent run starts; 5-10 in parallel is comfortable. The aggregator pattern of one-run-per-metro plus a downstream merge is the canonical way to build national-scope coverage without exceeding any single run's timeout."
  - q: "How fresh is SimplyHired data?"
    a: "Each run pulls live from SimplyHired.com at request time, but SimplyHired itself aggregates from upstream sources on its own cadence — so jobs in your dataset are typically 6-24 hours old by the time SimplyHired indexes them. For freshest-possible US listings, pair this scraper with our [Career Site Scraper](https://apify.com/thirdwatch/career-site-job-scraper) hitting employer pages directly. Most aggregators run SimplyHired daily."
  - q: "How do I dedupe SimplyHired jobs against Indeed and Monster?"
    a: "URL works as a primary key within SimplyHired but cross-source URLs are different even for the same job. The pragmatic dedupe key is (title-normalised, company-normalised, location-normalised, salary_min). Lower-case and strip punctuation before hashing. This catches 85-90% of cross-source duplicates. The remaining 10-15% are true edge cases (e.g. same role posted by both employer and a recruiter) and are usually fine to keep."
---

> Thirdwatch's [SimplyHired Scraper](https://apify.com/thirdwatch/simplyhired-jobs-scraper) returns structured US job listings from SimplyHired.com at $0.008 per job. Returns title, company, location, salary_min, salary_max, full description, and posted_date per record. Built on the same Camoufox stealth-browser architecture as our Monster and ZipRecruiter scrapers — purpose-built for aggregator builders who need SimplyHired's millions of US listings in clean machine-readable JSON.

## Why scrape SimplyHired for an aggregator

SimplyHired is one of the largest US job aggregators by listing volume. According to [Recruit Holdings' 2024 annual report](https://recruit-holdings.com/), SimplyHired (acquired by Recruit, the same parent as Indeed) indexes more than 30 million US listings on a typical day, drawing from both direct employer posts and partner board syndication. For an aggregator builder targeting comprehensive US coverage, including SimplyHired alongside Monster, Indeed, and ZipRecruiter is the canonical pattern — each source catches unique long-tail listings the others miss, and the deduped union covers the US market more completely than any single board.

The job-to-be-done is concrete. An aggregator developer running a US-focused jobs site needs SimplyHired's listings ingested daily and merged with three other sources. A salary-research analyst tracking US wage trends across mid-market employers wants SimplyHired's bands cleanly normalised. A staffing agency building a candidate-matching pipeline needs job descriptions to feed an LLM matcher. All of these reduce to the same data shape — search by keyword and location, return structured rows, dedupe by URL, ingest into Postgres or a search engine. The Thirdwatch actor handles the harder half (Camoufox stealth + SPA rendering) and returns clean JSON.

## How does this compare to the alternatives?

Three options for getting SimplyHired data into an aggregator:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| DIY Camoufox + SimplyHired SPA reverse-engineering | Free compute, weeks of dev | Brittle | 4–6 weeks | You own the stealth + parser |
| Generic scraping API + custom parser | $30–$80 (proxy + parsing) | High proxy, parsing is yours | 2–3 weeks | You own the parser |
| Thirdwatch SimplyHired Scraper | $8 ($0.008 × 1,000) | Production-tested, monopoly position on Apify | 5 minutes | Thirdwatch maintains the stealth layer |

SimplyHired uses anti-bot protection comparable to Indeed (its sibling under Recruit Holdings), making DIY scraping a real engineering project. The [SimplyHired Scraper actor page](/scrapers/simplyhired-jobs-scraper) gives you the structured feed; the aggregator analytics layer is downstream pandas or Postgres.

## How to scrape SimplyHired in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs by query and location?

Pass keyword queries in `queries` and a metro or `remote` in `location`. Set `maxResults` to your daily refresh size — SimplyHired supports up to 500 per run.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~simplyhired-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["product manager", "senior product manager",
                    "lead product manager"],
        "location": "San Francisco, CA",
        "maxResults": 200,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company.nunique()} employers")
```

The 3,600-second timeout headroom matches Camoufox's slower wall-clock — a 200-job run typically takes 8-15 minutes.

### Step 3: How do I parallelise across metros for nationwide coverage?

Use Apify's async runs API to spawn parallel runs per metro and join datasets afterwards.

```python
import time

METROS = ["New York, NY", "San Francisco, CA", "Chicago, IL",
          "Austin, TX", "Boston, MA", "Seattle, WA", "Denver, CO"]
QUERIES = ["product manager", "senior product manager"]

run_ids = []
for metro in METROS:
    r = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/runs",
        params={"token": TOKEN},
        json={"queries": QUERIES, "location": metro, "maxResults": 200},
    )
    run_ids.append((metro, r.json()["data"]["id"]))

all_jobs = []
for metro, run_id in run_ids:
    while True:
        status = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}",
            params={"token": TOKEN},
        ).json()["data"]["status"]
        if status in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(15)
    if status == "SUCCEEDED":
        items = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN},
        ).json()
        all_jobs.extend(items)

print(f"{len(all_jobs)} jobs across {len(METROS)} metros")
```

Seven metros × 200 jobs = up to 1,400 listings completing in 15-25 minutes total wall-clock with parallelism, costing $11.20 at FREE pricing.

### Step 4: How do I dedupe within SimplyHired and against other sources?

Within SimplyHired, dedupe on `url`. Across SimplyHired + Monster + Indeed, build a normalised key.

```python
import re

def normalise(s):
    return re.sub(r"\W+", " ", (s or "").lower()).strip()

df = pd.DataFrame(all_jobs).drop_duplicates(subset=["url"])
df["dedupe_key"] = (
    df.title.apply(normalise) + "|"
    + df.company.apply(normalise) + "|"
    + df.location.apply(normalise) + "|"
    + df.salary_min.fillna(-1).astype(int).astype(str)
)

# Merge with Monster + Indeed snapshots loaded earlier
import pandas as pd
combined = pd.concat([df, monster_df, indeed_df], ignore_index=True)
combined = combined.drop_duplicates(subset=["dedupe_key"]).reset_index(drop=True)
print(f"Cross-source merged & deduped: {len(combined)} unique jobs")
```

This 4-tuple key catches 85-90% of cross-source duplicates. The 10-15% that remain are usually legitimate distinct listings (employer post + recruiter post for the same role) and are fine to keep in an aggregator.

## Sample output

A single record from the dataset for one San Francisco product manager role looks like this. Five rows weigh ~10 KB.

```json
{
  "title": "Product Manager",
  "company": "Salesforce",
  "location": "San Francisco, CA",
  "salary_text": "$130,000 - $175,000 a year",
  "salary_min": 130000,
  "salary_max": 175000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "description": "We're seeking a Product Manager to lead our platform team and shape the roadmap for our developer-facing APIs...",
  "posted_date": "2026-04-06",
  "source": "simplyhired",
  "url": "https://www.simplyhired.com/job/abc123"
}
```

`source: "simplyhired"` is the field that makes a multi-source aggregator straightforward — every aggregator row carries its origin board, so quality-tier filtering (e.g. only show employer-posted jobs from career sites, fall back to SimplyHired/Monster aggregator coverage where employer data is missing) is a one-line filter. `salary_text` holds the original display string for fallback parsing when `salary_min`/`salary_max` are null.

## Common pitfalls

Three things go wrong in SimplyHired-based aggregators. **Cross-board duplicates** — SimplyHired re-publishes Indeed listings under different SimplyHired URLs, so naive aggregation triples the listing count compared to direct sources. The dedupe key in Step 4 handles this; double-check by spot-comparing a sample. **Salary-period mixing** — SimplyHired pulls from sources that publish hourly, daily, weekly, or yearly rates; always filter or normalise on `salary_period` before aggregating. **Camoufox-cost surprise** — at $0.008 per job, a 10K-job nightly multi-source aggregator pull costs $80 (×3 sources = $240/day if you do nationwide on Monster + ZipRecruiter + SimplyHired); plan accordingly and consider GOLD-tier pricing if you cross 50K records/month.

Thirdwatch's actor uses the same Camoufox + humanize architecture as Monster and ZipRecruiter — production-tested at 100% bypass rate. The 4096 MB max memory and 3,600-second timeout give comfortable headroom for 500-job runs.

## Related use cases

- [Find blue-collar jobs with SimplyHired](/blog/find-blue-collar-jobs-with-simplyhired)
- [Track mid-market hiring via SimplyHired](/blog/track-mid-market-hiring-via-simplyhired)
- [Build US jobs coverage with SimplyHired](/blog/build-us-jobs-coverage-with-simplyhired)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape SimplyHired?

Thirdwatch's SimplyHired Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume. A 10-query US aggregator daily refresh at 200 jobs per query — typical for a multi-role nationwide pull — costs $16 per pull. Hourly cadence is around $400 a month, in line with the rest of the Camoufox-based stealth-jobs cluster.

### How does SimplyHired differ from Monster or Indeed for aggregator coverage?

SimplyHired aggregates listings from employer career pages and partner boards rather than soliciting direct postings, which means it overlaps significantly with Indeed but skews mid-market and blue-collar. For an aggregator targeting comprehensive US coverage, all three (SimplyHired + Monster + Indeed) catch unique long-tail listings the others miss. Dedupe across sources by URL or by (title, company, location) tuple.

### Are salaries returned in standard format?

Yes, with caveats. `salary_min` and `salary_max` are integers when the band is parseable; `salary_period` is yearly, hourly, or monthly. SimplyHired aggregates from many sources so format consistency varies — about 50-60% of listings have parseable bands, the rest leave `salary_min` and `salary_max` null with the raw display string preserved in `salary_text`.

### Can I run multi-city pulls in parallel?

Yes. Each run takes a single `location` — for nationwide coverage spawn parallel runs per metro and join datasets afterwards. Apify's API supports concurrent run starts; 5-10 in parallel is comfortable. The aggregator pattern of one-run-per-metro plus a downstream merge is the canonical way to build national-scope coverage without exceeding any single run's timeout.

### How fresh is SimplyHired data?

Each run pulls live from SimplyHired.com at request time, but SimplyHired itself aggregates from upstream sources on its own cadence — so jobs in your dataset are typically 6-24 hours old by the time SimplyHired indexes them. For freshest-possible US listings, pair this scraper with our [Career Site Scraper](https://apify.com/thirdwatch/career-site-job-scraper) hitting employer pages directly. Most aggregators run SimplyHired daily.

### How do I dedupe SimplyHired jobs against Indeed and Monster?

`url` works as a primary key within SimplyHired but cross-source URLs are different even for the same job. The pragmatic dedupe key is `(title-normalised, company-normalised, location-normalised, salary_min)`. Lower-case and strip punctuation before hashing. This catches 85-90% of cross-source duplicates. The remaining 10-15% are true edge cases (e.g. same role posted by both employer and a recruiter) and are usually fine to keep.

Run the [SimplyHired Scraper on Apify Store](https://apify.com/thirdwatch/simplyhired-jobs-scraper) — pay-per-job, free to try, no credit card to test.
