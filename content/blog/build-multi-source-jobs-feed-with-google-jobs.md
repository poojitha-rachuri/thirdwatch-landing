---
title: "Build a Multi-Source Jobs Feed with Google Jobs (2026)"
slug: "build-multi-source-jobs-feed-with-google-jobs"
description: "Build a 20+ board jobs aggregator at $0.008 per job using Thirdwatch's Google Jobs Scraper. Postgres ingestion + source-priority dedupe + Meilisearch recipes."
actor: "google-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/google-jobs-scraper"
actorTitle: "Google Jobs Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-google-jobs-aggregated-listings"
  - "find-jobs-with-direct-apply-urls"
  - "track-job-posting-velocity-on-google-jobs"
keywords:
  - "build jobs feed google jobs"
  - "multi-source jobs aggregator"
  - "google jobs aggregator pipeline"
  - "single-call jobs aggregator"
faqs:
  - q: "Why anchor an aggregator on Google Jobs vs scraping each board separately?"
    a: "Google Jobs aggregates listings from 20+ boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, and dozens of specialist boards) into a single search response. For aggregator builders this collapses 5-10 source integrations into one — and the resulting dataset includes source attribution per row, so you still know which board originated each listing. The trade-off: Google Jobs descriptions are sometimes shorter than the originals, and Google's coverage lags some boards by hours."
  - q: "How much does it cost?"
    a: "Thirdwatch's Google Jobs Scraper charges $0.008 per job. A 50-keyword × 20-metro daily aggregator pull at 100 jobs each = 100,000 jobs/day = $800/day at FREE pricing or $400/day at GOLD. For a focused aggregator (10 keywords × 5 metros × 100 jobs) that's $40/day or $1,200/month — competitive with running 5+ direct-source scrapers separately."
  - q: "How do I dedupe Google Jobs against direct-source scrapers?"
    a: "Google Jobs returns its own consolidated record per job, but the same posting will also appear in your direct LinkedIn or Indeed scrapes if you run those. Dedupe on (title-norm, company-norm, location-norm, salary_min) when merging. About 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% are listings on smaller boards your direct scrapers don't cover."
  - q: "What database scheme works for a Google-Jobs-anchored aggregator?"
    a: "Postgres with GIN full-text on title + description handles up to 1 million active listings comfortably at sub-100ms search. Past 1M, push to Meilisearch or Typesense. Store source attribution per record so faceted search can offer per-source filtering. Index posted_date for time-based filtering and salary fields for band-based filtering."
  - q: "What's the right strategy for source enrichment?"
    a: "Use Google Jobs as discovery (one query covers 20+ boards) and direct-source scrapers (LinkedIn, Indeed, Monster) for deep enrichment on top-priority listings — Google Jobs descriptions are sometimes shorter than originals, so deepening with the source-board scraper backfills full content for promotional-tier rows. This hybrid approach gives the broadest coverage at the lowest unit cost."
  - q: "How fresh do Google Jobs results need to be?"
    a: "Six-hourly is the sweet spot. Google Jobs indexes new postings within 2-12 hours of source-board appearance, so faster cadences than 6-hourly capture freshness gains diminishingly. For most aggregator use cases, six-hourly catches new postings within 6-18 hours of original publication — good enough to compete with single-source aggregators on freshness."
---

> Thirdwatch's [Google Jobs Scraper](https://apify.com/thirdwatch/google-jobs-scraper) anchors a multi-source jobs aggregator at $0.008 per job — one query covers 20+ boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, specialist boards). This guide is the canonical recipe for building a jobs feed on Google Jobs as the discovery layer with optional direct-source enrichment, Postgres ingestion, source-priority dedupe, and Meilisearch faceted search.

## Why anchor on Google Jobs

Google Jobs is the most efficient single jobs-discovery surface. According to [Google's 2024 Search statistics](https://blog.google/products/search/), Google fields more than 800 million job-related searches monthly with the Google Jobs panel driving 30%+ of click-throughs. For aggregator builders, that means anchoring on Google Jobs collapses what would otherwise be a 5-10 source integration project into one — and the resulting dataset attributes each listing to its underlying board.

The job-to-be-done is structured. An aggregator developer wants comprehensive cross-board US coverage from one ingestion pipeline. A staffing-tech SaaS needs a jobs feed embedded in their product covering as many sources as possible. A workforce-analytics platform requires a longitudinal jobs dataset spanning all major boards. A recruiter agency builds an internal aggregator to consolidate sourcing across multiple boards. All reduce to Google Jobs pull → cross-source dedupe → Postgres + search-index ingestion.

## How does this compare to the alternatives?

Three options for building a multi-source jobs feed:

| Approach | Cost per 100K jobs/day | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Per-source scrapers (LinkedIn + Indeed + Monster + ZipRecruiter + ...) | $40–$80 ($0.008 × 100K × 4-8 sources) | Production-tested per source | Half a day per source | Per-source maintenance |
| Curated jobs-feed licence (LinkedIn Talent Insights, Indeed Hiring Insights) | $50K–$300K/year | High | Months | Vendor lock-in |
| Thirdwatch Google Jobs Scraper anchor | $800/day at FREE = $24K/month for 100K daily | Production-tested, 20+ source aggregation | One day | Thirdwatch tracks Google changes |

Per-source scraping gives the deepest coverage but requires maintaining each scraper. The [Google Jobs Scraper actor page](/scrapers/google-jobs-scraper) collapses discovery into one call.

## How to build a multi-source jobs feed in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a multi-keyword multi-metro Google Jobs feed?

Spawn parallel runs across role × metro combinations.

```python
import os, requests, time

ACTOR = "thirdwatch~google-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

ROLES = ["software engineer", "data scientist", "product manager",
         "registered nurse", "accountant"]
METROS = ["New York NY", "San Francisco CA", "Austin TX",
          "Chicago IL", "Boston MA"]

run_ids = []
for role in ROLES:
    for metro in METROS:
        r = requests.post(
            f"https://api.apify.com/v2/acts/{ACTOR}/runs",
            params={"token": TOKEN},
            json={"queries": [f"{role} {metro}"], "country": "us",
                  "maxResults": 50},
        )
        run_ids.append((role, metro, r.json()["data"]["id"]))
        time.sleep(0.5)

print(f"Spawned {len(run_ids)} role × metro runs")
```

5 roles × 5 metros = 25 runs × 50 jobs = up to 1,250 listings, costing $10.

### Step 3: How do I dedupe across source attributions?

Build the canonical 4-tuple key. Within Google Jobs alone the same posting can appear under multiple sources (LinkedIn + Glassdoor + Indeed for the same Microsoft job).

```python
import pandas as pd, re, json

def normalise(s):
    return re.sub(r"\W+", " ", (s or "").lower()).strip()

all_jobs = []
for role, metro, run_id in run_ids:
    while True:
        s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                         params={"token": TOKEN}).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s != "SUCCEEDED":
        continue
    items = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
                         params={"token": TOKEN}).json()
    all_jobs.extend(items)

df = pd.DataFrame(all_jobs)
df["dedupe_key"] = (
    df.title.fillna("").apply(normalise) + "|"
    + df.company_name.fillna("").apply(normalise) + "|"
    + df.location.fillna("").apply(normalise)
)
SOURCE_PRIORITY = {"LinkedIn": 0, "Indeed": 1, "Glassdoor": 2,
                    "ZipRecruiter": 3, "Monster": 4}
df["priority"] = df.source.map(SOURCE_PRIORITY).fillna(99)
unique = (df.sort_values(["dedupe_key", "priority"])
            .drop_duplicates(subset=["dedupe_key"], keep="first"))
print(f"Deduped: {len(df)} → {len(unique)} unique ({len(unique)/len(df):.0%})")
```

Source priority matters because LinkedIn descriptions are typically richer than Glassdoor descriptions for the same job; preferring LinkedIn rows in dedupe gives downstream consumers better data.

### Step 4: How do I serve faceted search via Postgres + Meilisearch?

For under 100K active listings, Postgres GIN handles faceted search at sub-100ms. Past that, push to Meilisearch.

```sql
CREATE TABLE jobs_feed (
  dedupe_key       text PRIMARY KEY,
  title            text NOT NULL,
  company_name     text NOT NULL,
  location         text,
  salary           text,
  description      text,
  job_type         text,
  source           text,
  apply_url        text,
  posted_date      text,
  scraped_at       timestamptz DEFAULT now()
);
CREATE INDEX jobs_search_idx ON jobs_feed USING gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);
CREATE INDEX jobs_filter_idx ON jobs_feed (source, job_type, posted_date DESC);
```

Push to Meilisearch for typo-tolerant faceted search:

```python
import meilisearch, os

client = meilisearch.Client("http://meilisearch:7700", os.environ["MEILI_KEY"])
index = client.index("jobs")
index.update_settings({
    "filterableAttributes": ["source", "job_type", "location"],
    "sortableAttributes": ["posted_date"],
    "searchableAttributes": ["title", "company_name", "description"],
})

docs = unique.to_dict("records")
for d in docs:
    d["id"] = d["dedupe_key"]
index.add_documents(docs, primary_key="id")
print(f"Indexed {len(docs)} jobs in Meilisearch")
```

Pair with a Next.js or Astro frontend; users get sub-100ms typo-tolerant search across daily-fresh aggregated jobs.

## Sample output

A single deduped record looks like this. Five rows weigh ~10 KB.

```json
{
  "title": "Data Analyst",
  "company_name": "Amazon",
  "location": "Seattle, WA",
  "salary": "$85,000 - $120,000",
  "description": "We are looking for a Data Analyst to join our team and drive decisions across supply chain operations...",
  "job_type": "Full-time",
  "source": "LinkedIn",
  "apply_url": "https://www.linkedin.com/jobs/view/123456789",
  "posted_date": "2 days ago"
}
```

`source` distinguishes which board originated each listing — useful for quality-tier filtering and for source-attribution UX in the aggregator. `apply_url` points to the original board's apply page (not a Google redirect), preserving recruiter-tracking parameters.

## Common pitfalls

Three things go wrong in production multi-source aggregators. **Description truncation** — Google Jobs sometimes returns shorter descriptions than original source postings; for full content, follow up with the source-board scraper using `apply_url`. **Source-coverage drift** — Google's set of indexed boards changes over time; if a particular source you used to see (e.g., Dice for tech) starts disappearing, that's Google's indexing decision, not a scraper failure. **Salary-format inconsistency** — `salary` is a free-text string varying by source; for analytics, parse to numerics with regex but tolerate ~30% null rate.

Thirdwatch's actor uses Camoufox stealth-browser bypass for Google's anti-bot defenses. The 4096 MB max memory and 3,600-second timeout headroom mean even 25-run batch fan-outs complete cleanly. Pair Google Jobs with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper), [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper), and [Monster Scraper](https://apify.com/thirdwatch/monster-jobs-scraper) for source-board enrichment after Google Jobs discovery.

## Related use cases

- [Scrape Google Jobs aggregated listings](/blog/scrape-google-jobs-aggregated-listings)
- [Find jobs with direct apply URLs](/blog/find-jobs-with-direct-apply-urls)
- [Track job posting velocity on Google Jobs](/blog/track-job-posting-velocity-on-google-jobs)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why anchor an aggregator on Google Jobs vs scraping each board separately?

Google Jobs aggregates listings from 20+ boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, and dozens of specialist boards) into a single search response. For aggregator builders this collapses 5-10 source integrations into one — and the resulting dataset includes source attribution per row, so you still know which board originated each listing. The trade-off: Google Jobs descriptions are sometimes shorter than the originals, and Google's coverage lags some boards by hours.

### How much does it cost?

Thirdwatch's Google Jobs Scraper charges $0.008 per job. A 50-keyword × 20-metro daily aggregator pull at 100 jobs each = 100,000 jobs/day = $800/day at FREE pricing or $400/day at GOLD. For a focused aggregator (10 keywords × 5 metros × 100 jobs) that's $40/day or $1,200/month — competitive with running 5+ direct-source scrapers separately.

### How do I dedupe Google Jobs against direct-source scrapers?

Google Jobs returns its own consolidated record per job, but the same posting will also appear in your direct LinkedIn or Indeed scrapes if you run those. Dedupe on `(title-norm, company-norm, location-norm, salary_min)` when merging. About 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% are listings on smaller boards your direct scrapers don't cover.

### What database scheme works for a Google-Jobs-anchored aggregator?

Postgres with GIN full-text on `title` + `description` handles up to 1 million active listings comfortably at sub-100ms search. Past 1M, push to [Meilisearch](https://www.meilisearch.com/) or Typesense. Store source attribution per record so faceted search can offer per-source filtering. Index `posted_date` for time-based filtering and salary fields for band-based filtering.

### What's the right strategy for source enrichment?

Use Google Jobs as discovery (one query covers 20+ boards) and direct-source scrapers (LinkedIn, Indeed, Monster) for deep enrichment on top-priority listings — Google Jobs descriptions are sometimes shorter than originals, so deepening with the source-board scraper backfills full content for promotional-tier rows. This hybrid approach gives the broadest coverage at the lowest unit cost.

### How fresh do Google Jobs results need to be?

Six-hourly is the sweet spot. Google Jobs indexes new postings within 2-12 hours of source-board appearance, so faster cadences than 6-hourly capture freshness gains diminishingly. For most aggregator use cases, six-hourly catches new postings within 6-18 hours of original publication — good enough to compete with single-source aggregators on freshness.

Run the [Google Jobs Scraper on Apify Store](https://apify.com/thirdwatch/google-jobs-scraper) — pay-per-job, free to try, no credit card to test.
