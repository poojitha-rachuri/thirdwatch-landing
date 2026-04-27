---
title: "Scrape Google Jobs Aggregated Listings (2026 Guide)"
slug: "scrape-google-jobs-aggregated-listings"
description: "Pull aggregated listings from 20+ job boards via Google Jobs at $0.008 per job using Thirdwatch. Direct apply URLs from Indeed, LinkedIn, Glassdoor in one call."
actor: "google-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/google-jobs-scraper"
actorTitle: "Google Jobs Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "build-multi-source-jobs-feed-with-google-jobs"
  - "find-jobs-with-direct-apply-urls"
  - "track-job-posting-velocity-on-google-jobs"
keywords:
  - "google jobs scraper"
  - "google for jobs api"
  - "scrape google for jobs"
  - "aggregated jobs scraper"
faqs:
  - q: "Why use Google Jobs instead of scraping each board separately?"
    a: "Google Jobs aggregates from 20+ boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, and many specialist sources) in a single search. For aggregator builders this collapses 5-10 source integrations into one — and the resulting dataset includes the source attribution per row, so you still know which board originated each listing. The trade-off: Google Jobs' coverage depends on Google's own indexing, which lags some boards by hours."
  - q: "How much does it cost?"
    a: "Thirdwatch's Google Jobs Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume — 3.75x cheaper than the leading orgupdate alternative ($0.03/job). A 50-query daily aggregator pull at 100 jobs each costs $40 at FREE pricing or $20 at GOLD. Hourly cadence on a 50-keyword watchlist is roughly $1,000/month at FREE — competitive with running 5+ direct-source scrapers separately."
  - q: "Are direct apply URLs included?"
    a: "Yes. Every record returns an apply_url that points to the original source's apply page (LinkedIn, Indeed, Glassdoor, etc.) — not a Google redirect. This makes downstream attribution clean: a click on apply_url goes straight to the employer's ATS or the source board's apply flow, preserving any tracking or referral parameters."
  - q: "Does it work outside the US?"
    a: "Yes. Pass country (us, uk, in, de, au, etc.) and include city in your query (software engineer London or data scientist Bangalore). Google Jobs surfaces region-appropriate boards per country — Naukri shows up in India queries, Glassdoor in US/UK queries, regional boards elsewhere. The actor returns the same canonical schema across all geographies."
  - q: "How do I dedupe Google Jobs against direct-source scrapers?"
    a: "Google Jobs returns its own consolidated record per job, but the same posting will also appear in your direct LinkedIn or Indeed scrapes if you run those. Dedupe on (title-norm, company-norm, location-norm, salary_min) when merging Google Jobs with direct-source pulls. About 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% are listings on smaller boards your direct scrapers don't cover."
  - q: "What's the right strategy for an aggregator?"
    a: "Use Google Jobs as your primary discovery layer (one query covers 20+ boards) and direct-source scrapers (LinkedIn, Indeed, Monster) for deep enrichment on top-priority listings — Google Jobs descriptions are sometimes shorter than the originals, so deepening with the source-board scraper backfills full content for promotional-tier rows. This hybrid approach gives the broadest coverage at the lowest unit cost."
---

> Thirdwatch's [Google Jobs Scraper](https://apify.com/thirdwatch/google-jobs-scraper) returns aggregated job listings from 20+ boards in one call at $0.008 per job — title, company, location, salary, description, source attribution, direct apply URL, posted date. Built for aggregator developers, multi-source recruiter pipelines, and HR-analytics teams who need broad cross-board coverage without integrating each source separately.

## Why scrape Google Jobs

Google Jobs (officially "Google for Jobs") sits at the top of the US/UK/India job-search funnel. According to [Google's 2024 Search statistics](https://blog.google/products/search/), Google fields more than 800 million job-related searches per month, with the Google Jobs aggregated panel driving more than 30% of click-throughs to source boards. For an aggregator builder or multi-source recruiter pipeline, Google Jobs is the most efficient single discovery surface — one query returns listings from Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, and dozens of specialist boards in the same response.

The job-to-be-done is structured. An aggregator developer wants comprehensive cross-board coverage with minimal source integrations. A staffing agency monitoring competitor postings wants one query to cover all major US boards. A market researcher comparing job volume across sources wants source attribution per row. A recruiter pipeline wants direct-apply URLs (not Google redirects) for clean attribution. All reduce to query + country + max results returning structured rows with `source` populated.

## How does this compare to the alternatives?

Three options for getting aggregated multi-board jobs data:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Direct-source scrapers (LinkedIn + Indeed + Monster + ZipRecruiter + ...) | $24–$32 (4 sources × $0.008) | Production-tested per source | Half a day per source | Per-source maintenance |
| orgupdate/google-jobs (Apify) | ~$30 ($0.03 × 1,000) | Production-tested | 5 minutes | Vendor maintains |
| Thirdwatch Google Jobs Scraper | $8 ($0.008 × 1,000) | 3.75x cheaper than orgupdate | 5 minutes | Thirdwatch tracks Google changes |

Direct-source scraping gives the deepest coverage per board but requires running and maintaining each scraper separately. The [Google Jobs Scraper actor page](/scrapers/google-jobs-scraper) collapses discovery into one call — and at 1/4 the cost of the leading Apify alternative.

## How to scrape Google Jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs by query and country?

Pass keyword + city queries (`software engineer New York`, `data scientist remote`) and the country code.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~google-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["software engineer New York", "data scientist remote",
                    "product manager San Francisco", "devops engineer Austin"],
        "country": "us",
        "maxResults": 50,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.source.value_counts().to_dict()}")
```

4 queries × 50 results = up to 200 jobs, costing $1.60. The `source` distribution typically shows 40-60% LinkedIn, 20-30% Indeed, 10-15% Glassdoor, with the rest split across smaller boards.

### Step 3: How do I filter by source and route to per-source enrichment?

Filter the dataset by `source` and decide whether to deepen with a direct-source scraper.

```python
top_priority = df[
    df.salary.notna()
    & (df.posted_date.str.contains("hour|day", na=False))
].copy()

# Route LinkedIn + Indeed rows to direct-source enrichment for fuller descriptions
linkedin_priority = top_priority[top_priority.source == "LinkedIn"]
indeed_priority = top_priority[top_priority.source == "Indeed"]
others = top_priority[~top_priority.source.isin(["LinkedIn", "Indeed"])]

print(f"Priority cohort: {len(top_priority)} jobs ({len(linkedin_priority)} LinkedIn, "
      f"{len(indeed_priority)} Indeed, {len(others)} other)")
```

For Wave 1 ingestion, take the Google Jobs row as-is. For top-priority cohort (recent + salary published), enrich the LinkedIn rows with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) and Indeed rows with [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper) for full descriptions.

### Step 4: How do I push to a meta-search Postgres index?

Upsert on `apply_url` (canonical per posting across boards).

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO meta_jobs
              (apply_url, title, company_name, location, salary,
               description, job_type, source, posted_date, scraped_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             title = EXCLUDED.title,
             salary = EXCLUDED.salary,
             scraped_at = now()""",
        [(j["apply_url"], j["title"], j["company_name"], j.get("location"),
          j.get("salary"), j.get("description"), j.get("job_type"),
          j.get("source"), j.get("posted_date"), "now()")
         for j in df.to_dict("records")],
    )
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at six-hourly cadence and a single keyword watchlist refreshes a multi-board aggregator with no per-source integration work.

## Sample output

A single record from the dataset for one Seattle data analyst role looks like this. Five rows of this shape weigh ~12 KB.

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

`source` is the killer field — it tells you which underlying board originated the listing, which is critical for cross-source dedup, source-quality filtering, and direct-apply attribution. `apply_url` points to the original board's apply page (not a Google redirect), preserving recruiter-tracking parameters and source-board UX. `posted_date` is Google's relative-time string ("2 days ago"); for absolute dates, capture your scrape timestamp and treat `posted_date` as relative.

## Common pitfalls

Three things go wrong in production Google Jobs pipelines. **Description truncation** — Google Jobs sometimes returns shorter descriptions than the original source posting (Google's UI summarises long postings); for full content, follow up with the source-board scraper using `apply_url`. **Salary inconsistency** — only ~30-40% of Google Jobs rows show salary, and the format varies by source (LinkedIn shows parsed bands, Indeed shows full text strings); for analysis, regex-parse `salary` to numerics rather than comparing raw strings. **Source-coverage drift** — Google's set of indexed boards changes over time; if a particular source you used to see (e.g., Dice for tech jobs) starts disappearing, that's Google's indexing decision, not a scraper failure.

Thirdwatch's actor uses Camoufox stealth-browser bypass for Google's anti-bot defenses. The 4096 MB max memory and 3,600-second timeout headroom mean even multi-keyword batch runs complete cleanly. Pair Google Jobs with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper), [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper), and [Monster Scraper](https://apify.com/thirdwatch/monster-jobs-scraper) for source-board enrichment after Google Jobs discovery. A fourth subtle issue worth flagging is that Google Jobs occasionally surfaces the same posting under multiple sources (e.g. the same Microsoft job appearing as both a LinkedIn row and a Glassdoor row); these are real duplicates within Google Jobs itself, not a scraper bug. Group by company + title + location before counting unique listings, and use the source distribution as a secondary signal of listing freshness — a job appearing on 4+ sources is usually 1+ week old.

## Related use cases

- [Build a multi-source jobs feed with Google Jobs](/blog/build-multi-source-jobs-feed-with-google-jobs)
- [Find jobs with direct apply URLs](/blog/find-jobs-with-direct-apply-urls)
- [Track job posting velocity on Google Jobs](/blog/track-job-posting-velocity-on-google-jobs)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why use Google Jobs instead of scraping each board separately?

Google Jobs aggregates from 20+ boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Monster, CareerBuilder, and many specialist sources) in a single search. For aggregator builders this collapses 5-10 source integrations into one — and the resulting dataset includes the source attribution per row, so you still know which board originated each listing. The trade-off: Google Jobs' coverage depends on Google's own indexing, which lags some boards by hours.

### How much does it cost?

Thirdwatch's Google Jobs Scraper charges $0.008 per job on the FREE tier and drops to $0.004 at GOLD volume — 3.75x cheaper than the leading orgupdate alternative ($0.03/job). A 50-query daily aggregator pull at 100 jobs each costs $40 at FREE pricing or $20 at GOLD. Hourly cadence on a 50-keyword watchlist is roughly $1,000/month at FREE — competitive with running 5+ direct-source scrapers separately.

### Are direct apply URLs included?

Yes. Every record returns an `apply_url` that points to the original source's apply page (LinkedIn, Indeed, Glassdoor, etc.) — not a Google redirect. This makes downstream attribution clean: a click on `apply_url` goes straight to the employer's ATS or the source board's apply flow, preserving any tracking or referral parameters.

### Does it work outside the US?

Yes. Pass `country` (`us`, `uk`, `in`, `de`, `au`, etc.) and include city in your query (`software engineer London` or `data scientist Bangalore`). Google Jobs surfaces region-appropriate boards per country — Naukri shows up in India queries, Glassdoor in US/UK queries, regional boards elsewhere. The actor returns the same canonical schema across all geographies.

### How do I dedupe Google Jobs against direct-source scrapers?

Google Jobs returns its own consolidated record per job, but the same posting will also appear in your direct LinkedIn or Indeed scrapes if you run those. Dedupe on `(title-norm, company-norm, location-norm, salary_min)` when merging Google Jobs with direct-source pulls. About 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% are listings on smaller boards your direct scrapers don't cover.

### What's the right strategy for an aggregator?

Use Google Jobs as your primary discovery layer (one query covers 20+ boards) and direct-source scrapers (LinkedIn, Indeed, Monster) for deep enrichment on top-priority listings — Google Jobs descriptions are sometimes shorter than the originals, so deepening with the source-board scraper backfills full content for promotional-tier rows. This hybrid approach gives the broadest coverage at the lowest unit cost.

Run the [Google Jobs Scraper on Apify Store](https://apify.com/thirdwatch/google-jobs-scraper) — pay-per-job, free to try, no credit card to test.
