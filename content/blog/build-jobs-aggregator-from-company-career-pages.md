---
title: "Build a Jobs Aggregator from Company Career Pages (2026)"
slug: "build-jobs-aggregator-from-company-career-pages"
description: "Build your own Indeed-style aggregator at $0.003 per job using Thirdwatch's Career Site Scraper. Multi-ATS coverage, dedupe, search, and storage recipes."
actor: "career-site-job-scraper"
actor_url: "https://apify.com/thirdwatch/career-site-job-scraper"
actorTitle: "Career Site Job Listing Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-greenhouse-jobs-for-ats-enrichment"
  - "scrape-lever-jobs-for-recruiter-pipeline"
  - "track-startup-hiring-velocity-with-career-sites"
keywords:
  - "build jobs aggregator"
  - "indeed alternative scraper"
  - "career page jobs API"
  - "multi ATS jobs feed"
faqs:
  - q: "How much does it cost to run a jobs aggregator on this actor?"
    a: "Thirdwatch's Career Site Scraper charges $0.003 per job on the FREE tier, dropping to $0.0016 at GOLD volume. A 1,000-company aggregator averaging 25 open roles each refreshes for $75 at FREE pricing or $40 at GOLD — competitive with the cost structure that makes Indeed-style aggregators viable."
  - q: "How many ATS platforms does the actor cover?"
    a: "Seven: Lever, Greenhouse, Workday, BambooHR, Keka, Ashby, and Recruitee, plus a generic fallback parser for non-standard career pages. The actor auto-detects from the URL, so you only maintain a list of company career page URLs — never per-platform code."
  - q: "Where do I get the company career page URL list?"
    a: "Three good sources: 1) crunchbase or pitchbook exports filtered by recent funding events, 2) YC's Work at a Startup company list, 3) curated public lists like awesome-startups on GitHub. Most companies link their careers page in the footer of their marketing site, so a one-time pass is straightforward."
  - q: "Can I run multiple ATS platforms in a single run?"
    a: "Yes. The careerPageUrls input accepts a heterogeneous list. A single run can include jobs.lever.co/stripe, boards.greenhouse.io/airbnb, and tesla.wd1.myworkdayjobs.com — the actor auto-routes each URL to its platform-specific parser before merging output into one dataset tagged with ats_platform per row."
  - q: "How do I store and search jobs efficiently?"
    a: "Postgres or DuckDB with a full-text index on title + description handles up to 1 million jobs comfortably. For larger or more search-heavy use cases, push the dataset into Algolia, Typesense, or Meilisearch. The actor returns clean structured rows so the storage layer is your choice."
  - q: "How fresh does an aggregator's data need to be?"
    a: "Daily is the minimum users tolerate; six-hourly is the sweet spot for most aggregators. Apify's scheduler handles cron — pair the actor with a Postgres upsert on apply_url and you have a self-maintaining feed that mirrors employer-side changes within hours."
---

> Thirdwatch's [Career Site Job Listing Scraper](https://apify.com/thirdwatch/career-site-job-scraper) is the data layer for a multi-ATS jobs aggregator at $0.003 per job — auto-detects Lever, Greenhouse, Workday, BambooHR, Keka, Ashby, and Recruitee from URLs alone, returning a normalised schema across all of them. Built for developers who want their own Indeed for a vertical (climate, AI, India, fintech) without writing seven separate scrapers.

## Why build a jobs aggregator from company career pages

The case for vertical job boards is well-established. [LinkedIn's 2024 talent report](https://business.linkedin.com/talent-solutions/resources/talent-acquisition/global-talent-trends-report) shows niche jobs sites consistently outperform the generalists for both engagement and conversion in defined verticals — a climate-tech jobs board converts 3–5x better than a generalist board for the same role. Building one means scraping the same set of company career pages on a schedule, normalising into a unified schema, deduping on apply URL, and serving search.

The hard part used to be the scraping layer: every ATS platform has its own HTML, JSON, or hybrid structure, and most "scrape any career page" services collapse to "scrape Greenhouse and Lever, sort of". A maintained, multi-ATS scraper with stable schema removes that floor. The job-to-be-done is concrete: ingest a list of 1,000 climate-tech (or AI, or India-tech, or whatever your vertical is) company career page URLs, refresh on a schedule, dedupe by apply URL, push into a search index. That is exactly the data shape this actor produces.

## How does this compare to the alternatives?

Three options for a multi-company, multi-ATS jobs ingestion layer:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Per-platform DIY (separate Lever, Greenhouse, Workday code) | Free compute, 4–8 weeks dev | High when stable | 4–8 weeks | You own seven parsers |
| Generic scraping API (Bright Data, ScraperAPI) | $30–$80 (proxy + parsing) | High infra, but parsing is yours | 2–4 weeks | You own the per-platform parsers |
| Thirdwatch Career Site Scraper | $3 ($0.003 × 1,000) | Production-tested across 7+ ATS | 1 day | Thirdwatch maintains parsers |

The 4–8 week DIY estimate is what an aggregator team typically burns before having a stable v1 across the major ATS platforms. The [Career Site Scraper actor page](/scrapers/career-site-job-scraper) compresses that into a single API call. Cost-wise, $3 per 1,000 jobs is below the noise floor of what an aggregator earns in ad/affiliate revenue per visitor — the unit economics are not a concern.

## How to build a jobs aggregator in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I batch-pull jobs from a 1,000-company list?

Apify runs have a 600-second default timeout that's plenty for hundreds of small career pages, but for thousand-company batches it's cleaner to chunk into 100-company runs. Each call passes one chunk:

```python
import os, requests
from itertools import islice

ACTOR = "thirdwatch~career-site-job-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

with open("climate-tech-careers.txt") as f:
    all_urls = [line.strip() for line in f if line.strip()]

def chunk(seq, n):
    it = iter(seq)
    while True:
        block = list(islice(it, n))
        if not block: break
        yield block

all_jobs = []
for batch in chunk(all_urls, 100):
    resp = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
        params={"token": TOKEN},
        json={
            "careerPageUrls": batch,
            "scrapeDescriptions": True,
            "maxJobsPerSite": 500,
        },
        timeout=900,
    )
    all_jobs.extend(resp.json())
print(f"{len(all_jobs)} jobs across {len(all_urls)} companies")
```

A 1,000-company climate-tech aggregator at 25 jobs per company averages ~25,000 jobs and costs $75 at FREE pricing per refresh.

### Step 3: How do I store and dedupe in Postgres?

Postgres handles a million jobs comfortably with a single GIN index for full-text search. The schema is intentionally minimal:

```sql
CREATE TABLE jobs (
  apply_url       text PRIMARY KEY,
  title           text NOT NULL,
  company_name    text NOT NULL,
  department      text,
  location        text,
  job_type        text,
  description     text,
  ats_platform    text,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_search_idx ON jobs USING gin (to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX jobs_company_idx ON jobs (company_name);
```

Upsert on `apply_url` so re-runs don't duplicate:

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO jobs (apply_url, title, company_name, department, location, job_type, description, ats_platform)
        VALUES %s
        ON CONFLICT (apply_url) DO UPDATE SET
          title = EXCLUDED.title,
          location = EXCLUDED.location,
          description = EXCLUDED.description,
          last_seen_at = now()
        """,
        [(j["apply_url"], j["title"], j["company_name"], j.get("department"),
          j.get("location"), j.get("job_type"), j.get("description"),
          j.get("ats_platform")) for j in all_jobs],
    )
```

### Step 4: How do I serve search and keep the index live?

Postgres full-text covers most use cases up to about a million rows. Past that, push the dataset into a dedicated search engine — [Meilisearch](https://www.meilisearch.com/) and [Typesense](https://typesense.org/) both offer typo-tolerant ranked search with sub-100ms response times at this scale. Schedule the actor on Apify to run every six hours and trigger an index sync via webhook:

```bash
curl -X POST "https://api.apify.com/v2/schedules?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "climate-tech-jobs-6h",
    "cronExpression": "0 */6 * * *",
    "timezone": "UTC",
    "isEnabled": true,
    "actions": [{
      "type": "RUN_ACTOR",
      "actorId": "thirdwatch~career-site-job-scraper",
      "runInput": {"careerPageUrls": ["..."], "scrapeDescriptions": true, "maxJobsPerSite": 500}
    }]
  }'
```

Add an `ACTOR.RUN.SUCCEEDED` webhook pointing to your ingestion service and the loop closes itself.

## Sample output

A single row from the dataset looks like this. Five rows of this shape weigh ~25 KB on the wire and ingest into Postgres in under 50ms.

```json
{
  "title": "Senior Backend Engineer, Carbon Markets",
  "company_name": "Watershed",
  "department": "Engineering",
  "location": "San Francisco, CA / Remote",
  "job_type": "Full-time",
  "apply_url": "https://jobs.ashbyhq.com/watershed/abc-123-789",
  "description": "Watershed helps companies decarbonize... You'll own the data pipelines that ingest 100M+ emissions records...",
  "ats_platform": "ashby"
}
```

`ats_platform` is the field that makes a multi-ATS aggregator possible — it's set automatically based on URL detection, so a Postgres `WHERE ats_platform = 'lever'` filter cleanly partitions the dataset for platform-specific analytics. `apply_url` is universally unique because every ATS encodes a globally-unique posting ID into its URL — Lever uses a UUID, Greenhouse uses a numeric ID, Ashby uses a slug+UUID, and so on. This makes upsert-on-apply_url a robust dedupe strategy without any cross-platform collision risk.

## Common pitfalls

Three things break aggregators that go to production. **Stale company lists** — companies pivot, get acquired, or change ATS providers, so a watchlist generated once and never updated drifts toward 20%+ dead URLs within 18 months; rebuild from your source quarterly. **Description bloat** — full descriptions can be 2-10 KB each, and a 100,000-job aggregator with descriptions stored verbatim in Postgres weighs 1-2 GB; consider storing descriptions in object storage (S3, R2) and keeping only an index in the DB row. **Schema drift on the generic fallback** — a small fraction of companies use truly custom career pages that the generic parser handles imperfectly; surface `ats_platform: "generic"` as a quality flag in your UI rather than treating those rows as identical to the structured-ATS rows.

Thirdwatch's actor partitions cleanly by `ats_platform`, so it's trivial to surface only the seven first-class platforms in your UI and route generic rows through additional cleaning. Out-of-band ATS changes (e.g. Greenhouse's URL pattern changing) are absorbed by Thirdwatch's parser updates, so the aggregator keeps running while the underlying world shifts.

## Related use cases

- [Scrape Greenhouse jobs for ATS enrichment](/blog/scrape-greenhouse-jobs-for-ats-enrichment)
- [Scrape Lever jobs for a recruiter sourcing pipeline](/blog/scrape-lever-jobs-for-recruiter-pipeline)
- [Track startup hiring velocity with career site data](/blog/track-startup-hiring-velocity-with-career-sites)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to run a jobs aggregator on this actor?

Thirdwatch's Career Site Scraper charges $0.003 per job on the FREE tier, dropping to $0.0016 at GOLD volume. A 1,000-company aggregator averaging 25 open roles each refreshes for $75 at FREE pricing or $40 at GOLD — competitive with the cost structure that makes Indeed-style aggregators viable.

### How many ATS platforms does the actor cover?

Seven: Lever, Greenhouse, Workday, BambooHR, Keka, Ashby, and Recruitee, plus a generic fallback parser for non-standard career pages. The actor auto-detects from the URL, so you only maintain a list of company career page URLs — never per-platform code.

### Where do I get the company career page URL list?

Three good sources: 1) Crunchbase or PitchBook exports filtered by recent funding events, 2) [YC's Work at a Startup](https://www.workatastartup.com/) company list, 3) curated public lists like awesome-startups on GitHub. Most companies link their careers page in the footer of their marketing site, so a one-time pass is straightforward.

### Can I run multiple ATS platforms in a single run?

Yes. The `careerPageUrls` input accepts a heterogeneous list. A single run can include `jobs.lever.co/stripe`, `boards.greenhouse.io/airbnb`, and `tesla.wd1.myworkdayjobs.com` — the actor auto-routes each URL to its platform-specific parser before merging output into one dataset tagged with `ats_platform` per row.

### How do I store and search jobs efficiently?

Postgres or DuckDB with a full-text index on title + description handles up to 1 million jobs comfortably. For larger or more search-heavy use cases, push the dataset into [Algolia](https://www.algolia.com/), Typesense, or Meilisearch. The actor returns clean structured rows so the storage layer is your choice.

### How fresh does an aggregator's data need to be?

Daily is the minimum users tolerate; six-hourly is the sweet spot for most aggregators. Apify's scheduler handles cron — pair the actor with a Postgres upsert on `apply_url` and you have a self-maintaining feed that mirrors employer-side changes within hours.

Run the [Career Site Job Listing Scraper on Apify Store](https://apify.com/thirdwatch/career-site-job-scraper) — pay-per-job, free to try, no credit card to test.
